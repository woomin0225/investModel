/**
 * This smoke test verifies GET /api/feed against tracked seed data.
 * It applies docs/database/seeds/002_feed_interaction_seed.sql as a whole file
 * and reads only informational FeedPost DTOs. It never mutates orders, funds,
 * broker connections, or portfolio allocations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/feed/route';
import { signToken } from '../../lib/auth/session';
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
    'seed user id exists for session role smoke'
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

async function readFeed(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/feed${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function readFeedWithSession(search: string, sessionCookie: string) {
  return GET(
    new NextRequest(`http://localhost/api/feed${search}`, {
      method: 'GET',
      headers: {
        cookie: sessionCookie
      }
    })
  );
}

async function main() {
  await applyTrackedFeedSeed();
  const seedUserId = await readSeedUserId();
  const sessionCookie = await createSessionCookie(seedUserId);

  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/feed', {
      method: 'GET'
    })
  );
  const listResponse = await readFeed('?limit=3');
  const listJson = await listResponse.json();
  const sessionScopedResponse = await readFeedWithSession(
    '?limit=2',
    sessionCookie
  );
  const sessionScopedJson = await sessionScopedResponse.json();
  const modelNoteResponse = await readFeed('?postType=model_note&limit=10');
  const modelNoteJson = await modelNoteResponse.json();
  const marketContextResponse = await readFeed(
    '?postType=market_context&limit=10'
  );
  const marketContextJson = await marketContextResponse.json();
  const filteredResponse = await readFeed('?postType=risk_note&limit=10');
  const filteredJson = await filteredResponse.json();
  const invalidResponse = await readFeed('?postType=trade_signal');

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(listResponse.status === 200, 'feed list responds');
  assertCondition(
    sessionScopedResponse.status === 200 &&
      Array.isArray(sessionScopedJson.data) &&
      sessionScopedJson.data.length === 2,
    'session role can read feed list without role header'
  );
  assertCondition(
    Array.isArray(listJson.data) && listJson.data.length === 3,
    'feed list respects limit'
  );
  assertCondition(
    listJson.data.every((post: { postPublicId?: string; id?: number }) => {
      return typeof post.postPublicId === 'string' && post.id === undefined;
    }),
    'feed list exposes public ids only'
  );
  assertCondition(
    listJson.meta?.routeStatus === 'db_backed' &&
      listJson.meta?.realOrder === false &&
      listJson.meta?.brokerageConnection === false &&
      listJson.meta?.financialAdvice === false,
    'feed list keeps mock-safe API meta'
  );
  assertCondition(
    modelNoteResponse.status === 200 &&
      modelNoteJson.meta?.postType === 'model_note' &&
      modelNoteJson.data.length === 1 &&
      modelNoteJson.data[0].postType === 'model_note',
    'postType filter returns model_note rows'
  );
  assertCondition(
    marketContextResponse.status === 200 &&
      marketContextJson.meta?.postType === 'market_context' &&
      marketContextJson.data.length === 1 &&
      marketContextJson.data[0].postType === 'market_context',
    'postType filter returns market_context rows'
  );
  assertCondition(
    filteredResponse.status === 200 &&
      filteredJson.meta?.postType === 'risk_note' &&
      filteredJson.data.length === 1 &&
      filteredJson.data[0].postType === 'risk_note',
    'postType filter returns risk_note rows'
  );
  assertCondition(
    invalidResponse.status === 422,
    'invalid postType returns validation error'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
