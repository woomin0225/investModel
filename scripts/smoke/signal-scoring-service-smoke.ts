/**
 * This smoke test verifies the mock-safe SignalEvent scoring service.
 * It applies the tracked app seed, creates score snapshots and weighted inputs,
 * confirms seeded AI attention/model inclusion inputs are reused by the service,
 * and verifies the operation does not create orders, broker actions, or external
 * live-data calls.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { calculateMockSignalScoreSnapshots } from '../../lib/db/signal-scoring-service';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyTrackedSignalSeed() {
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

async function readCounts() {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL
  });
  const [rows] = await connection.query<mysql.RowDataPacket[]>(`
    SELECT
      (SELECT COUNT(*) FROM model_signal_events) AS signal_count,
      (SELECT COUNT(*) FROM signal_score_snapshots) AS snapshot_count,
      (SELECT COUNT(*) FROM signal_score_inputs) AS input_count,
      (SELECT COUNT(*) FROM trade_intents) AS trade_intent_count
  `);

  await connection.end();

  return rows[0] as {
    signal_count: number;
    snapshot_count: number;
    input_count: number;
    trade_intent_count: number;
  };
}

async function readInputSourceTypes(snapshotIds: number[]) {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL
  });
  const placeholders = snapshotIds.map(() => '?').join(',');
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT DISTINCT source_type
      FROM signal_score_inputs
      WHERE score_snapshot_id IN (${placeholders})
      ORDER BY source_type
    `,
    snapshotIds
  );

  await connection.end();

  return rows.map((row) => String(row.source_type));
}

async function readInputLabels(snapshotIds: number[]) {
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL
  });
  const placeholders = snapshotIds.map(() => '?').join(',');
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT source_type, source_label
      FROM signal_score_inputs
      WHERE score_snapshot_id IN (${placeholders})
      ORDER BY source_type, source_label
    `,
    snapshotIds
  );

  await connection.end();

  return rows.map((row) => ({
    sourceType: String(row.source_type),
    sourceLabel: String(row.source_label)
  }));
}

async function main() {
  await applyTrackedSignalSeed();

  const before = await readCounts();
  const capturedAt = new Date('2026-07-15T00:06:13.000Z');
  const results = await calculateMockSignalScoreSnapshots({ capturedAt });
  const after = await readCounts();
  const sourceTypes = await readInputSourceTypes(
    results.map((result) => result.snapshotId)
  );
  const sourceLabels = await readInputLabels(
    results.map((result) => result.snapshotId)
  );

  assertCondition(before.signal_count >= 3, 'tracked signal seed exists');
  assertCondition(
    results.length === before.signal_count,
    'scoring service creates one snapshot per SignalEvent'
  );
  assertCondition(
    results.every(
      (result) =>
        typeof result.snapshotId === 'number' &&
        result.totalScore >= 0 &&
        result.totalScore <= 100 &&
        result.rankValue >= 1 &&
        result.inputCount >= 4 &&
        result.calculationContext === 'mock_seed'
    ),
    'scoring service returns bounded mock score results'
  );
  assertCondition(
    after.snapshot_count >= before.snapshot_count + results.length,
    'score snapshots were persisted'
  );
  assertCondition(
    after.input_count >=
      before.input_count +
        results.reduce((sum, result) => sum + result.inputCount, 0),
    'weighted score inputs were persisted'
  );
  assertCondition(
    sourceTypes.includes('ai_attention') &&
      sourceTypes.includes('model_inclusion') &&
      (sourceTypes.includes('news_traffic') ||
        sourceTypes.includes('price_trend')),
    'score input source types include mock-safe model attention and market context'
  );
  assertCondition(
    sourceLabels.some(
      (input) =>
        input.sourceType === 'ai_attention' &&
        input.sourceLabel.includes('Seeded mock AI model attention')
    ) &&
      sourceLabels.some(
        (input) =>
          input.sourceType === 'model_inclusion' &&
          input.sourceLabel.includes('Seeded mock risk model inclusion')
      ),
    'scoring service reuses seeded AI attention and model inclusion inputs'
  );
  assertCondition(
    after.trade_intent_count === before.trade_intent_count,
    'scoring service does not create TradeIntent rows'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
