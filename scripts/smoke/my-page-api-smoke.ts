/**
 * This smoke test verifies GET /api/my as a screen-level My Page read API.
 * It applies the tracked app seed and confirms the route only returns
 * user-scoped read models, never real accounts, orders, broker links, or advice.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';

import { GET } from '../../app/api/my/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedAppSeed() {
  const seedPath = path.resolve(
    'docs/database/seeds/001_invest_model_domain_seed.sql'
  );
  const sql = fs.readFileSync(seedPath, 'utf8');
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();
}

async function readMyPage(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/my${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function main() {
  await applyTrackedAppSeed();

  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/my', {
      method: 'GET'
    })
  );
  const creatorResponse = await GET(
    new NextRequest('http://localhost/api/my', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'creator'
      }
    })
  );
  const summaryResponse = await readMyPage();
  const summaryJson = await summaryResponse.json();
  const explicitDemoResponse = await readMyPage('?userPublicId=user_demo_001');
  const explicitDemoJson = await explicitDemoResponse.json();
  const invalidUserResponse = await readMyPage('?userPublicId=user_other_001');

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(summaryResponse.status === 200, 'my page summary responds');
  assertCondition(
    summaryJson.data?.userPublicId === 'user_demo_001' &&
      summaryJson.data?.profile?.userPublicId === 'user_demo_001' &&
      typeof summaryJson.data?.profile?.displayName === 'string' &&
      summaryJson.data?.activeSelection?.safetyBoundary?.noRealOrder === true &&
      typeof summaryJson.data?.feedActivity?.savedCount === 'number' &&
      typeof summaryJson.data?.feedActivity?.commentCount === 'number' &&
      typeof summaryJson.data?.notificationSummary?.unreadCount === 'number' &&
      Array.isArray(summaryJson.data?.recentNotifications) &&
      Array.isArray(summaryJson.data?.notices),
    'my page summary returns profile, selection, activity, notifications, and notices'
  );
  assertCondition(
    summaryJson.data?.profile?.email === undefined &&
      summaryJson.data?.profile?.id === undefined &&
      summaryJson.data?.activeSelection?.id === undefined &&
      !summaryJson.data?.recentNotifications?.some(
        (item: { id?: number; feedPost?: { id?: number } }) =>
          item.id !== undefined || item.feedPost?.id !== undefined
      ),
    'my page summary exposes public DTO fields only'
  );
  assertCondition(
    summaryJson.meta?.routeStatus === 'db_backed' &&
      summaryJson.meta?.readOnly === true &&
      summaryJson.meta?.exposesInternalDbIds === false &&
      summaryJson.meta?.realAccountConnection === false &&
      summaryJson.meta?.realDeposit === false &&
      summaryJson.meta?.realOrder === false &&
      summaryJson.meta?.brokerageConnection === false &&
      summaryJson.meta?.sendsRealPush === false &&
      summaryJson.meta?.sendsRealEmail === false &&
      summaryJson.meta?.sendsRealSms === false &&
      summaryJson.meta?.financialAdvice === false,
    'my page summary keeps mock-safe API meta'
  );
  assertCondition(
    explicitDemoResponse.status === 200 &&
      explicitDemoJson.meta?.userPublicId === 'user_demo_001',
    'explicit demo userPublicId is accepted'
  );
  assertCondition(
    invalidUserResponse.status === 422,
    'non-demo userPublicId returns validation error'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
