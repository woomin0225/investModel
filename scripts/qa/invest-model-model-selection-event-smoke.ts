import {
  buildModelSelectionEventDto,
  validateModelSelectionEventRequest
} from '@/lib/domain/analytics/model-selection-event';

/**
 * This smoke test verifies the privacy-minimal ModelSelectionEvent contract for BK-052.
 * It confirms model version and selectedAt are recorded without money movement, order, account, or suitability fields.
 */

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const valid = validateModelSelectionEventRequest({
  userPublicId: 'user_public_001',
  modelPublicId: 'model_public_001',
  modelVersionPublicId: 'model_version_public_001',
  modelSelectionPublicId: 'model_selection_public_001',
  selectedAt: '2026-07-14T02:26:17.940Z'
});

assert(valid.success, 'model selection event should validate');

const dto = buildModelSelectionEventDto(valid.data);

assert(
  dto.eventType === 'model_selection_created',
  'event type should be stable'
);
assert(
  dto.modelVersionPublicId === 'model_version_public_001',
  'model version should be recorded'
);
assert(
  dto.selectedAt === '2026-07-14T02:26:17.940Z',
  'selectedAt should be preserved'
);
assert(dto.persistence === 'not_persisted', 'MVP persistence is off');
assert(
  dto.privacyBoundary.noDepositData === true,
  'deposit data must not be collected'
);
assert(
  dto.privacyBoundary.noOrderData === true,
  'order data must not be collected'
);
assert(
  dto.privacyBoundary.noUserPreferenceData === true,
  'user investment preference data must not be collected'
);
assert(
  dto.privacyBoundary.noSuitabilityClaim === true,
  'suitability claims must not be collected'
);

const forbidden = validateModelSelectionEventRequest({
  userPublicId: 'user_public_001',
  modelPublicId: 'model_public_001',
  modelVersionPublicId: 'model_version_public_001',
  modelSelectionPublicId: 'model_selection_public_001',
  selectedAt: '2026-07-14T02:26:17.940Z',
  mockBalance: '100000',
  brokerOrderId: 'broker_order_001',
  stockRatio: '70',
  suitabilityResult: 'approved'
});

assert(!forbidden.success, 'forbidden selection fields should fail validation');
assert(
  forbidden.error.forbiddenFields.includes('mockBalance'),
  'mockBalance should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('brokerOrderId'),
  'brokerOrderId should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('stockRatio'),
  'stockRatio should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('suitabilityResult'),
  'suitabilityResult should be reported as forbidden'
);

console.log('ModelSelectionEvent smoke test passed');
