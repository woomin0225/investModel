/**
 * This smoke test verifies GET /api/models and GET /api/models/[modelId]
 * against tracked seed data. It applies docs/database/seeds/003_signal_event_seed.sql
 * as a whole file and reads public marketplace Model DTOs only.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET as GET_MODEL_DETAIL } from '../../app/api/models/[modelId]/route';
import { GET as GET_MODELS } from '../../app/api/models/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedModelSeed() {
  const seedPath = path.resolve(
    'docs/database/seeds/003_signal_event_seed.sql'
  );
  const sql = fs.readFileSync(seedPath, 'utf8');
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();
}

async function main() {
  await applyTrackedModelSeed();

  const listResponse = await GET_MODELS(
    new NextRequest('http://localhost/api/models?limit=1', {
      method: 'GET'
    })
  );
  const listJson = await listResponse.json();

  assertCondition(listResponse.status === 200, 'model list responds');
  assertCondition(
    Array.isArray(listJson.data) && listJson.data.length === 1,
    'model list respects limit'
  );

  const model = listJson.data[0];

  assertCondition(
    typeof model.modelPublicId === 'string' &&
      typeof model.slug === 'string' &&
      model.id === undefined,
    'model list exposes public identifiers only'
  );
  assertCondition(
    model.status === 'approved' || model.status === 'live',
    'model list exposes visible marketplace statuses only'
  );
  assertCondition(
    listJson.meta?.routeStatus === 'db_backed' &&
      listJson.meta?.financialAdvice === false &&
      listJson.meta?.modelSelectionCreated === false &&
      listJson.meta?.tradeIntentCreated === false &&
      listJson.meta?.realOrder === false &&
      listJson.meta?.brokerageConnection === false,
    'model list keeps safe API meta'
  );

  const searchTerm = model.name.split(/\s+/)[0];
  const searchResponse = await GET_MODELS(
    new NextRequest(
      `http://localhost/api/models?limit=10&q=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET'
      }
    )
  );
  const searchJson = await searchResponse.json();

  assertCondition(searchResponse.status === 200, 'model search responds');
  assertCondition(
    searchJson.meta?.q === searchTerm &&
      searchJson.meta?.filtersApplied?.search === true,
    'model search reports applied q filter'
  );
  assertCondition(
    Array.isArray(searchJson.data) &&
      searchJson.data.some(
        (searchModel: { modelPublicId?: string }) =>
          searchModel.modelPublicId === model.modelPublicId
      ),
    'model search returns the matching seeded model'
  );

  const emptySearchResponse = await GET_MODELS(
    new NextRequest('http://localhost/api/models?limit=10&q=no-such-model-xyz', {
      method: 'GET'
    })
  );
  const emptySearchJson = await emptySearchResponse.json();

  assertCondition(
    emptySearchResponse.status === 200 &&
      Array.isArray(emptySearchJson.data) &&
      emptySearchJson.data.length === 0,
    'model search returns an empty list for unmatched q without falling back'
  );

  const detailResponse = await GET_MODEL_DETAIL(
    new NextRequest(`http://localhost/api/models/${model.slug}`, {
      method: 'GET'
    }),
    {
      params: Promise.resolve({
        modelId: model.slug
      })
    }
  );
  const detailJson = await detailResponse.json();

  assertCondition(detailResponse.status === 200, 'model detail responds');
  assertCondition(
    detailJson.data?.modelPublicId === model.modelPublicId &&
      detailJson.data?.id === undefined,
    'model detail exposes matching public model without internal id'
  );
  assertCondition(
    detailJson.data?.mandate?.userOverrideAllowed === false,
    'model detail defaults user override to false without user-managed mandate'
  );
  assertCondition(
    Array.isArray(detailJson.data?.notices) &&
      detailJson.data.notices.some(
        (notice: { code?: string }) =>
          notice.code === 'backtest_not_future_return'
      ),
    'model detail includes backtest performance warning'
  );
  assertCondition(
    detailJson.meta?.financialAdvice === false &&
      detailJson.meta?.modelSelectionCreated === false &&
      detailJson.meta?.realOrder === false,
    'model detail keeps safe API meta'
  );

  const missingResponse = await GET_MODEL_DETAIL(
    new NextRequest('http://localhost/api/models/missing-model', {
      method: 'GET'
    }),
    {
      params: Promise.resolve({
        modelId: 'missing-model'
      })
    }
  );

  assertCondition(missingResponse.status === 404, 'missing model returns 404');

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
