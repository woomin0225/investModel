/**
 * Verifies the BK-492 watchlist seed read model without writing to a database
 * or calling live market, broker, bank, or external paid API providers.
 */

import fs from 'fs';
import path from 'path';

import {
  investModelWatchlistSeedFixture,
  readInvestModelWatchlistSeedFixture
} from '../../lib/db/watchlist-read-model';

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
  const firstRead = await readInvestModelWatchlistSeedFixture();
  const secondRead = await readInvestModelWatchlistSeedFixture();
  const source = readText('lib/db/watchlist-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/home-signals-watchlist-read-model.sample.sql'
  );
  const serialized = JSON.stringify(investModelWatchlistSeedFixture);

  assertCondition(
    firstRead.generatedFrom === 'deterministic_fixture' ||
      firstRead.generatedFrom === 'db_seed_projection',
    'watchlist read model reports its source'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'watchlist fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.items.length >= 3,
    'watchlist fixture exposes at least three seed rows'
  );
  assertCondition(
    firstRead.items.every(
      (item) =>
        item.seedSourceLabel === 'mock_seed' &&
        item.safetyMeta.mockOnly === true &&
        item.safetyMeta.simulated === true &&
        item.safetyMeta.liveMarketData === false &&
        item.safetyMeta.externalPaidApi === false &&
        item.safetyMeta.brokerageConnection === false &&
        item.safetyMeta.realDeposit === false &&
        item.safetyMeta.financialAdvice === false
    ),
    'every watchlist item keeps mock-only safety meta'
  );
  assertCondition(
    firstRead.items.some(
      (item) =>
        item.sourceType === 'model_signal_event' &&
        item.sourcePublicId === 'sig_mock_news_traffic_001'
    ),
    'watchlist fixture includes seeded SignalEvent observation'
  );
  assertCondition(
    firstRead.items.some(
      (item) =>
        item.sourceType === 'model_version' &&
        item.sourcePublicId === 'model_version_demo_signal_001'
    ),
    'watchlist fixture includes selected ModelVersion context'
  );
  assertCondition(
    firstRead.safetySummary.includes('no live market data') &&
      firstRead.safetySummary.includes('external paid API') &&
      firstRead.safetySummary.includes('brokerage connection') &&
      firstRead.safetySummary.includes('real deposit') &&
      firstRead.safetySummary.includes('financial advice'),
    'watchlist summary names blocked real-finance boundaries'
  );
  assertCondition(
    sampleSql.includes('watchlist_public_id') &&
      sampleSql.includes('item_kind') &&
      sampleSql.includes('model_public_id') &&
      sampleSql.includes('model_version_public_id') &&
      sampleSql.includes('signal_public_id') &&
      sampleSql.includes('mock_score') &&
      sampleSql.includes('home_signals') &&
      sampleSql.includes('mock_seed'),
    'sample SQL documents the screen-facing watchlist projection'
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
    'realBalance'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `watchlist source avoids ${needle}`);
    assertNotIncludes(serialized, needle, `watchlist fixture avoids ${needle}`);
    assertNotIncludes(sampleSql, needle, `watchlist sample avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
