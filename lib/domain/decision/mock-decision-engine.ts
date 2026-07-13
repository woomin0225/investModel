import type {
  AllocationDecision,
  AllocationDecisionStatus,
  DomainPublicId,
  PortfolioMandate
} from '@/lib/domain/types';
import type {
  MarketDataProvider,
  MarketDataQuote
} from '@/lib/domain/signals/market-data-provider';
import type {
  NewsTrafficEvent,
  NewsTrafficProvider
} from '@/lib/domain/signals/news-traffic-provider';
import {
  buildTradeIntentDto,
  tradeIntentSafetyBoundary,
  type TradeIntentDto
} from '@/lib/domain/portfolio/trade-intent';
import {
  evaluateTradeIntentPolicy,
  type TradeIntentPolicyCheckResult,
  type TradeIntentPolicyContext
} from '@/lib/domain/portfolio/trade-intent-policy';

/**
 * This module composes mock market/news observations into AllocationDecision and TradeIntent simulation DTOs.
 * It is a demo-only decision engine and must never submit broker orders, move money, or connect external accounts.
 */

export interface MockDecisionEngineQuery {
  modelVersionPublicId: DomainPublicId;
  portfolioPublicId: DomainPublicId;
  symbols: string[];
  market: string;
  mandate: PortfolioMandate;
  policyContext: Omit<
    TradeIntentPolicyContext,
    'mandate' | 'instrument' | 'hasRationale'
  >;
  generatedAt?: string;
}

export interface MockDecisionEngineTradeIntent {
  tradeIntent: TradeIntentDto;
  policyCheck: TradeIntentPolicyCheckResult;
  sourceQuote: MarketDataQuote;
  sourceNewsEvents: NewsTrafficEvent[];
}

export interface MockDecisionEngineResult {
  allocationDecision: AllocationDecision;
  tradeIntents: MockDecisionEngineTradeIntent[];
  warnings: string[];
  sourceSummary: {
    marketProviderKind: string;
    newsProviderKind: string;
    quoteCount: number;
    newsEventCount: number;
    isMockOnly: boolean;
  };
  safetyBoundary: typeof tradeIntentSafetyBoundary;
}

function calculatePriceChangePercent(quote: MarketDataQuote) {
  const price = Number.parseFloat(quote.price);
  const previousClose = Number.parseFloat(quote.previousClose ?? '');

  if (!Number.isFinite(price) || !Number.isFinite(previousClose) || previousClose <= 0) {
    return 0;
  }

  return ((price - previousClose) / previousClose) * 100;
}

function findRelatedNewsEvents(
  quote: MarketDataQuote,
  events: readonly NewsTrafficEvent[]
) {
  const symbol = quote.instrument.symbol.toUpperCase();

  return events.filter((event) =>
    event.relatedSymbols.some(
      (relatedSymbol) => relatedSymbol.toUpperCase() === symbol
    )
  );
}

function buildRationaleSummary(
  quote: MarketDataQuote,
  relatedEvents: readonly NewsTrafficEvent[]
) {
  const priceChangePercent = calculatePriceChangePercent(quote).toFixed(2);
  const trafficScore = relatedEvents[0]?.trafficScore;
  const trafficText =
    typeof trafficScore === 'number'
      ? `mock traffic score ${trafficScore}`
      : 'no matching mock traffic score';

  return `${quote.instrument.symbol} mock price changed ${priceChangePercent}% versus previous close with ${trafficText}; generated for pre-order simulation only.`;
}

function resolveDecisionStatus(tradeIntents: readonly MockDecisionEngineTradeIntent[]) {
  if (tradeIntents.length === 0) {
    return 'blocked' satisfies AllocationDecisionStatus;
  }

  return tradeIntents.some(
    (item) => item.policyCheck.nextStatus === 'approved_for_simulation'
  )
    ? ('ready_for_simulation' satisfies AllocationDecisionStatus)
    : ('blocked' satisfies AllocationDecisionStatus);
}

function resolveSide(quote: MarketDataQuote) {
  return calculatePriceChangePercent(quote) >= 0 ? 'buy' : 'sell';
}

