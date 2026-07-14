/**
 * This smoke test verifies GET /api/signals against tracked seed data.
 * It applies docs/database/seeds/003_signal_event_seed.sql as a whole file
 * and reads only observed SignalEvent DTOs. It never mutates orders, funds,
 * broker connections, TradeIntent rows, or portfolio allocations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/signals/route';
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

async function readSignals(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/signals${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function main() {
  await applyTrackedSignalSeed();

  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/signals', {
      method: 'GET'
    })
  );
  const listResponse = await readSignals('?limit=2');
  const listJson = await listResponse.json();
  const filteredResponse = await readSignals('?signalType=news_traffic&limit=10');
  const filteredJson = await filteredResponse.json();
  const riskAliasResponse = await readSignals('?signalType=risk_alert&limit=10');
  const riskAliasJson = await riskAliasResponse.json();
  const invalidResponse = await readSignals('?signalType=buy_signal');

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(listResponse.status === 200, 'signal list responds');
  assertCondition(
    Array.isArray(listJson.data) && listJson.data.length === 2,
    'signal list respects limit'
  );
  assertCondition(
    listJson.data.every(
      (signal: { signalPublicId?: string; id?: number; score?: number }) => {
        return (
          typeof signal.signalPublicId === 'string' &&
          signal.id === undefined &&
          typeof signal.score === 'number'
        );
      }
    ),
    'signal list exposes public ids and numeric scores only'
  );
  assertCondition(
    listJson.meta?.routeStatus === 'db_backed' &&
      listJson.meta?.realtimeExternalData === false &&
      listJson.meta?.tradeIntentCreated === false &&
      listJson.meta?.realOrder === false &&
      listJson.meta?.brokerageConnection === false &&
      listJson.meta?.financialAdvice === false,
    'signal list keeps mock-safe API meta'
  );
  assertCondition(
    filteredResponse.status === 200 &&
      filteredJson.data.length === 1 &&
      filteredJson.data[0].signalType === 'news_traffic',
    'signalType filter returns news_traffic rows'
  );
  assertCondition(
    riskAliasResponse.status === 200 &&
      riskAliasJson.meta?.signalType === 'risk' &&
      riskAliasJson.data.length === 1 &&
      riskAliasJson.data[0].signalType === 'risk',
    'risk_alert query aliases to risk rows'
  );
  assertCondition(
    invalidResponse.status === 422,
    'invalid signalType returns validation error'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
