import { z } from 'zod';

/**
 * This module defines the replaceable news and traffic provider contract.
 * NewsTraffic data is observed input for SignalEvent and feed context; it must not be phrased as investment advice, a recommendation, or a TradeIntent trigger.
 */

export const newsTrafficProviderKindSchema = z.enum([
  'mock',
  'manual_seed',
  'external_placeholder',
  'paid_api_disabled'
]);

export const newsTrafficAvailabilitySchema = z.enum([
  'available',
  'stale',
  'missing',
  'provider_disabled',
  'blocked_requires_review'
]);

export const newsTrafficSourceTypeSchema = z.enum([
  'news',
  'press_release',
  'social_traffic',
  'search_traffic',
  'macro_calendar',
  'operator_note',
  'other'
]);

export type NewsTrafficProviderKind = z.infer<
  typeof newsTrafficProviderKindSchema
>;
export type NewsTrafficAvailability = z.infer<
  typeof newsTrafficAvailabilitySchema
>;
export type NewsTrafficSourceType = z.infer<typeof newsTrafficSourceTypeSchema>;

export interface NewsTrafficSourceRef {
  publicId: string;
  sourceName: string;
  sourceType: NewsTrafficSourceType;
  sourceUrl?: string;
}

export interface NewsTrafficEvent {
  publicId: string;
  providerKind: NewsTrafficProviderKind;
  availability: NewsTrafficAvailability;
  title: string;
  summary: string;
  source: NewsTrafficSourceRef;
  relatedSymbols: string[];
  trafficScore?: number;
  capturedAt: string;
  dataSourceLabel: string;
  isMock: boolean;
}

export interface NewsTrafficQuery {
  symbols?: string[];
  keyword?: string;
  providerKind?: NewsTrafficProviderKind;
  capturedAfter?: string;
  limit?: number;
}

export interface NewsTrafficProviderResult {
  providerKind: NewsTrafficProviderKind;
  generatedAt: string;
  events: NewsTrafficEvent[];
  warnings: string[];
}

export interface NewsTrafficProvider {
  readonly providerKind: NewsTrafficProviderKind;
  getEvents(query: NewsTrafficQuery): Promise<NewsTrafficProviderResult>;
}

export const newsTrafficQuerySchema = z
  .object({
    symbols: z.array(z.string().trim().min(1).max(24)).max(50).optional(),
    keyword: z.string().trim().min(2).max(120).optional(),
    providerKind: newsTrafficProviderKindSchema.optional(),
    capturedAfter: z.string().trim().datetime({ offset: true }).optional(),
    limit: z.number().int().min(1).max(100).default(20)
  })
  .refine((query) => query.symbols?.length || query.keyword, {
    message: 'Provide symbols or keyword for NewsTraffic query.',
    path: ['symbols']
  });

export type NewsTrafficQueryInput = z.infer<typeof newsTrafficQuerySchema>;

export type NewsTrafficQueryValidationResult =
  | {
      success: true;
      data: NewsTrafficQueryInput;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof NewsTrafficQueryInput, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
      };
    };

export function validateNewsTrafficQuery(
  input: unknown
): NewsTrafficQueryValidationResult {
  const result = newsTrafficQuerySchema.safeParse(input);

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
      requiredFields: ['symbols or keyword']
    }
  };
}

export function createDisabledNewsTrafficResult(
  query: NewsTrafficQuery,
  generatedAt = new Date().toISOString()
): NewsTrafficProviderResult {
  const symbols = query.symbols?.length ? query.symbols : ['unknown'];

  return {
    providerKind: 'paid_api_disabled',
    generatedAt,
    events: symbols.map((symbol) => ({
      publicId: `news_traffic_${symbol.toLowerCase()}`,
      providerKind: 'paid_api_disabled',
      availability: 'provider_disabled',
      title: `External news provider disabled for ${symbol}`,
      summary:
        'External news and traffic providers remain disabled until API keys and security review are approved.',
      source: {
        publicId: 'source_external_provider_disabled',
        sourceName: 'external provider disabled',
        sourceType: 'other'
      },
      relatedSymbols: symbol === 'unknown' ? [] : [symbol],
      capturedAt: generatedAt,
      dataSourceLabel: 'external provider disabled',
      isMock: true
    })),
    warnings: [
      'External news and traffic providers are disabled until API keys and security review are approved.'
    ]
  };
}
