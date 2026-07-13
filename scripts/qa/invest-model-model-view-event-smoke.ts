import {
  buildModelViewEventDto,
  validateModelViewEventRequest
} from '@/lib/domain/analytics/model-view-event';

/**
 * This smoke test verifies the privacy-minimal ModelViewEvent contract for BK-051.
 * It confirms view analytics can be represented without storing raw device, account, order, or payment data.
 */

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const listView = validateModelViewEventRequest({
  surface: 'model_list',
  viewerRole: 'public',
  locale: 'ko'
});

assert(listView.success, 'public model list view should validate');

const listViewDto = buildModelViewEventDto(
  listView.data,
  '2026-07-14T02:21:17.873Z'
);

assert(listViewDto.eventType === 'model_viewed', 'event type should be stable');
assert(listViewDto.surface === 'model_list', 'surface should be model_list');
assert(listViewDto.locale === 'ko', 'default Korean locale should be preserved');
assert(
  listViewDto.privacyBoundary.noRawIp === true,
  'raw IP collection must be disabled'
);
assert(
  listViewDto.privacyBoundary.noFinancialBehavior === true,
  'financial behavior collection must be disabled'
);

const detailView = validateModelViewEventRequest({
  surface: 'model_detail',
  viewerRole: 'user',
  viewerPublicId: 'user_public_001',
  modelPublicId: 'model_public_001',
  modelVersionPublicId: 'model_version_public_001',
  locale: 'en'
});

assert(detailView.success, 'signed-in model detail view should validate');

const detailViewDto = buildModelViewEventDto(
  detailView.data,
  '2026-07-14T02:21:18.873Z'
);

assert(
  detailViewDto.modelPublicId === 'model_public_001',
  'detail view should preserve model public id'
);
assert(
  detailViewDto.modelVersionPublicId === 'model_version_public_001',
  'detail view should preserve model version public id'
);
assert(detailViewDto.persistence === 'not_persisted', 'MVP persistence is off');

const forbidden = validateModelViewEventRequest({
  surface: 'model_detail',
  viewerRole: 'user',
  modelPublicId: 'model_public_001',
  locale: 'ko',
  ipAddress: '192.0.2.10',
  userAgent: 'Example browser',
  accountNumber: '123456789'
});

assert(!forbidden.success, 'forbidden tracking fields should fail validation');
assert(
  forbidden.error.forbiddenFields.includes('ipAddress'),
  'ipAddress should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('userAgent'),
  'userAgent should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('accountNumber'),
  'accountNumber should be reported as forbidden'
);

console.log('ModelViewEvent smoke test passed');
