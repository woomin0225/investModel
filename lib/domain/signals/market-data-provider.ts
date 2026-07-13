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

export const mockMarketDataQuotes = [
  {
    instrument: {
      publicId: 'instrument_nvda',
      symbol: 'NVDA',
      displayName: 'NVIDIA Corp.',
      market: 'US',
      currency: 'USD',
      instrumentType: 'equity'
    },
    providerKind: 'mock',
    availability: 'available',
    observedAt: '2026-07-14T00:01:00+09:00',
    price: '128.40',
    volume: '58200000',
    previousClose: '125.10',
    dataSourceLabel: 'mock market price',
    isMock: true
  },
  {
    instrument: {
      publicId: 'instrument_qqq',
      symbol: 'QQQ',
      displayName: 'Invesco QQQ Trust',
      market: 'US',
      currency: 'USD',
      instrumentType: 'etf'
    },
    providerKind: 'mock',
    availability: 'available',
    observedAt: '2026-07-14T00:02:00+09:00',
    price: '486.25',
    volume: '31200000',
    previousClose: '482.20',
    dataSourceLabel: 'mock market price',
    isMock: true
  },
  {
    instrument: {
      publicId: 'instrument_tqqq',
      symbol: 'TQQQ',
      displayName: 'ProShares UltraPro QQQ',
      market: 'US',
      currency: 'USD',
      instrumentType: 'etf'
    },
    providerKind: 'mock',
    availability: 'available',
    observedAt: '2026-07-14T00:03:00+09:00',
    price: '72.18',
    volume: '41800000',
    previousClose: '70.44',
    dataSourceLabel: 'mock market price',
    isMock: true
  },
  {
    instrument: {
      publicId: 'instrument_tlt',
      symbol: 'TLT',
      displayName: 'iShares 20+ Year Treasury Bond ETF',
      market: 'US',
      currency: 'USD',
      instrumentType: 'etf'
    },
    providerKind: 'mock',
    availability: 'available',
    observedAt: '2026-07-14T00:04:00+09:00',
    price: '91.12',
    volume: '17900000',
    previousClose: '90.80',
    dataSourceLabel: 'mock market price',
    isMock: true
  },
  {
    instrument: {
      publicId: 'instrument_spy',
      symbol: 'SPY',
      displayName: 'SPDR S&P 500 ETF Trust',
      market: 'US',
      currency: 'USD',
      instrumentType: 'etf'
    },
    providerKind: 'mock',
    availability: 'available',
    observedAt: '2026-07-14T00:05:00+09:00',
    price: '556.70',
    volume: '50100000',
    previousClose: '553.40',
    dataSourceLabel: 'mock market price',
    isMock: true
  }
] satisfies MarketDataQuote[];

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

export function filterMockMarketDataQuotes(
  quotes: readonly MarketDataQuote[],
  query: MarketDataQuery
): MarketDataQuote[] {
  const requestedSymbols = new Set(
    query.symbols.map((symbol) => symbol.trim().toUpperCase())
  );
  const market = query.market?.trim().toUpperCase();
  const asOfTime = query.asOf ? Date.parse(query.asOf) : undefined;

  return quotes
    .filter((quote) => quote.providerKind === 'mock' && quote.isMock)
    .filter((quote) => requestedSymbols.has(quote.instrument.symbol.toUpperCase()))
    .filter((quote) =>
      market ? quote.instrument.market.toUpperCase() === market : true
    )
    .filter((quote) =>
      asOfTime === undefined ? true : Date.parse(quote.observedAt) <= asOfTime
    )
    .sort(
      (left, right) =>
        query.symbols.findIndex(
          (symbol) =>
            symbol.trim().toUpperCase() === left.instrument.symbol.toUpperCase()
        ) -
        query.symbols.findIndex(
          (symbol) =>
            symbol.trim().toUpperCase() === right.instrument.symbol.toUpperCase()
        )
    );
}

export function createMockMarketDataProvider(
  quotes: readonly MarketDataQuote[] = mockMarketDataQuotes,
  generatedAt = '2026-07-14T00:20:00+09:00'
): MarketDataProvider {
  return {
    providerKind: 'mock',
    async getQuotes(query) {
      const validation = validateMarketDataQuery(query);

      if (!validation.success) {
        return {
          providerKind: 'mock',
          generatedAt,
          quotes: [],
          warnings: [
            `Invalid market data query. Required fields: ${validation.error.requiredFields.join(
              ', '
            )}.`
          ]
        };
      }

      return {
        providerKind: 'mock',
        generatedAt,
        quotes: filterMockMarketDataQuotes(quotes, validation.data),
        warnings: [
          'Mock market data is observation-only context for SignalEvent and AllocationDecision demos and does not create TradeIntent records, recommendations, or real orders.'
        ]
      };
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
