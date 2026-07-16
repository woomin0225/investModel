/**
 * Verifies the BK-521 Model review calendar seed/read-model fixture.
 * It does not require legal judgment, rebalance execution, TradeIntent rows,
 * orders, brokerage accounts, deposits, real account data, or paid APIs.
 */

import fs from 'fs';
import path from 'path';

import {
  modelReviewCalendarSeedFixture,
  readModelReviewCalendarSeedFixture
} from '../../lib/db/model-review-calendar-read-model';

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
  const firstRead = await readModelReviewCalendarSeedFixture();
  const secondRead = await readModelReviewCalendarSeedFixture();
  const source = readText('lib/db/model-review-calendar-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/model-review-calendar-read-model.sample.sql'
  );
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(modelReviewCalendarSeedFixture);
  const statuses = new Set(firstRead.map((item) => item.status));

  assertCondition(
    firstRead.length >= 3 &&
      firstRead.every(
        (item) =>
          item.generatedFrom === 'deterministic_fixture' ||
          item.generatedFrom === 'db_seed_projection'
      ),
    'review calendar fixture returns deterministic or DB seed items'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'review calendar fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    statuses.has('review_due') && statuses.has('reviewed') && statuses.has('paused'),
    'review calendar fixture exposes review_due, reviewed, and paused states'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.scheduleSource === 'mock_schedule_seed' ||
        item.scheduleSource === 'compliance_review_projection'
    ),
    'review calendar fixture includes mock schedule source'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.changeHistory.length > 0 &&
        item.changeHistory.every((change) =>
          ['mock_schedule', 'compliance_review', 'model_status'].includes(
            change.source
          )
        )
    ),
    'review calendar fixture includes sample change history'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.summary.includes('read-only') ||
        item.summary.includes('metadata') ||
        item.summary.includes('informational')
    ) &&
      firstRead.every((item) => item.safetyLabel.includes('no')),
    'review calendar fixture includes read-only safety copy'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.sourceMeta.mockOnly === true &&
        item.sourceMeta.reviewMetadataOnly === true &&
        item.sourceMeta.legalJudgment === false &&
        item.sourceMeta.rebalanceExecution === false &&
        item.sourceMeta.tradeIntentCreated === false &&
        item.sourceMeta.realOrder === false &&
        item.sourceMeta.brokerageConnection === false &&
        item.sourceMeta.externalPaidApi === false
    ),
    'review calendar fixture keeps mock-only review metadata safety meta'
  );
  assertCondition(
    sampleSql.includes('compliance_reviews') &&
      sampleSql.includes('investment_models') &&
      sampleSql.includes('model_versions') &&
      sampleSql.includes('review_due') &&
      sampleSql.includes('reviewed') &&
      sampleSql.includes('paused') &&
      sampleSql.includes('no legal judgment'),
    'sample SQL documents model review calendar projection'
  );
  assertCondition(
    packageJson.includes(
      '"test:model-review-calendar-read-model": "npx tsx scripts/smoke/model-review-calendar-read-model-smoke.ts"'
    ),
    'package script exposes model review calendar read-model smoke'
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
    assertNotIncludes(source, needle, `review calendar source avoids ${needle}`);
    assertNotIncludes(
      serialized,
      needle,
      `review calendar fixture avoids ${needle}`
    );
    assertNotIncludes(sampleSql, needle, `review calendar sample avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
