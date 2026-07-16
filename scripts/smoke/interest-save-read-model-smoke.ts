/**
 * Verifies the BK-525 Interest/save state seed/read-model fixture.
 * It is mock user-scoped state only and must stay separate from model
 * selection, deposits, orders, TradeIntent, brokerage, and advice.
 */

import fs from 'fs';
import path from 'path';

import {
  readInterestSaveSeedFixture,
  type InterestSaveItem
} from '../../lib/db/interest-save-read-model';

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

function hasItemType(items: InterestSaveItem[], itemType: string) {
  return items.some((item) => item.itemType === itemType);
}

async function main() {
  const firstRead = await readInterestSaveSeedFixture();
  const secondRead = await readInterestSaveSeedFixture();
  const source = readText('lib/db/interest-save-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/interest-save-read-model.sample.sql'
  );
  const seedSql = readText(
    'docs/database/seeds/007_interest_save_state_seed.sql'
  );
  const seedReadme = readText('docs/database/seeds/README.md');
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(firstRead);

  assertCondition(
    firstRead.userPublicId === 'user_demo_001' &&
      firstRead.items.every((item) => item.userPublicId === 'user_demo_001'),
    'interest-save fixture is scoped to the demo mock user'
  );
  assertCondition(
    firstRead.items.length >= 3 &&
      hasItemType(firstRead.items, 'feed_post') &&
      hasItemType(firstRead.items, 'signal_event') &&
      hasItemType(firstRead.items, 'investment_model'),
    'interest-save fixture covers FeedPost, SignalEvent, and InvestmentModel markers'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'interest-save fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.items.every(
      (item) =>
        typeof item.createdAt === 'string' &&
        typeof item.updatedAt === 'string' &&
        item.safetyLabel.includes('no')
    ),
    'interest-save fixture exposes createdAt/updatedAt and safety copy'
  );
  assertCondition(
    firstRead.items.every(
      (item) =>
        item.sourceMeta.mockUserScoped === true &&
        item.sourceMeta.privateShortcutOnly === true &&
        item.sourceMeta.modelSelectionSignal === false &&
        item.sourceMeta.allocationSignal === false &&
        item.sourceMeta.realDeposit === false &&
        item.sourceMeta.realOrder === false &&
        item.sourceMeta.tradeIntentCreated === false &&
        item.sourceMeta.brokerageConnection === false &&
        item.sourceMeta.externalPaidApi === false &&
        item.sourceMeta.financialAdvice === false
    ),
    'interest-save fixture keeps private mock shortcut safety meta'
  );
  assertCondition(
    sampleSql.includes('feed_post_saves') &&
      sampleSql.includes('feed_posts') &&
      sampleSql.includes('users') &&
      sampleSql.includes('user_demo_001') &&
      sampleSql.includes('item_type') &&
      sampleSql.includes('created_at') &&
      sampleSql.includes('no model selection'),
    'sample SQL documents DB-backed FeedPost interest-save projection'
  );
  assertCondition(
    seedSql.includes('feed_post_saves') &&
      seedSql.includes('user_demo_001') &&
      seedSql.includes('feed_mock_002') &&
      seedSql.includes('private reading/interest shortcut') &&
      seedSql.includes('Does not create model selections'),
    'seed SQL documents and refreshes mock user-scoped FeedPost save state'
  );
  assertCondition(
    seedReadme.includes('007_interest_save_state_seed.sql') &&
      seedReadme.includes('private mock') &&
      seedReadme.includes('interest/save fixture'),
    'seed README lists the interest-save fixture seed'
  );
  assertCondition(
    packageJson.includes(
      '"test:interest-save-read-model": "npx tsx scripts/smoke/interest-save-read-model-smoke.ts"'
    ),
    'package script exposes interest-save read-model smoke'
  );

  [
    'user_model_selections',
    'mock_deposits',
    'allocation_decisions',
    'trade_intents',
    'broker_order',
    'brokerage_account',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'externalApiKey',
    'DATABASE_URL=',
    'STRIPE_SECRET_KEY',
    'realBalance',
    'cash available',
    'order placed',
    'guaranteed',
    'risk free',
    'suitabilityApproved',
    'legalApproved'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `interest-save source avoids ${needle}`);
    assertNotIncludes(
      serialized,
      needle,
      `interest-save fixture avoids ${needle}`
    );
    assertNotIncludes(sampleSql, needle, `interest-save sample avoids ${needle}`);
    assertNotIncludes(seedSql, needle, `interest-save seed avoids ${needle}`);
  });

  console.log('PASS interest-save read-model smoke');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
