import {
  buildModelReportDto,
  canCreateModelReport,
  validateModelReportRequest
} from '@/lib/domain/compliance/model-report';

/**
 * This smoke test verifies the mock-safe ModelReport contract for BK-053.
 * It confirms user reports can be routed to operator review without legal conclusions, compensation, account data, or trading actions.
 */

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(canCreateModelReport('user'), 'user role should create model reports');
assert(canCreateModelReport('admin'), 'admin role should create model reports');
assert(!canCreateModelReport('public'), 'public role should not create reports');
assert(!canCreateModelReport('creator'), 'creator role should not create reports');

const valid = validateModelReportRequest({
  reporterUserPublicId: 'user_public_001',
  modelPublicId: 'model_public_001',
  modelVersionPublicId: 'model_version_public_001',
  reportType: 'misleading_performance',
  summary:
    'The performance wording looks stronger than the backtest placeholder context shown elsewhere.'
});

assert(valid.success, 'valid model report should pass validation');

const dto = buildModelReportDto(valid.data, '2026-07-14T02:31:18.037Z');

assert(dto.status === 'pending_review', 'report should start pending review');
assert(
  dto.reviewRouting.operatorReviewRequired === true,
  'report should route to operator review'
);
assert(
  dto.reviewRouting.finalLegalJudgment === false,
  'report must not make a final legal judgment'
);
assert(dto.persistence === 'not_persisted', 'MVP persistence is off');
assert(
  dto.safetyBoundary.noTradingAction === true,
  'report must not trigger trading action'
);

const forbidden = validateModelReportRequest({
  reporterUserPublicId: 'user_public_001',
  modelPublicId: 'model_public_001',
  reportType: 'inappropriate_claim',
  summary: 'This report includes fields that should not be accepted.',
  legalConclusion: 'illegal',
  compensationAmount: '1000',
  brokerOrderId: 'broker_order_001',
  accountNumber: '123456789'
});

assert(!forbidden.success, 'forbidden report fields should fail validation');
assert(
  forbidden.error.forbiddenFields.includes('legalConclusion'),
  'legalConclusion should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('compensationAmount'),
  'compensationAmount should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('brokerOrderId'),
  'brokerOrderId should be reported as forbidden'
);
assert(
  forbidden.error.forbiddenFields.includes('accountNumber'),
  'accountNumber should be reported as forbidden'
);

console.log('ModelReport smoke test passed');
