/**
 * This smoke test verifies POST /api/feed/[postId]/likes against tracked seed data.
 * It toggles only user-scoped FeedPost reaction state and restores the sample like.
 * It never mutates orders, funds, broker connections, or portfolio allocations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET as readFeedDetail } from '../../app/api/feed/[postId]/route';
import { POST } from '../../app/api/feed/[postId]/likes/route';
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

function likeRequest(
  postId: string,
  body: unknown,
  role = 'user'
) {
  return POST(
    new NextRequest(`http://localhost/api/feed/${postId}/likes`, {
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

function detailRequest(postId: string) {
  return readFeedDetail(
    new NextRequest(
      `http://localhost/api/feed/${postId}?userPublicId=user_demo_001`,
      {
        method: 'GET',
        headers: {
          'x-invest-model-role': 'user'
        }
      }
    ),
    {
      params: Promise.resolve({ postId })
    }
  );
}

async function main() {
  await applyTrackedFeedSeed();

  const forbiddenResponse = await POST(
    new NextRequest('http://localhost/api/feed/feed_mock_001/likes', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ userPublicId: 'user_demo_001' })
    }),
    {
      params: Promise.resolve({ postId: 'feed_mock_001' })
    }
  );
  const missingUserPublicIdResponse = await likeRequest('feed_mock_001', {});
  const missingUserPublicIdJson = await missingUserPublicIdResponse.json();
  const invalidDesiredStateResponse = await likeRequest('feed_mock_001', {
    userPublicId: 'user_demo_001',
    desiredState: 'yes'
  });
  const notFoundResponse = await likeRequest('feed_mock_missing', {
    userPublicId: 'user_demo_001'
  });
  const ignoredUserResponse = await likeRequest('feed_mock_001', {
    userPublicId: 'user_missing',
    desiredState: true
  });
  const ignoredUserJson = await ignoredUserResponse.json();
  const unlikeResponse = await likeRequest('feed_mock_001', {
    userPublicId: 'user_demo_001',
    desiredState: false
  });
  const unlikeJson = await unlikeResponse.json();
  const likeResponse = await likeRequest('feed_mock_001', {
    userPublicId: 'user_demo_001',
    desiredState: true
  });
  const likeJson = await likeResponse.json();
  const revisitResponse = await detailRequest('feed_mock_001');
  const revisitJson = await revisitResponse.json();

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    missingUserPublicIdResponse.status === 200 &&
      missingUserPublicIdJson.meta?.userScopeSource === 'demo_fallback' &&
      missingUserPublicIdJson.meta?.clientUserPublicIdIgnored === false,
    'missing userPublicId falls back to the mock-safe demo scope'
  );
  assertCondition(
    invalidDesiredStateResponse.status === 422,
    'invalid desiredState returns validation error'
  );
  assertCondition(notFoundResponse.status === 404, 'missing post is 404');
  assertCondition(
    ignoredUserResponse.status === 200 &&
      ignoredUserJson.data?.userPublicId === 'user_demo_001' &&
      ignoredUserJson.meta?.clientUserPublicIdIgnored === true,
    'client userPublicId is ignored for like state'
  );
  assertCondition(unlikeResponse.status === 200, 'unlike responds');
  assertCondition(likeResponse.status === 200, 'like responds');
  assertCondition(
    unlikeJson.data?.postPublicId === 'feed_mock_001' &&
      unlikeJson.data?.userPublicId === 'user_demo_001' &&
      unlikeJson.data?.id === undefined &&
      unlikeJson.data?.liked === false,
    'unlike returns public user-scoped reaction state'
  );
  assertCondition(
    likeJson.data?.postPublicId === 'feed_mock_001' &&
      likeJson.data?.userPublicId === 'user_demo_001' &&
      likeJson.data?.liked === true &&
      likeJson.data?.likeCount === 1,
    'like restores active sample reaction state'
  );
  assertCondition(
    revisitResponse.status === 200 &&
      revisitJson.data?.userState?.liked === true &&
      revisitJson.data?.userState?.likeCount === 1,
    'like state persists through FeedPost detail revisit'
  );
  assertCondition(
    likeJson.meta?.routeStatus === 'db_backed' &&
      likeJson.meta?.popularityContextOnly === true &&
      likeJson.meta?.recommendationSignal === false &&
      likeJson.meta?.modelQualitySignal === false &&
      likeJson.meta?.expectedReturnSignal === false &&
      likeJson.meta?.realOrder === false &&
      likeJson.meta?.brokerageConnection === false &&
      likeJson.meta?.financialAdvice === false,
    'like API keeps mock-safe action meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
