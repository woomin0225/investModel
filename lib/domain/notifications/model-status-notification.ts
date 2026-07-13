import type { DomainPublicId, InvestmentModelStatus } from '../types';

/**
 * Model status notifications are user-visible DTOs for selected InvestmentModel changes.
 * They do not send push, email, SMS, or any external provider message in the MVP.
 */

export type UserImpactingModelStatus = Extract<
  InvestmentModelStatus,
  'paused' | 'suspended' | 'retired'
>;

export type ModelStatusNotificationKind =
  | 'selected_model_paused'
  | 'selected_model_suspended'
  | 'selected_model_retired';

export type ModelStatusNotificationReason =
  | 'operator_review'
  | 'creator_request'
  | 'risk_review'
  | 'policy_review'
  | 'market_data_unavailable'
  | 'product_decision';

export type ModelStatusNotificationBuildError =
  | 'missing_user_public_id'
  | 'missing_model_selection_public_id'
  | 'missing_model_public_id'
  | 'missing_model_version_public_id'
  | 'missing_model_name'
  | 'missing_previous_status'
  | 'missing_changed_at'
  | 'missing_reason_code'
  | 'unsupported_new_status'
  | 'unchanged_status'
  | 'missing_user_safe_summary';

export interface BuildModelStatusNotificationInput {
  userPublicId: DomainPublicId;
  modelSelectionPublicId: DomainPublicId;
  modelPublicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  modelName: string;
  previousStatus: InvestmentModelStatus;
  newStatus: UserImpactingModelStatus;
  reasonCode: ModelStatusNotificationReason;
  userSafeSummary: string;
  changedAt: string;
  sourceAuditLogPublicId?: DomainPublicId;
  adminActorPublicId?: DomainPublicId;
}

export interface ModelStatusNotificationDto {
  publicId: DomainPublicId;
  kind: ModelStatusNotificationKind;
  recipient: {
    role: 'user';
    userPublicId: DomainPublicId;
  };
  relatedResources: {
    modelSelectionPublicId: DomainPublicId;
    modelPublicId: DomainPublicId;
    modelVersionPublicId: DomainPublicId;
    sourceAuditLogPublicId?: DomainPublicId;
  };
  statusChange: {
    previousStatus: InvestmentModelStatus;
    newStatus: UserImpactingModelStatus;
    reasonCode: ModelStatusNotificationReason;
    changedAt: string;
    changedByAdminPublicId?: DomainPublicId;
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
    provider: 'none_mock';
    state: 'queued_mock';
    sendsRealMessage: false;
    queuedAt: string;
  };
  visibility: 'user_only';
  publicExposure: 'not_public';
  financialOperation: 'none';
  legalCopyReviewState: 'placeholder_not_final';
}

export type ModelStatusNotificationBuildResult =
  | {
      ok: true;
      data: ModelStatusNotificationDto;
    }
  | {
      ok: false;
      error: {
        code: ModelStatusNotificationBuildError;
        field: keyof BuildModelStatusNotificationInput;
        message: string;
      };
      delivery: {
        provider: 'none_mock';
        state: 'blocked_invalid_contract';
        sendsRealMessage: false;
      };
    };

const supportedNewStatuses = new Set<UserImpactingModelStatus>([
  'paused',
  'suspended',
  'retired'
]);

const kindByStatus: Record<
  UserImpactingModelStatus,
  ModelStatusNotificationKind
> = {
  paused: 'selected_model_paused',
  suspended: 'selected_model_suspended',
  retired: 'selected_model_retired'
};

const titleByStatus = {
  ko: {
    paused: '선택한 모델이 일시 중지되었습니다.',
    suspended: '선택한 모델이 정지되었습니다.',
    retired: '선택한 모델 운용이 종료되었습니다.'
  },
  en: {
    paused: 'Your selected model was paused.',
    suspended: 'Your selected model was suspended.',
    retired: 'Your selected model was retired.'
  }
} satisfies Record<'ko' | 'en', Record<UserImpactingModelStatus, string>>;

function trimValue(value: string | undefined) {
  return value?.trim() ?? '';
}

function buildInvalidResult(
  code: ModelStatusNotificationBuildError,
  field: keyof BuildModelStatusNotificationInput,
  message: string
): ModelStatusNotificationBuildResult {
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
  input: BuildModelStatusNotificationInput,
  field: keyof BuildModelStatusNotificationInput,
  code: ModelStatusNotificationBuildError,
  message: string
) {
  const value = trimValue(input[field] as string | undefined);

  if (!value) {
    return buildInvalidResult(code, field, message);
  }

  return null;
}

