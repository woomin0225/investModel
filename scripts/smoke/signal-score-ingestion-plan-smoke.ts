/**
 * Verifies the BK-301 mock signal score ingestion contract stays documented
 * and aligned with the current scoring service boundary.
 */

import fs from 'fs';
import path from 'path';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertIncludes(text: string, needle: string, message: string) {
  assertCondition(text.includes(needle), message);
}

const plan = readText(
  'docs/database/seeds/signal-score-mock-ingestion-job.md'
);
const seedReadme = readText('docs/database/seeds/README.md');
const scoringService = readText('lib/db/signal-scoring-service.ts');
const scoringSmoke = readText('scripts/smoke/signal-scoring-service-smoke.ts');

[
  'runId',
  'idempotency',
  'actor=system',
  'audit',
  'calculateMockSignalScoreSnapshots',
  'signal_score_snapshots',
  'signal_score_inputs',
  'rank_delta',
  'mock_seed',
  'scheduled_mock',
  'external_review_required',
  'No external paid API keys',
  'No `TradeIntent` creation',
  'No portfolio, MockDeposit, broker, bank, order, execution, fill, or account',
  'Verification Query'
].forEach((needle) => {
  assertIncludes(plan, needle, `plan documents ${needle}`);
});

assertIncludes(
  seedReadme,
  'signal-score-mock-ingestion-job.md',
  'seed README links the mock ingestion plan'
);

assertIncludes(
  scoringService,
  'export async function calculateMockSignalScoreSnapshots',
  'scoring service exports mock ingestion entrypoint'
);
assertIncludes(
  scoringService,
  'does not fetch external data, create TradeIntent rows, place orders, or alter portfolios',
  'scoring service keeps no external/order/portfolio boundary'
);
assertIncludes(
  scoringService,
  "calculationContext: 'mock_seed'",
  'current scoring service persists mock_seed context'
);
assertIncludes(
  scoringSmoke,
  'after.trade_intent_count === before.trade_intent_count',
  'existing scoring smoke guards against TradeIntent creation'
);

