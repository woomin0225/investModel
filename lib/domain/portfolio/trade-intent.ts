import crypto from 'crypto';
import { z } from 'zod';
import type { DomainPublicId, TradeIntent, TradeIntentStatus } from '@/lib/domain/types';

/**
 * This module defines the mock-only TradeIntent contract.
 * A TradeIntent is a pre-order simulation record and must never contain broker, execution, fill, settlement, payment, or account identifiers.
 */

export const tradeIntentStatusSchema = z.enum([
  'pending_policy_check',
  'approved_for_simulation',
  'blocked',
  'cancelled'
]);

export const forbiddenTradeIntentOrderFields = [
  'brokerOrderId',
  'broker_order_id',
  'executionId',
  'execution_id',
  'fillId',
  'fill_id',
  'settlementId',
  'settlement_id',
  'paymentId',
  'payment_id',
  'accountNumber',
  'account_number',
  'orderSubmittedAt',
  'executedAt',
  'filledAt',
  'settledAt'
] as const;

export const tradeIntentSafetyBoundary = {
  mockOnly: true,
  preOrderSimulationOnly: true,
  noBrokerSubmission: true,
  noExecution: true,
  noFill: true,
  noSettlement: true,
  noPayment: true,
  noExternalAccount: true
} as const;

export const tradeIntentRequestSchema = z.object({
  allocationDecisionPublicId: z.string().trim().min(3).max(120),
  portfolioPublicId: z.string().trim().min(3).max(120),
  instrumentPublicId: z.string().trim().min(3).max(120),
  side: z.enum(['buy', 'sell']),
  quantity: z.string().trim().regex(/^\d+(\.\d{1,8})?$/),
  status: tradeIntentStatusSchema.default('pending_policy_check'),
  rationaleSummary: z.string().trim().min(12).max(500).optional()
});

export type TradeIntentRequest = z.infer<typeof tradeIntentRequestSchema>;

export interface TradeIntentDto extends TradeIntent {
  rationaleSummary?: string;
  userFacingLabel: 'simulated trade intent';
  persistence: 'not_persisted';
  safetyBoundary: typeof tradeIntentSafetyBoundary;
}

export type TradeIntentValidationResult =
  | {
      success: true;
      data: TradeIntentRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof TradeIntentRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
        forbiddenFields: readonly string[];
      };
    };

export function findForbiddenTradeIntentFields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  return forbiddenTradeIntentOrderFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(input, field)
  );
}

export function validateTradeIntentRequest(
  input: unknown
): TradeIntentValidationResult {
  const forbiddenFields = findForbiddenTradeIntentFields(input);

  if (forbiddenFields.length > 0) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [
          'TradeIntent is a pre-order simulation record and must not include broker, execution, fill, settlement, payment, or account fields.'
        ],
        requiredFields: [
          'allocationDecisionPublicId',
          'portfolioPublicId',
          'instrumentPublicId',
          'side',
          'quantity'
        ],
        forbiddenFields
      }
    };
  }

  const result = tradeIntentRequestSchema.safeParse(input);

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
        'allocationDecisionPublicId',
        'portfolioPublicId',
        'instrumentPublicId',
        'side',
        'quantity'
      ],
      forbiddenFields: []
    }
  };
}

export function buildTradeIntentDto(
  input: TradeIntentRequest,
  createdAt = new Date().toISOString()
): TradeIntentDto {
  return {
    publicId: `trade_intent_${crypto.randomUUID()}` as DomainPublicId,
    allocationDecisionPublicId: input.allocationDecisionPublicId as DomainPublicId,
    portfolioPublicId: input.portfolioPublicId as DomainPublicId,
    instrumentPublicId: input.instrumentPublicId as DomainPublicId,
    side: input.side,
    quantity: input.quantity,
    status: input.status as TradeIntentStatus,
    createdAt,
    rationaleSummary: input.rationaleSummary,
    userFacingLabel: 'simulated trade intent',
    persistence: 'not_persisted',
    safetyBoundary: tradeIntentSafetyBoundary
  };
}

export function isDisplayableTradeIntentStatus(status: TradeIntentStatus) {
  return status === 'approved_for_simulation' || status === 'blocked';
}
