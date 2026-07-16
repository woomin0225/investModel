/**
 * Verifies the Portfolio holdings read model stays deterministic, summary
 * aligned, and mock-safe. It never opens a DB connection when MYSQL_URL is
 * absent and never creates broker positions, account links, orders, fills, or
 * advice.
 */

import { readFileSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source: string, needle: string, label: string) {
  assertCondition(source.includes(needle), `${label}: missing ${needle}`);
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
  'realOrderId',
  'liveBalance',
  'confirmedHolding'
];

async function main() {
  const previousMysqlUrl = process.env.MYSQL_URL;
  delete process.env.MYSQL_URL;

  try {
    const { readInvestModelPortfolioHoldings } = await import(
      '../../lib/db/portfolio-holdings-read-model'
    );
    const first = await readInvestModelPortfolioHoldings();
    const second = await readInvestModelPortfolioHoldings();
    const serialized = JSON.stringify(first);

    assertCondition(
      serialized === JSON.stringify(second),
      'portfolio holdings fixture is deterministic without MYSQL_URL'
    );
    assertCondition(
      first.isMockOnly === true &&
        first.safetyMeta.mockOnly === true &&
        first.safetyMeta.realDeposit === false &&
        first.safetyMeta.realBalance === false &&
        first.safetyMeta.realOrder === false &&
        first.safetyMeta.brokerageConnection === false &&
        first.safetyMeta.financialAdvice === false,
      'portfolio holdings keep mock-safe safety meta'
    );
    assertCondition(
      first.sourceTables.includes('portfolios') &&
        first.sourceTables.includes('portfolio_positions') &&
        first.sourceTables.includes('market_instruments') &&
        first.sourceTables.includes('mock_deposits') &&
        first.sourceTables.includes('user_model_selections'),
      'portfolio holdings declare canonical DBML source tables'
    );
    assertCondition(
      first.summaryAlignment.sourceSummaryValueLabel
        .toLowerCase()
        .includes('simulated') &&
        first.summaryAlignment.mockCashBufferLabel.toLowerCase().includes('mock') &&
        first.summaryAlignment.positionCountLabel.includes(
          'simulated PortfolioPositions'
        ) &&
        first.summaryAlignment.allocationBasisLabel ===
          'PortfolioSummary simulated total',
      'portfolio holdings stay aligned to simulated PortfolioSummary context'
    );
    assertCondition(
      first.holdings.length >= 3 &&
        first.holdings.every(
          (holding) =>
            holding.stateLabel === 'simulated position' &&
            holding.safetyLabel === 'not broker-confirmed' &&
            holding.valueLabel.toLowerCase().includes('simulated')
        ),
      'portfolio holdings expose simulated position rows only'
    );
    assertCondition(
      forbiddenNeedles.every((needle) => !serialized.includes(needle)),
      'portfolio holdings do not expose real finance field names'
    );

    const seedSource = readProjectFile(
      'docs/database/seeds/005_portfolio_holdings_seed.sql'
    );
    const sampleSource = readProjectFile(
      'docs/database/samples/portfolio-holdings-read-model.sample.sql'
    );
    const readModelSource = readProjectFile(
      'lib/db/portfolio-holdings-read-model.ts'
    );

    [
      'portfolio_positions',
      'market_instruments',
      'total_market_value of 78000 USD',
      'SAMPLE_AI_BASKET',
      'QQQ',
      'SHV',
      'SUM(pp.market_value)',
      'Does not create real holdings'
    ].forEach((needle) =>
      assertIncludes(seedSource, needle, 'portfolio holdings seed')
    );

    [
      'source_portfolio_summary_total',
      'simulated_allocation_pct',
      'PortfolioSummary simulated total',
      'not broker-confirmed',
      'Does not create real holdings'
    ].forEach((needle) =>
      assertIncludes(sampleSource, needle, 'portfolio holdings sample SQL')
    );

    [
      'readInvestModelPortfolioSummary',
      'PortfolioPositions are simulated read-model rows only',
      'seedSourceLabel',
      'db_or_mock_seed_portfolio_positions'
    ].forEach((needle) =>
      assertIncludes(readModelSource, needle, 'portfolio holdings read model')
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
