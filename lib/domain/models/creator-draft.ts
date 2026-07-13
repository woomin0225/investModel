import { z } from 'zod';
import type {
  AccessRole,
  DomainPublicId,
  InvestmentModelStatus,
  ModelArtifactStatus
} from '@/lib/domain/types';
import {
  modelDescriptionSchema,
  type ModelDescriptionInput
} from './model-description';
import { canCreateCreatorDraft } from './model-creator';

/**
 * This module defines the creator model draft API contract.
 * It keeps new creator submissions private, review-gated, and metadata-only until RBAC, audit, and review flows are implemented.
 */

export const creatorModelDraftRequestSchema = z.object({
  name: z.string().trim().min(2).max(80)
}).merge(modelDescriptionSchema);

export type CreatorModelDraftRequest = z.infer<
  typeof creatorModelDraftRequestSchema
>;

export interface InvestmentModelDraftDto {
  modelPublicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  status: InvestmentModelStatus;
  visibility: 'private';
  modelArtifactStatus: ModelArtifactStatus;
  reviewState: 'draft_not_submitted';
  publicDiscoveryEligible: false;
  creatorCanSubmitForReview: true;
  dataContext: 'mock_draft';
  submittedFields: CreatorModelDraftRequest;
  modelDescription: ModelDescriptionInput;
  policyNotices: string[];
}

export function canCreateModelDraft(role: AccessRole) {
  return canCreateCreatorDraft(role);
}

export function buildInvestmentModelDraftDto(
  input: CreatorModelDraftRequest
): InvestmentModelDraftDto {
  const slugSeed = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const safeSlug = slugSeed || 'creator-model-draft';

  return {
    modelPublicId: `model_draft_${safeSlug}_mock`,
    modelVersionPublicId: `version_draft_${safeSlug}_v0_mock`,
    status: 'draft',
    visibility: 'private',
    modelArtifactStatus: 'metadata_only',
    reviewState: 'draft_not_submitted',
    publicDiscoveryEligible: false,
    creatorCanSubmitForReview: true,
    dataContext: 'mock_draft',
    submittedFields: input,
    modelDescription: modelDescriptionSchema.parse(input),
    policyNotices: [
      'Draft models are never exposed in public discovery.',
      'Model artifacts remain metadata-only in the MVP.',
      'Legal and risk disclosure text is a placeholder until review.'
    ]
  };
}
