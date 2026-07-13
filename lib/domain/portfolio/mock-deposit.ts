import crypto from 'crypto';
import { z } from 'zod';
import type { DomainPublicId, MockDeposit, MockDepositStatus } from '@/lib/domain/types';

/**
 * This module defines the mock-only MockDeposit contract.
 * It creates simulated deposit records for MVP UI/API development without payment, withdrawal, bank, or brokerage behavior.
 */

export const mockDepositStatusSchema = z.enum([
  'created',
  'simulated_available',
  'simulated_allocated',
  'cancelled',
  'archived'
]);

export const mockDepositRequestSchema = z.object({
  userPublicId: z.string().trim().min(3).max(120),
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().trim().length(3).toUpperCase(),
  status: mockDepositStatusSchema.default('created'),
  displayLabel: z.string().trim().min(4).max(120).optional()
});

export type MockDepositRequest = z.infer<typeof mockDepositRequestSchema>;

export interface MockDepositDto extends MockDeposit {
  displayLabel: string;
  persistence: 'not_persisted';
  safetyBoundary: {
    mockOnly: true;
    noRealDeposit: true;
    noWithdrawal: true;
    noBankConnection: true;
    noBrokerageConnection: true;
    noPaymentProvider: true;
  };
}

export type MockDepositValidationResult =
  | {
      success: true;
      data: MockDepositRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof MockDepositRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
      };
    };

export function validateMockDepositRequest(
  input: unknown
): MockDepositValidationResult {
  const result = mockDepositRequestSchema.safeParse(input);

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
      requiredFields: ['userPublicId', 'amount', 'currency']
    }
  };
}

export function buildMockDepositDto(
  input: MockDepositRequest,
  createdAt = new Date().toISOString()
): MockDepositDto {
  return {
    publicId: `mock_deposit_${crypto.randomUUID()}` as DomainPublicId,
    userPublicId: input.userPublicId as DomainPublicId,
    amount: input.amount,
    currency: input.currency,
    status: input.status as MockDepositStatus,
    sourceType: 'mock',
    createdAt,
    displayLabel:
      input.displayLabel ??
      `${input.amount} ${input.currency} mock deposit`,
    persistence: 'not_persisted',
    safetyBoundary: {
      mockOnly: true,
      noRealDeposit: true,
      noWithdrawal: true,
      noBankConnection: true,
      noBrokerageConnection: true,
      noPaymentProvider: true
    }
  };
}

export function isActiveMockDepositStatus(status: MockDepositStatus) {
  return status === 'simulated_available' || status === 'simulated_allocated';
}