function buildPublicId({
  modelSelectionPublicId,
  newStatus,
  changedAt
}: Pick<
  BuildModelStatusNotificationInput,
  'modelSelectionPublicId' | 'newStatus' | 'changedAt'
>) {
  return `notification_model_status_${modelSelectionPublicId}_${newStatus}_${changedAt.replace(/[^0-9A-Za-z]/g, '')}`;
}

function buildMessage({
  modelName,
  newStatus,
  userSafeSummary
}: Pick<
  BuildModelStatusNotificationInput,
  'modelName' | 'newStatus' | 'userSafeSummary'
>): ModelStatusNotificationDto['message'] {
  const safeSummary = trimValue(userSafeSummary);

  return {
    defaultLocale: 'ko',
    ko: {
      title: titleByStatus.ko[newStatus],
      body: `${modelName} 모델 상태가 ${newStatus}로 변경되었습니다. ${safeSummary}`
    },
    en: {
      title: titleByStatus.en[newStatus],
      body: `${modelName} changed to ${newStatus}. ${safeSummary}`
    }
  };
}

export function buildModelStatusNotification(
  input: BuildModelStatusNotificationInput
): ModelStatusNotificationBuildResult {
  if (!supportedNewStatuses.has(input.newStatus)) {
    return buildInvalidResult(
      'unsupported_new_status',
      'newStatus',
      'Only paused, suspended, and retired selected model states notify users in the MVP.'
    );
  }

  if (input.previousStatus === input.newStatus) {
    return buildInvalidResult(
      'unchanged_status',
      'newStatus',
      'A model status notification requires a real status change.'
    );
  }

  const requiredChecks: Array<
    [
      keyof BuildModelStatusNotificationInput,
      ModelStatusNotificationBuildError,
      string
    ]
  > = [
    [
      'userPublicId',
      'missing_user_public_id',
      'userPublicId is required for user-only model status notifications.'
    ],
    [
      'modelSelectionPublicId',
      'missing_model_selection_public_id',
      'modelSelectionPublicId is required to notify only users who selected the model.'
    ],
    [
      'modelPublicId',
      'missing_model_public_id',
      'modelPublicId is required for model status notifications.'
    ],
    [
      'modelVersionPublicId',
      'missing_model_version_public_id',
      'modelVersionPublicId is required for model status notifications.'
    ],
    [
      'modelName',
      'missing_model_name',
      'modelName is required for user-visible notification copy.'
    ],
    [
      'previousStatus',
      'missing_previous_status',
      'previousStatus is required for audit traceability.'
    ],
    [
      'changedAt',
      'missing_changed_at',
      'changedAt is required for notification timing.'
    ],
    [
      'reasonCode',
      'missing_reason_code',
      'reasonCode is required to explain the non-final status change context.'
    ],
    [
      'userSafeSummary',
      'missing_user_safe_summary',
      'userSafeSummary is required and must avoid legal, suitability, return, or trading advice claims.'
    ]
  ];

  for (const [field, code, message] of requiredChecks) {
    const invalid = requireText(input, field, code, message);

    if (invalid) {
      return invalid;
    }
  }

  return {
    ok: true,
    data: {
      publicId: buildPublicId(input),
      kind: kindByStatus[input.newStatus],
      recipient: {
        role: 'user',
        userPublicId: trimValue(input.userPublicId)
      },
      relatedResources: {
        modelSelectionPublicId: trimValue(input.modelSelectionPublicId),
        modelPublicId: trimValue(input.modelPublicId),
        modelVersionPublicId: trimValue(input.modelVersionPublicId),
        sourceAuditLogPublicId:
          trimValue(input.sourceAuditLogPublicId) || undefined
      },
      statusChange: {
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        reasonCode: input.reasonCode,
        changedAt: trimValue(input.changedAt),
        changedByAdminPublicId:
          trimValue(input.adminActorPublicId) || undefined
      },
      message: buildMessage(input),
      delivery: {
        provider: 'none_mock',
        state: 'queued_mock',
        sendsRealMessage: false,
        queuedAt: trimValue(input.changedAt)
      },
      visibility: 'user_only',
      publicExposure: 'not_public',
      financialOperation: 'none',
      legalCopyReviewState: 'placeholder_not_final'
    }
  };
}

export function isDeliverableModelStatusNotification(
  notification: ModelStatusNotificationDto
) {
  return (
    notification.recipient.role === 'user' &&
    notification.delivery.provider === 'none_mock' &&
    notification.delivery.state === 'queued_mock' &&
    notification.delivery.sendsRealMessage === false &&
    notification.visibility === 'user_only' &&
    notification.publicExposure === 'not_public' &&
    notification.financialOperation === 'none' &&
    notification.legalCopyReviewState === 'placeholder_not_final'
  );
}
