import type { AuditAction } from '../audit/audit-log';
import type { DomainPublicId, ReviewStatus } from '../types';

/**
 * Review result notifications are creator-visible DTOs only.
 * They do not send email, SMS, push notifications, or connect to an external provider.
 */

export type ReviewResultNotificationResult = Extract<
  ReviewStatus,
  'approved' | 'rejected' | 'changes_requested'
>;

export type ReviewResultNotificationKind =
  | 'model_approved'
  | 'model_rejected'
  | 'model_changes_requested';

export type ReviewResultNotificationProvider = 'none_mock';

export type ReviewResultNotificationDeliveryState =
  | 'queued_mock'
  | 'blocked_invalid_contract';

export type ReviewResultNotificationBuildError =
  | 'missing_model_public_id'
  | 'missing_model_version_public_id'
  | 'missing_model_name'
  | 'missing_creator_public_id'
  | 'missing_review_public_id'
  | 'missing_reviewed_at'
  | 'missing_admin_actor_public_id'
  | 'unsupported_review_result'
  | 'missing_reason_for_rejection'
  | 'missing_change_request_summary';

export interface BuildReviewResultNotificationInput {
  reviewResult: ReviewResultNotificationResult;
  modelPublicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  modelName: string;
  creatorPublicId: DomainPublicId;
  reviewPublicId: DomainPublicId;
  adminActorPublicId: DomainPublicId;
  reviewedAt: string;
  reason?: string;
  changeRequestSummary?: string;
}

export interface ReviewResultNotificationDto {
  publicId: DomainPublicId;
  kind: ReviewResultNotificationKind;
  recipient: {
    role: 'creator';
    creatorPublicId: DomainPublicId;
  };
  relatedResources: {
    modelPublicId: DomainPublicId;
    modelVersionPublicId: DomainPublicId;
    complianceReviewPublicId: DomainPublicId;
  };
  review: {
    result: ReviewResultNotificationResult;
    reviewedAt: string;
    reviewedByAdminPublicId: DomainPublicId;
    reason?: string;
    changeRequestSummary?: string;
  };
  message: {
    defaultLocale: 'ko';
    ko: {
      title: string;
      body: string;
    };
    en: {
      title: string;
      body: string;
    };
  };
  delivery: {
    provider: ReviewResultNotificationProvider;
    state: 'queued_mock';
    sendsRealMessage: false;
    queuedAt: string;
  };
  visibility: 'creator_only';
  publicExposure: 'not_public';
  financialOperation: 'none';
  auditAction: AuditAction;
}

export type ReviewResultNotificationBuildResult =
  | {
      ok: true;
      data: ReviewResultNotificationDto;
    }
  | {
      ok: false;
      error: {
        code: ReviewResultNotificationBuildError;
        field: keyof BuildReviewResultNotificationInput;
        message: string;
      };
      delivery: {
        provider: ReviewResultNotificationProvider;
        state: 'blocked_invalid_contract';
        sendsRealMessage: false;
      };
    };

const kindByResult: Record<
  ReviewResultNotificationResult,
  ReviewResultNotificationKind
> = {
  approved: 'model_approved',
  rejected: 'model_rejected',
  changes_requested: 'model_changes_requested'
};

const auditActionByResult: Record<
  ReviewResultNotificationResult,
  AuditAction
> = {
  approved: 'admin_model_approved',
  rejected: 'admin_model_rejected',
  changes_requested: 'admin_model_changes_requested'
};

const supportedResults = new Set<ReviewResultNotificationResult>([
  'approved',
  'rejected',
  'changes_requested'
]);

function trimValue(value: string | undefined) {
  return value?.trim() ?? '';
}

function buildInvalidResult(
  code: ReviewResultNotificationBuildError,
  field: keyof BuildReviewResultNotificationInput,
  message: string
): ReviewResultNotificationBuildResult {
  return {
    ok: false,
    error: {
      code,
      field,
      message
    },
    delivery: {
      provider: 'none_mock',
      state: 'blocked_invalid_contract',
      sendsRealMessage: false
    }
  };
}

function requireText(
  input: BuildReviewResultNotificationInput,
  field: keyof BuildReviewResultNotificationInput,
  code: ReviewResultNotificationBuildError,
  message: string
) {
  const value = trimValue(input[field] as string | undefined);

  if (!value) {
    return buildInvalidResult(code, field, message);
  }

  return null;
}

function buildPublicId({
  reviewPublicId,
  reviewResult
}: Pick<BuildReviewResultNotificationInput, 'reviewPublicId' | 'reviewResult'>) {
  return `notification_review_${reviewPublicId}_${reviewResult}`;
}

