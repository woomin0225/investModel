/**
 * This smoke test verifies the admin force-stop domain contract without DB writes, real orders, or fund movement.
 */

import {
  buildAdminForceStopResult,
  canForceStopInvestmentModel
} from '../../lib/domain/models/admin-force-stop';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assertCondition(
  canForceStopInvestmentModel('admin'),
  'admin should force-stop models'
);
assertCondition(
  !canForceStopInvestmentModel('creator'),
  'creator must not force-stop models'
);
assertCondition(
  !canForceStopInvestmentModel('user'),
  'user must not force-stop models'
);

const forceStopResult = buildAdminForceStopResult({
  modelPublicId: 'model_force_stop_smoke',
  input: {
    currentStatus: 'live',
    severity: 'critical',
    reason:
      'Smoke test force-stop after operator identifies a mock high-risk disclosure concern.',
    operatorUserPublicId: 'user_admin_force_stop',
    affectedSurfaces: ['discover', 'model_detail', 'portfolio']
  },
  requestIp: '127.0.0.1'
});

assertCondition(forceStopResult.allowed, 'force-stop should be allowed');
assertCondition(
  forceStopResult.data.previousStatus === 'live' &&
    forceStopResult.data.nextStatus === 'suspended',
  'force-stop should move live model to suspended'
);
assertCondition(
  forceStopResult.data.auditLog.action === 'admin_model_suspended',
  'force-stop should return admin_model_suspended audit action'
);
assertCondition(
  forceStopResult.data.auditLog.resource.resourcePublicId ===
    'model_force_stop_smoke',
  'audit log should target the stopped model public id'
);
assertCondition(
  forceStopResult.data.publicDiscoveryAllowed === false &&
    forceStopResult.data.userSelectionAllowed === false &&
    forceStopResult.data.tradeIntentGenerationAllowed === false,
  'force-stop should disable discovery, selection, and TradeIntent generation'
);
assertCondition(
  forceStopResult.data.persistence === 'not_persisted' &&
    forceStopResult.data.realTrading === false,
  'force-stop smoke result must stay mock-safe and not persisted'
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      flow: 'admin force-stop -> suspended -> audit log',
      checked: {
        nextStatus: forceStopResult.data.nextStatus,
        severity: forceStopResult.data.severity,
        auditAction: forceStopResult.data.auditLog.action,
        publicDiscoveryAllowed: forceStopResult.data.publicDiscoveryAllowed,
        userSelectionAllowed: forceStopResult.data.userSelectionAllowed,
        tradeIntentGenerationAllowed:
          forceStopResult.data.tradeIntentGenerationAllowed,
        persistence: forceStopResult.data.persistence,
        realTrading: forceStopResult.data.realTrading
      }
    },
    null,
    2
  )
);
