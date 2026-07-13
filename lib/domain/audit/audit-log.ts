import { z } from 'zod';
import type { AccessRole, DomainPublicId, PermissionResult } from '../types';

/**
 * AuditLog defines the immutable event shape for important creator, admin, system, and policy-blocked actions.
 * It records actor, resource, action, result, timestamp, and optional snapshots without exposing internal database ids.
 */

export type AuditActorRole = Exclude<AccessRole, 'public'>;

export type AuditResourceType =
  | 'InvestmentModel'
  | 'ModelVersion'
  | 'ModelDisclosure'
  | 'ComplianceReview'
  | 'UserModelSelection'
  | 'MockDeposit'
  | 'Portfolio'
  | 'AllocationDecision'
  | 'TradeIntent'
  | 'FeedPost'
  | 'PermissionPolicy';

export type AuditAction =
  | 'creator_model_draft_created'
  | 'creator_model_submitted_for_review'
  | 'creator_model_pause_requested'
  | 'admin_model_changes_requested'
  | 'admin_model_rejected'
  | 'admin_model_approved'
  | 'admin_model_published_live'
  | 'admin_model_paused'
  | 'admin_model_suspended'
  | 'admin_model_retired'
  | 'model_disclosure_review_required'
  | 'user_model_selected'
  | 'mock_deposit_created'
  | 'mock_deposit_status_changed'
  | 'allocation_decision_policy_checked'
  | 'trade_intent_policy_checked'
  | 'trade_intent_blocked'
  | 'permission_denied'
  | 'policy_blocked';

export type AuditResult = PermissionResult;

export type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };

export interface AuditActor {
  role: AuditActorRole;
  userPublicId?: DomainPublicId;
}

export interface AuditResource {
  resourceType: AuditResourceType;
  resourcePublicId?: DomainPublicId;
}

export interface AuditLog {
  publicId: DomainPublicId;
  actor: AuditActor;
  resource: AuditResource;
  action: AuditAction;
  result: AuditResult;
  reason?: string;
  before?: AuditJsonValue;
  after?: AuditJsonValue;
  requestIp?: string;
  createdAt: string;
}

const auditActorRoleSchema = z.enum(['user', 'creator', 'admin', 'system']);

const auditResourceTypeSchema = z.enum([
  'InvestmentModel',
  'ModelVersion',
  'ModelDisclosure',
  'ComplianceReview',
  'UserModelSelection',
  'MockDeposit',
  'Portfolio',
  'AllocationDecision',
  'TradeIntent',
  'FeedPost',
  'PermissionPolicy'
]);

const auditActionSchema = z.enum([
  'creator_model_draft_created',
  'creator_model_submitted_for_review',
  'creator_model_pause_requested',
  'admin_model_changes_requested',
  'admin_model_rejected',
  'admin_model_approved',
  'admin_model_published_live',
  'admin_model_paused',
  'admin_model_suspended',
  'admin_model_retired',
  'model_disclosure_review_required',
  'user_model_selected',
  'mock_deposit_created',
  'mock_deposit_status_changed',
  'allocation_decision_policy_checked',
  'trade_intent_policy_checked',
  'trade_intent_blocked',
  'permission_denied',
  'policy_blocked'
]);

const auditJsonValueSchema: z.ZodType<AuditJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(auditJsonValueSchema),
    z.record(auditJsonValueSchema)
  ])
);

export const auditLogSchema = z.object({
  publicId: z.string().trim().min(3).max(120),
  actor: z.object({
    role: auditActorRoleSchema,
    userPublicId: z.string().trim().min(3).max(120).optional()
  }),
  resource: z.object({
    resourceType: auditResourceTypeSchema,
    resourcePublicId: z.string().trim().min(3).max(120).optional()
  }),
  action: auditActionSchema,
  result: z.enum(['allowed', 'denied', 'policy_blocked', 'review_required']),
  reason: z.string().trim().min(2).max(500).optional(),
  before: auditJsonValueSchema.optional(),
  after: auditJsonValueSchema.optional(),
  requestIp: z.string().trim().min(3).max(45).optional(),
  createdAt: z.string().datetime()
});

export type AuditLogInput = z.input<typeof auditLogSchema>;

export function buildAuditLog(input: AuditLogInput): AuditLog {
  return auditLogSchema.parse(input);
}
