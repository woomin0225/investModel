import crypto from 'crypto';
import { z } from 'zod';
import type { AccessRole, DomainPublicId, ModelViewEvent } from '@/lib/domain/types';

/**
 * This module defines privacy-minimal analytics for InvestmentModel list/detail views.
 * It records mock-safe product events without IP addresses, raw user agents, sessions, accounts, or financial behavior.
 */

export const modelViewSurfaceSchema = z.enum(['model_list', 'model_detail']);

export const modelViewLocaleSchema = z.enum(['ko', 'en']).default('ko');

export const modelViewViewerRoleSchema = z.enum([
  'public',
  'user',
  'creator',
  'admin',
  'system'
]);

export const forbiddenModelViewEventFields = [
  'ip',
  'ipAddress',
  'userAgent',
  'sessionId',
  'cookie',
  'email',
  'accountNumber',
  'brokerageAccount',
  'orderId',
  'paymentId'
] as const;

export const modelViewEventRequestSchema = z.object({
  surface: modelViewSurfaceSchema,
  viewerRole: modelViewViewerRoleSchema,
  viewerPublicId: z.string().trim().min(3).max(120).optional(),
  modelPublicId: z.string().trim().min(3).max(120).optional(),
  modelVersionPublicId: z.string().trim().min(3).max(120).optional(),
  locale: modelViewLocaleSchema
});

export type ModelViewEventRequest = z.infer<typeof modelViewEventRequestSchema>;

export interface ModelViewEventDto extends ModelViewEvent {
  eventType: 'model_viewed';
  persistence: 'not_persisted';
  privacyBoundary: {
    minimalCollection: true;
    noRawIp: true;
    noRawUserAgent: true;
    noSessionTracking: true;
    noFinancialBehavior: true;
  };
}

export type ModelViewEventValidationResult =
  | {
      success: true;
      data: ModelViewEventRequest;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof ModelViewEventRequest, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
        forbiddenFields: readonly string[];
      };
    };

export function findForbiddenModelViewEventFields(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  return forbiddenModelViewEventFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(input, field)
  );
}

export function validateModelViewEventRequest(
  input: unknown
): ModelViewEventValidationResult {
  const forbiddenFields = findForbiddenModelViewEventFields(input);

  if (forbiddenFields.length > 0) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [
          'ModelViewEvent uses privacy-minimal analytics and must not include raw IP, user agent, session, account, order, or payment fields.'
        ],
        requiredFields: ['surface', 'viewerRole'],
        forbiddenFields
      }
    };
  }

  const result = modelViewEventRequestSchema.safeParse(input);

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
      requiredFields: ['surface', 'viewerRole'],
      forbiddenFields: []
    }
  };
}

export function buildModelViewEventDto(
  input: ModelViewEventRequest,
  occurredAt = new Date().toISOString()
): ModelViewEventDto {
  return {
    publicId: `model_view_event_${crypto.randomUUID()}` as DomainPublicId,
    surface: input.surface,
    viewerRole: input.viewerRole as AccessRole,
    viewerPublicId: input.viewerPublicId as DomainPublicId | undefined,
    modelPublicId: input.modelPublicId as DomainPublicId | undefined,
    modelVersionPublicId: input.modelVersionPublicId as DomainPublicId | undefined,
    locale: input.locale,
    occurredAt,
    eventType: 'model_viewed',
    persistence: 'not_persisted',
    privacyBoundary: {
      minimalCollection: true,
      noRawIp: true,
      noRawUserAgent: true,
      noSessionTracking: true,
      noFinancialBehavior: true
    }
  };
}
