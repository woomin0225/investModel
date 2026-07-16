/**
 * Price history read-model fixture for mini charts.
 * It is bounded seed data, not live market data, brokerage state, or advice.
 */

export type InvestModelPriceHistoryPoint = {
  id: string;
  instrumentSymbol: string;
  instrumentName: string;
  capturedAt: string;
  samplePrice: number;
  sampleVolume: number;
  seedProvider: 'mock_seed_sample_backtest_window';
  dataWindowLabel: 'sample_backtest_window';
  seedSourceLabel: 'mock_seed';
};

export type InvestModelPriceHistoryReadModel = {
  generatedFrom: 'deterministic_fixture';
  sourceTables: ['market_instruments', 'market_price_snapshots'];
  displaySurface: 'mini_chart';
  instrumentSymbol: 'SAMPLE_AI_BASKET';
  points: InvestModelPriceHistoryPoint[];
  emptyState: {
    title: string;
    description: string;
  };
  safetyMeta: {
    mockOnly: true;
    simulated: true;
    sampleBacktestWindow: true;
    liveMarketData: false;
    realTimeQuotes: false;
    externalPaidApi: false;
    brokerageConnection: false;
    tradeInstruction: false;
    financialAdvice: false;
  };
  safetySummary: string;
};

const priceHistorySafetyMeta = {
  mockOnly: true,
  simulated: true,
  sampleBacktestWindow: true,
  liveMarketData: false,
  realTimeQuotes: false,
  externalPaidApi: false,
  brokerageConnection: false,
  tradeInstruction: false,
  financialAdvice: false
} as const;

const priceHistoryPoints = [
  ['2026-07-14T09:00:00.000Z', 124.1, 120000],
  ['2026-07-14T10:00:00.000Z', 125.35, 118400],
  ['2026-07-14T11:00:00.000Z', 126.02, 121800],
  ['2026-07-14T12:00:00.000Z', 124.88, 119250],
  ['2026-07-14T13:00:00.000Z', 127.44, 123100],
  ['2026-07-14T14:00:00.000Z', 128.12, 122600]
] as const;

export const investModelPriceHistorySeedFixture: InvestModelPriceHistoryReadModel =
  {
    generatedFrom: 'deterministic_fixture',
    sourceTables: ['market_instruments', 'market_price_snapshots'],
    displaySurface: 'mini_chart',
    instrumentSymbol: 'SAMPLE_AI_BASKET',
    emptyState: {
      title: 'No seeded price history yet',
      description:
        'Mini charts render only after bounded mock_seed price history is available.'
    },
    safetyMeta: priceHistorySafetyMeta,
    safetySummary:
      'Bounded mock_seed sample_backtest_window for mini charts only. It uses no live market data, real-time quotes, external paid API, brokerage connection, trade instruction, or financial advice.',
    points: priceHistoryPoints.map(([capturedAt, samplePrice, sampleVolume]) => ({
      id: `price_hist_SAMPLE_AI_BASKET_${capturedAt.slice(0, 13).replace(/\D/g, '')}`,
      instrumentSymbol: 'SAMPLE_AI_BASKET',
      instrumentName: 'Sample AI Infrastructure Basket',
      capturedAt,
      samplePrice,
      sampleVolume,
      seedProvider: 'mock_seed_sample_backtest_window',
      dataWindowLabel: 'sample_backtest_window',
      seedSourceLabel: 'mock_seed'
    }))
  };

export async function readInvestModelPriceHistorySeedFixture(
  limit = investModelPriceHistorySeedFixture.points.length
): Promise<InvestModelPriceHistoryReadModel> {
  return {
    ...investModelPriceHistorySeedFixture,
    emptyState: { ...investModelPriceHistorySeedFixture.emptyState },
    safetyMeta: { ...investModelPriceHistorySeedFixture.safetyMeta },
    points: investModelPriceHistorySeedFixture.points
      .slice(0, limit)
      .map((point) => ({ ...point }))
  };
}
