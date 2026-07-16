/**
 * Verifies the BK-501 price history seed fixture stays bounded and mock-safe.
 * It never opens a DB connection and never creates live quotes, broker links,
 * trade instructions, real deposits, or external paid API assumptions.
 */

import fs from 'fs';
import path from 'path';

import {
  investModelPriceHistorySeedFixture,
  readInvestModelPriceHistorySeedFixture
} from '../../lib/db/price-history-read-model';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertNotIncludes(text: string, needle: string, message: string) {
  assertCondition(!text.includes(needle), message);
}

async function main() {
  const firstRead = await readInvestModelPriceHistorySeedFixture();
  const secondRead = await readInvestModelPriceHistorySeedFixture();
  const source = readText('lib/db/price-history-read-model.ts');
  const seedSql = readText('docs/database/seeds/004_price_history_seed.sql');
  const sampleSql = readText(
    'docs/database/samples/price-history-read-model.sample.sql'
  );
  const serialized = JSON.stringify(investModelPriceHistorySeedFixture);

  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'price history fixture read is deterministic'
  );
  assertCondition(
    firstRead.generatedFrom === 'deterministic_fixture' &&
      firstRead.displaySurface === 'mini_chart' &&
      firstRead.sourceTables.includes('market_price_snapshots') &&
      firstRead.sourceTables.includes('market_instruments'),
    'price history fixture declares deterministic mini chart source tables'
  );
  assertCondition(
    firstRead.points.length === 6,
    'price history fixture exposes six bounded sample points'
  );
  assertCondition(
    firstRead.points.every(
      (point) =>
        point.instrumentSymbol === 'SAMPLE_AI_BASKET' &&
        point.seedProvider === 'mock_seed_sample_backtest_window' &&
        point.dataWindowLabel === 'sample_backtest_window' &&
        point.seedSourceLabel === 'mock_seed' &&
        Number.isFinite(point.samplePrice) &&
        Number.isFinite(point.sampleVolume)
    ),
    'every point keeps mock seed and sample backtest context'
  );
  assertCondition(
    firstRead.safetyMeta.mockOnly === true &&
      firstRead.safetyMeta.simulated === true &&
      firstRead.safetyMeta.sampleBacktestWindow === true &&
      firstRead.safetyMeta.liveMarketData === false &&
      firstRead.safetyMeta.realTimeQuotes === false &&
      firstRead.safetyMeta.externalPaidApi === false &&
      firstRead.safetyMeta.brokerageConnection === false &&
      firstRead.safetyMeta.tradeInstruction === false &&
      firstRead.safetyMeta.financialAdvice === false,
    'price history safety meta blocks live finance surfaces'
  );
  assertCondition(
    firstRead.safetySummary.includes('sample_backtest_window') &&
      firstRead.safetySummary.includes('no live market data') &&
      firstRead.safetySummary.includes('real-time quotes') &&
      firstRead.safetySummary.includes('external paid API') &&
      firstRead.safetySummary.includes('brokerage connection') &&
      firstRead.safetySummary.includes('financial advice'),
    'price history summary names blocked real-time and finance boundaries'
  );
  assertCondition(
    seedSql.includes('market_price_snapshots') &&
      seedSql.includes('mock_seed_sample_backtest_window') &&
      seedSql.includes('mock://invest-model/price-history/sample-backtest-window') &&
      sampleSql.includes('point_public_id') &&
      sampleSql.includes('sample_price') &&
      sampleSql.includes('sample_backtest_window') &&
      sampleSql.includes('No live market data'),
    'SQL seed and sample projection document bounded price history shape'
  );

  [
    'brokerAccount',
    'broker_account',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'tradeFill',
    'orderExecution',
    'brokerOrder',
    'liveQuoteProvider',
    'externalApiKey',
    'realBalance',
    'realTimePrice',
    'buy now',
    'sell now'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `price history source avoids ${needle}`);
    assertNotIncludes(seedSql, needle, `price history seed avoids ${needle}`);
    assertNotIncludes(sampleSql, needle, `price history sample avoids ${needle}`);
    assertNotIncludes(serialized, needle, `price history fixture avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
