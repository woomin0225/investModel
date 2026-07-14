/**
 * This smoke test verifies GET /api/my/activity.
 * It reads only user-scoped in-app FeedPost activity and never sends
 * push/email/SMS, connects accounts, creates orders, or gives advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/my/activity/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function readMyActivity(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/my/activity${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function main() {
  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/my/activity', {
      method: 'GET'
    })
  );
  const creatorResponse = await GET(
    new NextRequest('http://localhost/api/my/activity', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'creator'
      }
    })
  );
  const activityResponse = await readMyActivity();
  const activityJson = await activityResponse.json();
  const explicitDemoResponse = await readMyActivity(
    '?userPublicId=user_demo_001'
  );
  const explicitDemoJson = await explicitDemoResponse.json();
  const invalidUserResponse = await readMyActivity(
    '?userPublicId=user_other_001'
  );

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(activityResponse.status === 200, 'my activity responds');
  assertCondition(
    activityJson.data?.userPublicId === 'user_demo_001' &&
      typeof activityJson.data?.savedCount === 'number' &&
      typeof activityJson.data?.commentCount === 'number' &&
      Array.isArray(activityJson.data?.recentSavedPosts) &&
      Array.isArray(activityJson.data?.recentCommentPosts),
    'my activity returns activity summary DTO'
  );
  assertCondition(
    !activityJson.data?.recentSavedPosts?.some(
      (item: { id?: number }) => item.id !== undefined
    ) &&
      !activityJson.data?.recentCommentPosts?.some(
        (item: { id?: number }) => item.id !== undefined
      ),
    'my activity exposes public DTO fields only'
  );
  assertCondition(
    activityJson.meta?.routeStatus === 'db_backed' &&
      activityJson.meta?.readOnly === true &&
      activityJson.meta?.sendsRealPush === false &&
      activityJson.meta?.sendsRealEmail === false &&
      activityJson.meta?.sendsRealSms === false &&
      activityJson.meta?.realAccountConnection === false &&
      activityJson.meta?.realOrder === false &&
      activityJson.meta?.brokerageConnection === false &&
      activityJson.meta?.financialAdvice === false,
    'my activity keeps mock-safe API meta'
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
