export type InvestModelPortfolioSummary = {
  isMockOnly: true;
  safetyMeta: {
    mockOnly: true;
    realDeposit: false;
    realBalance: false;
    realOrder: false;
    brokerageConnection: false;
    financialAdvice: false;
    fallbackLabel: string;
  };
  selectedModel: {
    selectionPublicId: string;
    modelPublicId: string;
    modelVersionPublicId: string;
    name: string;
    versionLabel: string;
    mandateLabel: string;
    statusLabel: string;
    riskLabel: string;
    selectedAtLabel: string;
    statusDescription: string;
  };
  mockDeposit: {
    displayLabel: string;
    amountLabel: string;
    statusLabel: string;
    sourceLabel: string;
    safetyLabel: string;
  };
  allocationDecision: {
    statusLabel: string;
    sourceLabel: string;
    generatedAtLabel: string;
    rationale: string;
  };
  timeSnapshots: Array<{
    rangeLabel: string;
    valueLabel: string;
    checkpointLabel: string;
    signalLabel: string;
    safetyLabel: string;
  }>;
  positions: Array<{
    symbol: string;
    name: string;
    quantityLabel: string;
    weightLabel: string;
    valueLabel: string;
    stateLabel: string;
    sourceLabel: string;
  }>;
  tradeIntent: {
    statusLabel: string;
    boundaryLabel: string;
    blockedActions: string[];
  };
};

export const portfolioMockSafetyMeta: InvestModelPortfolioSummary['safetyMeta'] = {
  mockOnly: true,
  realDeposit: false,
  realBalance: false,
  realOrder: false,
  brokerageConnection: false,
  financialAdvice: false,
  fallbackLabel:
    'Mock-safe PortfolioSummary only; no real deposit, balance, order, brokerage connection, or financial advice.'
};
