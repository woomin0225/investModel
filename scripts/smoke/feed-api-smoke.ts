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

async function main() {
  await applyTrackedFeedSeed();

  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/feed', {
      method: 'GET'
    })
  );
  const listResponse = await readFeed('?limit=3');
  const listJson = await listResponse.json();
  const filteredResponse = await readFeed('?postType=risk_note&limit=10');
  const filteredJson = await filteredResponse.json();
  const invalidResponse = await readFeed('?postType=trade_signal');

  assertCondition(forbiddenResponse.status === 403, 'public role is forbidden');
  assertCondition(listResponse.status === 200, 'feed list responds');
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
    filteredResponse.status === 200 &&
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
