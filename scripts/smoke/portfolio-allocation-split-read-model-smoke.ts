import { readFileSync } from 'node:fs';

import {
  portfolioAllocationSplitSeedFixture,
  readInvestModelPortfolioAllocationSplit
} from '@/lib/db/portfolio-allocation-split-read-model';

delete process.env.MYSQL_URL;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function valueFromLabel(label: string) {
  const numeric = Number.parseFloat(label.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function percentFromWeight(label: string) {
  const numeric = Number.parseFloat(label.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

async function main() {
  const first = await readInvestModelPortfolioAllocationSplit();
  const second = await readInvestModelPortfolioAllocationSplit();

  assert(JSON.stringify(first) === JSON.stringify(second), 'read model must be deterministic');
  assert(first.isMockOnly === true, 'allocation split must be mock only');
  assert(first.safetyMeta.mockOnly === true, 'safety meta must stay mock only');
  assert(first.safetyMeta.realDeposit === false, 'real deposits must be disabled');
  assert(first.safetyMeta.realBalance === false, 'real balances must be disabled');
  assert(first.safetyMeta.realOrder === false, 'real orders must be disabled');
  assert(first.safetyMeta.brokerageConnection === false, 'brokerage connection must be disabled');
  assert(first.safetyMeta.financialAdvice === false, 'financial advice must be disabled');

  assert(
    portfolioAllocationSplitSeedFixture.totalMarketValue === 78000,
    'BK-508 fixture must stay anchored to the 78000 USD holdings seed total'
  );
  assert(first.summaryAlignment.holdingsTotalLabel === '$78,000 simulated', 'holdings total label mismatch');
  assert(first.summaryAlignment.bucketTotalLabel === '$78,000 simulated', 'bucket total label mismatch');

  const expectedHoldings = new Map([
    ['SAMPLE_AI_BASKET', 39000],
    ['QQQ', 23400],
    ['SHV', 15600]
  ]);
  for (const holding of portfolioAllocationSplitSeedFixture.holdings) {
    assert(
      expectedHoldings.get(holding.symbol) === holding.marketValue,
      `${holding.symbol} holding value must match 005 seed`
    );
  }

  assert(first.sectorBuckets.length === 3, 'sector buckets must cover the three seed holdings');
  assert(first.assetClassBuckets.length === 3, 'asset-class buckets must cover the three seed holdings');
  assert(
    first.sectorBuckets.every((bucket) => bucket.safetyLabel === 'simulated allocation bucket'),
    'sector buckets must keep simulated safety labels'
  );
  assert(
    first.assetClassBuckets.every((bucket) => bucket.safetyLabel === 'simulated allocation bucket'),
    'asset-class buckets must keep simulated safety labels'
  );

  const sectorValueTotal = first.sectorBuckets.reduce(
    (total, bucket) => total + valueFromLabel(bucket.valueLabel),
    0
  );
  const assetClassValueTotal = first.assetClassBuckets.reduce(
    (total, bucket) => total + valueFromLabel(bucket.valueLabel),
    0
  );
  const sectorWeightTotal = first.sectorBuckets.reduce(
    (total, bucket) => total + percentFromWeight(bucket.weightLabel),
    0
  );
  const assetClassWeightTotal = first.assetClassBuckets.reduce(
    (total, bucket) => total + percentFromWeight(bucket.weightLabel),
    0
  );

  assert(sectorValueTotal === 78000, 'sector bucket values must sum to 78000');
  assert(assetClassValueTotal === 78000, 'asset-class bucket values must sum to 78000');
  assert(sectorWeightTotal === 100, 'sector bucket weights must sum to 100');
  assert(assetClassWeightTotal === 100, 'asset-class bucket weights must sum to 100');

  for (const label of ['AI infrastructure', 'Broad technology', 'Cash / T-bills']) {
    assert(
      first.sectorBuckets.some((bucket) => bucket.label === label),
      `missing sector bucket: ${label}`
    );
  }
  for (const label of ['equity_basket', 'equity_etf', 'cash_like_etf']) {
    assert(
      first.assetClassBuckets.some((bucket) => bucket.label === label),
      `missing asset-class bucket: ${label}`
    );
  }

  const { safetyMeta: _safetyMeta, ...payloadWithoutSafetyMeta } = first;
  const serialized = JSON.stringify(payloadWithoutSafetyMeta);
  const forbiddenPayloadTerms = [
    'riskTolerance',
    'riskSetting',
    'preference',
    'brokerAccount',
    'accountNumber',
    'orderExecution',
    'tradeFill',
    'paymentIntent',
    'checkout',
    'realBalance',
    'confirmedHolding'
  ];
  for (const term of forbiddenPayloadTerms) {
    assert(!serialized.includes(term), `allocation split payload must not include ${term}`);
  }

  const seedSql = readFileSync(
    'docs/database/seeds/006_portfolio_allocation_split_seed.sql',
    'utf8'
  );
  const sampleSql = readFileSync(
    'docs/database/samples/portfolio-allocation-split-read-model.sample.sql',
    'utf8'
  );
  for (const expected of ['SAMPLE_AI_BASKET', 'QQQ', 'SHV', '78000.00']) {
    assert(seedSql.includes(expected), `006 seed guard must mention ${expected}`);
    assert(sampleSql.includes(expected), `allocation sample SQL must mention ${expected}`);
  }
  assert(
    seedSql.toLowerCase().includes('verification-only') &&
      seedSql.includes('insert rows'),
    '006 seed guard must document that it is verification-only'
  );

  console.log('portfolio-allocation-split-read-model smoke passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
