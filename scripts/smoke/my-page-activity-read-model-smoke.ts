/**
 * Verifies the My Page activity read model projects saved FeedPost, visible
 * comment, and in-app mock notification rows as user-scoped activity rows.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

import { client } from '../../lib/db/drizzle';
import {
  readMyPageActivitySeedFixture,
  readMyPageFeedActivitySummary
} from '../../lib/db/my-page-read-model';
import type { MyPageActivityRow } from '../../lib/domain/my-page/feed-activity';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applySeedFile(seedFileName: string) {
  const seedPath = path.resolve('docs/database/seeds', seedFileName);
  const sql = fs.readFileSync(seedPath, 'utf8');
  await runSql(sql);
}

async function runSql(sql: string) {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();
}

async function ensureUserNotificationsTable() {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_notifications'"
  );
  const tableExists = Number(rows[0]?.value ?? 0) > 0;
  await connection.end();

  if (tableExists) {
    return;
  }

  const migrationSql = fs.readFileSync(
    path.resolve('lib/db/migrations/0011_user_notifications.sql'),
    'utf8'
  ).replaceAll('--> statement-breakpoint', '');
  await runSql(migrationSql);
}

function asText(value: unknown) {
  return JSON.stringify(value);
}

function assertNoInternalIds(rows: MyPageActivityRow[]) {
  assertCondition(
    rows.every((row) => !('id' in row) && !('userId' in row)),
    'activity rows expose public DTO fields only'
  );
}

function assertNoForbiddenActionFields(value: unknown) {
  const payload = asText(value);
  const forbiddenTerms = [
    'accountPublicId',
    'brokerAccountId',
    'bankAccountId',
    'orderId',
    'tradeIntentId',
    'secretKey',
    'externalProviderToken'
  ];

  assertCondition(
    forbiddenTerms.every((term) => !payload.includes(term)),
    'activity read model does not expose account, broker, order, secret, or external provider identifiers'
  );
}

async function main() {
  await ensureUserNotificationsTable();
  await applySeedFile('001_invest_model_domain_seed.sql');
  await applySeedFile('015_my_page_activity_read_model_seed.sql');

  const activity = await readMyPageActivitySeedFixture('user_demo_001');
  const summary = await readMyPageFeedActivitySummary('user_demo_001');
  const missingUserPublicId = 'user_scope_empty_572';
  const missingActivity =
    await readMyPageActivitySeedFixture(missingUserPublicId);

  assertCondition(
    activity.generatedFrom === 'db_seed_projection' &&
      activity.userPublicId === 'user_demo_001' &&
      activity.rows.length >= 3,
    'seeded user receives DB-backed My Page activity rows'
  );
  assertCondition(
    activity.rows.every((row) => row.userPublicId === 'user_demo_001'),
    'every activity row stays scoped to the requested demo user'
  );
  assertCondition(
    activity.counts.saved_feed > 0 &&
      activity.counts.comment > 0 &&
      activity.counts.notification > 0,
    'activity read model includes saved feed, comment, and notification rows'
  );
  assertCondition(
    activity.rows.some(
      (row) =>
        row.activityType === 'saved_feed' &&
        row.sourceMeta.sourceTables.includes('feed_post_saves') &&
        row.sourceMeta.sourceTables.includes('feed_posts')
    ),
    'saved activity derives from FeedPost save tables'
  );
  assertCondition(
    activity.rows.some(
      (row) =>
        row.activityType === 'comment' &&
        row.sourceMeta.sourceTables.includes('feed_post_comments') &&
        row.sourceMeta.sourceTables.includes('feed_posts')
    ),
    'comment activity derives from visible FeedPost comment tables'
  );
  assertCondition(
    activity.rows.some(
      (row) =>
        row.activityType === 'notification' &&
        row.sourceMeta.sourceTables.includes('user_notifications') &&
        row.sourceMeta.externalDelivery === false
    ),
    'notification activity derives from in-app mock notification rows only'
  );
  assertCondition(
    activity.rows.every(
      (row) =>
        row.sourceMeta.userScoped === true &&
        row.sourceMeta.inAppReadModelOnly === true &&
        row.sourceMeta.accountLinkage === false &&
        row.sourceMeta.realDeposit === false &&
        row.sourceMeta.realOrder === false &&
        row.sourceMeta.brokerageConnection === false &&
        row.sourceMeta.paidExternalApi === false &&
        row.sourceMeta.financialAdvice === false
    ),
    'activity row safety metadata blocks financial and external actions'
  );
  assertNoInternalIds(activity.rows);
  assertNoForbiddenActionFields(activity);

  assertCondition(
    summary.userPublicId === 'user_demo_001' &&
      summary.activityRows?.length === activity.rows.length &&
      summary.activityRows.every((row) => row.userPublicId === 'user_demo_001'),
    'My Page feed summary carries the same user-scoped activity rows'
  );

  assertCondition(
    missingActivity.generatedFrom === 'deterministic_fixture' &&
      missingActivity.userPublicId === missingUserPublicId &&
      missingActivity.rows.length === 0 &&
      !asText(missingActivity).includes('user_demo_001'),
    'missing user fallback stays empty and does not expose demo user rows'
  );
  missingActivity.rows.push(activity.rows[0]);
  const repeatedMissingActivity =
    await readMyPageActivitySeedFixture(missingUserPublicId);
  assertCondition(
    repeatedMissingActivity.rows.length === 0 &&
      !asText(repeatedMissingActivity).includes('user_demo_001'),
    'fallback activity rows are isolated across repeated reads'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
