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
import { signToken } from '../../lib/auth/session';
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

async function readSeedUserId() {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT id FROM users WHERE public_id = 'user_demo_001' LIMIT 1"
  );
  await connection.end();

  const userId = rows[0]?.id;
  assertCondition(
    typeof userId === 'number',
    'seed user id exists for session scope smoke'
  );
  return userId;
}

async function createSessionCookie(userId: number) {
  const encryptedSession = await signToken({
    user: { id: userId },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });

  return `session=${encryptedSession}`;
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

async function readMyPageWithSession(search: string, sessionCookie: string) {
  return GET(
    new NextRequest(`http://localhost/api/my${search}`, {
      method: 'GET',
      headers: {
        cookie: sessionCookie
      }
    })
  );
}

async function main() {
  await applyTrackedAppSeed();
  const seedUserId = await readSeedUserId();
  const sessionCookie = await createSessionCookie(seedUserId);

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
  const clientScopedResponse = await readMyPage('?userPublicId=user_other_001');
  const clientScopedJson = await clientScopedResponse.json();
  const sessionScopedResponse = await readMyPageWithSession(
    '?userPublicId=user_other_001',
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();

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
      summaryJson.meta?.userScopeSource === 'demo_fallback' &&
      summaryJson.meta?.clientUserPublicIdIgnored === undefined &&
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
    clientScopedResponse.status === 200 &&
      clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
      clientScopedJson.meta?.userScopeSource === 'demo_fallback' &&
      clientScopedJson.meta?.clientUserPublicIdIgnored === undefined,
    'client-provided userPublicId is not exposed as compatibility meta'
  );
  assertCondition(
    sessionScopedResponse.status === 200 &&
      sessionScopedJson.data?.userPublicId === 'user_demo_001' &&
      sessionScopedJson.meta?.userScopeSource === 'session' &&
      sessionScopedJson.meta?.clientUserPublicIdIgnored === undefined &&
      sessionScopedJson.meta?.userPublicId === 'user_demo_001',
    'session role and user scope win over client-provided userPublicId'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
