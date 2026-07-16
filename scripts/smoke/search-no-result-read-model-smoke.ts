/**
 * Verifies the BK-567 Search no-result seed/read-model fixture.
 * It keeps no-result fallback keywords local to model, feed, and signal
 * categories and never adds live search, quote, provider, account, deposit,
 * TradeIntent, order, brokerage, or financial-advice fields.
 */

import fs from 'fs';
import path from 'path';

import {
  readSearchNoResultSeedFixture,
  searchNoResultSeedFixture
} from '../../lib/db/search-no-result-read-model';

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
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const firstRead = await readSearchNoResultSeedFixture();
    const secondRead = await readSearchNoResultSeedFixture();
    const source = readText('lib/db/search-no-result-read-model.ts');
    const sampleSql = readText(
      'docs/database/samples/search-no-result-read-model.sample.sql'
    );
    const seedSql = readText(
      'docs/database/seeds/014_search_no_result_read_model_seed.sql'
    );
    const sampleReadme = readText('docs/database/samples/README.md');
    const seedReadme = readText('docs/database/seeds/README.md');
    const packageJson = readText('package.json');
    const serialized = JSON.stringify(searchNoResultSeedFixture);
    const categories = new Set(firstRead.map((group) => group.category));

    assertCondition(
      firstRead.length === 3 &&
        JSON.stringify(firstRead) === JSON.stringify(secondRead),
      'search no-result fixture is deterministic without MYSQL_URL'
    );
    assertCondition(
      categories.has('model') &&
        categories.has('feed') &&
        categories.has('signal'),
      'search no-result fixture groups model, feed, and signal categories'
    );
    assertCondition(
      firstRead.every(
        (group) =>
          group.groupPublicId.startsWith('search_no_result_') &&
          group.sourceSurface === 'Search' &&
          group.suggestedKeywords.length >= 3 &&
          group.suggestedKeywords.every((keyword) => keyword.length > 0) &&
          group.relatedSuggestionPublicIds.every((publicId) =>
            publicId.startsWith('search_suggestion_')
          )
      ),
      'search no-result groups expose stable public ids and keyword seeds'
    );
    assertCondition(
      firstRead.every(
        (group) =>
          group.sourceMeta.mockOnly === true &&
          group.sourceMeta.seedOnly === true &&
          group.sourceMeta.localReadModelOnly === true &&
          group.sourceMeta.emptyStateOnly === true &&
          group.sourceMeta.realtimeExternalData === false &&
          group.sourceMeta.externalSearchProvider === false &&
          group.sourceMeta.liveQuoteLookup === false &&
          group.sourceMeta.externalPaidApi === false &&
          group.sourceMeta.financialAdvice === false &&
          group.sourceMeta.modelSelectionCreated === false &&
          group.sourceMeta.tradeIntentCreated === false &&
          group.sourceMeta.realOrder === false &&
          group.sourceMeta.realDeposit === false &&
          group.sourceMeta.brokerageConnection === false &&
          group.sourceMeta.accountData === false
      ),
      'search no-result fixture keeps no-result safety meta'
    );
    assertCondition(
      sampleSql.includes('search_no_result_seed_model_keywords') &&
        sampleSql.includes('search_no_result_seed_feed_keywords') &&
        sampleSql.includes('search_no_result_seed_signal_keywords') &&
        sampleSql.includes('investment_models') &&
        sampleSql.includes('feed_posts') &&
        sampleSql.includes('model_signal_events') &&
        sampleSql.includes('no live search volume') &&
        sampleSql.includes('no external search provider') &&
        sampleSql.includes('no orders, deposits, or brokerage'),
      'sample SQL documents Search no-result projection'
    );
    assertCondition(
      seedSql.includes('INSERT INTO search_query_logs') &&
        seedSql.includes("'models' AS result_scope") &&
        seedSql.includes("'feed'") &&
        seedSql.includes("'signals'") &&
        seedSql.includes('result_count') &&
        seedSql.includes('0,') &&
        seedSql.includes('user_demo_001') &&
        seedSql.includes('NOT EXISTS') &&
        seedSql.includes('external search-volume data') &&
        seedSql.includes('TradeIntent rows'),
      'seed SQL documents local zero-result Search rows'
    );
    assertCondition(
      sampleReadme.includes('search-no-result-read-model.sample.sql') &&
        seedReadme.includes('014_search_no_result_read_model_seed.sql') &&
        seedReadme.includes('search-no-result-read-model.sample.sql') &&
        seedReadme.includes('Search no-result'),
      'README files link Search no-result sample'
    );
    assertCondition(
      packageJson.includes(
        '"test:search-no-result-read-model": "npx tsx scripts/smoke/search-no-result-read-model-smoke.ts"'
      ),
      'package script exposes search no-result read-model smoke'
    );

    [
      'brokerAccount',
      'broker_account',
      'accountNumber',
      'bankAccount',
      'routingNumber',
      'paymentId',
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
      assertNotIncludes(source, needle, `search no-result source avoids ${needle}`);
      assertNotIncludes(
        serialized,
        needle,
        `search no-result fixture avoids ${needle}`
      );
      assertNotIncludes(
        sampleSql,
        needle,
        `search no-result sample avoids ${needle}`
      );
      assertNotIncludes(
        seedSql,
        needle,
        `search no-result seed avoids ${needle}`
      );
    });
  } finally {
    if (originalMysqlUrl === undefined) {
      delete process.env.MYSQL_URL;
    } else {
      process.env.MYSQL_URL = originalMysqlUrl;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
