export type InvestModelPortfolioSummary = {
  isMockOnly: true;
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
