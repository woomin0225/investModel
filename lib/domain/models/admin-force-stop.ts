import { z } from 'zod';
import { buildAuditLog } from '../audit/audit-log';
import type {
  AccessRole,
  DomainPublicId,
  InvestmentModelStatus
} from '../types';

/**
 * Admin force-stop helpers model an operator emergency suspension without persisting state or touching trading systems.
 * The returned AuditLog payload is the contract that later storage can persist after security and compliance review.
 */

export type AdminForceStopSeverity = 'elevated' | 'critical';

const stoppableStatusSchema = z.enum(['live', 'paused']);

export const adminForceStopRequestSchema = z.object({
  currentStatus: stoppableStatusSchema,
  severity: z.enum(['elevated', 'critical']),
  reason: z.string().trim().min(10).max(700),
  operatorUserPublicId: z.string().trim().min(3).max(120).optional(),
  affectedSurfaces: z
    .array(z.enum(['discover', 'model_detail', 'portfolio', 'signals', 'feed']))
    .min(1)
    .max(5)
});

export type AdminForceStopRequest = z.infer<
  typeof adminForceStopRequestSchema
>;

export function canForceStopInvestmentModel(role: AccessRole) {
  return role === 'admin';
}

export function buildAdminForceStopResult({
  modelPublicId,
  input,
  requestIp
}: {
  modelPublicId: DomainPublicId;
  input: AdminForceStopRequest;
  requestIp?: string;
}) {
  const stoppedAt = new Date().toISOString();
  const nextStatus: InvestmentModelStatus = 'suspended';
  const forceStopPublicId = `force_stop_${crypto.randomUUID()}`;

  const auditLog = buildAuditLog({
    publicId: `audit_${crypto.randomUUID()}`,
    actor: {
      role: 'admin',
      userPublicId: input.operatorUserPublicId
    },
    resource: {
      resourceType: 'InvestmentModel',
      resourcePublicId: modelPublicId
    },
    action: 'admin_model_suspended',
    result: 'allowed',
    reason: input.reason,
    before: {
      status: input.currentStatus
    },
    after: {
      status: nextStatus,
      forceStopPublicId,
      severity: input.severity,
      affectedSurfaces: input.affectedSurfaces,
      userSelectionAllowed: false,
      publicDiscoveryAllowed: false,
      tradeIntentGenerationAllowed: false,
      persistence: 'not_persisted'
    },
    requestIp,
    createdAt: stoppedAt
  });

  return {
    allowed: true as const,
    data: {
      forceStopPublicId,
      modelPublicId,
      previousStatus: input.currentStatus,
      nextStatus,
      severity: input.severity,
      reason: input.reason,
      affectedSurfaces: input.affectedSurfaces,
      stoppedAt,
      userSelectionAllowed: false,
      publicDiscoveryAllowed: false,
      tradeIntentGenerationAllowed: false,
      persistence: 'not_persisted' as const,
      realTrading: false,
      auditLog
    }
  };
}
