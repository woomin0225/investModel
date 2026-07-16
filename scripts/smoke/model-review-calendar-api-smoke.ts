/**
 * Verifies GET /api/models/review-calendar and detail reads.
 * It reads BK-521 seed projections only and never calls live review systems,
 * paid APIs, broker accounts, TradeIntent creation, orders, legal judgment, or advice paths.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import { GET as getReviewCalendarDetail } from '../../app/api/models/review-calendar/[reviewPublicId]/route';
import { GET as getReviewCalendar } from '../../app/api/models/review-calendar/route';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function calendarRequest(role = 'user') {
  return new NextRequest('http://localhost/api/models/review-calendar', {
    method: 'GET',
    headers: {
      'x-invest-model-role': role
    }
  });
}

function calendarDetailRequest(reviewPublicId: string, role = 'user') {
  return getReviewCalendarDetail(
    new NextRequest(
      `http://localhost/api/models/review-calendar/${reviewPublicId}`,
      {
        method: 'GET',
        headers: {
          'x-invest-model-role': role
        }
      }
    ),
    {
      params: Promise.resolve({ reviewPublicId })
    }
  );
}

function assertReadOnlySafetyMeta(meta: Record<string, unknown>) {
  assertCondition(
    meta.routeStatus === 'fixture_or_db_seed_projection' &&
      meta.contract === 'ModelReviewCalendarDto' &&
      meta.persistence === 'read_only_seed_projection' &&
      Array.isArray(meta.sourceTables) &&
      meta.sourceTables.includes('investment_models') &&
      meta.sourceTables.includes('model_versions') &&
      meta.sourceTables.includes('compliance_reviews') &&
      meta.mockOnly === true &&
      meta.reviewMetadataOnly === true &&
      meta.legalJudgment === false &&
      meta.rebalanceExecution === false &&
      meta.allocationChanged === false &&
      meta.tradeIntentCreated === false &&
      meta.realOrder === false &&
      meta.brokerageConnection === false &&
      meta.externalPaidApi === false &&
      meta.financialAdvice === false,
    'review calendar API keeps read-only mock-safe meta'
  );
}

function assertNoExecutionCapableFields(payload: unknown, context: string) {
  const serialized = JSON.stringify(payload);

  [
    '"id"',
    'orderId',
    'tradeIntentId',
    'brokerageAccountId',
    'brokerAccount',
    'accountNumber',
    'realBalance',
    'legalApprovalId',
    'rebalanceExecutionId',
    'externalApiKey'
  ].forEach((needle) => {
    assertCondition(!serialized.includes(needle), `${context} avoids ${needle}`);
  });
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const forbiddenResponse = await getReviewCalendar(
      new NextRequest('http://localhost/api/models/review-calendar', {
        method: 'GET'
      })
    );
    const creatorResponse = await getReviewCalendar(calendarRequest('creator'));
    const adminResponse = await getReviewCalendar(calendarRequest('admin'));
    const listResponse = await getReviewCalendar(calendarRequest());
    const listJson = await listResponse.json();
    const detailResponse = await calendarDetailRequest(
      'review_calendar_mock_due_001'
    );
    const detailJson = await detailResponse.json();
    const missingResponse = await calendarDetailRequest('missing_review');
    const missingJson = await missingResponse.json();
    const blankResponse = await calendarDetailRequest('   ');
    const routeSource = readText('app/api/models/review-calendar/route.ts');
    const detailSource = readText(
      'app/api/models/review-calendar/[reviewPublicId]/route.ts'
    );
    const packageJson = readText('package.json');

    assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
    assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
    assertCondition(adminResponse.status === 200, 'admin role can read calendar metadata');
    assertCondition(listResponse.status === 200, 'review calendar list responds');
    assertCondition(
      Array.isArray(listJson.data?.upcoming) &&
        listJson.data.upcoming.some(
          (item: { status?: string; reviewPublicId?: string }) =>
            item.status === 'review_due' &&
            item.reviewPublicId === 'review_calendar_mock_due_001'
        ) &&
        Array.isArray(listJson.data?.recent) &&
        listJson.data.recent.some(
          (item: { status?: string }) => item.status === 'reviewed'
        ) &&
        Array.isArray(listJson.data?.paused) &&
        listJson.data.paused.some(
          (item: { status?: string }) => item.status === 'paused'
        ) &&
        Array.isArray(listJson.data?.all) &&
        listJson.data.all.every(
          (item: {
            scheduleSource?: string;
            changeHistory?: unknown[];
            sourceMeta?: Record<string, unknown>;
          }) =>
            item.scheduleSource === 'mock_schedule_seed' &&
            Array.isArray(item.changeHistory) &&
            item.changeHistory.length > 0 &&
            item.sourceMeta?.mockOnly === true &&
            item.sourceMeta?.reviewMetadataOnly === true &&
            item.sourceMeta?.legalJudgment === false &&
            item.sourceMeta?.rebalanceExecution === false &&
            item.sourceMeta?.tradeIntentCreated === false &&
            item.sourceMeta?.realOrder === false &&
            item.sourceMeta?.brokerageConnection === false &&
            item.sourceMeta?.externalPaidApi === false
        ),
      'review calendar list exposes upcoming/recent/paused seed metadata'
    );
    assertReadOnlySafetyMeta(listJson.meta);
    assertCondition(listJson.meta?.emptyState === null, 'non-empty list has null empty state');
    assertCondition(
      listJson.meta?.statusCounts?.review_due === 1 &&
        listJson.meta?.statusCounts?.reviewed === 1 &&
        listJson.meta?.statusCounts?.paused === 1,
      'status counts expose the three review calendar buckets'
    );
    assertCondition(detailResponse.status === 200, 'review calendar detail responds');
    assertCondition(
      detailJson.data?.reviewPublicId === 'review_calendar_mock_due_001' &&
        detailJson.data?.status === 'review_due' &&
        detailJson.data?.sourceMeta?.rebalanceExecution === false,
      'review calendar detail exposes the requested public seed item'
    );
    assertReadOnlySafetyMeta(detailJson.meta);
    assertCondition(
      missingResponse.status === 404 &&
        missingJson.error?.code === 'not_found' &&
        missingJson.error?.message.includes('No live review system'),
      'missing review calendar item returns read-only 404'
    );
    assertCondition(
      blankResponse.status === 422,
      'blank review calendar public id returns validation error'
    );
    assertNoExecutionCapableFields(listJson, 'review calendar list payload');
    assertNoExecutionCapableFields(detailJson, 'review calendar detail payload');
    assertCondition(
      packageJson.includes(
        '"test:model-review-calendar-api": "npx tsx scripts/smoke/model-review-calendar-api-smoke.ts"'
      ),
      'package script exposes model review calendar API smoke'
    );

    [
      'fetch(',
      'axios',
      'liveReviewProvider',
      'externalApiKey',
      'brokerOrder',
      'buySignal',
      'sellSignal',
      'holdRecommendation',
      'Connect brokerage',
      'Place order',
      'Deposit now',
      'Execute rebalance',
      'Legally approved'
    ].forEach((needle) => {
      assertCondition(
        !routeSource.includes(needle) && !detailSource.includes(needle),
        `review calendar routes avoid ${needle}`
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
