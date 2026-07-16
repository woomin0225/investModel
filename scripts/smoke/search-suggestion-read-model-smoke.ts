/**
 * Verifies the BK-529 Search suggestion seed/read-model fixture.
 * It does not require live search, live quotes, paid APIs, broker accounts,
 * deposits, TradeIntent creation, orders, account data, or financial advice.
 */

import fs from 'fs';
import path from 'path';

import {
  readSearchSuggestionSeedFixture,
  searchSuggestionSeedFixture
} from '../../lib/db/search-suggestion-read-model';

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
  const firstRead = await readSearchSuggestionSeedFixture();
  const secondRead = await readSearchSuggestionSeedFixture();
  const source = readText('lib/db/search-suggestion-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/search-suggestion-read-model.sample.sql'
  );
  const seedReadme = readText('docs/database/seeds/README.md');
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(searchSuggestionSeedFixture);
  const kinds = new Set(firstRead.map((item) => item.kind));

  assertCondition(
    firstRead.length >= 3 &&
      firstRead.every(
        (item) =>
          item.generatedFrom === 'deterministic_fixture' ||
          item.generatedFrom === 'db_seed_projection'
      ),
    'search suggestion fixture returns deterministic or DB seed suggestions'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'search suggestion fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    kinds.has('topic') && kinds.has('model') && kinds.has('signal'),
    'search suggestion fixture exposes topic, model, and signal suggestions'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.suggestionPublicId.startsWith('search_suggestion_') &&
        item.sourceSurface === 'Search' &&
        item.label.length > 0 &&
        item.query.length > 0 &&
        item.helper.length > 0
    ),
    'search suggestion fixture exposes stable public ids and chip copy'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.sourceMeta.mockOnly === true &&
        item.sourceMeta.seedOnly === true &&
        item.sourceMeta.localReadModelOnly === true &&
        item.sourceMeta.realtimeExternalData === false &&
        item.sourceMeta.externalSearchProvider === false &&
        item.sourceMeta.externalPaidApi === false &&
        item.sourceMeta.financialAdvice === false &&
        item.sourceMeta.modelSelectionCreated === false &&
        item.sourceMeta.tradeIntentCreated === false &&
        item.sourceMeta.realOrder === false &&
        item.sourceMeta.brokerageConnection === false
    ),
    'search suggestion fixture keeps seed-only safety meta'
  );
  assertCondition(
    sampleSql.includes('search_query_logs') &&
      sampleSql.includes('investment_models') &&
      sampleSql.includes('model_signal_events') &&
      sampleSql.includes('feed_posts') &&
      sampleSql.includes('no live search volume') &&
      sampleSql.includes('without live feeds'),
    'sample SQL documents Search suggestion projection'
  );
  assertCondition(
    seedReadme.includes('search-suggestion-read-model.sample.sql') &&
      seedReadme.includes('Search suggestion'),
    'seed README links Search suggestion sample'
  );
  assertCondition(
    packageJson.includes(
      '"test:search-suggestion-read-model": "npx tsx scripts/smoke/search-suggestion-read-model-smoke.ts"'
    ),
    'package script exposes search suggestion read-model smoke'
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
    'buySignal',
    'sellSignal',
    'holdRecommendation',
    'suitabilityApproved',
    'legalApproved'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `search suggestion source avoids ${needle}`);
    assertNotIncludes(
      serialized,
      needle,
      `search suggestion fixture avoids ${needle}`
    );
    assertNotIncludes(
      sampleSql,
      needle,
      `search suggestion sample avoids ${needle}`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
