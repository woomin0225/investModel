/**
 * This smoke test verifies GET /api/my/activity.
 * It reads only user-scoped in-app FeedPost activity and never sends
 * push/email/SMS, connects accounts, creates orders, or gives advice.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';

import { GET } from '../../app/api/my/activity/route';
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

async function readMyActivityWithSession(search: string, sessionCookie: string) {
  return GET(
    new NextRequest(`http://localhost/api/my/activity${search}`, {
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
  const clientScopedResponse = await readMyActivity(
    '?userPublicId=user_other_001'
  );
  const clientScopedJson = await clientScopedResponse.json();
  const sessionScopedResponse = await readMyActivityWithSession(
    '?userPublicId=user_other_001',
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();

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
      activityJson.meta?.userScopeSource === 'demo_fallback' &&
      activityJson.meta?.clientUserPublicIdIgnored === undefined &&
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
    clientScopedResponse.status === 200 &&
      clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
      clientScopedJson.meta?.clientUserPublicIdIgnored === undefined,
    'client userPublicId compatibility metadata is not exposed for my activity'
  );
  assertCondition(
    sessionScopedResponse.status === 200 &&
      sessionScopedJson.data?.userPublicId === 'user_demo_001' &&
      sessionScopedJson.meta?.userScopeSource === 'session' &&
      sessionScopedJson.meta?.clientUserPublicIdIgnored === undefined &&
      sessionScopedJson.meta?.userPublicId === 'user_demo_001',
    'session role and user scope win for my activity'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
