/**
 * This smoke test verifies GET /api/signals/[signalId] against tracked seed data.
 * It reads one observed SignalEvent DTO by public id and never mutates orders,
 * funds, broker connections, TradeIntent rows, or portfolio allocations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/signals/[signalId]/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedSignalSeed() {
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

function detailRequest(signalId: string, role = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/signals/${signalId}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    }),
    {
      params: Promise.resolve({ signalId })
    }
  );
}

async function main() {
  await applyTrackedSignalSeed();

  const forbiddenResponse = await GET(
    new NextRequest(
      'http://localhost/api/signals/sig_mock_news_traffic_001',
      { method: 'GET' }
    ),
    {
      params: Promise.resolve({ signalId: 'sig_mock_news_traffic_001' })
    }
  );
  const notFoundResponse = await detailRequest('sig_mock_missing');
  const detailResponse = await detailRequest('sig_mock_news_traffic_001');
  const detailJson = await detailResponse.json();

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(notFoundResponse.status === 404, 'missing signal is 404');
  assertCondition(detailResponse.status === 200, 'signal detail responds');
  assertCondition(
    detailJson.data?.signalPublicId === 'sig_mock_news_traffic_001' &&
      detailJson.data?.id === undefined &&
      detailJson.data?.signalType === 'news_traffic' &&
      typeof detailJson.data?.score === 'number',
    'signal detail exposes public id and observed fields only'
  );
  assertCondition(
    detailJson.meta?.routeStatus === 'db_backed' &&
      detailJson.meta?.realtimeExternalData === false &&
      detailJson.meta?.tradeIntentCreated === false &&
      detailJson.meta?.realOrder === false &&
      detailJson.meta?.brokerageConnection === false &&
      detailJson.meta?.financialAdvice === false,
    'signal detail keeps mock-safe API meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
