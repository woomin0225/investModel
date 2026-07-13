import crypto from 'crypto';
import { z } from 'zod';
import type { DomainPublicId, ModelSelectionEvent } from '@/lib/domain/types';

/**
 * This module defines privacy-minimal analytics for UserModelSelection creation.
 * It records model/version/selection public ids and selectedAt only, without funds, orders, accounts, payments, or suitability data.
 */

export const forbiddenModelSelectionEventFields = [
  'amount',
  'balance',
  'mockBalance',
  'realBalance',
  'depositId',
  'paymentId',
  'accountNumber',
  'brokerageAccount',
  'brokerOrderId',
  'orderId',
  'executionId',
  'fillId',
  'settlementId',
  'riskPreference',
  'stockRatio',
  'bondRatio',
  'leveragePreference',
  'suitabilityResult'
] as const;

export const modelSelectionEventRequestSchema = z.object({
  userPublicId: z.string().trim().min(3).max(120),
  modelPublicId: z.string().trim().min(3).max(120),
  modelVersionPublicId: z.string().trim().min(3).max(120),
  modelSelectionPublicId: z.string().trim().min(3).max(120),
  selectedAt: z.string().trim().datetime({ offset: true })
});

export type ModelSelectionEventRequest = z.infer<
  typeof modelSelectionEventRequestSchema
>;

export interface ModelSelectionEventDto extends ModelSelectionEvent {
  eventType: 'model_selection_created';
  persistence: 'not_persisted';
  privacyBoundary: {
    minimalCollection: true;
    noDepositData: true;
    noOrderData: true;
    noBrokerageAccount: true;
    noPaymentData: true;
    noUserPreferenceData: true;
    noSuitabilityClaim: true;
  };
}

export type ModelSelectionEventValidationResult =
  | {
      success: true;
      data: ModelSelectionEventRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof ModelSelectionEventRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
        forbiddenFields: readonly string[];
      };
    };

export function findForbiddenModelSelectionEventFields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  return forbiddenModelSelectionEventFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(input, field)
  );
}

export function validateModelSelectionEventRequest(
  input: unknown
): ModelSelectionEventValidationResult {
  const forbiddenFields = findForbiddenModelSelectionEventFields(input);

  if (forbiddenFields.length > 0) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [
          'ModelSelectionEvent records selection analytics only and must not include deposit, order, account, payment, user preference, or suitability fields.'
        ],
        requiredFields: [
          'userPublicId',
          'modelPublicId',
          'modelVersionPublicId',
          'modelSelectionPublicId',
          'selectedAt'
        ],
        forbiddenFields
      }
    };
  }

  const result = modelSelectionEventRequestSchema.safeParse(input);

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
        'userPublicId',
        'modelPublicId',
        'modelVersionPublicId',
        'modelSelectionPublicId',
        'selectedAt'
      ],
      forbiddenFields: []
    }
  };
}

export function buildModelSelectionEventDto(
  input: ModelSelectionEventRequest
): ModelSelectionEventDto {
  return {
    publicId: `model_selection_event_${crypto.randomUUID()}` as DomainPublicId,
    userPublicId: input.userPublicId as DomainPublicId,
    modelPublicId: input.modelPublicId as DomainPublicId,
    modelVersionPublicId: input.modelVersionPublicId as DomainPublicId,
    modelSelectionPublicId: input.modelSelectionPublicId as DomainPublicId,
    selectedAt: input.selectedAt,
    eventType: 'model_selection_created',
    persistence: 'not_persisted',
    privacyBoundary: {
      minimalCollection: true,
      noDepositData: true,
      noOrderData: true,
      noBrokerageAccount: true,
      noPaymentData: true,
      noUserPreferenceData: true,
      noSuitabilityClaim: true
    }
  };
}
