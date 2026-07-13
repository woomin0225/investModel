import assert from 'node:assert/strict';

import {
  buildReviewResultNotification,
  isDeliverableReviewResultNotification,
  type BuildReviewResultNotificationInput
} from '../../lib/domain/notifications/review-result-notification';

const baseInput: BuildReviewResultNotificationInput = {
  reviewResult: 'approved',
  modelPublicId: 'model_balanced_rotation',
  modelVersionPublicId: 'model_version_20260714',
  modelName: 'Balanced ETF Rotation',
  creatorPublicId: 'creator_public_001',
  reviewPublicId: 'compliance_review_001',
  adminActorPublicId: 'admin_public_001',
  reviewedAt: '2026-07-14T06:11:21.000Z'
};

const approvedResult = buildReviewResultNotification(baseInput);

assert.equal(approvedResult.ok, true, 'approved review should build');

if (approvedResult.ok) {
  assert.equal(approvedResult.data.kind, 'model_approved');
  assert.equal(approvedResult.data.message.defaultLocale, 'ko');
  assert.equal(approvedResult.data.visibility, 'creator_only');
  assert.equal(approvedResult.data.publicExposure, 'not_public');
  assert.equal(approvedResult.data.financialOperation, 'none');
  assert.equal(approvedResult.data.delivery.provider, 'none_mock');
  assert.equal(approvedResult.data.delivery.state, 'queued_mock');
  assert.equal(approvedResult.data.delivery.sendsRealMessage, false);
  assert.equal(isDeliverableReviewResultNotification(approvedResult.data), true);
}

assert.deepEqual(
  buildReviewResultNotification({
    ...baseInput,
    reviewResult: 'rejected'
  }),
  {
    ok: false,
    error: {
      code: 'missing_reason_for_rejection',
      field: 'reason',
      message: 'Rejected review notifications must include a creator-visible reason.'
    },
    delivery: {
      provider: 'none_mock',
      state: 'blocked_invalid_contract',
      sendsRealMessage: false
    }
  }
);

const rejectedResult = buildReviewResultNotification({
  ...baseInput,
  reviewResult: 'rejected',
  reviewPublicId: 'compliance_review_002',
  reason: 'Performance evidence requires a clearer backtest source label.'
});

assert.equal(rejectedResult.ok, true, 'rejected review with reason should build');

if (rejectedResult.ok) {
  assert.equal(rejectedResult.data.kind, 'model_rejected');
  assert.equal(rejectedResult.data.auditAction, 'admin_model_rejected');
  assert.match(rejectedResult.data.message.ko.body, /사유:/);
}

const changesRequestedResult = buildReviewResultNotification({
  ...baseInput,
  reviewResult: 'changes_requested',
  reviewPublicId: 'compliance_review_003',
  changeRequestSummary:
    'Add a concise risk summary and mark all performance numbers as backtest samples.'
});

assert.equal(
  changesRequestedResult.ok,
  true,
  'changes_requested review with summary should build'
);

if (changesRequestedResult.ok) {
  assert.equal(changesRequestedResult.data.kind, 'model_changes_requested');
  assert.equal(
    changesRequestedResult.data.auditAction,
    'admin_model_changes_requested'
  );
  assert.equal(changesRequestedResult.data.recipient.role, 'creator');
  assert.equal(changesRequestedResult.data.delivery.provider, 'none_mock');
  assert.equal(changesRequestedResult.data.publicExposure, 'not_public');
  assert.equal(changesRequestedResult.data.financialOperation, 'none');
}

const unsupportedResult = buildReviewResultNotification({
  ...baseInput,
  reviewResult: 'pending' as BuildReviewResultNotificationInput['reviewResult']
});

assert.deepEqual(
  unsupportedResult,
  {
    ok: false,
    error: {
      code: 'unsupported_review_result',
      field: 'reviewResult',
      message:
        'Only approved, rejected, and changes_requested review results can notify creators.'
    },
    delivery: {
      provider: 'none_mock',
      state: 'blocked_invalid_contract',
      sendsRealMessage: false
    }
  },
  'pending reviews should not notify creators'
);

console.log(
  'Review result notification smoke test passed for creator-only mock delivery contracts.'
);
