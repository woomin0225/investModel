import { z } from 'zod';
import type { DomainPublicId, ModelArtifactStatus } from '@/lib/domain/types';

/**
 * This module defines the metadata-only model artifact contract for the MVP.
 * It records creator-provided version metadata without accepting executable files, runtime commands, secrets, or network access.
 */

const blockedExecutableFieldNames = [
  'file',
  'files',
  'fileContent',
  'fileBytes',
  'filePath',
  'downloadUrl',
  'runtimeCommand',
  'executionCommand',
  'entrypoint',
  'environment',
  'env',
  'secret',
  'secrets',
  'networkAccess'
] as const;

const optionalMetadataText = z.string().trim().min(1).max(240).optional();

export const modelArtifactMetadataRequestSchema = z
  .object({
    modelPublicId: z.string().trim().min(3).max(120),
    modelVersionPublicId: z.string().trim().min(3).max(120),
    artifactLabel: z.string().trim().min(2).max(120),
    artifactKind: z.enum([
      'strategy_description',
      'model_card',
      'risk_notes',
      'backtest_summary',
      'external_reference'
    ]),
    sourceKind: z.literal('metadata_only').default('metadata_only'),
    summary: z.string().trim().min(12).max(600),
    declaredRuntime: optionalMetadataText,
    declaredFramework: optionalMetadataText,
    declaredInputSchema: optionalMetadataText,
    declaredOutputSchema: optionalMetadataText,
    checksumHint: optionalMetadataText,
    provenanceNote: z.string().trim().min(12).max(600),
    securityReviewRequired: z.literal(true).default(true)
  })
  .strict();

export type ModelArtifactMetadataRequest = z.infer<
  typeof modelArtifactMetadataRequestSchema
>;

export interface ModelArtifactMetadataDto {
  modelPublicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  artifactLabel: string;
  artifactKind: ModelArtifactMetadataRequest['artifactKind'];
  modelArtifactStatus: Extract<ModelArtifactStatus, 'metadata_only'>;
  sourceKind: 'metadata_only';
  summary: string;
  declaredRuntime?: string;
  declaredFramework?: string;
  declaredInputSchema?: string;
  declaredOutputSchema?: string;
  checksumHint?: string;
  provenanceNote: string;
  securityReviewRequired: true;
  executableAccepted: false;
  runtimeEnabled: false;
  publicDiscoveryEligible: false;
  blockedExecutableFieldNames: readonly string[];
  policyNotices: readonly string[];
}

export type ModelArtifactMetadataValidationResult =
  | {
      success: true;
      data: ModelArtifactMetadataRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof ModelArtifactMetadataRequest, string[]>>;
        formErrors: string[];
        blockedFields: string[];
      };
    };

export function validateModelArtifactMetadataRequest(
  input: unknown
): ModelArtifactMetadataValidationResult {
  const blockedFields = findBlockedExecutableFields(input);
  const result = modelArtifactMetadataRequestSchema.safeParse(input);

  if (result.success && blockedFields.length === 0) {
    return {
      success: true,
      data: result.data
    };
  }

  const flattened = result.success
    ? { fieldErrors: {}, formErrors: [] }
    : result.error.flatten();

  return {
    success: false,
    error: {
      fieldErrors: flattened.fieldErrors,
      formErrors: [
        ...flattened.formErrors,
        ...(blockedFields.length > 0
          ? ['Executable model upload fields are blocked in the MVP.']
          : [])
      ],
      blockedFields
    }
  };
}

export function buildModelArtifactMetadataDto(
  input: ModelArtifactMetadataRequest
): ModelArtifactMetadataDto {
  return {
    modelPublicId: input.modelPublicId,
    modelVersionPublicId: input.modelVersionPublicId,
    artifactLabel: input.artifactLabel,
    artifactKind: input.artifactKind,
    modelArtifactStatus: 'metadata_only',
    sourceKind: 'metadata_only',
    summary: input.summary,
    declaredRuntime: input.declaredRuntime,
    declaredFramework: input.declaredFramework,
    declaredInputSchema: input.declaredInputSchema,
    declaredOutputSchema: input.declaredOutputSchema,
    checksumHint: input.checksumHint,
    provenanceNote: input.provenanceNote,
    securityReviewRequired: true,
    executableAccepted: false,
    runtimeEnabled: false,
    publicDiscoveryEligible: false,
    blockedExecutableFieldNames,
    policyNotices: [
      'Model artifacts remain metadata-only in the MVP.',
      'Executable files, runtime commands, secrets, and network access are not accepted.',
      'Security review is required before artifact upload or sandbox execution can be implemented.'
    ]
  };
}

function findBlockedExecutableFields(input: unknown): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  const inputRecord = input as Record<string, unknown>;

  return blockedExecutableFieldNames.filter((fieldName) =>
    Object.prototype.hasOwnProperty.call(inputRecord, fieldName)
  );
}
