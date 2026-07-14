/**
 * This smoke test verifies POST /api/feed/[postId]/comments against tracked seed data.
 * It creates only informational top-level FeedPost comments and never mutates orders,
 * funds, broker connections, model selections, allocations, or compliance approval.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/feed/[postId]/comments/route';
import { client } from '../../lib/db/drizzle';

const smokeCommentBody = 'BK-323 smoke informational comment';

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
      smokeCommentBody
    ]);
  });
}

function commentRequest(postId: string, body: unknown, role = 'user') {
  return POST(
    new NextRequest(`http://localhost/api/feed/${postId}/comments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-invest-model-role': role
      },
      body: JSON.stringify(body)
    }),
    {
      params: Promise.resolve({ postId })
    }
  );
}

async function main() {
  await applyTrackedFeedSeed();

  const forbiddenResponse = await POST(
    new NextRequest('http://localhost/api/feed/feed_mock_001/comments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        userPublicId: 'user_demo_001',
        body: smokeCommentBody
      })
    }),
    {
      params: Promise.resolve({ postId: 'feed_mock_001' })
    }
  );
  const missingUserPublicIdResponse = await commentRequest('feed_mock_001', {
    body: smokeCommentBody
  });
  const missingBodyResponse = await commentRequest('feed_mock_001', {
    userPublicId: 'user_demo_001'
  });
  const tooLongBodyResponse = await commentRequest('feed_mock_001', {
    userPublicId: 'user_demo_001',
    body: 'a'.repeat(601)
  });
  const notFoundResponse = await commentRequest('feed_mock_missing', {
    userPublicId: 'user_demo_001',
    body: smokeCommentBody
  });
  const userNotFoundResponse = await commentRequest('feed_mock_001', {
    userPublicId: 'user_missing',
    body: smokeCommentBody
  });
  const createResponse = await commentRequest('feed_mock_001', {
    userPublicId: 'user_demo_001',
    body: smokeCommentBody
  });
  const createJson = await createResponse.json();

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
  assertCondition(notFoundResponse.status === 404, 'missing post is 404');
  assertCondition(userNotFoundResponse.status === 404, 'missing user is 404');
  assertCondition(createResponse.status === 201, 'comment creation responds');
  assertCondition(
    createJson.data?.postPublicId === 'feed_mock_001' &&
      createJson.data?.userState?.commentCount >= 1 &&
      createJson.data?.comments?.some(
        (comment: { body?: string; parentCommentPublicId?: string }) =>
          comment.body === smokeCommentBody &&
          comment.parentCommentPublicId === undefined
      ),
    'comment creation returns refreshed FeedPost detail with top-level comment'
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
    'comment API keeps mock-safe action meta'
  );

  await withMysqlConnection(async (connection) => {
    await connection.query('DELETE FROM feed_post_comments WHERE body = ?', [
      smokeCommentBody
    ]);
  });
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
