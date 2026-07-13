import { z } from 'zod';
import { buildAuditLog } from '../audit/audit-log';
import type {
  AccessRole,
  DomainPublicId,
  InvestmentModelStatus
} from '../types';

/**
 * Admin model review helpers validate operator-only model status transitions and produce an AuditLog payload.
 * This MVP helper does not persist state, publish models, execute model files, or connect to real trading systems.
 */

export type AdminModelReviewDecision =
  | 'approve'
  | 'request_changes'
  | 'reject'
  | 'publish_live'
  | 'pause'
  | 'suspend'
  | 'retire';

export type AdminReviewCommentVisibility = 'internal' | 'creator_visible';

type AdminReviewTransition = {
  from: InvestmentModelStatus;
  to: InvestmentModelStatus;
};

const transitionByDecision: Record<
  AdminModelReviewDecision,
  AdminReviewTransition[]
> = {
  approve: [{ from: 'pending_review', to: 'approved' }],
  request_changes: [{ from: 'pending_review', to: 'changes_requested' }],
  reject: [{ from: 'pending_review', to: 'rejected' }],
  publish_live: [{ from: 'approved', to: 'live' }],
  pause: [{ from: 'live', to: 'paused' }],
  suspend: [
    { from: 'live', to: 'suspended' },
    { from: 'paused', to: 'suspended' }
  ],
  retire: [
    { from: 'approved', to: 'retired' },
    { from: 'live', to: 'retired' },
    { from: 'paused', to: 'retired' },
    { from: 'suspended', to: 'retired' }
  ]
};

const auditActionByDecision = {
  approve: 'admin_model_approved',
  request_changes: 'admin_model_changes_requested',
  reject: 'admin_model_rejected',
  publish_live: 'admin_model_published_live',
  pause: 'admin_model_paused',
  suspend: 'admin_model_suspended',
  retire: 'admin_model_retired'
} as const;

const investmentModelStatusSchema = z.enum([
  'draft',
  'pending_review',
  'changes_requested',
  'rejected',
  'approved',
  'live',
  'paused',
  'suspended',
  'retired'
]);

export const adminModelReviewRequestSchema = z.object({
  decision: z.enum([
    'approve',
    'request_changes',
    'reject',
    'publish_live',
    'pause',
    'suspend',
    'retire'
  ]),
  currentStatus: investmentModelStatusSchema,
  reason: z.string().trim().min(3).max(500),
  reviewerUserPublicId: z.string().trim().min(3).max(120).optional()
});

export type AdminModelReviewRequest = z.infer<
  typeof adminModelReviewRequestSchema
>;

function resolveCommentVisibility(decision: AdminModelReviewDecision) {
  return decision === 'request_changes' || decision === 'reject'
    ? 'creator_visible'
    : 'internal';
}

function buildAdminReviewComment({
  decision,
  reason,
  reviewerUserPublicId,
  reviewedAt
}: {
  decision: AdminModelReviewDecision;
  reason: string;
  reviewerUserPublicId?: DomainPublicId;
  reviewedAt: string;
}) {
  return {
    publicId: `review_comment_${crypto.randomUUID()}`,
    body: reason,
    decision,
    visibility: resolveCommentVisibility(decision),
    reviewerUserPublicId,
    createdAt: reviewedAt,
    persistence: 'not_persisted' as const
  };
}

export function canReviewInvestmentModel(role: AccessRole) {
  return role === 'admin';
}

export function resolveAdminModelReviewTransition(
  decision: AdminModelReviewDecision,
  currentStatus: InvestmentModelStatus
) {
  return transitionByDecision[decision].find(
    (transition) => transition.from === currentStatus
  );
}

export function buildAdminModelReviewResult({
  modelPublicId,
  input,
  requestIp
}: {
  modelPublicId: DomainPublicId;
  input: AdminModelReviewRequest;
  requestIp?: string;
}) {
  const transition = resolveAdminModelReviewTransition(
    input.decision,
    input.currentStatus
  );

  if (!transition) {
    return {
      allowed: false as const,
      error: {
        code: 'policy_blocked' as const,
        message:
          'The requested model status transition is not allowed by the review policy.'
      }
    };
  }

  const reviewedAt = new Date().toISOString();
  const reviewComment = buildAdminReviewComment({
    decision: input.decision,
    reason: input.reason,
    reviewerUserPublicId: input.reviewerUserPublicId,
    reviewedAt
  });
  const auditLog = buildAuditLog({
    publicId: `audit_${crypto.randomUUID()}`,
    actor: {
      role: 'admin',
      userPublicId: input.reviewerUserPublicId
    },
    resource: {
      resourceType: 'InvestmentModel',
      resourcePublicId: modelPublicId
    },
    action: auditActionByDecision[input.decision],
    result: 'allowed',
    reason: input.reason,
    before: {
      status: transition.from
    },
    after: {
      status: transition.to,
      reviewDecision: input.decision,
      reviewCommentPublicId: reviewComment.publicId,
      reviewCommentVisibility: reviewComment.visibility,
      persistence: 'not_persisted'
    },
    requestIp,
    createdAt: reviewedAt
  });

  return {
    allowed: true as const,
    data: {
      modelPublicId,
      previousStatus: transition.from,
      nextStatus: transition.to,
      decision: input.decision,
      reviewComment,
      reviewedAt,
      persistence: 'not_persisted',
      auditLog
    }
  };
}
