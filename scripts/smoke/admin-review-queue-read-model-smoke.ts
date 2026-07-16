/**
 * Verifies the BK-563 Admin review queue seed/read-model fixture.
 * It does not require legal judgment, final suitability approval, deposits,
 * allocation decisions, TradeIntent rows, orders, brokerage accounts, real
 * account data, live data, or paid APIs.
 */

import fs from 'fs';
import path from 'path';

import {
  adminReviewQueueSeedFixture,
  readAdminReviewQueueSeedFixture
} from '../../lib/db/admin-review-queue-read-model';

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
  const firstRead = await readAdminReviewQueueSeedFixture();
  const secondRead = await readAdminReviewQueueSeedFixture();
  const source = readText('lib/db/admin-review-queue-read-model.ts');
  const seedSql = readText('docs/database/seeds/013_admin_review_queue_seed.sql');
  const sampleSql = readText(
    'docs/database/samples/admin-review-queue-read-model.sample.sql'
  );
  const packageJson = readText('package.json');
  const serialized = JSON.stringify(adminReviewQueueSeedFixture);
  const statuses = new Set(firstRead.map((item) => item.queueStatus));
  const pausedItem = firstRead.find((item) => item.queueStatus === 'paused');
  const rejectedItem = firstRead.find((item) => item.queueStatus === 'rejected');

  assertCondition(
    firstRead.length >= 3 &&
      firstRead.every(
        (item) =>
          item.generatedFrom === 'deterministic_fixture' ||
          item.generatedFrom === 'db_seed_projection'
      ),
    'admin review queue returns deterministic or DB seed items'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'admin review queue fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    statuses.has('pending_review') &&
      statuses.has('rejected') &&
      statuses.has('paused'),
    'admin review queue exposes pending_review, rejected, and paused states'
  );
  assertCondition(
    pausedItem?.modelStatus === 'paused' &&
      pausedItem.complianceReviewStatus !== 'paused',
    'paused queue state is derived from investment_models.status'
  );
  assertCondition(
    rejectedItem?.complianceReviewStatus === 'rejected' &&
      rejectedItem.modelStatus !== 'paused',
    'rejected queue state is derived from compliance_reviews.status'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.reasonPlaceholder.length > 0 &&
        item.safetyLabel.includes('no legal judgment') &&
        item.safetyLabel.includes('no final suitability approval')
    ),
    'admin review queue includes reason placeholders and safety copy'
  );
  assertCondition(
    firstRead.every(
      (item) =>
        item.sourceMeta.mockOnly === true &&
        item.sourceMeta.auditSafeActor === true &&
        item.sourceMeta.reviewMetadataOnly === true &&
        item.sourceMeta.legalJudgment === false &&
        item.sourceMeta.suitabilityApproval === false &&
        item.sourceMeta.finalLegalApproval === false &&
        item.sourceMeta.tradeIntentCreated === false &&
        item.sourceMeta.realOrder === false &&
        item.sourceMeta.brokerageConnection === false &&
        item.sourceMeta.realDeposit === false &&
        item.sourceMeta.externalPaidApi === false
    ),
    'admin review queue keeps mock-only review metadata safety meta'
  );
  assertCondition(
    seedSql.includes('013_admin_review_queue_seed') &&
      seedSql.includes('model_admin_review_pending_001') &&
      seedSql.includes('model_admin_review_rejected_001') &&
      seedSql.includes('model_admin_review_paused_001') &&
      seedSql.includes("'metadata_only'") &&
      seedSql.includes('requires_legal_review') &&
      seedSql.includes('no legal judgment'),
    'admin review queue seed documents the three sample rows and safety copy'
  );
  assertCondition(
    sampleSql.includes("WHEN im.status = 'paused' THEN 'paused'") &&
      sampleSql.includes("WHEN cr.status = 'rejected' THEN 'rejected'") &&
      sampleSql.includes("ELSE 'pending_review'") &&
      sampleSql.includes('no legal judgment'),
    'sample SQL documents the derived admin review queue projection'
  );
  assertCondition(
    packageJson.includes(
      '"test:admin-review-queue-read-model": "npx tsx scripts/smoke/admin-review-queue-read-model-smoke.ts"'
    ),
    'package script exposes admin review queue read-model smoke'
  );

  [
    'mock_deposits',
    'portfolios',
    'portfolio_positions',
    'allocation_decisions',
    'trade_intents',
    'broker_account',
    'brokerAccount',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'brokerOrder',
    'orderExecution',
    'tradeFill',
    'publish_live',
    'liveQuoteProvider',
    'externalApiKey',
    'STRIPE_SECRET_KEY',
    'legalApproved',
    'suitabilityApproved'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `admin review source avoids ${needle}`);
    assertNotIncludes(
      serialized,
      needle,
      `admin review fixture avoids ${needle}`
    );
    assertNotIncludes(seedSql, needle, `admin review seed avoids ${needle}`);
    assertNotIncludes(sampleSql, needle, `admin review sample avoids ${needle}`);
  });

  assertCondition(
    !seedSql.includes("im.status = 'rejected'") &&
      !seedSql.includes("'model_admin_review_rejected_001',\n  @seed_creator_id,\n  'admin-review-rejected-sample',\n  'Admin Rejected Sample',\n  'rejected'"),
    'rejected queue row avoids unsupported investment_models.status rejected'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
