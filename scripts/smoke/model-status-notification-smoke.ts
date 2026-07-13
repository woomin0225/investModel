import assert from 'node:assert/strict';

import {
  buildModelStatusNotification,
  isDeliverableModelStatusNotification,
  type BuildModelStatusNotificationInput
} from '../../lib/domain/notifications/model-status-notification';

const baseInput: BuildModelStatusNotificationInput = {
  userPublicId: 'user_public_001',
  modelSelectionPublicId: 'selection_public_001',
  modelPublicId: 'model_balanced_rotation',
  modelVersionPublicId: 'model_version_20260714',
  modelName: 'Balanced ETF Rotation',
  previousStatus: 'live',
  newStatus: 'paused',
  reasonCode: 'operator_review',
  userSafeSummary:
    'The model is not available for new mock allocation previews while the operator review is active.',
  changedAt: '2026-07-14T06:16:21.000Z',
  sourceAuditLogPublicId: 'audit_public_001',
  adminActorPublicId: 'admin_public_001'
};

const pausedResult = buildModelStatusNotification(baseInput);

assert.equal(pausedResult.ok, true, 'paused status should notify selected users');

if (pausedResult.ok) {
  assert.equal(pausedResult.data.kind, 'selected_model_paused');
  assert.equal(pausedResult.data.recipient.role, 'user');
  assert.equal(pausedResult.data.visibility, 'user_only');
  assert.equal(pausedResult.data.publicExposure, 'not_public');
  assert.equal(pausedResult.data.financialOperation, 'none');
  assert.equal(pausedResult.data.legalCopyReviewState, 'placeholder_not_final');
  assert.equal(pausedResult.data.delivery.provider, 'none_mock');
  assert.equal(pausedResult.data.delivery.state, 'queued_mock');
  assert.equal(pausedResult.data.delivery.sendsRealMessage, false);
  assert.equal(isDeliverableModelStatusNotification(pausedResult.data), true);
}

const suspendedResult = buildModelStatusNotification({
  ...baseInput,
  modelSelectionPublicId: 'selection_public_002',
  newStatus: 'suspended',
  reasonCode: 'risk_review',
  userSafeSummary:
    'The model is hidden from new selection until the risk review is completed.'
});

assert.equal(
  suspendedResult.ok,
  true,
  'suspended status should notify selected users'
);

if (suspendedResult.ok) {
  assert.equal(suspendedResult.data.kind, 'selected_model_suspended');
  assert.equal(suspendedResult.data.statusChange.reasonCode, 'risk_review');
}

const retiredResult = buildModelStatusNotification({
  ...baseInput,
  modelSelectionPublicId: 'selection_public_003',
  previousStatus: 'paused',
  newStatus: 'retired',
  reasonCode: 'product_decision',
  userSafeSummary:
    'The model remains visible as history only and does not create new TradeIntent previews.'
});

assert.equal(retiredResult.ok, true, 'retired status should notify selected users');

if (retiredResult.ok) {
  assert.equal(retiredResult.data.kind, 'selected_model_retired');
  assert.match(retiredResult.data.message.en.body, /does not create new TradeIntent/);
}

assert.deepEqual(
  buildModelStatusNotification({
    ...baseInput,
    newStatus: 'live' as BuildModelStatusNotificationInput['newStatus']
  }),
  {
    ok: false,
    error: {
      code: 'unsupported_new_status',
      field: 'newStatus',
      message:
        'Only paused, suspended, and retired selected model states notify users in the MVP.'
    },
    delivery: {
      provider: 'none_mock',
      state: 'blocked_invalid_contract',
      sendsRealMessage: false
    }
  },
  'live status changes should not use the inactive-state notification contract'
);

assert.deepEqual(
  buildModelStatusNotification({
    ...baseInput,
    previousStatus: 'paused',
    newStatus: 'paused'
  }),
  {
    ok: false,
    error: {
      code: 'unchanged_status',
      field: 'newStatus',
      message: 'A model status notification requires a real status change.'
    },
    delivery: {
      provider: 'none_mock',
      state: 'blocked_invalid_contract',
      sendsRealMessage: false
    }
  },
  'unchanged status should not notify users'
);

assert.equal(
  buildModelStatusNotification({
    ...baseInput,
    userSafeSummary: ''
  }).ok,
  false,
  'userSafeSummary is required to avoid vague or advice-like notifications'
);

console.log(
  'Model status notification smoke test passed for user-only mock delivery contracts.'
);
