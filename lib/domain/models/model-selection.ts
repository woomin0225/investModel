import crypto from 'crypto';
import { z } from 'zod';
import type { AccessRole, DomainPublicId, UserModelSelection } from '@/lib/domain/types';

/**
 * This module defines the mock-safe user model selection contract.
 * It records which InvestmentModel version a user selected without persisting funds, orders, brokerage accounts, or model execution.
 */

export const modelSelectionRequestSchema = z.object({
  userPublicId: z.string().trim().min(3).max(120),
  modelPublicId: z.string().trim().min(3).max(120),
  modelVersionPublicId: z.string().trim().min(3).max(120),
  riskAcknowledgedAt: z.string().trim().datetime({ offset: true }).optional()
});

export type ModelSelectionRequest = z.infer<typeof modelSelectionRequestSchema>;

export type ModelSelectionValidationResult =
  | {
      success: true;
      data: ModelSelectionRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof ModelSelectionRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
      };
    };

export interface UserModelSelectionDto extends UserModelSelection {
  persistence: 'not_persisted' | 'persisted';
  safetyBoundary: {
    mockOnly: true;
    noRealDeposit: true;
    noRealOrder: true;
    noBrokerageConnection: true;
  };
}

export function canCreateModelSelection(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export function validateModelSelectionRequest(
  input: unknown
): ModelSelectionValidationResult {
  const result = modelSelectionRequestSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  return {
    success: false,
    error: {
      fieldErrors: result.error.flatten().fieldErrors,
      formErrors: result.error.flatten().formErrors,
      requiredFields: ['userPublicId', 'modelPublicId', 'modelVersionPublicId']
    }
  };
}

export function buildUserModelSelectionDto(
  input: ModelSelectionRequest,
  selectedAt = new Date().toISOString(),
  persistence: UserModelSelectionDto['persistence'] = 'not_persisted',
  publicId: DomainPublicId = `model_selection_${crypto.randomUUID()}` as DomainPublicId
): UserModelSelectionDto {
  return {
    publicId,
    userPublicId: input.userPublicId as DomainPublicId,
    modelPublicId: input.modelPublicId as DomainPublicId,
    modelVersionPublicId: input.modelVersionPublicId as DomainPublicId,
    status: 'active',
    riskAcknowledgedAt: input.riskAcknowledgedAt ?? selectedAt,
    createdAt: selectedAt,
    persistence,
    safetyBoundary: {
      mockOnly: true,
      noRealDeposit: true,
      noRealOrder: true,
      noBrokerageConnection: true
    }
  };
}
