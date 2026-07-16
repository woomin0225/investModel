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
  const publicJson = await publicResponse.json();
  const creatorJson = await creatorResponse.json();
  const invalidLimitJson = await invalidLimitResponse.json();
  const sessionScopedResponse = await readNotificationsWithSession(
    '?userPublicId=user_demo_999',
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();

  assertCondition(publicResponse.status === 401, 'public role is unauthenticated');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(
    publicJson.ok === false &&
      publicJson.error?.code === 'unauthenticated' &&
      typeof publicJson.error?.requestId === 'string' &&
      publicJson.error?.resource === 'notifications' &&
      publicJson.error?.action === 'read_notifications' &&
      publicJson.meta?.routeStatus === 'unauthenticated' &&
      publicJson.meta?.userScopeSource === 'not_resolved_auth_error' &&
      publicJson.meta?.deliveryProvider === 'none' &&
      publicJson.meta?.externalDeliveryBlocked === true &&
      publicJson.meta?.sendsRealPush === false &&
      publicJson.meta?.sendsRealEmail === false &&
      publicJson.meta?.sendsRealSms === false &&
      publicJson.meta?.brokerageConnection === false &&
      publicJson.meta?.realOrder === false &&
      publicJson.meta?.financialAdvice === false &&
      publicJson.meta?.userPublicId === undefined,
    'public error keeps normalized safe notification meta'
  );
  assertCondition(
    creatorJson.ok === false &&
      creatorJson.error?.code === 'forbidden' &&
      creatorJson.meta?.routeStatus === 'forbidden' &&
      creatorJson.meta?.userScopeSource === 'not_resolved_auth_error' &&
      creatorJson.meta?.deliveryProvider === 'none' &&
      creatorJson.meta?.externalDeliveryBlocked === true,
    'creator error keeps normalized safe notification meta'
  );
  assertCondition(successResponse.status === 200, 'user role can read notifications');
  assertCondition(
    successJson.ok === true &&
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
      successJson.meta?.inAppOnly === true &&
      successJson.meta?.feedDerivedInAppReadStateOnly === true &&
      successJson.meta?.sourceReadModel === 'feed_post_read_state' &&
      successJson.meta?.sourceEntity === 'feed_post' &&
      successJson.meta?.mutationScope === 'none_read_only' &&
      successJson.meta?.deliveryProvider === 'none' &&
      successJson.meta?.externalDeliveryBlocked === true &&
      successJson.meta?.pushDeliveryBlocked === true &&
      successJson.meta?.emailDeliveryBlocked === true &&
      successJson.meta?.smsDeliveryBlocked === true &&
      successJson.meta?.brokerMessagingBlocked === true &&
      successJson.meta?.orderMessagingBlocked === true &&
      successJson.meta?.financialAdviceBlocked === true &&
      Array.isArray(successJson.meta?.deliveryChannels) &&
      successJson.meta.deliveryChannels.length === 1 &&
      successJson.meta.deliveryChannels[0] === 'in_app_mock' &&
      successJson.meta?.sendsRealPush === false &&
      successJson.meta?.sendsRealEmail === false &&
      successJson.meta?.sendsRealSms === false &&
      successJson.meta?.realOrder === false &&
      successJson.meta?.brokerageConnection === false &&
      successJson.meta?.financialAdvice === false &&
      successJson.meta?.userScopeSource === 'demo_fallback' &&
      successJson.meta?.dataContext === successJson.data?.dataContext &&
      successJson.meta?.clientUserPublicIdIgnored === undefined,
    'notifications keep mock-safe API meta'
  );
  assertCondition(
    limitedResponse.status === 200 && limitedJson.meta?.limit === 2,
    'limit query is honored'
  );
  assertCondition(
    ignoredClientUserResponse.status === 200 &&
      ignoredClientUserJson.meta?.userPublicId === 'user_demo_001' &&
      ignoredClientUserJson.meta?.dataContext ===
        ignoredClientUserJson.data?.dataContext &&
      ignoredClientUserJson.meta?.clientUserPublicIdIgnored === undefined,
    'client userPublicId compatibility metadata is not exposed for notifications'
  );
  assertCondition(
    invalidLimitResponse.status === 422 &&
      invalidLimitJson.ok === false &&
      invalidLimitJson.error?.code === 'validation_error' &&
      invalidLimitJson.error?.fieldErrors?.limit?.[0] ===
        'limit must be an integer between 1 and 30.' &&
      invalidLimitJson.meta?.routeStatus === 'validation_error' &&
      invalidLimitJson.meta?.deliveryProvider === 'none' &&
      invalidLimitJson.meta?.externalDeliveryBlocked === true &&
      invalidLimitJson.meta?.userPublicId === undefined,
    'invalid limit is rejected with normalized safe notification meta'
  );
  assertCondition(
    sessionScopedResponse.status === 200 &&
      sessionScopedJson.data?.userPublicId === 'user_demo_001' &&
      sessionScopedJson.meta?.userScopeSource === 'session' &&
      sessionScopedJson.meta?.dataContext === sessionScopedJson.data?.dataContext &&
      sessionScopedJson.meta?.clientUserPublicIdIgnored === undefined &&
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
