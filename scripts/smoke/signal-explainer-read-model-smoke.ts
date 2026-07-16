/**
 * Verifies the BK-512 SignalEvent explainer seed/read-model fixture.
 * It does not require live market data, external paid APIs, brokers, bank
 * accounts, deposits, TradeIntent creation, or financial advice.
 */

import fs from 'fs';
import path from 'path';

import {
  readSignalExplainerSeedFixture,
  signalExplainerSeedFixture
} from '../../lib/db/signal-explainer-read-model';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertNotIncludes(text: string, needle: string, message: string) {
  assertCondition(!text.includes(needle), message);
}

async function main() {
  const firstRead = await readSignalExplainerSeedFixture();
  const secondRead = await readSignalExplainerSeedFixture();
  const source = readText('lib/db/signal-explainer-read-model.ts');
  const sampleSql = readText(
    'docs/database/samples/signal-explainer-read-model.sample.sql'
  );
  const serialized = JSON.stringify(signalExplainerSeedFixture);

  assertCondition(
    firstRead.generatedFrom === 'deterministic_fixture' ||
      firstRead.generatedFrom === 'db_seed_projection',
    'explainer read model reports deterministic or DB seed source'
  );
  assertCondition(
    JSON.stringify(firstRead) === JSON.stringify(secondRead),
    'explainer fixture read is deterministic without MYSQL_URL'
  );
  assertCondition(
    firstRead.signalPublicId === 'sig_mock_news_traffic_001',
    'explainer fixture targets tracked SignalEvent public id'
  );
  assertCondition(
    firstRead.explanationTitle.includes('mock signal') &&
      firstRead.explanationSummary.includes('seeded') &&
      firstRead.explanationSummary.includes('does not create advice') &&
      firstRead.explanationSummary.includes('orders') &&
      firstRead.explanationSummary.includes('brokerage actions'),
    'explainer copy states seeded/mock and blocked real-finance boundaries'
  );
  assertCondition(
    firstRead.drivers.length >= 3 &&
      firstRead.drivers.some((driver) => driver.sourceType === 'news_traffic') &&
      firstRead.drivers.some((driver) => driver.sourceType === 'ai_attention') &&
      firstRead.drivers.every(
        (driver) =>
          driver.normalizedScore >= 0 &&
          driver.normalizedScore <= 100 &&
          driver.weight > 0 &&
          driver.contributionLabel.includes('weighted mock points')
      ),
    'explainer fixture exposes bounded mock score drivers'
  );
  assertCondition(
    firstRead.scoreSnapshot.calculationContext === 'mock_seed' &&
      firstRead.scoreSnapshot.totalScoreLabel.includes('mock score') &&
      firstRead.scoreSnapshot.rankLabel.includes('#'),
    'explainer fixture exposes mock score snapshot context'
  );
  assertCondition(
    firstRead.safetyMeta.mockOnly === true &&
      firstRead.safetyMeta.simulated === true &&
      firstRead.safetyMeta.observedInputsOnly === true &&
      firstRead.safetyMeta.liveMarketData === false &&
      firstRead.safetyMeta.externalPaidApi === false &&
      firstRead.safetyMeta.tradeIntentCreated === false &&
      firstRead.safetyMeta.realOrder === false &&
      firstRead.safetyMeta.brokerageConnection === false &&
      firstRead.safetyMeta.financialAdvice === false,
    'explainer fixture keeps mock-only safety meta'
  );
  assertCondition(
    sampleSql.includes('signal_score_inputs') &&
      sampleSql.includes('driver_source_type') &&
      sampleSql.includes('driver_evidence_label') &&
      sampleSql.includes('mock_seed') &&
      sampleSql.includes('sig_mock_news_traffic_001'),
    'sample SQL documents the explainer read-model projection'
  );

  [
    'brokerAccount',
    'broker_account',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'tradeFill',
    'orderExecution',
    'brokerOrder',
    'liveQuoteProvider',
    'externalApiKey',
    'realBalance',
    'buySignal',
    'sellSignal',
    'holdRecommendation'
  ].forEach((needle) => {
    assertNotIncludes(source, needle, `explainer source avoids ${needle}`);
    assertNotIncludes(serialized, needle, `explainer fixture avoids ${needle}`);
    assertNotIncludes(sampleSql, needle, `explainer sample avoids ${needle}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
