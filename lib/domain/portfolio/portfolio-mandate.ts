import { z } from 'zod';
import type { DomainPublicId, PortfolioMandate } from '@/lib/domain/types';

/**
 * This module defines the model-owned PortfolioMandate contract.
 * A mandate describes what a model version may or may not invest in; it must not accept user-editable risk, ratio, or leverage preferences.
 */

export const forbiddenPortfolioMandateUserPreferenceFields = [
  'riskPreference',
  'riskProfile',
  'stockRatio',
  'bondRatio',
  'leveragePreference',
  'targetAllocation',
  'userRiskProfile'
] as const;

export const portfolioMandateSafetyBoundary = {
  modelOwned: true,
  userEditable: false,
  noUserRiskPreference: true,
  noUserAssetRatioControl: true,
  noTradeExecution: true
} as const;

const mandateTextSchema = z.string().trim().min(2).max(80);

export const portfolioMandateRequestSchema = z.object({
  modelVersionPublicId: z.string().trim().min(3).max(120),
  allowedAssetClasses: z.array(mandateTextSchema).min(1).max(12),
  prohibitedAssetClasses: z.array(mandateTextSchema).max(20).default([]),
  allowedMarkets: z.array(mandateTextSchema).min(1).max(20),
  rebalancePolicy: z.string().trim().min(10).max(400),
  mandateSummary: z.string().trim().min(20).max(800)
});

export type PortfolioMandateRequest = z.infer<typeof portfolioMandateRequestSchema>;

export interface PortfolioMandateDto extends PortfolioMandate {
  safetyBoundary: typeof portfolioMandateSafetyBoundary;
}

export type PortfolioMandateValidationResult =
  | {
      success: true;
      data: PortfolioMandateRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof PortfolioMandateRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
        forbiddenFields: readonly string[];
      };
    };

export function findForbiddenPortfolioMandateFields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  return forbiddenPortfolioMandateUserPreferenceFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(input, field)
  );
}

export function validatePortfolioMandateRequest(
  input: unknown
): PortfolioMandateValidationResult {
  const forbiddenFields = findForbiddenPortfolioMandateFields(input);

  if (forbiddenFields.length > 0) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [
          'PortfolioMandate is model-owned and must not include user-editable risk, allocation, or leverage preference fields.'
        ],
        requiredFields: [
          'modelVersionPublicId',
          'allowedAssetClasses',
          'allowedMarkets',
          'rebalancePolicy',
          'mandateSummary'
        ],
        forbiddenFields
      }
    };
  }

  const result = portfolioMandateRequestSchema.safeParse(input);

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
      requiredFields: [
        'modelVersionPublicId',
        'allowedAssetClasses',
        'allowedMarkets',
        'rebalancePolicy',
        'mandateSummary'
      ],
      forbiddenFields: []
    }
  };
}

export function buildPortfolioMandateDto(
  input: PortfolioMandateRequest
): PortfolioMandateDto {
  return {
    modelVersionPublicId: input.modelVersionPublicId as DomainPublicId,
    allowedAssetClasses: input.allowedAssetClasses,
    prohibitedAssetClasses: input.prohibitedAssetClasses,
    allowedMarkets: input.allowedMarkets,
    rebalancePolicy: input.rebalancePolicy,
    mandateSummary: input.mandateSummary,
    safetyBoundary: portfolioMandateSafetyBoundary
  };
}
