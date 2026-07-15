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

async function main() {
  await applyTrackedFeedSeed();

  const forbiddenResponse = await POST(
    new NextRequest('http://localhost/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ userPublicId: 'user_demo_001' })
    })
  );
  const ignoredClientUserResponse = await markAllRead({
    userPublicId: 'user_demo_999'
  });
  const ignoredClientUserJson = await ignoredClientUserResponse.json();
  const invalidLimitResponse = await markAllRead({
    userPublicId: 'user_demo_001',
    limit: 31
  });
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

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    ignoredClientUserResponse.status === 200 &&
      ignoredClientUserJson.meta?.userPublicId === 'user_demo_001' &&
      ignoredClientUserJson.meta?.clientUserPublicIdIgnored === true,
    'client userPublicId is ignored in favor of server-resolved user scope'
  );
  assertCondition(invalidLimitResponse.status === 422, 'invalid limit is rejected');
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
      markJson.meta?.sendsRealPush === false &&
      markJson.meta?.sendsRealEmail === false &&
      markJson.meta?.sendsRealSms === false &&
      markJson.meta?.realOrder === false &&
      markJson.meta?.brokerageConnection === false &&
      markJson.meta?.financialAdvice === false &&
      markJson.meta?.userScopeSource === 'demo_fallback' &&
      markJson.meta?.clientUserPublicIdIgnored === false,
    'mark all read keeps mock-safe meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
