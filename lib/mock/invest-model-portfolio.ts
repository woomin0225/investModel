/**
 * Portfolio mock data is UI-only sample state.
 * It must not be treated as a real cash balance, brokerage account, order, or investment result.
 */
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';

export const investModelPortfolioMock = {
  isMockOnly: true,
  safetyMeta: portfolioMockSafetyMeta,
  selectedModel: {
    selectionPublicId: 'selection_mock_001',
    modelPublicId: 'model_quant_us_alpha',
    modelVersionPublicId: 'model_version_quant_us_v0_9',
    name: 'Quant US Leverage Alpha',
    versionLabel: 'ModelVersion v0.9 mock',
    mandateLabel: 'PortfolioMandate: US equities + leveraged ETF guardrails',
    statusLabel: 'live mock',
    riskLabel: 'High risk',
    selectedAtLabel: 'selected mock: 2026-07-14 09:40 KST',
    statusDescription:
      'Current selected model status is live mock; inactive models cannot create simulated TradeIntent records.'
  },
  mockDeposit: {
    displayLabel: '24,800 USD MockDeposit',
    amountLabel: '$24,800',
    statusLabel: 'simulated_allocated',
    sourceLabel: 'sourceType: mock',
    safetyLabel: 'Not a real deposit or cash balance'
  },
  allocationDecision: {
    statusLabel: 'ready_for_simulation',
    sourceLabel: 'Mock decision engine',
    generatedAtLabel: '2026-07-14 09:40 KST',
    rationale:
      'Mock market and news observations created pre-order simulation TradeIntent records after policy checks.'
  },
  timeSnapshots: [
    {
      rangeLabel: '1D',
      valueLabel: '$24,800 simulated',
      checkpointLabel: '09:40 KST mock checkpoint',
      signalLabel: '3 observed SignalEvents',
      safetyLabel: 'No real P/L'
    },
    {
      rangeLabel: '1W',
      valueLabel: '$24,800 simulated',
      checkpointLabel: '7-day sample window',
      signalLabel: 'Mock volatility guard active',
      safetyLabel: 'No return claim'
    },
    {
      rangeLabel: '1M',
      valueLabel: '$24,800 simulated',
      checkpointLabel: '30-day sample window',
      signalLabel: 'PortfolioMandate guardrails only',
      safetyLabel: 'No brokerage data'
    }
  ],
  positions: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA sample equity',
      quantityLabel: '42.00000000 simulated units',
      weightLabel: '42% target',
      valueLabel: '$10,416 simulated',
      stateLabel: 'simulated position',
      sourceLabel: 'mock market quote'
    },
    {
      symbol: 'QQQ',
      name: 'NASDAQ 100 sample ETF',
      quantityLabel: '38.00000000 simulated units',
      weightLabel: '38% target',
      valueLabel: '$9,424 simulated',
      stateLabel: 'simulated position',
      sourceLabel: 'mock market quote'
    },
    {
      symbol: 'SHV',
      name: 'Treasury bill sample ETF',
      quantityLabel: '20.00000000 simulated units',
      weightLabel: '20% guardrail',
      valueLabel: '$4,960 simulated',
      stateLabel: 'simulated position',
      sourceLabel: 'mock policy buffer'
    }
  ],
  tradeIntent: {
    statusLabel: 'approved_for_simulation',
    boundaryLabel: 'pre-order simulation only',
    blockedActions: [
      'No real deposit',
      'No live order',
      'No brokerage account'
    ]
  }
} as const;
