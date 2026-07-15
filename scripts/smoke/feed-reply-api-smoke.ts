/**
 * This smoke test verifies POST /api/feed/[postId]/comments/[commentId]/replies.
 * It creates only informational FeedPost replies and never mutates orders,
 * funds, broker connections, model selections, allocations, or compliance approval.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/feed/[postId]/comments/[commentId]/replies/route';
import { signToken } from '../../lib/auth/session';
import { client } from '../../lib/db/drizzle';

const smokeReplyBody = 'BK-325 smoke informational reply';
const hiddenParentCommentBody = 'BK-275 smoke hidden parent comment';
const hiddenParentCommentPublicId = 'feed_comment_smoke_hidden_parent';
const parentCommentPublicId = 'feed_comment_mock_001';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function withMysqlConnection<T>(
  callback: (connection: mysql.Connection) => Promise<T>
) {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  try {
    return await callback(connection);
  } finally {
    await connection.end();
  }
}

async function applyTrackedFeedSeed() {
  const seedPath = path.resolve(
    'docs/database/seeds/002_feed_interaction_seed.sql'
  );
  const sql = fs.readFileSync(seedPath, 'utf8');

  await withMysqlConnection(async (connection) => {
    await connection.query(sql);
    await connection.query('DELETE FROM feed_post_comments WHERE body IN (?, ?)', [
      smokeReplyBody,
      hiddenParentCommentBody
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
          ?,
          fp.id,
          NULL,
          u.id,
          ?,
          'hidden',
          '2026-07-14 10:22:00'
        FROM feed_posts fp
        JOIN users u ON u.public_id = 'user_demo_001'
        WHERE fp.public_id = 'feed_mock_001'
      `,
      [hiddenParentCommentPublicId, hiddenParentCommentBody]
    );
  });
}

async function readSeedUserId() {
  return withMysqlConnection(async (connection) => {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE public_id = 'user_demo_001' LIMIT 1"
    );
    const userId = rows[0]?.id;
    assertCondition(
      typeof userId === 'number',
      'seed user id exists for session scope smoke'
    );
    return userId;
  });
}

async function createSessionCookie(userId: number) {
  const encryptedSession = await signToken({
    user: { id: userId },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });

  return `session=${encryptedSession}`;
}

function replyRequest(
  postId: string,
  commentId: string,
  body: unknown,
  role = 'user'
) {
  return POST(
    new NextRequest(
      `http://localhost/api/feed/${postId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-invest-model-role': role
        },
        body: JSON.stringify(body)
      }
    ),
    {
      params: Promise.resolve({ postId, commentId })
    }
  );
}

function replyRequestWithSession(
  postId: string,
  commentId: string,
  body: unknown,
  sessionCookie: string
) {
  return POST(
    new NextRequest(
      `http://localhost/api/feed/${postId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: sessionCookie
        },
        body: JSON.stringify(body)
      }
    ),
    {
      params: Promise.resolve({ postId, commentId })
    }
  );
}

async function main() {
  await applyTrackedFeedSeed();
  const seedUserId = await readSeedUserId();
  const sessionCookie = await createSessionCookie(seedUserId);

  const forbiddenResponse = await POST(
    new NextRequest(
      `http://localhost/api/feed/feed_mock_001/comments/${parentCommentPublicId}/replies`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          userPublicId: 'user_demo_001',
          body: smokeReplyBody
        })
      }
    ),
    {
      params: Promise.resolve({
        postId: 'feed_mock_001',
        commentId: parentCommentPublicId
      })
    }
  );
  const missingUserPublicIdResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      body: smokeReplyBody
    }
  );
  const missingUserPublicIdJson = await missingUserPublicIdResponse.json();
  const missingBodyResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_demo_001'
    }
  );
  const tooLongBodyResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_demo_001',
      body: 'a'.repeat(601)
    }
  );
  const postNotFoundResponse = await replyRequest(
    'feed_mock_missing',
    parentCommentPublicId,
    {
      userPublicId: 'user_demo_001',
      body: smokeReplyBody
    }
  );
  const parentNotFoundResponse = await replyRequest(
    'feed_mock_001',
    'feed_comment_missing',
    {
      userPublicId: 'user_demo_001',
      body: smokeReplyBody
    }
  );
  const hiddenParentResponse = await replyRequest(
    'feed_mock_001',
    hiddenParentCommentPublicId,
    {
      userPublicId: 'user_demo_001',
      body: smokeReplyBody
    }
  );
  const ignoredUserResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_missing',
      body: smokeReplyBody
    }
  );
  const ignoredUserJson = await ignoredUserResponse.json();
  const createResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_demo_001',
      body: smokeReplyBody
    }
  );
  const createJson = await createResponse.json();
  const sessionScopedResponse = await replyRequestWithSession(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_missing',
      body: smokeReplyBody
    },
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();
  const parentComment = createJson.data?.comments?.find(
    (comment: { commentPublicId?: string }) =>
      comment.commentPublicId === parentCommentPublicId
  );

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    missingUserPublicIdResponse.status === 201 &&
      missingUserPublicIdJson.meta?.userScopeSource === 'demo_fallback' &&
      missingUserPublicIdJson.meta?.clientUserPublicIdIgnored === undefined,
    'missing userPublicId falls back to the mock-safe demo scope'
  );
  assertCondition(missingBodyResponse.status === 422, 'body is required');
  assertCondition(
    tooLongBodyResponse.status === 422,
    'long body returns validation error'
  );
  assertCondition(postNotFoundResponse.status === 404, 'missing post is 404');
  assertCondition(
    parentNotFoundResponse.status === 404,
    'missing parent comment is 404'
  );
  assertCondition(
    hiddenParentResponse.status === 404,
    'hidden parent comment is not replyable'
  );
  assertCondition(
    ignoredUserResponse.status === 201 &&
      ignoredUserJson.meta?.userPublicId === 'user_demo_001' &&
      ignoredUserJson.meta?.userScopeSource === 'demo_fallback' &&
      ignoredUserJson.meta?.clientUserPublicIdIgnored === undefined,
    'client userPublicId is not exposed as compatibility meta for reply creation'
  );
  assertCondition(createResponse.status === 201, 'reply creation responds');
  assertCondition(
    createJson.data?.postPublicId === 'feed_mock_001' &&
      createJson.data?.userState?.commentCount >= 1 &&
      parentComment?.replies?.some(
        (reply: { body?: string; parentCommentPublicId?: string }) =>
          reply.body === smokeReplyBody &&
          reply.parentCommentPublicId === parentCommentPublicId
      ),
    'reply creation returns refreshed FeedPost detail with nested reply'
  );
  assertCondition(
    createJson.meta?.routeStatus === 'db_backed' &&
      createJson.meta?.discussionOnly === true &&
      createJson.meta?.recommendationSignal === false &&
      createJson.meta?.orderIntentSignal === false &&
      createJson.meta?.realOrder === false &&
      createJson.meta?.brokerageConnection === false &&
      createJson.meta?.financialAdvice === false &&
      createJson.meta?.complianceApproval === false,
    'reply API keeps mock-safe action meta'
  );
  assertCondition(
    sessionScopedResponse.status === 201 &&
      sessionScopedJson.meta?.userScopeSource === 'session' &&
      sessionScopedJson.meta?.userPublicId === 'user_demo_001' &&
      sessionScopedJson.meta?.clientUserPublicIdIgnored === undefined,
    'session role and user scope win for reply creation'
  );

  await withMysqlConnection(async (connection) => {
    await connection.query('DELETE FROM feed_post_comments WHERE body IN (?, ?)', [
      smokeReplyBody,
      hiddenParentCommentBody
    ]);
  });
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
