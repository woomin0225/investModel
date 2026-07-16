/**
 * Portfolio holdings read model for mobile Portfolio list/allocation work.
 * It projects simulated PortfolioPosition rows only; it never represents real
 * broker-confirmed holdings, cash, account links, order fills, or advice.
 */
import { readInvestModelPortfolioSummary } from '@/lib/db/portfolio-read-model';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';

export type InvestModelPortfolioHolding = {
  symbol: string;
  name: string;
  quantityLabel: string;
  weightLabel: string;
  valueLabel: string;
  stateLabel: 'simulated position';
  sourceLabel: string;
  safetyLabel: 'not broker-confirmed';
};

export type InvestModelPortfolioHoldings = {
  isMockOnly: true;
  safetyMeta: typeof portfolioMockSafetyMeta;
  seedSourceLabel: 'db_or_mock_seed_portfolio_positions';
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
    mockCashBufferLabel: string;
    positionCountLabel: string;
    allocationBasisLabel: 'PortfolioSummary simulated total';
  };
  holdings: InvestModelPortfolioHolding[];
  displayHints: {
    listTitle: 'Simulated holdings';
    allocationTitle: 'Mock allocation split';
    safetyLine: string;
  };
};

export async function readInvestModelPortfolioHoldings(
  userPublicId = 'user_demo_001'
): Promise<InvestModelPortfolioHoldings> {
  const summary = await readInvestModelPortfolioSummary(userPublicId);
  const latestSnapshot = summary.timeSnapshots[0];
  const cashSnapshot = summary.timeSnapshots[1] ?? latestSnapshot;

  return {
    isMockOnly: true,
    safetyMeta: portfolioMockSafetyMeta,
    seedSourceLabel: 'db_or_mock_seed_portfolio_positions',
    sourceTables: [
      'users',
      'user_model_selections',
      'portfolios',
      'portfolio_positions',
      'market_instruments',
      'mock_deposits'
    ],
    summaryAlignment: {
      sourceSummaryValueLabel:
        latestSnapshot?.valueLabel ?? 'No PortfolioSummary rows yet',
      mockCashBufferLabel: `${
        cashSnapshot?.valueLabel ?? 'No MockDeposit cash window yet'
      } mock context`,
      positionCountLabel: `${summary.positions.length} simulated PortfolioPositions`,
      allocationBasisLabel: 'PortfolioSummary simulated total'
    },
    holdings: summary.positions.map((position) => ({
      symbol: position.symbol,
      name: position.name,
      quantityLabel: position.quantityLabel,
      weightLabel: position.weightLabel,
      valueLabel: position.valueLabel,
      stateLabel: 'simulated position',
      sourceLabel: position.sourceLabel,
      safetyLabel: 'not broker-confirmed'
    })),
    displayHints: {
      listTitle: 'Simulated holdings',
      allocationTitle: 'Mock allocation split',
      safetyLine:
        'PortfolioPositions are simulated read-model rows only; no real holdings, broker account, order execution, or financial advice.'
    }
  };
}
