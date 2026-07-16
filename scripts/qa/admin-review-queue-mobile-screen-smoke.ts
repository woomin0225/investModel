/**
 * Verifies the BK-566 mobile admin review queue smoke coverage.
 * The screen renders read-only admin review queue metadata only; it does not
 * finalize legal copy, approve suitability, publish models, create deposits,
 * create TradeIntent rows, place orders, or connect brokerage accounts.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import { GET as GET_ADMIN_REVIEW_QUEUE } from '../../app/api/admin/reviews/queue/route';

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

function assertNoUnsafeInteractiveCta(source: string) {
  const unsafeCtaPattern =
    /(<button|<Link|role="button"|href=|onClick|formAction)[\s\S]{0,240}(Approve|Publish live|Finalize|Place order|Deposit now|Connect brokerage|Submit order|Execute trade|Start trading|Invest now)[\s\S]{0,240}/i;

  assertCondition(
    !unsafeCtaPattern.test(source),
    'mobile queue page avoids unsafe interactive approval/order/deposit/brokerage CTAs'
  );
}

function queueRequest(role = 'admin', search = '') {
  return GET_ADMIN_REVIEW_QUEUE(
    new NextRequest(`http://localhost/api/admin/reviews/queue${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    })
  );
}

function assertAdminQueueSafetyMeta(meta: Record<string, unknown>) {
  assertCondition(
    meta.adminOnly === true &&
      meta.readOnly === true &&
      meta.mockOnly === true &&
      meta.reviewMetadataOnly === true &&
      meta.legalJudgment === false &&
      meta.suitabilityApproval === false &&
      meta.finalLegalApproval === false &&
      meta.modelStatusChanged === false &&
      meta.disclosureFinalized === false &&
      meta.modelExecution === false &&
      meta.modelSelectionCreated === false &&
      meta.realTrading === false &&
      meta.realFundsMovement === false &&
      meta.tradeIntentCreated === false &&
      meta.realOrder === false &&
      meta.brokerageConnection === false &&
      meta.realDeposit === false &&
      meta.externalPaidApi === false &&
      meta.financialAdvice === false,
    'admin review queue API keeps metadata-only safety meta'
  );
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const pageSource = readText('app/invest-model/admin/reviews/page.tsx');
    const packageJson = readText('package.json');
    const items = await readAdminReviewQueueSeedFixture();
    const statuses = new Set(items.map((item) => item.queueStatus));
    const forbiddenResponses = await Promise.all(
      ['public', 'user', 'creator', 'system'].map((role) => queueRequest(role))
    );
    const listResponse = await queueRequest();
    const listJson = await listResponse.json();
    const pendingResponse = await queueRequest('admin', '?status=pending_review');
    const pendingJson = await pendingResponse.json();
    const rejectedResponse = await queueRequest('admin', '?status=rejected');
    const rejectedJson = await rejectedResponse.json();
    const pausedResponse = await queueRequest('admin', '?status=paused');
    const pausedJson = await pausedResponse.json();
    const unknownFilterResponse = await queueRequest('admin', '?status=approved');
    const unknownFilterJson = await unknownFilterResponse.json();

    assertCondition(items.length >= 3, 'screen fixture has queue rows');
    assertCondition(
      statuses.has('pending_review') &&
        statuses.has('rejected') &&
        statuses.has('paused'),
      'screen fixture includes pending, rejected, and paused states'
    );
    assertCondition(
      forbiddenResponses.every((response) => response.status === 403),
      'non-admin roles are forbidden from admin review queue API'
    );
    assertCondition(listResponse.status === 200, 'admin role can read queue API');
    assertCondition(
      listJson.ok === true &&
        Array.isArray(listJson.data?.items) &&
        listJson.data.items.length >= 3 &&
        listJson.meta?.statusCounts?.pending_review >= 1 &&
        listJson.meta?.statusCounts?.rejected >= 1 &&
        listJson.meta?.statusCounts?.paused >= 1,
      'admin queue API returns grouped pending, rejected, and paused metadata'
    );
    assertAdminQueueSafetyMeta(listJson.meta);

    const filteredCases = [
      { response: pendingResponse, json: pendingJson, status: 'pending_review' },
      { response: rejectedResponse, json: rejectedJson, status: 'rejected' },
      { response: pausedResponse, json: pausedJson, status: 'paused' }
    ];

    filteredCases.forEach(({ response, json, status }) => {
      assertCondition(
        response.status === 200 &&
          json.ok === true &&
          json.data.items.length >= 1 &&
          json.data.items.every(
            (item: { queueStatus?: string }) => item.queueStatus === status
          ) &&
          json.meta?.requestedStatus === status &&
          json.meta?.filtersApplied?.queueStatus === true,
        `admin queue API status filter returns ${status} metadata only`
      );
      assertAdminQueueSafetyMeta(json.meta);
    });
    assertCondition(
      unknownFilterResponse.status === 200 &&
        unknownFilterJson.ok === true &&
        unknownFilterJson.data.items.length >= 3 &&
        unknownFilterJson.meta?.requestedStatus === null &&
        unknownFilterJson.meta?.filtersApplied?.queueStatus === false,
      'unknown queue status filter falls back to full safe queue'
    );
    assertAdminQueueSafetyMeta(unknownFilterJson.meta);

    [
      'readAdminReviewQueueSeedFixture',
      'AdminReviewQueueItem',
      'AdminReviewQueueStatus',
      'MobileFilterRail',
      'min-h-invest-touch-target',
      'min-w-0',
      'truncate',
      'flex-wrap',
      'break-words',
      '[overflow-wrap:anywhere]',
      'grid gap-3',
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

    assertCondition(
      items.every(
        (item) =>
          item.reviewPublicId.length <= 42 &&
          item.modelPublicId.length <= 42 &&
          item.modelVersionPublicId.length <= 42
      ),
      'fixture public ids fit 390px cards without forced overflow'
    );
    assertNoUnsafeInteractiveCta(pageSource);

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
