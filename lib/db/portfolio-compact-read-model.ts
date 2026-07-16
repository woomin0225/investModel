/**
 * Portfolio compact summary read model for the mobile Portfolio card.
 * It projects MockDeposit and PortfolioSummary concepts only; it never
 * represents a real deposit, real account balance, broker order, or advice.
 */
import { readInvestModelPortfolioSummary } from '@/lib/db/portfolio-read-model';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';

export type InvestModelPortfolioCompactSummary = {
  isMockOnly: true;
  safetyMeta: typeof portfolioMockSafetyMeta;
  seedSourceLabel: 'db_or_mock_seed_portfolio_summary';
  sourceTables: [
    'users',
    'user_model_selections',
    'investment_models',
    'model_versions',
    'mock_deposits',
    'portfolios',
    'portfolio_positions',
    'allocation_decisions',
    'trade_intents'
  ];
  selectedModel: {
    selectionPublicId: string;
    modelPublicId: string;
    modelVersionPublicId: string;
    name: string;
    versionLabel: string;
    mandateLabel: string;
    riskLabel: string;
    statusLabel: string;
  };
  mockDeposit: {
    displayLabel: string;
    statusLabel: string;
    sourceLabel: string;
    safetyLabel: string;
  };
  portfolioSummary: {
    simulatedValueLabel: string;
    mockCashBufferLabel: string;
    positionCountLabel: string;
    snapshotLabel: string;
    safetyLabel: string;
  };
  allocationDecision: {
    statusLabel: string;
    sourceLabel: string;
    generatedAtLabel: string;
  };
  tradeIntentBoundary: {
    statusLabel: string;
    boundaryLabel: string;
    blockedActions: string[];
  };
  displayHints: {
    compactCardTitle: 'PortfolioSummary';
    primaryMetricLabel: 'Simulated portfolio value';
    secondaryMetricLabel: 'MockDeposit context';
    safetyLine: string;
  };
};

export async function readInvestModelPortfolioCompactSummary(
  userPublicId = 'user_demo_001'
): Promise<InvestModelPortfolioCompactSummary> {
  const summary = await readInvestModelPortfolioSummary(userPublicId);
  const latestSnapshot = summary.timeSnapshots[0];
  const cashSnapshot = summary.timeSnapshots[1] ?? latestSnapshot;

  return {
    isMockOnly: true,
    safetyMeta: portfolioMockSafetyMeta,
    seedSourceLabel: 'db_or_mock_seed_portfolio_summary',
    sourceTables: [
      'users',
      'user_model_selections',
      'investment_models',
      'model_versions',
      'mock_deposits',
      'portfolios',
      'portfolio_positions',
      'allocation_decisions',
      'trade_intents'
    ],
    selectedModel: {
      selectionPublicId: summary.selectedModel.selectionPublicId,
      modelPublicId: summary.selectedModel.modelPublicId,
      modelVersionPublicId: summary.selectedModel.modelVersionPublicId,
      name: summary.selectedModel.name,
      versionLabel: summary.selectedModel.versionLabel,
      mandateLabel: summary.selectedModel.mandateLabel,
      riskLabel: summary.selectedModel.riskLabel,
      statusLabel: summary.selectedModel.statusLabel
    },
    mockDeposit: {
      displayLabel: summary.mockDeposit.displayLabel,
      statusLabel: summary.mockDeposit.statusLabel,
      sourceLabel: summary.mockDeposit.sourceLabel,
      safetyLabel: summary.mockDeposit.safetyLabel
    },
    portfolioSummary: {
      simulatedValueLabel: latestSnapshot.valueLabel,
      mockCashBufferLabel: `${cashSnapshot.valueLabel} mock context`,
      positionCountLabel: `${summary.positions.length} simulated PortfolioPositions`,
      snapshotLabel: latestSnapshot.checkpointLabel,
      safetyLabel:
        'PortfolioSummary is mock/simulated only; no real deposit, real balance, real order, brokerage connection, or financial advice.'
    },
    allocationDecision: {
      statusLabel: summary.allocationDecision.statusLabel,
      sourceLabel: summary.allocationDecision.sourceLabel,
      generatedAtLabel: summary.allocationDecision.generatedAtLabel
    },
    tradeIntentBoundary: {
      statusLabel: summary.tradeIntent.statusLabel,
      boundaryLabel: summary.tradeIntent.boundaryLabel,
      blockedActions: [...summary.tradeIntent.blockedActions]
    },
    displayHints: {
      compactCardTitle: 'PortfolioSummary',
      primaryMetricLabel: 'Simulated portfolio value',
      secondaryMetricLabel: 'MockDeposit context',
      safetyLine:
        'MockDeposit and PortfolioSummary are simulated read-model values only.'
    }
  };
}
