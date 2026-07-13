/**
 * Portfolio mock data is UI-only sample state.
 * It must not be treated as a real cash balance, brokerage account, order, or investment result.
 */
export const investModelPortfolioMock = {
  isMockOnly: true,
  selectedModel: {
    name: 'Quant US Leverage Alpha',
    versionLabel: 'ModelVersion v0.9 mock',
    mandateLabel: 'PortfolioMandate: US equities + leveraged ETF guardrails',
    statusLabel: 'live mock',
    riskLabel: 'High risk'
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
  positions: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA sample equity',
      weightLabel: '42% target',
      valueLabel: '$10,416 simulated',
      stateLabel: 'simulated position',
      sourceLabel: 'mock market quote'
    },
    {
      symbol: 'QQQ',
      name: 'NASDAQ 100 sample ETF',
      weightLabel: '38% target',
      valueLabel: '$9,424 simulated',
      stateLabel: 'simulated position',
      sourceLabel: 'mock market quote'
    },
    {
      symbol: 'SHV',
      name: 'Treasury bill sample ETF',
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
