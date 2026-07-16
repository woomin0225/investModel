/**
 * Verifies the Portfolio compact read model stays deterministic and mock-safe.
 * It never opens a DB connection when MYSQL_URL is absent and never creates
 * deposits, balances, broker connections, orders, TradeIntent rows, or advice.
 */

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const forbiddenNeedles = [
  'brokerAccount',
  'broker_account',
  'accountNumber',
  'bankAccount',
  'routingNumber',
  'orderExecution',
  'tradeFill',
  'brokerOrder',
  'paymentIntent',
  'checkout',
  'settledCash',
  'availableToWithdraw',
  'realDepositAmount',
  'realOrderId'
];

async function main() {
  const previousMysqlUrl = process.env.MYSQL_URL;
  delete process.env.MYSQL_URL;

  try {
    const { readInvestModelPortfolioCompactSummary } = await import(
      '../../lib/db/portfolio-compact-read-model'
    );
    const first = await readInvestModelPortfolioCompactSummary();
    const second = await readInvestModelPortfolioCompactSummary();
    const serialized = JSON.stringify(first);

    assertCondition(
      serialized === JSON.stringify(second),
      'compact portfolio fixture is deterministic without MYSQL_URL'
    );
    assertCondition(
      first.isMockOnly === true &&
        first.safetyMeta.mockOnly === true &&
        first.safetyMeta.realDeposit === false &&
        first.safetyMeta.realBalance === false &&
        first.safetyMeta.realOrder === false &&
        first.safetyMeta.brokerageConnection === false &&
        first.safetyMeta.financialAdvice === false,
      'compact portfolio keeps mock-safe safety meta'
    );
    assertCondition(
      first.sourceTables.includes('mock_deposits') &&
        first.sourceTables.includes('portfolios') &&
        first.sourceTables.includes('portfolio_positions') &&
        first.sourceTables.includes('allocation_decisions') &&
        first.sourceTables.includes('trade_intents') &&
        first.sourceTables.includes('user_model_selections') &&
        first.sourceTables.includes('investment_models') &&
        first.sourceTables.includes('model_versions'),
      'compact portfolio declares canonical DBML source tables'
    );
    assertCondition(
      first.selectedModel.selectionPublicId === 'selection_mock_001' &&
        first.selectedModel.modelPublicId === 'model_quant_us_alpha' &&
        first.selectedModel.modelVersionPublicId ===
          'model_version_quant_us_v0_9',
      'compact portfolio preserves selected InvestmentModel and ModelVersion identifiers'
    );
    assertCondition(
      first.mockDeposit.displayLabel.includes('MockDeposit') &&
        first.mockDeposit.safetyLabel ===
          'Not a real deposit or cash balance' &&
        first.portfolioSummary.simulatedValueLabel
          .toLowerCase()
          .includes('simulated') &&
        first.portfolioSummary.mockCashBufferLabel
          .toLowerCase()
          .includes('mock') &&
        first.portfolioSummary.positionCountLabel.includes(
          'simulated PortfolioPositions'
        ) &&
        first.tradeIntentBoundary.boundaryLabel ===
          'pre-order simulation only' &&
        first.displayHints.compactCardTitle === 'PortfolioSummary',
      'compact portfolio exposes only mock/simulated card labels'
    );
    assertCondition(
      forbiddenNeedles.every((needle) => !serialized.includes(needle)),
      'compact portfolio does not expose real finance field names'
    );
  } finally {
    if (previousMysqlUrl) {
      process.env.MYSQL_URL = previousMysqlUrl;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
