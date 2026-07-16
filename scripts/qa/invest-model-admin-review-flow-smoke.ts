/**
 * 이 스모크 테스트는 모델 등록 초안 -> 운영자 심사 -> audit log 반환 흐름을 검증한다.
 * 실제 DB 저장, 모델 공개, 모델 파일 실행, 실제 주문/입금 연결 없이 domain helper의 mock-safe 계약만 확인한다.
 */

import {
  buildAdminModelReviewResult,
  canReviewInvestmentModel
} from '../../lib/domain/models/admin-review';
import {
  buildInvestmentModelDraftDto,
  canCreateModelDraft,
  validateCreatorModelDraftRequest
} from '../../lib/domain/models/creator-draft';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const validDraftRequest = {
  name: 'Operator Review Smoke Model',
  shortDescription: 'Mock model draft for admin review smoke testing.',
  targetMarkets: ['US equities'],
  allowedAssetClasses: ['ETF', 'equity'],
  assetUniverseSummary:
    'A metadata-only mock universe used to verify admin review flow boundaries.',
  strategySummary:
    'This mock strategy description is long enough to verify creator draft validation without implying real trading or investment advice.',
  leverageAllowed: false,
  derivativesAllowed: false,
  rebalancePolicy: 'Monthly mock rebalance',
  primaryDataInputs: ['mock price trend', 'mock news traffic'],
  forbiddenAssets: ['real brokerage orders'],
  riskSummary:
    'This risk summary states that the model can lose simulated value and is not a recommendation, guarantee, or live trading instruction.',
  performanceSource: 'Backtest placeholder only',
  disclosurePlaceholder:
    'Final legal and financial disclosure copy must be supplied by a qualified reviewer before public launch.'
};

assertCondition(canCreateModelDraft('creator'), 'creator should create drafts');
assertCondition(canCreateModelDraft('admin'), 'admin should create drafts');
assertCondition(!canCreateModelDraft('user'), 'user must not create drafts');

const draftValidation = validateCreatorModelDraftRequest(validDraftRequest);
assertCondition(draftValidation.success, 'valid creator draft should pass');

const draft = buildInvestmentModelDraftDto(draftValidation.data);
assertCondition(draft.status === 'draft', 'draft status should stay private draft');
assertCondition(
  draft.publicDiscoveryEligible === false,
  'draft must not be publicly discoverable'
);
assertCondition(
  draft.modelArtifactStatus === 'metadata_only',
  'draft artifact must stay metadata-only'
);

assertCondition(canReviewInvestmentModel('admin'), 'admin should review models');
assertCondition(!canReviewInvestmentModel('creator'), 'creator must not review models');
assertCondition(!canReviewInvestmentModel('user'), 'user must not review models');

const approveResult = buildAdminModelReviewResult({
  modelPublicId: draft.modelPublicId,
  input: {
    decision: 'approve',
    currentStatus: 'pending_review',
    reason: 'Smoke test admin approval after required mock review fields were checked.',
    reviewerUserPublicId: 'user_admin_smoke'
  },
  requestIp: '127.0.0.1'
});

assertCondition(approveResult.allowed, 'pending_review -> approve should pass');
assertCondition(
  approveResult.data.previousStatus === 'pending_review' &&
    approveResult.data.nextStatus === 'approved',
  'approve transition should move pending_review to approved'
);
assertCondition(
  approveResult.data.auditLog.action === 'admin_model_approved',
  'approve should return admin_model_approved audit action'
);
assertCondition(
  approveResult.data.auditLog.resource.resourcePublicId === draft.modelPublicId,
  'audit log should target the reviewed model public id'
);
assertCondition(
  approveResult.data.persistence === 'not_persisted',
  'review result must remain not_persisted in MVP smoke test'
);

const rejectResult = buildAdminModelReviewResult({
  modelPublicId: draft.modelPublicId,
  input: {
    decision: 'reject',
    currentStatus: 'pending_review',
    reason: 'Smoke test rejection comment visible to creator.',
    reviewerUserPublicId: 'user_admin_smoke'
  }
});

assertCondition(rejectResult.allowed, 'pending_review -> reject should pass');
assertCondition(
  rejectResult.data.reviewComment.visibility === 'creator_visible',
  'reject comments should be creator visible'
);
assertCondition(
  rejectResult.data.auditLog.after &&
    typeof rejectResult.data.auditLog.after === 'object' &&
    !Array.isArray(rejectResult.data.auditLog.after) &&
    rejectResult.data.auditLog.after.reviewCommentVisibility === 'creator_visible',
  'audit after snapshot should include creator-visible review comment'
);

const allowedTransitionCases = [
  {
    decision: 'request_changes',
    currentStatus: 'pending_review',
    nextStatus: 'changes_requested'
  },
  {
    decision: 'publish_live',
    currentStatus: 'approved',
    nextStatus: 'live'
  },
  {
    decision: 'pause',
    currentStatus: 'live',
    nextStatus: 'paused'
  },
  {
    decision: 'suspend',
    currentStatus: 'live',
    nextStatus: 'suspended'
  },
  {
    decision: 'retire',
    currentStatus: 'suspended',
    nextStatus: 'retired'
  }
] as const;

allowedTransitionCases.forEach((transitionCase) => {
  const transitionResult = buildAdminModelReviewResult({
    modelPublicId: draft.modelPublicId,
    input: {
      decision: transitionCase.decision,
      currentStatus: transitionCase.currentStatus,
      reason: `Smoke test ${transitionCase.decision} transition.`,
      reviewerUserPublicId: 'user_admin_smoke'
    }
  });

  assertCondition(
    transitionResult.allowed,
    `${transitionCase.currentStatus} -> ${transitionCase.nextStatus} should pass`
  );
  assertCondition(
    transitionResult.data.previousStatus === transitionCase.currentStatus &&
      transitionResult.data.nextStatus === transitionCase.nextStatus,
    `${transitionCase.decision} should move ${transitionCase.currentStatus} to ${transitionCase.nextStatus}`
  );
  assertCondition(
    transitionResult.data.persistence === 'not_persisted',
    `${transitionCase.decision} must remain not_persisted in MVP smoke test`
  );
});

const blockedResult = buildAdminModelReviewResult({
  modelPublicId: draft.modelPublicId,
  input: {
    decision: 'publish_live',
    currentStatus: 'pending_review',
    reason: 'Smoke test invalid transition.',
    reviewerUserPublicId: 'user_admin_smoke'
  }
});

assertCondition(
  !blockedResult.allowed && blockedResult.error.code === 'policy_blocked',
  'invalid review transition should be policy_blocked'
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      flow: 'creator draft -> admin review -> audit log',
      checked: {
        draftStatus: draft.status,
        draftVisibility: draft.visibility,
        publicDiscoveryEligible: draft.publicDiscoveryEligible,
        artifactStatus: draft.modelArtifactStatus,
        approveAuditAction: approveResult.data.auditLog.action,
        rejectCommentVisibility: rejectResult.data.reviewComment.visibility,
        invalidTransitionCode: blockedResult.error.code,
        persistence: approveResult.data.persistence
      }
    },
    null,
    2
  )
);
