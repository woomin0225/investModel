/**
 * Verifies GET /api/watchlist/mock-summary.
 * It reads deterministic seed data only and never creates advice, orders,
 * TradeIntent rows, deposits, broker links, or external paid API calls.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/watchlist/mock-summary/route';
import { client } from '../../lib/db/drizzle';
import type { AccessRole } from '../../lib/domain/types';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function readWatchlist(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/watchlist/mock-summary${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    })
  );
}

function assertNoForbiddenFields(payload: unknown) {
  const serialized = JSON.stringify(payload);

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
    'realBalance'
  ].forEach((needle) => {
    assertCondition(
      !serialized.includes(needle),
      `watchlist API payload avoids ${needle}`
    );
  });
}

async function main() {
  const publicResponse = await GET(
    new NextRequest('http://localhost/api/watchlist/mock-summary', {
      method: 'GET'
    })
  );
  const creatorResponse = await readWatchlist('', 'creator');
  const systemResponse = await readWatchlist('', 'system');
  const invalidLimitResponse = await readWatchlist('?limit=7');
  const successResponse = await readWatchlist();
  const successJson = await successResponse.json();
  const limitedResponse = await readWatchlist('?limit=2', 'admin');
  const limitedJson = await limitedResponse.json();

  assertCondition(publicResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(systemResponse.status === 403, 'system role is forbidden');
  assertCondition(
    invalidLimitResponse.status === 422,
    'invalid watchlist limit is rejected'
  );
  assertCondition(successResponse.status === 200, 'watchlist API responds');
  assertCondition(limitedResponse.status === 200, 'admin role can read watchlist');
  assertCondition(
    successJson.data?.generatedFrom === 'deterministic_fixture' ||
      successJson.data?.generatedFrom === 'db_seed_projection',
    'watchlist API reports seed source'
  );
  assertCondition(
    Array.isArray(successJson.data?.items) &&
      successJson.data.items.length >= 3 &&
      successJson.data.items.some(
        (item: { sourcePublicId?: string }) =>
          item.sourcePublicId === 'sig_mock_news_traffic_001'
      ),
    'watchlist API exposes deterministic SignalEvent seed payload'
  );
  assertCondition(
    successJson.data.items.every(
      (item: {
        seedSourceLabel?: string;
        statusLabel?: string;
        safetyMeta?: {
          mockOnly?: boolean;
          simulated?: boolean;
          liveMarketData?: boolean;
          externalPaidApi?: boolean;
          brokerageConnection?: boolean;
          realDeposit?: boolean;
          financialAdvice?: boolean;
        };
      }) =>
        item.seedSourceLabel === 'mock_seed' &&
        Boolean(item.statusLabel) &&
        item.safetyMeta?.mockOnly === true &&
        item.safetyMeta?.simulated === true &&
        item.safetyMeta?.liveMarketData === false &&
        item.safetyMeta?.externalPaidApi === false &&
        item.safetyMeta?.brokerageConnection === false &&
        item.safetyMeta?.realDeposit === false &&
        item.safetyMeta?.financialAdvice === false
    ),
    'watchlist item DTOs keep mock-safe safety meta'
  );
  assertCondition(
    successJson.meta?.routeStatus === 'db_backed' &&
      successJson.meta?.persistence === 'persisted_or_mock_safe_fallback' &&
      successJson.meta?.userPublicId === 'user_demo_001' &&
      successJson.meta?.userScopeSource === 'demo_fallback' &&
      successJson.meta?.readOnly === true &&
      successJson.meta?.mockOnly === true &&
      successJson.meta?.simulated === true &&
      successJson.meta?.liveMarketData === false &&
      successJson.meta?.realtimeExternalData === false &&
      successJson.meta?.externalPaidApi === false &&
      successJson.meta?.financialAdvice === false &&
      successJson.meta?.tradeIntentCreated === false &&
      successJson.meta?.realDeposit === false &&
      successJson.meta?.realOrder === false &&
      successJson.meta?.brokerageConnection === false &&
      successJson.meta?.accountLinking === false,
    'watchlist API meta blocks real-finance side effects'
  );
  assertCondition(
    Array.isArray(limitedJson.data?.items) &&
      limitedJson.data.items.length === 2 &&
      limitedJson.meta?.limit === 2,
    'watchlist API applies bounded limit'
  );

  assertNoForbiddenFields(successJson);
  assertNoForbiddenFields(limitedJson);

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
