/**
 * Verifies GET /api/admin/reviews/queue for BK-564.
 * The route is read-only admin review metadata and never finalizes legal copy,
 * approves suitability, changes model state, creates deposits, creates
 * TradeIntent rows, places orders, or connects brokerage accounts.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import { GET as GET_ADMIN_REVIEW_QUEUE } from '../../app/api/admin/reviews/queue/route';

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

function assertSafeMeta(meta: Record<string, unknown>) {
  assertCondition(
    meta.routeStatus === 'fixture_or_db_seed_projection' &&
      meta.contract === 'AdminReviewQueueDto' &&
      Array.isArray(meta.sourceTables) &&
      meta.sourceTables.includes('investment_models') &&
      meta.sourceTables.includes('model_versions') &&
      meta.sourceTables.includes('model_creators') &&
      meta.sourceTables.includes('compliance_reviews') &&
      meta.adminOnly === true &&
      meta.readOnly === true &&
      meta.mockOnly === true &&
      meta.auditSafeActor === true &&
      meta.reviewMetadataOnly === true &&
      meta.legalJudgment === false &&
      meta.suitabilityApproval === false &&
      meta.finalLegalApproval === false &&
      meta.modelStatusChanged === false &&
      meta.disclosureFinalized === false &&
      meta.modelExecution === false &&
      meta.modelSelectionCreated === false &&
      meta.realTrading === false &&
      meta.realOrderCancellation === false &&
      meta.realFundsMovement === false &&
      meta.sendsRealPush === false &&
      meta.sendsRealEmail === false &&
      meta.sendsRealSms === false &&
      meta.tradeIntentCreated === false &&
      meta.realOrder === false &&
      meta.brokerageConnection === false &&
      meta.realDeposit === false &&
      meta.externalPaidApi === false &&
      meta.financialAdvice === false,
    'admin review queue API keeps admin-only read-only safety meta'
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
    'suitabilityApprovalId',
    'modelExecutionId',
    'externalApiKey'
  ].forEach((needle) => {
    assertCondition(!serialized.includes(needle), `${context} avoids ${needle}`);
  });
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const publicResponse = await queueRequest('public');
    const userResponse = await queueRequest('user');
    const creatorResponse = await queueRequest('creator');
    const systemResponse = await queueRequest('system');
    const listResponse = await queueRequest();
    const listJson = await listResponse.json();
    const pausedResponse = await queueRequest('admin', '?status=paused');
    const pausedJson = await pausedResponse.json();
    const unknownFilterResponse = await queueRequest(
      'admin',
      '?status=approved'
    );
    const unknownFilterJson = await unknownFilterResponse.json();
    const routeSource = readText('app/api/admin/reviews/queue/route.ts');
    const readModelSource = readText('lib/db/admin-review-queue-read-model.ts');
    const packageJson = readText('package.json');

    assertCondition(publicResponse.status === 403, 'public role is forbidden');
    assertCondition(userResponse.status === 403, 'user role is forbidden');
    assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
    assertCondition(systemResponse.status === 403, 'system role is forbidden');
    assertCondition(listResponse.status === 200, 'admin role can read review queue');
    assertCondition(
      listJson.ok === true &&
        Array.isArray(listJson.data?.items) &&
        listJson.data.items.length >= 3 &&
        listJson.data.items.every(
          (item: {
            reviewPublicId?: string;
            modelPublicId?: string;
            modelVersionPublicId?: string;
            queueStatus?: string;
            sourceMeta?: Record<string, unknown>;
          }) =>
            item.reviewPublicId?.startsWith('admin_review_queue_') &&
            typeof item.modelPublicId === 'string' &&
            typeof item.modelVersionPublicId === 'string' &&
            ['pending_review', 'rejected', 'paused'].includes(
              item.queueStatus ?? ''
            ) &&
            item.sourceMeta?.reviewMetadataOnly === true &&
            item.sourceMeta?.legalJudgment === false &&
            item.sourceMeta?.suitabilityApproval === false &&
            item.sourceMeta?.finalLegalApproval === false
        ),
      'admin review queue API exposes public ids and review metadata only'
    );
    assertCondition(
      listJson.data.groups.pendingReview.length >= 1 &&
        listJson.data.groups.rejected.length >= 1 &&
        listJson.data.groups.paused.length >= 1,
      'admin review queue API groups pending, rejected, and paused states'
    );
    assertCondition(
      listJson.meta?.statusCounts?.pending_review >= 1 &&
        listJson.meta?.statusCounts?.rejected >= 1 &&
        listJson.meta?.statusCounts?.paused >= 1,
      'admin review queue API counts all queue states'
    );
    assertSafeMeta(listJson.meta);
    assertNoExecutionCapableFields(listJson, 'admin review queue list payload');

    assertCondition(
      pausedResponse.status === 200 &&
        pausedJson.data.items.length >= 1 &&
        pausedJson.data.items.every(
          (item: { queueStatus?: string; modelStatus?: string }) =>
            item.queueStatus === 'paused' && item.modelStatus === 'paused'
        ) &&
        pausedJson.meta?.requestedStatus === 'paused' &&
        pausedJson.meta?.filtersApplied?.queueStatus === true,
      'status filter returns derived paused queue items'
    );
    assertSafeMeta(pausedJson.meta);
    assertNoExecutionCapableFields(pausedJson, 'admin review queue paused payload');

    assertCondition(
      unknownFilterResponse.status === 200 &&
        unknownFilterJson.ok === true &&
        unknownFilterJson.data.items.length >= 3 &&
        unknownFilterJson.meta?.requestedStatus === null &&
        unknownFilterJson.meta?.filtersApplied?.queueStatus === false,
      'unknown status filter falls back to the full safe queue'
    );

    assertCondition(
      packageJson.includes(
        '"test:admin-review-queue-api": "npx tsx scripts/smoke/admin-review-queue-api-smoke.ts"'
      ),
      'package script exposes admin review queue API smoke'
    );

    [
      'POST(',
      'PUT(',
      'PATCH(',
      'DELETE(',
      'buildAdminModelReviewResult',
      'buildAdminForceStopResult',
      'markNotification',
      'sendPush',
      'sendEmail',
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
      assertNotIncludes(routeSource, needle, `admin review API route avoids ${needle}`);
      assertNotIncludes(
        readModelSource,
        needle,
        `admin review queue read model avoids ${needle}`
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
