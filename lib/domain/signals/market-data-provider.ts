import { z } from 'zod';

/**
 * This module defines the replaceable market data provider contract.
 * Market data is observed input for SignalEvent and decision analysis; it must not create recommendations, TradeIntent records, or real orders.
 */

export const marketDataProviderKindSchema = z.enum([
  'mock',
  'manual_seed',
  'external_placeholder',
  'paid_api_disabled'
]);

export const marketDataInstrumentTypeSchema = z.enum([
  'equity',
  'etf',
  'bond',
  'treasury',
  'cash_equivalent',
  'index',
  'crypto',
  'other'
]);

export const marketDataAvailabilitySchema = z.enum([
  'available',
  'stale',
  'missing',
  'provider_disabled',
  'blocked_requires_review'
]);

export type MarketDataProviderKind = z.infer<typeof marketDataProviderKindSchema>;
export type MarketDataInstrumentType = z.infer<
  typeof marketDataInstrumentTypeSchema
>;
export type MarketDataAvailability = z.infer<typeof marketDataAvailabilitySchema>;

export interface MarketDataInstrumentRef {
  publicId: string;
  symbol: string;
  displayName: string;
  market: string;
  currency: string;
  instrumentType: MarketDataInstrumentType;
}

export interface MarketDataQuote {
  instrument: MarketDataInstrumentRef;
  providerKind: MarketDataProviderKind;
  availability: MarketDataAvailability;
  observedAt: string;
  price: string;
  volume?: string;
  previousClose?: string;
  dataSourceLabel: string;
  isMock: boolean;
}

export interface MarketDataQuery {
  symbols: string[];
  market?: string;
  providerKind?: MarketDataProviderKind;
  asOf?: string;
}

export interface MarketDataProviderResult {
  providerKind: MarketDataProviderKind;
  generatedAt: string;
  quotes: MarketDataQuote[];
  warnings: string[];
}

export interface MarketDataProvider {
  readonly providerKind: MarketDataProviderKind;
  getQuotes(query: MarketDataQuery): Promise<MarketDataProviderResult>;
}

export const marketDataQuerySchema = z.object({
  symbols: z.array(z.string().trim().min(1).max(24)).min(1).max(50),
  market: z.string().trim().min(2).max(40).optional(),
  providerKind: marketDataProviderKindSchema.optional(),
  asOf: z.string().trim().datetime({ offset: true }).optional()
});

export type MarketDataQueryInput = z.infer<typeof marketDataQuerySchema>;

export type MarketDataQueryValidationResult =
  | {
      success: true;
      data: MarketDataQueryInput;
    }
  | {
      success: false;
      error: {
        fieldErrors: Partial<Record<keyof MarketDataQueryInput, string[]>>;
        formErrors: string[];
        requiredFields: readonly string[];
      };
    };

export function validateMarketDataQuery(
  input: unknown
): MarketDataQueryValidationResult {
  const result = marketDataQuerySchema.safeParse(input);

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
      requiredFields: ['symbols']
    }
  };
}

export function createDisabledMarketDataResult(
  query: MarketDataQuery,
  generatedAt = new Date().toISOString()
): MarketDataProviderResult {
  return {
    providerKind: 'paid_api_disabled',
    generatedAt,
    quotes: query.symbols.map((symbol) => ({
      instrument: {
        publicId: `instrument_${symbol.toLowerCase()}`,
        symbol,
        displayName: symbol,
        market: query.market ?? 'unknown',
        currency: 'USD',
        instrumentType: 'other'
      },
      providerKind: 'paid_api_disabled',
      availability: 'provider_disabled',
      observedAt: generatedAt,
      price: '0',
      dataSourceLabel: 'external provider disabled',
      isMock: true
    })),
    warnings: [
      'External market data provider is disabled until API keys and security review are approved.'
    ]
  };
}
