/**
 * Verifies the My Page DB read model keeps member-scoped activity separated.
 * The fallback path must not leak the demo member's selections, feed activity,
 * or notifications when a different public user id is requested directly.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

import { client } from '../../lib/db/drizzle';
import {
  readMyPageFeedActivitySummary,
  readMyPageSummary
} from '../../lib/db/my-page-read-model';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedAppSeed() {
  const seedPath = path.resolve(
    'docs/database/seeds/001_invest_model_domain_seed.sql'
  );
  const sql = fs.readFileSync(seedPath, 'utf8');
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();
}

function containsDemoScopedActivity(value: unknown) {
  return JSON.stringify(value).includes('user_demo_001');
}

async function main() {
  await applyTrackedAppSeed();

  const demoSummary = await readMyPageSummary('user_demo_001');
  const missingUserPublicId = 'user_scope_empty_001';
  const missingSummary = await readMyPageSummary(missingUserPublicId);
  const missingFeedActivity =
    await readMyPageFeedActivitySummary(missingUserPublicId);

  assertCondition(
    demoSummary.userPublicId === 'user_demo_001' &&
      demoSummary.profile.userPublicId === 'user_demo_001' &&
      demoSummary.dataContext === 'db_read_model',
    'demo member summary uses the DB-backed member scope'
  );
  assertCondition(
    demoSummary.activeSelection?.userPublicId === 'user_demo_001' &&
      demoSummary.feedActivity.userPublicId === 'user_demo_001' &&
      demoSummary.feedActivity.savedCount > 0 &&
      demoSummary.feedActivity.commentCount > 0 &&
      demoSummary.notificationSummary.totalCount > 0 &&
      demoSummary.recentNotifications.length > 0,
    'demo member summary includes scoped selection, activity, and notifications'
  );

  assertCondition(
    missingSummary.userPublicId === missingUserPublicId &&
      missingSummary.profile.userPublicId === missingUserPublicId &&
      missingSummary.dataContext === 'mock_safe_fallback',
    'missing member summary keeps the requested public id on fallback'
  );
  assertCondition(
    missingSummary.activeSelection === null &&
      missingSummary.feedActivity.userPublicId === missingUserPublicId &&
      missingSummary.feedActivity.savedCount === 0 &&
      missingSummary.feedActivity.commentCount === 0 &&
      missingSummary.feedActivity.recentSavedPosts.length === 0 &&
      missingSummary.feedActivity.recentCommentPosts.length === 0 &&
      missingSummary.notificationSummary.unreadCount === 0 &&
      missingSummary.notificationSummary.totalCount === 0 &&
      missingSummary.recentNotifications.length === 0,
    'missing member fallback does not expose another member activity'
  );
  assertCondition(
    missingFeedActivity.userPublicId === missingUserPublicId &&
      missingFeedActivity.sourceLabel === 'mock_safe_fallback' &&
      missingFeedActivity.savedCount === 0 &&
      missingFeedActivity.commentCount === 0 &&
      missingFeedActivity.recentSavedPosts.length === 0 &&
      missingFeedActivity.recentCommentPosts.length === 0,
    'direct feed activity read model fallback is also member scoped'
  );
  assertCondition(
    !containsDemoScopedActivity(missingSummary) &&
      !containsDemoScopedActivity(missingFeedActivity),
    'fallback summaries do not contain demo member scoped identifiers'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
