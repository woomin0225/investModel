/**
 * This smoke test verifies GET /api/feed/[postId] against tracked seed data.
 * It reads informational FeedPost detail, comment tree, and user-scoped UI state.
 * It never mutates comments, funds, broker connections, orders, or allocations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/feed/[postId]/route';
import { signToken } from '../../lib/auth/session';
import { client } from '../../lib/db/drizzle';

const hiddenCommentBody = 'BK-275 smoke hidden moderation comment';
const deletedCommentBody = 'BK-275 smoke deleted moderation comment';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedFeedSeed() {
  const seedPaths = [
    path.resolve('docs/database/seeds/003_signal_event_seed.sql'),
    path.resolve('docs/database/seeds/002_feed_interaction_seed.sql')
  ];
  const sql = seedPaths
    .map((seedPath) => fs.readFileSync(seedPath, 'utf8'))
    .join('\n\n');
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.query('DELETE FROM feed_post_comments WHERE body IN (?, ?)', [
    hiddenCommentBody,
    deletedCommentBody
  ]);
  await connection.query(
    `
      INSERT INTO feed_post_comments (
        public_id,
        post_id,
        parent_comment_id,
        author_user_id,
        body,
        status,
        created_at
      )
      SELECT
        'feed_comment_smoke_hidden_detail',
        fp.id,
        NULL,
        u.id,
        ?,
        'hidden',
        '2026-07-14 10:20:00'
      FROM feed_posts fp
      JOIN users u ON u.public_id = 'user_demo_001'
      WHERE fp.public_id = 'feed_mock_001'
    `,
    [hiddenCommentBody]
  );
  await connection.query(
    `
      INSERT INTO feed_post_comments (
        public_id,
        post_id,
        parent_comment_id,
        author_user_id,
        body,
        status,
        created_at
      )
      SELECT
        'feed_comment_smoke_deleted_detail',
        fp.id,
        NULL,
        u.id,
        ?,
        'deleted',
        '2026-07-14 10:21:00'
      FROM feed_posts fp
      JOIN users u ON u.public_id = 'user_demo_001'
      WHERE fp.public_id = 'feed_mock_001'
    `,
    [deletedCommentBody]
  );
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
    'seed user id exists for detail session role smoke'
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

function containsClientRequestedPublicId(value: unknown) {
  return JSON.stringify(value).includes('user_other_001');
}

function detailRequest(
  postId: string,
  search = '?userPublicId=user_demo_001',
  role = 'user'
) {
  return GET(
    new NextRequest(`http://localhost/api/feed/${postId}${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    }),
    {
      params: Promise.resolve({ postId })
    }
  );
}

function detailRequestWithSession(
  postId: string,
  sessionCookie: string,
  search = '?userPublicId=user_other_001'
) {
  return GET(
    new NextRequest(`http://localhost/api/feed/${postId}${search}`, {
      method: 'GET',
      headers: {
        cookie: sessionCookie
      }
    }),
    {
      params: Promise.resolve({ postId })
    }
  );
}

async function main() {
  await applyTrackedFeedSeed();
  const seedUserId = await readSeedUserId();
  const sessionCookie = await createSessionCookie(seedUserId);

  const forbiddenResponse = await GET(
    new NextRequest(
      'http://localhost/api/feed/feed_mock_001?userPublicId=user_demo_001',
      { method: 'GET' }
    ),
    {
      params: Promise.resolve({ postId: 'feed_mock_001' })
    }
  );
  const missingUserResponse = await detailRequest('feed_mock_001', '');
  const missingUserJson = await missingUserResponse.json();
  const ignoredUserResponse = await detailRequest(
    'feed_mock_001',
    '?userPublicId=user_other_001'
  );
  const ignoredUserJson = await ignoredUserResponse.json();
  const notFoundResponse = await detailRequest('feed_mock_missing');
  const detailResponse = await detailRequest('feed_mock_001');
  const detailJson = await detailResponse.json();
  const sessionDetailResponse = await detailRequestWithSession(
    'feed_mock_001',
    sessionCookie
  );
  const sessionDetailJson = await sessionDetailResponse.json();

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(
    missingUserResponse.status === 200 &&
      missingUserJson.meta?.userScopeSource === 'demo_fallback' &&
      missingUserJson.meta?.clientUserPublicIdIgnored === undefined,
    'missing userPublicId falls back to the prototype fallback scope'
  );
  assertCondition(
    ignoredUserResponse.status === 200 &&
      ignoredUserJson.data?.userState?.userPublicId === 'user_demo_001' &&
      ignoredUserJson.meta?.userPublicId === 'user_demo_001' &&
      ignoredUserJson.meta?.userScopeSource === 'demo_fallback' &&
      ignoredUserJson.meta?.clientUserPublicIdIgnored === undefined &&
      !containsClientRequestedPublicId(ignoredUserJson.data?.userState),
    'client userPublicId is not exposed as compatibility meta or FeedPost detail user state'
  );
  assertCondition(notFoundResponse.status === 404, 'missing post is 404');
  assertCondition(detailResponse.status === 200, 'feed detail responds');
  assertCondition(
    sessionDetailResponse.status === 200 &&
      sessionDetailJson.data?.userState?.userPublicId === 'user_demo_001' &&
      sessionDetailJson.meta?.userPublicId === 'user_demo_001' &&
      sessionDetailJson.meta?.userScopeSource === 'session' &&
      sessionDetailJson.meta?.clientUserPublicIdIgnored === undefined &&
      !containsClientRequestedPublicId(sessionDetailJson.data?.userState),
    'session role reads FeedPost detail with the server-resolved user scope'
  );
  assertCondition(
    detailJson.data?.postPublicId === 'feed_mock_001' &&
      detailJson.data?.id === undefined,
    'feed detail exposes public post id only'
  );
  assertCondition(
    Array.isArray(detailJson.data?.comments) &&
      detailJson.data.comments.length === 1 &&
      detailJson.data.comments[0].commentPublicId === 'feed_comment_mock_001' &&
      detailJson.data.comments[0].id === undefined &&
      detailJson.data.comments[0].replies?.[0]?.parentCommentPublicId ===
        'feed_comment_mock_001',
    'feed detail returns public comment tree'
  );
  assertCondition(
    !detailJson.data.comments.some(
      (comment: { body?: string; replies?: Array<{ body?: string }> }) =>
        comment.body === hiddenCommentBody ||
        comment.body === deletedCommentBody ||
        comment.replies?.some(
          (reply) =>
            reply.body === hiddenCommentBody || reply.body === deletedCommentBody
        )
    ),
    'feed detail hides moderated hidden/deleted comments'
  );
  assertCondition(
    detailJson.data?.userState?.userPublicId === 'user_demo_001' &&
      detailJson.data.userState.liked === true &&
      detailJson.data.userState.saved === false &&
      detailJson.data.userState.read === true &&
      detailJson.data.userState.likeCount === 1 &&
      detailJson.data.userState.commentCount === 2,
    'feed detail returns user-scoped state and aggregate counts'
  );
  assertCondition(
    Array.isArray(detailJson.data?.relatedSignalPublicIds) &&
      detailJson.data.relatedSignalPublicIds.length > 0 &&
      detailJson.data.relatedSignalPublicIds.every(
        (signalPublicId: unknown) => typeof signalPublicId === 'string'
      ),
    'feed detail returns DB-backed related SignalEvent public ids'
  );
  assertCondition(
    detailJson.meta?.routeStatus === 'db_backed' &&
      detailJson.meta?.sourceTables?.includes('model_signal_events') &&
      detailJson.meta?.realOrder === false &&
      detailJson.meta?.brokerageConnection === false &&
      detailJson.meta?.financialAdvice === false,
    'feed detail keeps mock-safe API meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
