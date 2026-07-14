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
import { client } from '../../lib/db/drizzle';

const smokeReplyBody = 'BK-325 smoke informational reply';
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
    await connection.query('DELETE FROM feed_post_comments WHERE body = ?', [
      smokeReplyBody
    ]);
  });
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

async function main() {
  await applyTrackedFeedSeed();

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
  const userNotFoundResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_missing',
      body: smokeReplyBody
    }
  );
  const createResponse = await replyRequest(
    'feed_mock_001',
    parentCommentPublicId,
    {
      userPublicId: 'user_demo_001',
      body: smokeReplyBody
    }
  );
  const createJson = await createResponse.json();
  const parentComment = createJson.data?.comments?.find(
    (comment: { commentPublicId?: string }) =>
      comment.commentPublicId === parentCommentPublicId
  );

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    missingUserPublicIdResponse.status === 422,
    'userPublicId is required'
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
  assertCondition(userNotFoundResponse.status === 404, 'missing user is 404');
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

  await withMysqlConnection(async (connection) => {
    await connection.query('DELETE FROM feed_post_comments WHERE body = ?', [
      smokeReplyBody
    ]);
  });
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
