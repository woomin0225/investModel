/**
 * Verifies GET /api/my/interest-saves against the BK-525 read-model fixture.
 * It reads private mock user-scoped interest/save state only and never creates
 * model selections, deposits, orders, TradeIntent rows, push delivery, or advice.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import { GET } from '../../app/api/my/interest-saves/route';

const ignoredClientUserPublicId = 'user_other_001';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function interestSaveRequest(pathname = '/api/my/interest-saves', role = 'user') {
  return GET(
    new NextRequest(`http://localhost${pathname}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    })
  );
}

function assertReadOnlySafetyMeta(meta: Record<string, unknown>) {
  assertCondition(
    meta.routeStatus === 'fixture_or_db_seed_projection' &&
      meta.contract === 'InterestSaveStateDto' &&
      meta.persistence === 'read_only_seed_projection' &&
      meta.dataContext === 'mock' &&
      meta.readOnly === true &&
      meta.mockUserScoped === true &&
      meta.privateShortcutOnly === true &&
      meta.modelSelectionSignal === false &&
      meta.allocationSignal === false &&
      meta.depositSignal === false &&
      meta.orderIntentSignal === false &&
      meta.tradeIntentSignal === false &&
      meta.tradeIntentCreated === false &&
      meta.realOrder === false &&
      meta.realDeposit === false &&
      meta.brokerageConnection === false &&
      meta.pushDelivery === false &&
      meta.sendsRealPush === false &&
      meta.deliveryAttempted === false &&
      meta.externalPaidApi === false &&
      meta.financialAdvice === false,
    'interest/save API keeps read-only mock-safe meta'
  );
}

function assertNoRestrictedFields(payload: unknown, context: string) {
  const serialized = JSON.stringify(payload);

  [
    '"id"',
    'user_other_001',
    'modelSelectionId',
    'depositId',
    'orderId',
    'tradeIntentId',
    'brokerageAccountId',
    'accountNumber',
    'realBalance',
    'externalApiKey'
  ].forEach((needle) => {
    assertCondition(!serialized.includes(needle), `${context} avoids ${needle}`);
  });
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const forbiddenResponse = await GET(
      new NextRequest('http://localhost/api/my/interest-saves', {
        method: 'GET'
      })
    );
    const creatorResponse = await interestSaveRequest(
      '/api/my/interest-saves',
      'creator'
    );
    const systemResponse = await interestSaveRequest(
      '/api/my/interest-saves',
      'system'
    );
    const adminResponse = await interestSaveRequest(
      '/api/my/interest-saves',
      'admin'
    );
    const userResponse = await interestSaveRequest(
      `/api/my/interest-saves?userPublicId=${ignoredClientUserPublicId}`
    );
    const userJson = await userResponse.json();
    const signalResponse = await interestSaveRequest(
      '/api/my/interest-saves?itemType=signal_event'
    );
    const signalJson = await signalResponse.json();
    const itemPublicIdResponse = await interestSaveRequest(
      '/api/my/interest-saves?itemPublicId=model_mock_signal_observer'
    );
    const itemPublicIdJson = await itemPublicIdResponse.json();
    const limitResponse = await interestSaveRequest(
      '/api/my/interest-saves?limit=1'
    );
    const limitJson = await limitResponse.json();
    const invalidLimitResponse = await interestSaveRequest(
      '/api/my/interest-saves?limit=abc'
    );
    const invalidTypeResponse = await interestSaveRequest(
      '/api/my/interest-saves?itemType=order'
    );
    const invalidTypeJson = await invalidTypeResponse.json();
    const routeSource = readText('app/api/my/interest-saves/route.ts');
    const packageJson = readText('package.json');

    assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
    assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
    assertCondition(systemResponse.status === 403, 'system role is forbidden');
    assertCondition(adminResponse.status === 200, 'admin role can read interest/save state');
    assertCondition(userResponse.status === 200, 'user role can read interest/save state');
    assertCondition(
      Array.isArray(userJson.data?.items) &&
        userJson.data.items.length >= 3 &&
        userJson.data.items.every(
          (item: {
            userPublicId?: string;
            interestSavePublicId?: string;
            sourceMeta?: Record<string, unknown>;
          }) =>
            item.userPublicId === 'user_demo_001' &&
            typeof item.interestSavePublicId === 'string' &&
            item.sourceMeta?.mockUserScoped === true &&
            item.sourceMeta?.privateShortcutOnly === true &&
            item.sourceMeta?.modelSelectionSignal === false &&
            item.sourceMeta?.realOrder === false &&
            item.sourceMeta?.realDeposit === false &&
            item.sourceMeta?.tradeIntentCreated === false
        ),
      'interest/save list exposes public mock user-scoped DTOs'
    );
    assertCondition(
      userJson.data?.userPublicId === 'user_demo_001' &&
        userJson.meta?.userPublicId === 'user_demo_001' &&
        userJson.meta?.userScopeSource === 'demo_fallback' &&
        userJson.meta?.clientUserPublicIdIgnored === undefined,
      'client userPublicId query is ignored without compatibility meta'
    );
    assertReadOnlySafetyMeta(userJson.meta);
    assertNoRestrictedFields(userJson, 'interest/save list payload');
    assertCondition(
      signalResponse.status === 200 &&
        signalJson.meta?.itemTypeFilter === 'signal_event' &&
        signalJson.data?.items.length === 1 &&
        signalJson.data.items.every(
          (item: { itemType?: string }) => item.itemType === 'signal_event'
        ),
      'itemType filter returns only signal events'
    );
    assertReadOnlySafetyMeta(signalJson.meta);
    assertCondition(
      itemPublicIdResponse.status === 200 &&
        itemPublicIdJson.meta?.itemPublicIdFilter === 'model_mock_signal_observer' &&
        itemPublicIdJson.data?.items.length === 1 &&
        itemPublicIdJson.data.items[0]?.itemPublicId ===
          'model_mock_signal_observer',
      'itemPublicId filter returns exact public item match'
    );
    assertCondition(
      limitResponse.status === 200 && limitJson.data?.items.length === 1,
      'limit query clamps and slices interest/save items'
    );
    assertCondition(
      invalidLimitResponse.status === 422,
      'invalid limit returns validation error'
    );
    assertCondition(
      invalidTypeResponse.status === 422 &&
        invalidTypeJson.error?.code === 'validation_error',
      'invalid itemType returns validation error'
    );
    assertCondition(
      packageJson.includes(
        '"test:interest-save-api": "npx tsx scripts/smoke/interest-save-api-smoke.ts"'
      ),
      'package script exposes interest/save API smoke'
    );

    [
      'fetch(',
      'axios',
      'externalApiKey',
      'brokerOrder',
      'buySignal',
      'sellSignal',
      'holdRecommendation',
      'Connect brokerage',
      'Place order',
      'Deposit now',
      'Execute rebalance'
    ].forEach((needle) => {
      assertCondition(!routeSource.includes(needle), `route avoids ${needle}`);
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
