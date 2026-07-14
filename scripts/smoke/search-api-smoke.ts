/**
 * This smoke test verifies GET /api/search grouped read results.
 * It reads model discovery entries plus DB-backed FeedPost and SignalEvent rows,
 * and never creates recommendations, model selections, orders, or brokerage actions.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/search/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function readSearch(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/search${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function main() {
  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/search', {
      method: 'GET'
    })
  );
  const creatorResponse = await GET(
    new NextRequest('http://localhost/api/search', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'creator'
      }
    })
  );
  const emptyQueryResponse = await readSearch();
  const emptyQueryJson = await emptyQueryResponse.json();
  const focusedResponse = await readSearch('?q=income');
  const focusedJson = await focusedResponse.json();
  const invalidResponse = await readSearch(`?q=${'x'.repeat(121)}`);

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(emptyQueryResponse.status === 200, 'empty search responds');
  assertCondition(
    Array.isArray(emptyQueryJson.data?.investmentModels) &&
      Array.isArray(emptyQueryJson.data?.feedPosts) &&
      Array.isArray(emptyQueryJson.data?.signalEvents),
    'search returns grouped result arrays'
  );
  assertCondition(
    emptyQueryJson.data.investmentModels.every(
      (model: { modelId?: string; id?: number; href?: string }) =>
        typeof model.modelId === 'string' &&
        model.id === undefined &&
        typeof model.href === 'string'
    ),
    'investment model search results expose public model ids only'
  );
  assertCondition(
    emptyQueryJson.meta?.routeStatus === 'db_backed' &&
      emptyQueryJson.meta?.readOnly === true &&
      emptyQueryJson.meta?.realtimeExternalData === false &&
      emptyQueryJson.meta?.financialAdvice === false &&
      emptyQueryJson.meta?.modelSelectionCreated === false &&
      emptyQueryJson.meta?.tradeIntentCreated === false &&
      emptyQueryJson.meta?.realOrder === false &&
      emptyQueryJson.meta?.brokerageConnection === false,
    'search keeps mock-safe API meta'
  );
  assertCondition(focusedResponse.status === 200, 'focused search responds');
  assertCondition(
    focusedJson.meta?.query === 'income' &&
      typeof focusedJson.meta?.counts?.investmentModels === 'number',
    'focused search returns query and counts'
  );
  assertCondition(invalidResponse.status === 422, 'long q returns validation error');

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
