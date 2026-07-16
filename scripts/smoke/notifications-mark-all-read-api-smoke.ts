/**
 * This smoke test verifies POST /api/notifications/mark-all-read.
 * It updates only DB-backed FeedPost read state and never sends push, email,
 * SMS, broker, order, account, or advice notifications.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';

import { GET } from '../../app/api/notifications/route';
import { POST } from '../../app/api/notifications/mark-all-read/route';
import { signToken } from '../../lib/auth/session';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedFeedSeed() {
  const seedPath = path.resolve(
    'docs/database/seeds/002_feed_interaction_seed.sql'
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
    'seed user id exists for mark all read session scope smoke'
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

function readNotifications() {
  return GET(
    new NextRequest('http://localhost/api/notifications?limit=30', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

function markAllRead(body: unknown, role = 'user') {
  return POST(
    new NextRequest('http://localhost/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-invest-model-role': role
      },
      body: JSON.stringify(body)
    })
  );
}

function markAllReadWithSession(body: unknown, sessionCookie: string) {
  return POST(
    new NextRequest('http://localhost/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: sessionCookie
      },
      body: JSON.stringify(body)
    })
  );
}

async function main() {
  await applyTrackedFeedSeed();
  const seedUserId = await readSeedUserId();
  const sessionCookie = await createSessionCookie(seedUserId);

  const forbiddenResponse = await POST(
    new NextRequest('http://localhost/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ userPublicId: 'user_demo_001' })
    })
  );
  const forbiddenJson = await forbiddenResponse.json();
  const creatorResponse = await markAllRead({ userPublicId: 'user_demo_001' }, 'creator');
  const creatorJson = await creatorResponse.json();
  const ignoredClientUserResponse = await markAllRead({
    userPublicId: 'user_demo_999'
  });
  const ignoredClientUserJson = await ignoredClientUserResponse.json();
  const invalidLimitResponse = await markAllRead({
    userPublicId: 'user_demo_001',
    limit: 31
  });
  const invalidLimitJson = await invalidLimitResponse.json();
  const sessionScopedResponse = await markAllReadWithSession(
    {
      userPublicId: 'user_demo_999',
      limit: 30
    },
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();
  const beforeResponse = await readNotifications();
  const beforeJson = await beforeResponse.json();
  const markResponse = await markAllRead({
    userPublicId: 'user_demo_001',
    limit: 30
  });
  const markJson = await markResponse.json();
  const afterResponse = await readNotifications();
  const afterJson = await afterResponse.json();
  const repeatResponse = await markAllRead({
    userPublicId: 'user_demo_001',
    limit: 30
  });
  const repeatJson = await repeatResponse.json();

  assertCondition(forbiddenResponse.status === 401, 'public role is unauthenticated');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(
    forbiddenJson.ok === false &&
      forbiddenJson.error?.code === 'unauthenticated' &&
      typeof forbiddenJson.error?.requestId === 'string' &&
      forbiddenJson.error?.resource === 'notifications' &&
      forbiddenJson.error?.action === 'mark_all_notifications_read' &&
      forbiddenJson.meta?.routeStatus === 'unauthenticated' &&
      forbiddenJson.meta?.userScopeSource === 'not_resolved_auth_error' &&
      forbiddenJson.meta?.deliveryProvider === 'none' &&
      forbiddenJson.meta?.externalDeliveryBlocked === true &&
      forbiddenJson.meta?.sendsRealPush === false &&
      forbiddenJson.meta?.sendsRealEmail === false &&
      forbiddenJson.meta?.sendsRealSms === false &&
      forbiddenJson.meta?.brokerageConnection === false &&
      forbiddenJson.meta?.realOrder === false &&
      forbiddenJson.meta?.financialAdvice === false &&
      forbiddenJson.meta?.userPublicId === undefined,
    'public mark all read error keeps normalized safe notification meta'
  );
  assertCondition(
    creatorJson.ok === false &&
      creatorJson.error?.code === 'forbidden' &&
      creatorJson.meta?.routeStatus === 'forbidden' &&
      creatorJson.meta?.deliveryProvider === 'none' &&
      creatorJson.meta?.externalDeliveryBlocked === true,
    'creator mark all read error keeps normalized safe notification meta'
  );
  assertCondition(
    ignoredClientUserResponse.status === 200 &&
      ignoredClientUserJson.ok === true &&
      ignoredClientUserJson.meta?.userPublicId === 'user_demo_001' &&
      ignoredClientUserJson.meta?.dataContext ===
        ignoredClientUserJson.data?.notificationCenter?.dataContext &&
      ignoredClientUserJson.meta?.clientUserPublicIdIgnored === undefined,
    'client userPublicId is not exposed and server-resolved user scope is used'
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
      sessionScopedJson.ok === true &&
      sessionScopedJson.meta?.userScopeSource === 'session' &&
      sessionScopedJson.meta?.userPublicId === 'user_demo_001' &&
      sessionScopedJson.meta?.clientUserPublicIdIgnored === undefined,
    'session role and user scope win for mark all read notifications'
  );
  assertCondition(beforeResponse.status === 200, 'notifications can be read before mark');
  assertCondition(markResponse.status === 200, 'mark all read responds');
  assertCondition(afterResponse.status === 200, 'notifications can be read after mark');
  assertCondition(repeatResponse.status === 200, 'mark all read is idempotent');
  assertCondition(
    typeof beforeJson.data?.unreadCount === 'number',
    'before response returns unread count'
  );
  assertCondition(
    markJson.data?.notificationCenter?.userPublicId === 'user_demo_001' &&
      markJson.data?.notificationCenter?.unreadCount === 0 &&
      typeof markJson.data?.markedCount === 'number' &&
      typeof markJson.data?.readAt === 'string',
    'mark all read returns a public notification center with zero unread'
  );
  assertCondition(afterJson.data?.unreadCount === 0, 'unread count stays zero');
  assertCondition(
    repeatJson.data?.notificationCenter?.unreadCount === 0,
    'repeat call keeps unread count zero'
  );
  assertCondition(
    markJson.meta?.routeStatus === 'db_backed' &&
      markJson.meta?.readStateOnly === true &&
      markJson.meta?.inAppOnly === true &&
      markJson.meta?.feedDerivedInAppReadStateOnly === true &&
      markJson.meta?.sourceReadModel === 'feed_post_read_state' &&
      markJson.meta?.sourceEntity === 'feed_post' &&
      markJson.meta?.mutationScope === 'feed_post_reads_only' &&
      markJson.meta?.deliveryProvider === 'none' &&
      markJson.meta?.externalDeliveryBlocked === true &&
      markJson.meta?.pushDeliveryBlocked === true &&
      markJson.meta?.emailDeliveryBlocked === true &&
      markJson.meta?.smsDeliveryBlocked === true &&
      markJson.meta?.brokerMessagingBlocked === true &&
      markJson.meta?.orderMessagingBlocked === true &&
      markJson.meta?.financialAdviceBlocked === true &&
      Array.isArray(markJson.meta?.deliveryChannels) &&
      markJson.meta.deliveryChannels.length === 1 &&
      markJson.meta.deliveryChannels[0] === 'in_app_mock' &&
      markJson.meta?.sendsRealPush === false &&
      markJson.meta?.sendsRealEmail === false &&
      markJson.meta?.sendsRealSms === false &&
      markJson.meta?.realOrder === false &&
      markJson.meta?.brokerageConnection === false &&
      markJson.meta?.financialAdvice === false &&
      markJson.meta?.userScopeSource === 'demo_fallback' &&
      markJson.meta?.dataContext === markJson.data?.notificationCenter?.dataContext &&
      markJson.meta?.clientUserPublicIdIgnored === undefined,
    'mark all read keeps mock-safe meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