function resolveQuantity(quote: MarketDataQuote) {
  return quote.instrument.symbol === 'TQQQ' ? '0.5' : '1';
}

export function createMockDecisionEngine(
  marketDataProvider: MarketDataProvider,
  newsTrafficProvider: NewsTrafficProvider
) {
  return {
    async run(query: MockDecisionEngineQuery): Promise<MockDecisionEngineResult> {
      const generatedAt = query.generatedAt ?? '2026-07-14T00:40:00+09:00';
      const [marketData, newsTraffic] = await Promise.all([
        marketDataProvider.getQuotes({
          symbols: query.symbols,
          market: query.market,
          asOf: generatedAt
        }),
        newsTrafficProvider.getEvents({
          symbols: query.symbols,
          capturedAfter: '2026-07-13T00:00:00+09:00',
          limit: 20
        })
      ]);

      const tradeIntents = marketData.quotes.map((quote) => {
        const sourceNewsEvents = findRelatedNewsEvents(quote, newsTraffic.events);
        const rationaleSummary = buildRationaleSummary(quote, sourceNewsEvents);
        const pendingTradeIntent = buildTradeIntentDto(
          {
            allocationDecisionPublicId:
              `allocation_decision_${query.modelVersionPublicId}` as DomainPublicId,
            portfolioPublicId: query.portfolioPublicId,
            instrumentPublicId: quote.instrument.publicId,
            side: resolveSide(quote),
            quantity: resolveQuantity(quote),
            status: 'pending_policy_check',
            rationaleSummary
          },
          generatedAt
        );
        const policyCheck = evaluateTradeIntentPolicy(pendingTradeIntent, {
          ...query.policyContext,
          mandate: query.mandate,
          instrument: {
            assetClass: quote.instrument.instrumentType,
            market: quote.instrument.market,
            leverageExposure: quote.instrument.symbol === 'TQQQ',
            instrumentType: quote.instrument.instrumentType
          },
          hasRationale: true
        });
        const tradeIntent = buildTradeIntentDto(
          {
            allocationDecisionPublicId:
              pendingTradeIntent.allocationDecisionPublicId,
            portfolioPublicId: pendingTradeIntent.portfolioPublicId,
            instrumentPublicId: pendingTradeIntent.instrumentPublicId,
            side: pendingTradeIntent.side,
            quantity: pendingTradeIntent.quantity,
            status: policyCheck.nextStatus,
            rationaleSummary
          },
          generatedAt
        );

        return {
          tradeIntent,
          policyCheck,
          sourceQuote: quote,
          sourceNewsEvents
        };
      });
      const decisionStatus = resolveDecisionStatus(tradeIntents);

      return {
        allocationDecision: {
          publicId: `allocation_decision_${query.modelVersionPublicId}` as DomainPublicId,
          modelVersionPublicId: query.modelVersionPublicId,
          portfolioPublicId: query.portfolioPublicId,
          decisionStatus,
          rationaleSummary:
            decisionStatus === 'ready_for_simulation'
              ? 'Mock market and news observations produced pre-order simulation TradeIntent records after policy checks.'
              : 'Mock decision engine blocked simulation because policy checks or source observations were insufficient.',
          createdAt: generatedAt
        },
        tradeIntents,
        warnings: [
          ...marketData.warnings,
          ...newsTraffic.warnings,
          'Mock decision engine output is pre-order simulation only and does not submit real orders, move funds, or connect brokerage accounts.'
        ],
        sourceSummary: {
          marketProviderKind: marketData.providerKind,
          newsProviderKind: newsTraffic.providerKind,
          quoteCount: marketData.quotes.length,
          newsEventCount: newsTraffic.events.length,
          isMockOnly:
            marketData.providerKind === 'mock' &&
            newsTraffic.providerKind === 'mock' &&
            marketData.quotes.every((quote) => quote.isMock) &&
            newsTraffic.events.every((event) => event.isMock)
        },
        safetyBoundary: tradeIntentSafetyBoundary
      };
    }
  };
}
