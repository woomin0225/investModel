import { z } from 'zod';
import type {
  AccessRole,
  DomainPublicId,
  InvestmentModelStatus
} from '@/lib/domain/types';
import {
  buildModelVersionChangePlan,
  type ModelVersionChangePlan,
  type ModelVersionChangeType
} from './model-version';

/**
 * Creator description revision helpers turn live InvestmentModel copy edits into review-gated ModelVersion changes.
 * The MVP contract is mock-safe: no live copy is mutated in place and no database row is persisted by this helper.
 */

const revisionFieldSchema = z.enum([
  'strategy_summary',
  'target_markets',
  'allowed_asset_classes',
  'prohibited_asset_classes',
  'leverage_policy',
  'derivatives_policy',
  'risk_summary',
  'performance_source',
  'disclosure_copy'
]);

const revisionCurrentStatusSchema = z.enum([
  'live',
  'approved',
  'changes_requested'
]);

export const creatorDescriptionRevisionRequestSchema = z
  .object({
    creatorPublicId: z.string().trim().min(3).max(120),
    currentVersionPublicId: z.string().trim().min(3).max(120),
    requestedVersionLabel: z.string().trim().min(1).max(80),
    currentStatus: revisionCurrentStatusSchema,
    changedFields: z.array(revisionFieldSchema).min(1).max(12),
    changeSummary: z.string().trim().min(12).max(600),
    requestedByUserPublicId: z.string().trim().min(3).max(120).optional()
  })
  .strict();

export type CreatorDescriptionRevisionRequest = z.infer<
  typeof creatorDescriptionRevisionRequestSchema
>;

export type CreatorDescriptionRevisionValidationResult =
  | {
      success: true;
      data: CreatorDescriptionRevisionRequest;
      plan: CreatorDescriptionRevisionPlan;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<
          Record<keyof CreatorDescriptionRevisionRequest, string[]>
        >;
        formErrors: string[];
      };
    };

export interface CreatorDescriptionRevisionPlan {
  modelPublicId: DomainPublicId;
  creatorPublicId: DomainPublicId;
  currentVersionPublicId: DomainPublicId;
  requestedVersionPublicId: DomainPublicId;
  requestedVersionLabel: string;
  previousStatus: InvestmentModelStatus;
  nextStatus: Extract<InvestmentModelStatus, 'pending_review'>;
  changedFields: readonly ModelVersionChangeType[];
  reviewRequirement: ModelVersionChangePlan['reviewRequirement'];
  reviewRequired: true;
  inPlaceMutationAllowed: false;
  publicDiscoveryEligible: false;
  persistence: 'not_persisted';
  auditCandidate: {
    action: 'creator_model_description_revision_requested';
    resourceType: 'InvestmentModel';
    actorRole: Extract<AccessRole, 'creator' | 'admin'>;
  };
  policyNotices: readonly string[];
}

export function canRequestModelDescriptionRevision(role: AccessRole) {
  return role === 'creator' || role === 'admin';
}

export function validateCreatorDescriptionRevisionRequest({
  actorRole,
  modelPublicId,
  input
}: {
  actorRole: Extract<AccessRole, 'creator' | 'admin'>;
  modelPublicId: DomainPublicId;
  input: unknown;
}): CreatorDescriptionRevisionValidationResult {
  const result = creatorDescriptionRevisionRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.flatten()
    };
  }

  return {
    success: true,
    data: result.data,
    plan: buildCreatorDescriptionRevisionPlan({
      actorRole,
      modelPublicId,
      input: result.data
    })
  };
}

function buildCreatorDescriptionRevisionPlan({
  actorRole,
  modelPublicId,
  input
}: {
  actorRole: Extract<AccessRole, 'creator' | 'admin'>;
  modelPublicId: DomainPublicId;
  input: CreatorDescriptionRevisionRequest;
}): CreatorDescriptionRevisionPlan {
  const versionPlan = buildModelVersionChangePlan({
    modelPublicId,
    currentVersionPublicId: input.currentVersionPublicId,
    requestedVersionLabel: input.requestedVersionLabel,
    currentStatus: input.currentStatus,
    changedFields: input.changedFields,
    changeSummary: input.changeSummary,
    modelArtifactStatus: 'metadata_only',
    requestedByUserPublicId: input.requestedByUserPublicId
  });

  return {
    modelPublicId,
    creatorPublicId: input.creatorPublicId,
    currentVersionPublicId: input.currentVersionPublicId,
    requestedVersionPublicId: versionPlan.draftVersionPublicId,
    requestedVersionLabel: input.requestedVersionLabel,
    previousStatus: input.currentStatus,
    nextStatus: 'pending_review',
    changedFields: versionPlan.changedFields,
    reviewRequirement: versionPlan.reviewRequirement,
    reviewRequired: true,
    inPlaceMutationAllowed: false,
    publicDiscoveryEligible: false,
    persistence: 'not_persisted',
    auditCandidate: {
      action: 'creator_model_description_revision_requested',
      resourceType: 'InvestmentModel',
      actorRole
    },
    policyNotices: [
      'Live or approved InvestmentModel descriptions are never edited in place.',
      'The requested description change creates a new ModelVersion candidate for review.',
      'Public discovery continues to use the previously reviewed version until an operator approves the revision.',
      ...versionPlan.policyNotices
    ]
  };
}
