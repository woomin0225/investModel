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
import { calculateMockSignalScoreSnapshots } from '../../lib/db/signal-scoring-service';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const forbiddenPayloadKeys = new Set([
  'id',
  'signalEventId',
  'snapshotId',
  'inputId',
  'orderId',
  'tradeIntent',
  'tradeIntentId',
  'tradeIntentCreated',
  'broker',
  'brokerage',
  'brokerageConnection',
  'financialAdvice',
  'advice'
]);

function findForbiddenPayloadKey(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findForbiddenPayloadKey(item);

      if (match) {
        return match;
      }
    }

    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (forbiddenPayloadKeys.has(key)) {
      return key;
    }

    const match = findForbiddenPayloadKey(nestedValue);

    if (match) {
      return match;
    }
  }

  return null;
}

async function applyTrackedSignalSeed() {
  const seedPaths = [
    path.resolve('docs/database/seeds/003_signal_event_seed.sql'),
    path.resolve('docs/database/seeds/009_signal_detail_seed.sql')
  ];
  const sql = seedPaths.map((seedPath) => fs.readFileSync(seedPath, 'utf8')).join('\n');
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
  await calculateMockSignalScoreSnapshots({
    capturedAt: new Date('2026-01-01T00:00:00.000Z')
  });

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
  const notFoundJson = await notFoundResponse.json();
  const blankIdResponse = await detailRequest('   ');
  const blankIdJson = await blankIdResponse.json();
  const detailResponse = await detailRequest('sig_mock_news_traffic_001');
  const detailJson = await detailResponse.json();

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(
    notFoundResponse.status === 404 &&
      notFoundJson.data === undefined &&
      notFoundJson.error?.code === 'not_found' &&
      typeof notFoundJson.error?.message === 'string' &&
      notFoundJson.error.message.includes('not found'),
    'missing signal is 404 without data payload or side effects'
  );
  assertCondition(
    blankIdResponse.status === 422 &&
      blankIdJson.data === undefined &&
      blankIdJson.error?.code === 'validation_error',
    'blank signal public id returns validation error without data payload'
  );
  assertCondition(detailResponse.status === 200, 'signal detail responds');
  assertCondition(
      detailJson.data?.signalPublicId === 'sig_mock_news_traffic_001' &&
      detailJson.data?.id === undefined &&
      detailJson.data?.signalType === 'news_traffic' &&
      typeof detailJson.data?.score === 'number' &&
      typeof detailJson.data?.scoreSnapshot?.rankValue === 'number' &&
      detailJson.data?.scoreSnapshot?.calculationContext === 'mock_seed' &&
      Array.isArray(detailJson.data?.observedDrivers) &&
      detailJson.data.observedDrivers.length >= 3 &&
      detailJson.data.observedDrivers.every(
        (driver: {
          sourceType?: string;
          evidenceLabel?: string;
          normalizedScore?: number;
          weight?: number;
          contributionDisplay?: string;
          evidenceContext?: string;
        }) =>
          typeof driver.sourceType === 'string' &&
          typeof driver.evidenceLabel === 'string' &&
          driver.evidenceLabel.includes('Observed-only') &&
          typeof driver.normalizedScore === 'number' &&
          driver.normalizedScore >= 0 &&
          driver.normalizedScore <= 100 &&
          typeof driver.weight === 'number' &&
          driver.weight > 0 &&
          typeof driver.contributionDisplay === 'string' &&
          driver.contributionDisplay.includes('weighted mock points') &&
          driver.evidenceContext === 'mock'
      ),
    'signal detail exposes public id, observed fields, score snapshot, and observed driver breakdown'
  );
  assertCondition(
    detailJson.data?.observedDrivers.every(
      (driver: { id?: unknown; orderId?: unknown; tradeIntentId?: unknown }) =>
        driver.id === undefined &&
        driver.orderId === undefined &&
        driver.tradeIntentId === undefined
    ),
    'signal detail drivers expose no internal ids or order-capable fields'
  );
  assertCondition(
    detailJson.meta?.routeStatus === 'db_backed' &&
      detailJson.meta?.sourceTables?.includes('model_signal_events') &&
      detailJson.meta?.sourceTables?.includes('signal_score_snapshots') &&
      detailJson.meta?.sourceTables?.includes('signal_score_inputs') &&
      detailJson.meta?.observedInputsOnly === true &&
      detailJson.meta?.realtimeExternalData === false &&
      detailJson.meta?.externalPaidApi === false &&
      detailJson.meta?.tradeIntentCreated === false &&
      detailJson.meta?.realOrder === false &&
      detailJson.meta?.brokerageConnection === false &&
      detailJson.meta?.financialAdvice === false,
    'signal detail keeps mock-safe API meta'
  );
  assertCondition(
    detailJson.data?.tradeIntent === undefined &&
      detailJson.data?.tradeIntentCreated === undefined &&
      detailJson.data?.order === undefined &&
      detailJson.data?.brokerageConnection === undefined &&
      detailJson.data?.financialAdvice === undefined,
    'signal detail DTO exposes no advice or TradeIntent-capable fields'
  );
  assertCondition(
    findForbiddenPayloadKey(detailJson.data) === null,
    'signal detail DTO recursively exposes no internal/action-capable keys'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
