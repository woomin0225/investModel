/**
 * This smoke test verifies POST /api/feed/[postId]/reads against tracked seed data.
 * It marks only private user-scoped read state and never mutates orders, funds,
 * broker connections, model selections, allocations, or compliance approval.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET as readFeedDetail } from '../../app/api/feed/[postId]/route';
import { POST } from '../../app/api/feed/[postId]/reads/route';
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

function readRequest(postId: string, body: unknown, role = 'user') {
  return POST(
    new NextRequest(`http://localhost/api/feed/${postId}/reads`, {
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
    new NextRequest('http://localhost/api/feed/feed_mock_003/reads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ userPublicId: 'user_demo_001' })
    }),
    {
      params: Promise.resolve({ postId: 'feed_mock_003' })
    }
  );
  const missingUserPublicIdResponse = await readRequest('feed_mock_003', {});
  const missingUserPublicIdJson = await missingUserPublicIdResponse.json();
  const notFoundResponse = await readRequest('feed_mock_missing', {
    userPublicId: 'user_demo_001'
  });
  const ignoredUserResponse = await readRequest('feed_mock_003', {
    userPublicId: 'user_missing'
  });
  const ignoredUserJson = await ignoredUserResponse.json();
  const markReadResponse = await readRequest('feed_mock_003', {
    userPublicId: 'user_demo_001'
  });
  const markReadJson = await markReadResponse.json();
  const repeatMarkReadResponse = await readRequest('feed_mock_003', {
    userPublicId: 'user_demo_001'
  });
  const repeatMarkReadJson = await repeatMarkReadResponse.json();
  const revisitResponse = await detailRequest('feed_mock_003');
  const revisitJson = await revisitResponse.json();

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    missingUserPublicIdResponse.status === 200 &&
      missingUserPublicIdJson.meta?.userScopeSource === 'demo_fallback' &&
      missingUserPublicIdJson.meta?.clientUserPublicIdIgnored === false,
    'missing userPublicId falls back to the mock-safe demo scope'
  );
  assertCondition(notFoundResponse.status === 404, 'missing post is 404');
  assertCondition(
    ignoredUserResponse.status === 200 &&
      ignoredUserJson.data?.userPublicId === 'user_demo_001' &&
      ignoredUserJson.meta?.clientUserPublicIdIgnored === true,
    'client userPublicId is ignored for read state'
  );
  assertCondition(markReadResponse.status === 200, 'mark read responds');
  assertCondition(
    repeatMarkReadResponse.status === 200,
    'repeat mark read remains idempotent'
  );
  assertCondition(
    markReadJson.data?.postPublicId === 'feed_mock_003' &&
      markReadJson.data?.userPublicId === 'user_demo_001' &&
      markReadJson.data?.id === undefined &&
      markReadJson.data?.read === true &&
      typeof markReadJson.data?.readAt === 'string',
    'mark read returns public user-scoped reaction state'
  );
  assertCondition(
    repeatMarkReadJson.data?.read === true &&
      typeof repeatMarkReadJson.data?.readAt === 'string',
    'repeat mark read keeps read state'
  );
  assertCondition(
    revisitResponse.status === 200 &&
      revisitJson.data?.userState?.read === true &&
      typeof revisitJson.data?.userState?.readAt === 'string',
    'read state persists through FeedPost detail revisit'
  );
  assertCondition(
    markReadJson.meta?.routeStatus === 'db_backed' &&
      markReadJson.meta?.privateReadingStateOnly === true &&
      markReadJson.meta?.recommendationSignal === false &&
      markReadJson.meta?.modelQualitySignal === false &&
      markReadJson.meta?.expectedReturnSignal === false &&
      markReadJson.meta?.orderIntentSignal === false &&
      markReadJson.meta?.realOrder === false &&
      markReadJson.meta?.brokerageConnection === false &&
      markReadJson.meta?.financialAdvice === false &&
      markReadJson.meta?.complianceApproval === false,
    'read API keeps mock-safe action meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
