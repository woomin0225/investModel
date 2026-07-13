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

export const mockNewsTrafficEvents = [
  {
    publicId: 'news_traffic_ai_chip_headlines',
    providerKind: 'mock',
    availability: 'available',
    title: 'AI chip headline volume is elevated',
    summary:
      'Mock semiconductor and AI infrastructure headline traffic is above the sample baseline for model signal demos.',
    source: {
      publicId: 'source_mock_news_attention',
      sourceName: 'Mock News Attention Index',
      sourceType: 'news'
    },
    relatedSymbols: ['NVDA', 'AMD', 'QQQ', 'TQQQ'],
    trafficScore: 92,
    capturedAt: '2026-07-14T00:02:00+09:00',
    dataSourceLabel: 'mock news traffic',
    isMock: true
  },
  {
    publicId: 'news_traffic_yield_cooling',
    providerKind: 'mock',
    availability: 'available',
    title: 'Short-term yield coverage is cooling',
    summary:
      'Mock macro news traffic indicates lower short-term yield pressure in the sample ETF basket context.',
    source: {
      publicId: 'source_mock_macro_calendar',
      sourceName: 'Mock Macro Calendar',
      sourceType: 'macro_calendar'
    },
    relatedSymbols: ['TLT', 'IEF', 'AGG', 'SPY'],
    trafficScore: 78,
    capturedAt: '2026-07-14T00:07:00+09:00',
    dataSourceLabel: 'mock macro traffic',
    isMock: true
  },
  {
    publicId: 'news_traffic_asia_tech_earnings',
    providerKind: 'mock',
    availability: 'available',
    title: 'Asia tech earnings traffic spike',
    summary:
      'Mock regional technology earnings mentions increased for prototype signal ranking only.',
    source: {
      publicId: 'source_mock_earnings_monitor',
      sourceName: 'Mock Earnings Monitor',
      sourceType: 'news'
    },
    relatedSymbols: ['TSM', 'ASML', 'SMH'],
    trafficScore: 84,
    capturedAt: '2026-07-14T00:11:00+09:00',
    dataSourceLabel: 'mock earnings traffic',
    isMock: true
  },
  {
    publicId: 'news_traffic_consumer_fading',
    providerKind: 'mock',
    availability: 'available',
    title: 'Consumer discretionary topic traffic is fading',
    summary:
      'Mock consumer topic attention is lower than the sample baseline and remains observation-only context.',
    source: {
      publicId: 'source_mock_topic_volume',
      sourceName: 'Mock Topic Volume',
      sourceType: 'search_traffic'
    },
    relatedSymbols: ['XLY', 'AMZN', 'HD'],
    trafficScore: 58,
    capturedAt: '2026-07-14T00:19:00+09:00',
    dataSourceLabel: 'mock search traffic',
    isMock: true
  }
] satisfies NewsTrafficEvent[];

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

export function createMockNewsTrafficProvider(
  events: readonly NewsTrafficEvent[] = mockNewsTrafficEvents,
  generatedAt = '2026-07-14T00:20:00+09:00'
): NewsTrafficProvider {
  return {
    providerKind: 'mock',
    async getEvents(query) {
      const validation = validateNewsTrafficQuery(query);

      if (!validation.success) {
        return {
          providerKind: 'mock',
          generatedAt,
          events: [],
          warnings: validation.error.formErrors.length
            ? validation.error.formErrors
            : ['Provide symbols or keyword for NewsTraffic query.']
        };
      }

      const filteredEvents = filterMockNewsTrafficEvents(
        events,
        validation.data
      ).slice(0, validation.data.limit);

      return {
        providerKind: 'mock',
        generatedAt,
        events: filteredEvents,
        warnings: [
          'Mock news traffic is observation-only context for SignalEvent demos and does not create TradeIntent records or recommendations.'
        ]
      };
    }
  };
}

export function filterMockNewsTrafficEvents(
  events: readonly NewsTrafficEvent[],
  query: NewsTrafficQueryInput
) {
  const normalizedSymbols = new Set(
    query.symbols?.map((symbol) => symbol.trim().toUpperCase())
  );
  const normalizedKeyword = query.keyword?.trim().toLowerCase();
  const capturedAfter = query.capturedAfter
    ? new Date(query.capturedAfter).getTime()
    : null;

  return events.filter((event) => {
    if (event.providerKind !== 'mock' || !event.isMock) {
      return false;
    }

    if (capturedAfter && new Date(event.capturedAt).getTime() <= capturedAfter) {
      return false;
    }

    const matchesSymbol =
      !normalizedSymbols.size ||
      event.relatedSymbols.some((symbol) =>
        normalizedSymbols.has(symbol.trim().toUpperCase())
      );

    const searchableText = [
      event.title,
      event.summary,
      event.source.sourceName,
      event.dataSourceLabel,
      ...event.relatedSymbols
    ]
      .join(' ')
      .toLowerCase();
    const matchesKeyword =
      !normalizedKeyword || searchableText.includes(normalizedKeyword);

    return matchesSymbol && matchesKeyword;
  });
}
