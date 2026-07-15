/**
 * This smoke test verifies GET /api/notifications for DB-backed read-only rows.
 * It never sends push, email, SMS, broker, order, or account notifications.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';

import { GET } from '../../app/api/notifications/route';
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

async function readNotifications(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/notifications${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function readNotificationsWithSession(
  search: string,
  sessionCookie: string
) {
  return GET(
    new NextRequest(`http://localhost/api/notifications${search}`, {
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

  const publicResponse = await GET(
    new NextRequest('http://localhost/api/notifications', {
      method: 'GET'
    })
  );
  const creatorResponse = await GET(
    new NextRequest('http://localhost/api/notifications', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'creator'
      }
    })
  );
  const successResponse = await readNotifications();
  const successJson = await successResponse.json();
  const limitedResponse = await readNotifications('?limit=2');
  const limitedJson = await limitedResponse.json();
  const ignoredClientUserResponse = await readNotifications(
    '?userPublicId=user_demo_999'
  );
  const ignoredClientUserJson = await ignoredClientUserResponse.json();
  const invalidLimitResponse = await readNotifications('?limit=31');
  const sessionScopedResponse = await readNotificationsWithSession(
    '?userPublicId=user_demo_999',
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();

  assertCondition(publicResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(successResponse.status === 200, 'user role can read notifications');
  assertCondition(
    successJson.data?.userPublicId === 'user_demo_001' &&
      Array.isArray(successJson.data?.items) &&
      typeof successJson.data?.unreadCount === 'number',
    'notifications response returns a notification center dto'
  );
  assertCondition(
    successJson.data.items.every(
      (item: { notificationPublicId?: string; id?: number; href?: string }) =>
        typeof item.notificationPublicId === 'string' &&
        item.id === undefined &&
        typeof item.href === 'string'
    ),
    'notifications expose public notification ids and hrefs only'
  );
  assertCondition(
    successJson.meta?.routeStatus === 'db_backed' &&
      successJson.meta?.readOnly === true &&
      successJson.meta?.sendsRealPush === false &&
      successJson.meta?.sendsRealEmail === false &&
      successJson.meta?.sendsRealSms === false &&
      successJson.meta?.realOrder === false &&
      successJson.meta?.brokerageConnection === false &&
      successJson.meta?.financialAdvice === false &&
      successJson.meta?.userScopeSource === 'demo_fallback' &&
      successJson.meta?.clientUserPublicIdIgnored === false,
    'notifications keep mock-safe API meta'
  );
  assertCondition(
    limitedResponse.status === 200 && limitedJson.meta?.limit === 2,
    'limit query is honored'
  );
  assertCondition(
    ignoredClientUserResponse.status === 200 &&
      ignoredClientUserJson.meta?.userPublicId === 'user_demo_001' &&
      ignoredClientUserJson.meta?.clientUserPublicIdIgnored === true,
    'client userPublicId is ignored in favor of server-resolved user scope'
  );
  assertCondition(invalidLimitResponse.status === 422, 'invalid limit is rejected');
  assertCondition(
    sessionScopedResponse.status === 200 &&
      sessionScopedJson.data?.userPublicId === 'user_demo_001' &&
      sessionScopedJson.meta?.userScopeSource === 'session' &&
      sessionScopedJson.meta?.clientUserPublicIdIgnored === true &&
      sessionScopedJson.meta?.userPublicId === 'user_demo_001',
    'session role and user scope win for notifications'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