function buildMessage({
  modelName,
  reviewResult,
  reason,
  changeRequestSummary
}: Pick<
  BuildReviewResultNotificationInput,
  'modelName' | 'reviewResult' | 'reason' | 'changeRequestSummary'
>): ReviewResultNotificationDto['message'] {
  if (reviewResult === 'approved') {
    return {
      defaultLocale: 'ko',
      ko: {
        title: '모델 심사가 승인되었습니다.',
        body: `${modelName} 모델이 운영자 심사를 통과했습니다. 공개 전 최종 노출 상태는 별도 워크플로에서 관리됩니다.`
      },
      en: {
        title: 'Model review approved.',
        body: `${modelName} passed operator review. Final public exposure is handled by a separate workflow.`
      }
    };
  }

  if (reviewResult === 'rejected') {
    return {
      defaultLocale: 'ko',
      ko: {
        title: '모델 심사가 반려되었습니다.',
        body: `${modelName} 모델 심사가 반려되었습니다. 사유: ${trimValue(reason)}`
      },
      en: {
        title: 'Model review rejected.',
        body: `${modelName} was rejected during operator review. Reason: ${trimValue(reason)}`
      }
    };
  }

  return {
    defaultLocale: 'ko',
    ko: {
      title: '모델 수정 요청이 도착했습니다.',
      body: `${modelName} 모델에 수정 요청이 있습니다. 요청 내용: ${trimValue(changeRequestSummary)}`
    },
    en: {
      title: 'Model changes requested.',
      body: `${modelName} needs changes before review can continue. Request: ${trimValue(changeRequestSummary)}`
    }
  };
}

export function buildReviewResultNotification(
  input: BuildReviewResultNotificationInput
): ReviewResultNotificationBuildResult {
  if (!supportedResults.has(input.reviewResult)) {
    return buildInvalidResult(
      'unsupported_review_result',
      'reviewResult',
      'Only approved, rejected, and changes_requested review results can notify creators.'
    );
  }

  const requiredChecks: Array<
    [
      keyof BuildReviewResultNotificationInput,
      ReviewResultNotificationBuildError,
      string
    ]
  > = [
    [
      'modelPublicId',
      'missing_model_public_id',
      'modelPublicId is required for review result notifications.'
    ],
    [
      'modelVersionPublicId',
      'missing_model_version_public_id',
      'modelVersionPublicId is required for review result notifications.'
    ],
    [
      'modelName',
      'missing_model_name',
      'modelName is required for creator-visible notification copy.'
    ],
    [
      'creatorPublicId',
      'missing_creator_public_id',
      'creatorPublicId is required because review result notifications are creator-only.'
    ],
    [
      'reviewPublicId',
      'missing_review_public_id',
      'reviewPublicId is required to link the notification to a ComplianceReview.'
    ],
    [
      'reviewedAt',
      'missing_reviewed_at',
      'reviewedAt is required to preserve review timing.'
    ],
    [
      'adminActorPublicId',
      'missing_admin_actor_public_id',
      'adminActorPublicId is required for audit traceability.'
    ]
  ];

  for (const [field, code, message] of requiredChecks) {
    const invalid = requireText(input, field, code, message);

    if (invalid) {
      return invalid;
    }
  }

  if (input.reviewResult === 'rejected' && !trimValue(input.reason)) {
    return buildInvalidResult(
      'missing_reason_for_rejection',
      'reason',
      'Rejected review notifications must include a creator-visible reason.'
    );
  }

  if (
    input.reviewResult === 'changes_requested' &&
    !trimValue(input.changeRequestSummary)
  ) {
    return buildInvalidResult(
      'missing_change_request_summary',
      'changeRequestSummary',
      'Change request notifications must include a creator-visible summary.'
    );
  }

  return {
    ok: true,
    data: {
      publicId: buildPublicId(input),
      kind: kindByResult[input.reviewResult],
      recipient: {
        role: 'creator',
        creatorPublicId: trimValue(input.creatorPublicId)
      },
      relatedResources: {
        modelPublicId: trimValue(input.modelPublicId),
        modelVersionPublicId: trimValue(input.modelVersionPublicId),
        complianceReviewPublicId: trimValue(input.reviewPublicId)
      },
      review: {
        result: input.reviewResult,
        reviewedAt: trimValue(input.reviewedAt),
        reviewedByAdminPublicId: trimValue(input.adminActorPublicId),
        reason: trimValue(input.reason) || undefined,
        changeRequestSummary: trimValue(input.changeRequestSummary) || undefined
      },
      message: buildMessage(input),
      delivery: {
        provider: 'none_mock',
        state: 'queued_mock',
        sendsRealMessage: false,
        queuedAt: trimValue(input.reviewedAt)
      },
      visibility: 'creator_only',
      publicExposure: 'not_public',
      financialOperation: 'none',
      auditAction: auditActionByResult[input.reviewResult]
    }
  };
}

export function isDeliverableReviewResultNotification(
  notification: ReviewResultNotificationDto
) {
  return (
    notification.recipient.role === 'creator' &&
    notification.delivery.provider === 'none_mock' &&
    notification.delivery.state === 'queued_mock' &&
    notification.delivery.sendsRealMessage === false &&
    notification.visibility === 'creator_only' &&
    notification.publicExposure === 'not_public' &&
    notification.financialOperation === 'none'
  );
}
