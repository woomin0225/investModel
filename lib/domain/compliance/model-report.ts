import crypto from 'crypto';
import { z } from 'zod';
import type { AccessRole, DomainPublicId, ModelReport } from '@/lib/domain/types';

/**
 * This module defines mock-safe user reporting for model copy and performance-display concerns.
 * Reports are routed to operator review and must not become legal conclusions, compensation claims, or trading instructions.
 */

export const modelReportTypeSchema = z.enum([
  'misleading_performance',
  'missing_risk_disclosure',
  'inappropriate_claim',
  'other'
]);

export const forbiddenModelReportFields = [
  'legalConclusion',
  'legalAdvice',
  'suitabilityDecision',
  'compensationAmount',
  'refundAmount',
  'orderId',
  'brokerOrderId',
  'executionId',
  'accountNumber',
  'paymentId',
  'privateKey',
  'apiKey'
] as const;

export const modelReportRequestSchema = z.object({
  reporterUserPublicId: z.string().trim().min(3).max(120),
  modelPublicId: z.string().trim().min(3).max(120),
  modelVersionPublicId: z.string().trim().min(3).max(120).optional(),
  reportType: modelReportTypeSchema,
  summary: z.string().trim().min(12).max(1000)
});

export type ModelReportRequest = z.infer<typeof modelReportRequestSchema>;

export interface ModelReportDto extends ModelReport {
  reviewRouting: {
    operatorReviewRequired: true;
    legalReviewPlaceholder: true;
    finalLegalJudgment: false;
    userVisibleStatus: 'received_for_review';
  };
  persistence: 'not_persisted';
  safetyBoundary: {
    noLegalConclusion: true;
    noCompensationDecision: true;
    noTradingAction: true;
    noAccountData: true;
  };
}

export type ModelReportValidationResult =
  | {
      success: true;
      data: ModelReportRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof ModelReportRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
        forbiddenFields: readonly string[];
      };
    };

export function canCreateModelReport(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export function findForbiddenModelReportFields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  return forbiddenModelReportFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(input, field)
  );
}

export function validateModelReportRequest(
  input: unknown
): ModelReportValidationResult {
  const forbiddenFields = findForbiddenModelReportFields(input);

  if (forbiddenFields.length > 0) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [
          'ModelReport only records a concern for operator review and must not include legal conclusions, compensation, account, payment, secret, or order fields.'
        ],
        requiredFields: [
          'reporterUserPublicId',
          'modelPublicId',
          'reportType',
          'summary'
        ],
        forbiddenFields
      }
    };
  }

  const result = modelReportRequestSchema.safeParse(input);

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
        'reporterUserPublicId',
        'modelPublicId',
        'reportType',
        'summary'
      ],
      forbiddenFields: []
    }
  };
}

export function buildModelReportDto(
  input: ModelReportRequest,
  createdAt = new Date().toISOString()
): ModelReportDto {
  return {
    publicId: `model_report_${crypto.randomUUID()}` as DomainPublicId,
    reporterUserPublicId: input.reporterUserPublicId as DomainPublicId,
    modelPublicId: input.modelPublicId as DomainPublicId,
    modelVersionPublicId: input.modelVersionPublicId as DomainPublicId | undefined,
    reportType: input.reportType,
    status: 'pending_review',
    summary: input.summary,
    createdAt,
    reviewRouting: {
      operatorReviewRequired: true,
      legalReviewPlaceholder: true,
      finalLegalJudgment: false,
      userVisibleStatus: 'received_for_review'
    },
    persistence: 'not_persisted',
    safetyBoundary: {
      noLegalConclusion: true,
      noCompensationDecision: true,
      noTradingAction: true,
      noAccountData: true
    }
  };
}
