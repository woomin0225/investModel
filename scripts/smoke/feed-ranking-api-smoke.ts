/**
 * This smoke test verifies GET /api/feed/rankings against tracked seed data.
 * Rankings are popularity context only and never create advice, orders, broker
 * actions, model quality signals, or expected-return signals.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/feed/rankings/route';
import { signToken } from '../../lib/auth/session';
import { client } from '../../lib/db/drizzle';

const IGNORED_CLIENT_USER_PUBLIC_ID = 'user_other_001';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoClientUserPublicIdExposure(payload: unknown, context: string) {
  const serializedPayload = JSON.stringify(payload);

  assertCondition(
    !serializedPayload.includes(IGNORED_CLIENT_USER_PUBLIC_ID),
    `${context} does not expose ignored client userPublicId`
  );
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
    'seed user id exists for ranking session role smoke'
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

function rankingRequest(pathname: string, role = 'user') {
  return GET(
    new NextRequest(`http://localhost${pathname}`, {
      headers: {
        'x-invest-model-role': role
      }
    })
  );
}

function rankingRequestWithSession(pathname: string, sessionCookie: string) {
  return GET(
    new NextRequest(`http://localhost${pathname}`, {
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

  const forbiddenResponse = await rankingRequest('/api/feed/rankings', 'public');
  const invalidLimitResponse = await rankingRequest(
    '/api/feed/rankings?limit=21'
  );
  const invalidWindowResponse = await rankingRequest(
    '/api/feed/rankings?window=recent'
  );
  const rankingResponse = await rankingRequest(
    '/api/feed/rankings?limit=3&window=tracked_seed'
  );
  const rankingJson = await rankingResponse.json();
  const clientScopedRankingResponse = await rankingRequest(
    `/api/feed/rankings?limit=2&window=tracked_seed&userPublicId=${IGNORED_CLIENT_USER_PUBLIC_ID}`
  );
  const clientScopedRankingJson = await clientScopedRankingResponse.json();
  const sessionRankingResponse = await rankingRequestWithSession(
    `/api/feed/rankings?limit=2&window=tracked_seed&userPublicId=${IGNORED_CLIENT_USER_PUBLIC_ID}`,
    sessionCookie
  );
  const sessionRankingJson = await sessionRankingResponse.json();

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(
    invalidLimitResponse.status === 422,
    'invalid limit returns validation error'
  );
  assertCondition(
    invalidWindowResponse.status === 422,
    'invalid window returns validation error'
  );
  assertCondition(rankingResponse.status === 200, 'ranking responds');
  assertCondition(
    sessionRankingResponse.status === 200 &&
      Array.isArray(sessionRankingJson.data) &&
      sessionRankingJson.data.length > 0 &&
      sessionRankingJson.data.length <= 2,
    'session role can read feed rankings without role header'
  );
  assertCondition(
    clientScopedRankingResponse.status === 200 &&
      Array.isArray(clientScopedRankingJson.data) &&
      clientScopedRankingJson.data.length > 0 &&
      clientScopedRankingJson.data.length <= 2,
    'feed rankings ignore client userPublicId query under prototype fallback'
  );
  assertNoClientUserPublicIdExposure(
    clientScopedRankingJson,
    'prototype fallback feed ranking'
  );
  assertNoClientUserPublicIdExposure(
    sessionRankingJson,
    'session scoped feed ranking'
  );
  assertCondition(
    [...clientScopedRankingJson.data, ...sessionRankingJson.data].every(
      (post: { userPublicId?: string; authorPublicId?: string }) => {
        return (
          post.userPublicId === undefined && post.authorPublicId === undefined
        );
      }
    ),
    'feed rankings do not expose user public ids for client-selected scope'
  );
  assertCondition(
    [clientScopedRankingJson.meta, sessionRankingJson.meta].every(
      (meta: { userPublicId?: string; clientUserPublicIdIgnored?: string }) => {
        return (
          meta.userPublicId === undefined &&
          meta.clientUserPublicIdIgnored === undefined
        );
      }
    ),
    'feed ranking meta does not expose client-selected user scope'
  );
  assertCondition(Array.isArray(rankingJson.data), 'ranking data is an array');
  assertCondition(rankingJson.data.length > 0, 'ranking returns seeded posts');
  assertCondition(
    rankingJson.data[0]?.rank === 1 &&
      typeof rankingJson.data[0]?.postPublicId === 'string' &&
      typeof rankingJson.data[0]?.likeCount === 'number' &&
      rankingJson.data[0]?.id === undefined,
    'ranking returns public DTO rows without internal ids'
  );
  assertCondition(
    rankingJson.meta?.routeStatus === 'db_backed' &&
      rankingJson.meta?.popularityContextOnly === true &&
      rankingJson.meta?.recommendationSignal === false &&
      rankingJson.meta?.modelQualitySignal === false &&
      rankingJson.meta?.expectedReturnSignal === false &&
      rankingJson.meta?.realOrder === false &&
      rankingJson.meta?.brokerageConnection === false &&
      rankingJson.meta?.financialAdvice === false,
    'ranking API keeps mock-safe popularity meta'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
