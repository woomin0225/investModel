/**
 * This smoke test verifies POST /api/feed/[postId]/saves against tracked seed data.
 * It toggles only private user-scoped saved/bookmark state and restores the sample save.
 * It never mutates orders, funds, broker connections, model selections, or allocations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET as readFeedDetail } from '../../app/api/feed/[postId]/route';
import { POST } from '../../app/api/feed/[postId]/saves/route';
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

function saveRequest(postId: string, body: unknown, role = 'user') {
  return POST(
    new NextRequest(`http://localhost/api/feed/${postId}/saves`, {
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
    new NextRequest('http://localhost/api/feed/feed_mock_002/saves', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ userPublicId: 'user_demo_001' })
    }),
    {
      params: Promise.resolve({ postId: 'feed_mock_002' })
    }
  );
  const missingUserPublicIdResponse = await saveRequest('feed_mock_002', {});
  const invalidDesiredStateResponse = await saveRequest('feed_mock_002', {
    userPublicId: 'user_demo_001',
    desiredState: 'yes'
  });
  const notFoundResponse = await saveRequest('feed_mock_missing', {
    userPublicId: 'user_demo_001'
  });
  const userNotFoundResponse = await saveRequest('feed_mock_002', {
    userPublicId: 'user_missing'
  });
  const unsaveResponse = await saveRequest('feed_mock_002', {
    userPublicId: 'user_demo_001',
    desiredState: false
  });
  const unsaveJson = await unsaveResponse.json();
  const saveResponse = await saveRequest('feed_mock_002', {
    userPublicId: 'user_demo_001',
    desiredState: true
  });
  const saveJson = await saveResponse.json();
  const revisitResponse = await detailRequest('feed_mock_002');
  const revisitJson = await revisitResponse.json();

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    missingUserPublicIdResponse.status === 422,
    'userPublicId is required'
  );
  assertCondition(
    invalidDesiredStateResponse.status === 422,
    'invalid desiredState returns validation error'
  );
  assertCondition(notFoundResponse.status === 404, 'missing post is 404');
  assertCondition(userNotFoundResponse.status === 404, 'missing user is 404');
  assertCondition(unsaveResponse.status === 200, 'unsave responds');
  assertCondition(saveResponse.status === 200, 'save responds');
  assertCondition(
    unsaveJson.data?.postPublicId === 'feed_mock_002' &&
      unsaveJson.data?.userPublicId === 'user_demo_001' &&
      unsaveJson.data?.id === undefined &&
      unsaveJson.data?.saved === false,
    'unsave returns public user-scoped reaction state'
  );
  assertCondition(
    saveJson.data?.postPublicId === 'feed_mock_002' &&
      saveJson.data?.userPublicId === 'user_demo_001' &&
      saveJson.data?.saved === true &&
      typeof saveJson.data?.savedAt === 'string',
    'save restores private saved state'
  );
  assertCondition(
    revisitResponse.status === 200 &&
      revisitJson.data?.userState?.saved === true &&
      typeof revisitJson.data?.userState?.savedAt === 'string',
    'saved state persists through FeedPost detail revisit'
  );
  assertCondition(
    saveJson.meta?.routeStatus === 'db_backed' &&
      saveJson.meta?.privateReadingShortcutOnly === true &&
      saveJson.meta?.modelSelectionSignal === false &&
      saveJson.meta?.allocationSignal === false &&
      saveJson.meta?.orderIntentSignal === false &&
      saveJson.meta?.realOrder === false &&
      saveJson.meta?.brokerageConnection === false &&
      saveJson.meta?.financialAdvice === false,
    'save API keeps mock-safe action meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
