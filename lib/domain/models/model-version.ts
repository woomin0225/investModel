import { z } from 'zod';
import type {
  DomainPublicId,
  ModelArtifactStatus,
  ModelRiskLevel
} from '@/lib/domain/types';

/**
 * This module defines ModelVersion change management for creator-owned model revisions.
 * It prevents in-place live mutations and marks material strategy, mandate, risk, disclosure, performance, or artifact changes as review-required.
 */

export type ModelVersionReviewStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'rejected'
  | 'approved'
  | 'live'
  | 'superseded'
  | 'retired';

export type ModelVersionChangeType =
  | 'strategy_summary'
  | 'target_markets'
  | 'allowed_asset_classes'
  | 'prohibited_asset_classes'
  | 'leverage_policy'
  | 'derivatives_policy'
  | 'risk_summary'
  | 'performance_source'
  | 'disclosure_copy'
  | 'artifact_metadata'
  | 'artifact_execution_status';

export type ModelVersionReviewRequirement =
  | 'none'
  | 'model_marketplace_review'
  | 'disclosure_review'
  | 'legal_review_required'
  | 'security_review_required'
  | 'policy_blocked';

export const modelVersionReviewStatusSchema = z.enum([
  'draft',
  'pending_review',
  'changes_requested',
  'rejected',
  'approved',
  'live',
  'superseded',
  'retired'
]);

export const modelVersionChangeRequestSchema = z
  .object({
    modelPublicId: z.string().trim().min(3).max(120),
    currentVersionPublicId: z.string().trim().min(3).max(120).optional(),
    requestedVersionLabel: z.string().trim().min(1).max(80),
    currentStatus: modelVersionReviewStatusSchema,
    changedFields: z
      .array(
        z.enum([
          'strategy_summary',
          'target_markets',
          'allowed_asset_classes',
          'prohibited_asset_classes',
          'leverage_policy',
          'derivatives_policy',
          'risk_summary',
          'performance_source',
          'disclosure_copy',
          'artifact_metadata',
          'artifact_execution_status'
        ])
      )
      .min(1)
      .max(20),
    changeSummary: z.string().trim().min(12).max(600),
    modelArtifactStatus: z
      .enum(['metadata_only', 'uploaded', 'quarantined', 'approved', 'rejected'])
      .default('metadata_only'),
    riskLevel: z
      .enum(['low', 'medium', 'high', 'very_high'])
      .optional(),
    requestedByUserPublicId: z.string().trim().min(3).max(120).optional()
  })
  .strict();

export type ModelVersionChangeRequest = z.infer<
  typeof modelVersionChangeRequestSchema
>;

export interface ModelVersionChangePlan {
  modelPublicId: DomainPublicId;
  previousVersionPublicId?: DomainPublicId;
  draftVersionPublicId: DomainPublicId;
  requestedVersionLabel: string;
  currentStatus: ModelVersionReviewStatus;
  nextStatus: Extract<ModelVersionReviewStatus, 'draft' | 'pending_review'>;
  changedFields: readonly ModelVersionChangeType[];
  reviewRequirement: ModelVersionReviewRequirement;
  reviewRequired: boolean;
  inPlaceMutationAllowed: false;
  publicDiscoveryEligible: false;
  modelArtifactStatus: ModelArtifactStatus;
  riskLevel?: ModelRiskLevel;
  policyNotices: readonly string[];
}

const immutableStatuses = new Set<ModelVersionReviewStatus>([
  'pending_review',
  'approved',
  'live',
  'superseded',
  'retired',
  'rejected'
]);

const legalReviewFields = new Set<ModelVersionChangeType>([
  'performance_source',
  'disclosure_copy'
]);

const marketplaceReviewFields = new Set<ModelVersionChangeType>([
  'strategy_summary',
  'target_markets',
  'allowed_asset_classes',
  'prohibited_asset_classes',
  'leverage_policy',
  'derivatives_policy',
  'risk_summary',
  'artifact_metadata'
]);

export function canEditModelVersionInPlace(
  status: ModelVersionReviewStatus
): boolean {
  return status === 'draft' || status === 'changes_requested';
}

export function resolveModelVersionReviewRequirement(
  request: Pick<
    ModelVersionChangeRequest,
    'changedFields' | 'modelArtifactStatus'
  >
): ModelVersionReviewRequirement {
  if (
    request.changedFields.includes('artifact_execution_status') ||
    request.modelArtifactStatus !== 'metadata_only'
  ) {
    return 'security_review_required';
  }

  if (request.changedFields.some((field) => legalReviewFields.has(field))) {
    return 'legal_review_required';
  }

  if (
    request.changedFields.some((field) => marketplaceReviewFields.has(field))
  ) {
    return 'model_marketplace_review';
  }

  return 'none';
}

export function buildModelVersionChangePlan(
  request: ModelVersionChangeRequest
): ModelVersionChangePlan {
  const reviewRequirement = resolveModelVersionReviewRequirement(request);
  const draftVersionPublicId = buildDraftVersionPublicId({
    modelPublicId: request.modelPublicId,
    requestedVersionLabel: request.requestedVersionLabel
  });
  const reviewRequired = reviewRequirement !== 'none';

  return {
    modelPublicId: request.modelPublicId,
    previousVersionPublicId: request.currentVersionPublicId,
    draftVersionPublicId,
    requestedVersionLabel: request.requestedVersionLabel,
    currentStatus: request.currentStatus,
    nextStatus:
      canEditModelVersionInPlace(request.currentStatus) && !reviewRequired
        ? 'draft'
        : 'pending_review',
    changedFields: request.changedFields,
    reviewRequirement,
    reviewRequired,
    inPlaceMutationAllowed: false,
    publicDiscoveryEligible: false,
    modelArtifactStatus: request.modelArtifactStatus,
    riskLevel: request.riskLevel,
    policyNotices: buildModelVersionPolicyNotices(request, reviewRequirement)
  };
}

export function validateModelVersionChangeRequest(input: unknown) {
  const result = modelVersionChangeRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false as const,
      error: result.error.flatten()
    };
  }

  if (
    immutableStatuses.has(result.data.currentStatus) &&
    !result.data.currentVersionPublicId
  ) {
    return {
      success: false as const,
      error: {
        fieldErrors: {
          currentVersionPublicId: [
            'Current version id is required when changing an immutable or reviewed version.'
          ]
        },
        formErrors: []
      }
    };
  }

  return {
    success: true as const,
    data: result.data,
    plan: buildModelVersionChangePlan(result.data)
  };
}

function buildDraftVersionPublicId({
  modelPublicId,
  requestedVersionLabel
}: {
  modelPublicId: DomainPublicId;
  requestedVersionLabel: string;
}) {
  const safeLabel = requestedVersionLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `version_draft_${modelPublicId}_${safeLabel || 'revision'}`;
}

function buildModelVersionPolicyNotices(
  request: ModelVersionChangeRequest,
  reviewRequirement: ModelVersionReviewRequirement
) {
  const notices = [
    'ModelVersion changes are captured as a new draft or review snapshot, not an in-place live mutation.',
    'Public discovery remains disabled until the version is reviewed and explicitly published.'
  ];

  if (request.currentStatus === 'live') {
    notices.push('Live ModelVersion content cannot be edited in place.');
  }

  if (reviewRequirement === 'security_review_required') {
    notices.push(
      'Artifact execution or non-metadata artifact status requires security review before implementation.'
    );
  }

  if (reviewRequirement === 'legal_review_required') {
    notices.push(
      'Performance or disclosure wording requires legal/compliance review before user-facing exposure.'
    );
  }

  return notices;
}
