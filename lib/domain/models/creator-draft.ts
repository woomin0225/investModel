import { z } from 'zod';
import type {
  AccessRole,
  DomainPublicId,
  InvestmentModelStatus,
  ModelArtifactStatus
} from '@/lib/domain/types';

/**
 * This module defines the creator model draft API contract.
 * It keeps new creator submissions private, review-gated, and metadata-only until RBAC, audit, and review flows are implemented.
 */

export const creatorModelDraftRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  shortDescription: z.string().trim().min(12).max(220),
  targetMarkets: z.array(z.string().trim().min(2).max(40)).min(1).max(8),
  assetUniverseSummary: z.string().trim().min(12).max(260),
  strategySummary: z.string().trim().min(20).max(600),
  riskSummary: z.string().trim().min(20).max(600),
  leverageAllowed: z.boolean(),
  rebalancePolicy: z.string().trim().min(4).max(120),
  forbiddenAssets: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  disclosurePlaceholder: z.string().trim().min(12).max(600)
});

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
  policyNotices: string[];
}

export function canCreateModelDraft(role: AccessRole) {
  return role === 'creator' || role === 'admin';
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
    policyNotices: [
      'Draft models are never exposed in public discovery.',
      'Model artifacts remain metadata-only in the MVP.',
      'Legal and risk disclosure text is a placeholder until review.'
    ]
  };
}
