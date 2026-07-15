/**
 * This smoke test verifies GET /api/notifications for DB-backed read-only rows.
 * It never sends push, email, SMS, broker, order, or account notifications.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/notifications/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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

async function main() {
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

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
