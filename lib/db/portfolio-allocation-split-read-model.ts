/**
 * Portfolio allocation split fixture for mobile allocation UI/API work.
 * Values are anchored to the BK-505 holdings seed total of 78000 USD and are
 * simulated read-model evidence only.
 */
import {
  formatAllocationWeight,
  formatMockMoney
} from '@/lib/domain/formatting/invest-model-number';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';

type SeedHolding = {
  symbol: 'SAMPLE_AI_BASKET' | 'QQQ' | 'SHV';
  name: string;
  assetClassLabel: 'equity_basket' | 'equity_etf' | 'cash_like_etf';
  sectorLabel: 'AI infrastructure' | 'Broad technology' | 'Cash / T-bills';
  marketValue: number;
};

export type InvestModelPortfolioAllocationBucket = {
  bucketId: string;
  bucketType: 'sector' | 'asset_class';
  label: string;
  valueLabel: string;
  weightLabel: string;
  sourceSymbols: string[];
  safetyLabel: 'simulated allocation bucket';
};

export type InvestModelPortfolioAllocationSplit = {
  isMockOnly: true;
  safetyMeta: typeof portfolioMockSafetyMeta;
  seedSourceLabel: 'seed_005_portfolio_positions_006_allocation_split';
  sourceTables: [
    'users',
    'user_model_selections',
    'portfolios',
    'portfolio_positions',
    'market_instruments',
    'mock_deposits'
  ];
  summaryAlignment: {
    sourceSummaryValueLabel: string;
    holdingsTotalLabel: string;
    bucketTotalLabel: string;
    allocationBasisLabel: 'PortfolioSummary simulated total';
  };
  sectorBuckets: InvestModelPortfolioAllocationBucket[];
  assetClassBuckets: InvestModelPortfolioAllocationBucket[];
  displayHints: {
    segmentedControlTitle: 'Mock allocation split';
    sectorTabLabel: 'Sector buckets';
    assetClassTabLabel: 'Asset-class buckets';
    safetyLine: string;
  };
};

const allocationSeedTotal = 78000;

const allocationSeedHoldings: SeedHolding[] = [
  {
    symbol: 'SAMPLE_AI_BASKET',
    name: 'Sample AI Basket simulated holding',
    assetClassLabel: 'equity_basket',
    sectorLabel: 'AI infrastructure',
    marketValue: 39000
  },
  {
    symbol: 'QQQ',
    name: 'NASDAQ 100 sample ETF simulated holding',
    assetClassLabel: 'equity_etf',
    sectorLabel: 'Broad technology',
    marketValue: 23400
  },
  {
    symbol: 'SHV',
    name: 'Treasury bill sample ETF simulated holding',
    assetClassLabel: 'cash_like_etf',
    sectorLabel: 'Cash / T-bills',
    marketValue: 15600
  }
];

function bucketId(type: 'sector' | 'asset_class', label: string) {
  return `${type}:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function buildBuckets(
  bucketType: 'sector' | 'asset_class',
  labelForHolding: (holding: SeedHolding) => string
): InvestModelPortfolioAllocationBucket[] {
  const grouped = allocationSeedHoldings.reduce<
    Record<string, { marketValue: number; symbols: string[] }>
  >((accumulator, holding) => {
    const label = labelForHolding(holding);
    const current = accumulator[label] ?? { marketValue: 0, symbols: [] };
    current.marketValue += holding.marketValue;
    current.symbols.push(holding.symbol);
    accumulator[label] = current;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([label, bucket]) => ({
      bucketId: bucketId(bucketType, label),
      bucketType,
      label,
      valueLabel: `${formatMockMoney(bucket.marketValue)} simulated`,
      weightLabel: formatAllocationWeight(bucket.marketValue, allocationSeedTotal),
      sourceSymbols: bucket.symbols.sort(),
      safetyLabel: 'simulated allocation bucket' as const
    }))
    .sort((left, right) => {
      const leftValue = allocationSeedHoldings
        .filter((holding) => labelForHolding(holding) === left.label)
        .reduce((sum, holding) => sum + holding.marketValue, 0);
      const rightValue = allocationSeedHoldings
        .filter((holding) => labelForHolding(holding) === right.label)
        .reduce((sum, holding) => sum + holding.marketValue, 0);
      return rightValue - leftValue || left.label.localeCompare(right.label);
    });
}

export async function readInvestModelPortfolioAllocationSplit(): Promise<InvestModelPortfolioAllocationSplit> {
  const sectorBuckets = buildBuckets('sector', (holding) => holding.sectorLabel);
  const assetClassBuckets = buildBuckets(
    'asset_class',
    (holding) => holding.assetClassLabel
  );

  return {
    isMockOnly: true,
    safetyMeta: portfolioMockSafetyMeta,
    seedSourceLabel: 'seed_005_portfolio_positions_006_allocation_split',
    sourceTables: [
      'users',
      'user_model_selections',
      'portfolios',
      'portfolio_positions',
      'market_instruments',
      'mock_deposits'
    ],
    summaryAlignment: {
      sourceSummaryValueLabel: '$78,000 simulated',
      holdingsTotalLabel: `${formatMockMoney(allocationSeedTotal)} simulated`,
      bucketTotalLabel: `${formatMockMoney(allocationSeedTotal)} simulated`,
      allocationBasisLabel: 'PortfolioSummary simulated total'
    },
    sectorBuckets,
    assetClassBuckets,
    displayHints: {
      segmentedControlTitle: 'Mock allocation split',
      sectorTabLabel: 'Sector buckets',
      assetClassTabLabel: 'Asset-class buckets',
      safetyLine:
        'Allocation buckets are simulated seed/read-model rows only; no broker account, real cash movement, order execution, or financial advice.'
    }
  };
}

export const portfolioAllocationSplitSeedFixture = {
  totalMarketValue: allocationSeedTotal,
  holdings: allocationSeedHoldings.map((holding) => ({ ...holding }))
};
