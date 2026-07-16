/**
 * Verifies the BK-565 mobile admin review queue screen.
 * The screen renders read-only admin review queue metadata only; it does not
 * finalize legal copy, approve suitability, publish models, create deposits,
 * create TradeIntent rows, place orders, or connect brokerage accounts.
 */

import fs from 'fs';
import path from 'path';

import {
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

function assertIncludes(text: string, needle: string, message: string) {
  assertCondition(text.includes(needle), message);
}

function assertNotIncludes(text: string, needle: string, message: string) {
  assertCondition(!text.includes(needle), message);
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const pageSource = readText('app/invest-model/admin/reviews/page.tsx');
    const packageJson = readText('package.json');
    const items = await readAdminReviewQueueSeedFixture();
    const statuses = new Set(items.map((item) => item.queueStatus));

    assertCondition(items.length >= 3, 'screen fixture has queue rows');
    assertCondition(
      statuses.has('pending_review') &&
        statuses.has('rejected') &&
        statuses.has('paused'),
      'screen fixture includes pending, rejected, and paused states'
    );

    [
      'readAdminReviewQueueSeedFixture',
      'AdminReviewQueueItem',
      'AdminReviewQueueStatus',
      'MobileFilterRail',
      'min-h-invest-touch-target',
      'data-review-public-id',
      'data-review-metadata-only',
      'data-legal-judgment',
      'data-suitability-approval',
      'reviewPublicId',
      'modelPublicId',
      'modelVersionPublicId',
      'queueStatus',
      'modelStatus',
      'complianceReviewStatus',
      'reviewType',
      'submittedAt',
      'reviewedAt',
      'actorLabel',
      'reasonPlaceholder',
      'safetyLabel',
      'sourceMeta',
      '/api/admin/reviews/queue',
      'No legal judgment',
      'final suitability approval',
      'broker connection',
      'deposit movement',
      'TradeIntent'
    ].forEach((needle) => {
      assertIncludes(pageSource, needle, `mobile queue page renders ${needle}`);
    });

    [
      "id: 'all'",
      "id: 'pending_review'",
      "id: 'rejected'",
      "id: 'paused'",
      'status=${filterId}',
      'basePath.includes'
    ].forEach((needle) => {
      assertIncludes(pageSource, needle, `mobile queue filter includes ${needle}`);
    });

    [
      'pendingAdminReviewModels',
      'MockAdminReviewModel',
      'getPendingAdminReviewModelById',
      '`/invest-model/admin/reviews/${',
      'buildAdminModelReviewResult',
      'adminModelReviewRequestSchema',
      'publish_live',
      'legalApproved',
      'suitabilityApproved',
      'legalApprovalId',
      'suitabilityApprovalId',
      'brokerOrder',
      'orderExecution',
      'tradeFill',
      'liveQuoteProvider',
      'externalApiKey',
      'Connect brokerage',
      'Place order',
      'Deposit now'
    ].forEach((needle) => {
      assertNotIncludes(pageSource, needle, `mobile queue page avoids ${needle}`);
    });

    assertIncludes(
      packageJson,
      '"test:admin-review-queue-mobile-screen": "npx tsx scripts/qa/admin-review-queue-mobile-screen-smoke.ts"',
      'package script exposes admin review queue mobile screen smoke'
    );

    console.log(
      JSON.stringify(
        {
          status: 'pass',
          screen: 'admin-review-queue-mobile',
          checked: {
            itemCount: items.length,
            statuses: Array.from(statuses).sort(),
            mobileFilterRail: true,
            touchTarget: true,
            metadataOnly: true,
            apiContractPathMentioned: true
          }
        },
        null,
        2
      )
    );
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
