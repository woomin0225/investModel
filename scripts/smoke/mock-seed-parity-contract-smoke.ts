/**
 * Verifies the BK-304 mock fixture and DB seed parity contract without writing
 * to MySQL or calling external providers.
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

function assertNotIncludes(text: string, needle: string, message: string) {
  assertCondition(!text.includes(needle), message);
}

const contract = readText('docs/mock-data/mock-seed-parity-contract.md');
const strategy = readText('docs/mock-data/mock-seed-loader-strategy.md');
const seed = readText('docs/database/seeds/001_invest_model_domain_seed.sql');
const discoveryMock = readText('lib/mock/invest-model-discovery.ts');
const feedMock = readText('lib/mock/invest-model-feed.ts');
const signalsMock = readText('lib/mock/invest-model-signals.ts');
const portfolioMock = readText('lib/mock/invest-model-portfolio.ts');

[
  'toDbSeedRows',
  'user_demo_001',
  'model_demo_signal_001',
  'model_version_demo_signal_001',
  'sig_mock_*',
  'feed_mock_*',
  'selection_demo_signal_001',
  'MockDeposit',
  'TradeIntent',
  'pre-order simulation',
  'blocked_policy_check',
  'no real deposit',
  'no real order',
  'no brokerage connection',
  'No external paid API'
].forEach((needle) => {
  assertIncludes(contract, needle, `contract documents ${needle}`);
});

[
  'mock-seed-parity-contract.md',
  'toDbSeedRows',
  'Loaders never call `fetch`, DB clients',
  'MockDeposit',
  'TradeIntent'
].forEach((needle) => {
  assertIncludes(strategy, needle, `strategy links or documents ${needle}`);
});

[
  'user_demo_001',
  'model_demo_signal_001',
  'model_version_demo_signal_001',
  'sig_mock_news_traffic_001',
  'sig_mock_price_trend_001',
  'sig_mock_risk_001',
  'feed_mock_001',
  'feed_mock_004',
  'selection_demo_signal_001',
  'mock_seed',
  'MockDeposit',
  'AllocationDecision',
  'TradeIntent',
  'blocked_policy_check',
  'rebalance_simulation',
  'not a real deposit, payment, bank transfer, or cash balance'
].forEach((needle) => {
  assertIncludes(seed, needle, `seed contains canonical ${needle}`);
});

[
  'Approved mock models only',
  'Backtest returns are placeholders',
  'do not trigger deposits, orders, or model execution',
  '$2.4M simulated'
].forEach((needle) => {
  assertIncludes(discoveryMock, needle, `discovery mock keeps ${needle}`);
});

[
  'Mock commentary',
  'without recommending trades',
  'not real assets',
  'separate from TradeIntent creation'
].forEach((needle) => {
  assertIncludes(feedMock, needle, `feed mock keeps ${needle}`);
});

[
  'Observation only',
  'Simulation input',
  'must not be interpreted as buy, sell, or hold recommendations',
  'TradeIntent or live orders'
].forEach((needle) => {
  assertIncludes(signalsMock, needle, `signals mock keeps ${needle}`);
});

[
  'isMockOnly',
  'MockDeposit',
  'pre-order simulation only',
  'Not a real deposit or cash balance',
  'No real deposit',
  'No live order',
  'No brokerage account'
].forEach((needle) => {
  assertIncludes(portfolioMock, needle, `portfolio mock keeps ${needle}`);
});

const paritySources = [
  discoveryMock,
  feedMock,
  signalsMock,
  portfolioMock
].join('\n');

[
  'realBalance',
  'brokerAccount',
  'orderExecution',
  'tradeFill',
  'brokerOrder'
].forEach((needle) => {
  assertNotIncludes(paritySources, needle, `parity sources avoid ${needle}`);
});
