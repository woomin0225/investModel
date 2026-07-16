/**
 * Verifies the BK-541 Signal detail seed/read-model artifacts.
 * This is a source-level guard for mock_seed observed driver breakdowns.
 * It does not require live market data, paid APIs, brokers, bank accounts,
 * deposits, TradeIntent creation, orders, or financial advice.
 */

import fs from 'fs';
import path from 'path';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertIncludes(text: string, needle: string, label: string) {
  assert(text.includes(needle), `${label} must include ${needle}`);
}

function assertNotIncludes(text: string, needle: string, label: string) {
  assert(!text.includes(needle), `${label} must not include ${needle}`);
}

function main() {
  const seedSql = readText('docs/database/seeds/009_signal_detail_seed.sql');
  const sampleSql = readText(
    'docs/database/samples/signal-detail-read-model.sample.sql'
  );
  const seedsReadme = readText('docs/database/seeds/README.md');
  const samplesReadme = readText('docs/database/samples/README.md');

  for (const signalPublicId of [
    'sig_mock_news_traffic_001',
    'sig_mock_price_trend_001',
    'sig_mock_risk_001'
  ]) {
    assertIncludes(seedSql, signalPublicId, '009 signal detail seed');
    assertIncludes(sampleSql, signalPublicId, 'signal detail sample SQL');
  }

  for (const expected of [
    'signal_score_snapshots',
    'signal_score_inputs',
    'model_signal_events',
    'mock_seed',
    'Observed-only',
    'source_label',
    'normalized_score',
    'weight'
  ]) {
    assertIncludes(seedSql, expected, '009 signal detail seed');
  }

  for (const expected of [
    'signal_public_id',
    'model_version_public_id',
    'model_public_id',
    'linked_model_name',
    'model_versions',
    'investment_models',
    'market_instruments',
    'source_label',
    'observed_driver_label',
    'driver_normalized_score',
    'driver_weight',
    'safety_boundary',
    'no advice',
    'no TradeIntent',
    'no order',
    'no brokerage',
    'no live external data'
  ]) {
    assertIncludes(sampleSql, expected, 'signal detail sample SQL');
  }

  assertIncludes(seedsReadme, '009_signal_detail_seed.sql', 'seed README');
  assertIncludes(
    samplesReadme,
    'signal-detail-read-model.sample.sql',
    'sample README'
  );

  const combined = `${seedSql}\n${sampleSql}`;
  for (const forbidden of [
    'brokerAccount',
    'broker_account',
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'paymentIntent',
    'checkout',
    'tradeFill',
    'orderExecution',
    'brokerOrder',
    'liveQuoteProvider',
    'externalApiKey',
    'realBalance',
    'buySignal',
    'sellSignal',
    'holdRecommendation',
    'suitabilityScore'
  ]) {
    assertNotIncludes(combined, forbidden, 'signal detail seed artifacts');
  }

  console.log('signal-detail-read-model smoke passed');
}

main();
