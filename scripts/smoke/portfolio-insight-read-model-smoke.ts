import { readFileSync } from 'node:fs';

import {
  portfolioInsightSeedFixture,
  readInvestModelPortfolioInsight,
  type PortfolioInsightSourceTable
} from '@/lib/db/portfolio-insight-read-model';

delete process.env.MYSQL_URL;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const first = await readInvestModelPortfolioInsight();
  const second = await readInvestModelPortfolioInsight();

  assert(JSON.stringify(first) === JSON.stringify(second), 'portfolio insight read model must be deterministic');
  assert(first.isMockOnly === true, 'portfolio insight must be mock only');
  assert(first.safetyMeta.mockOnly === true, 'safety meta must stay mock only');
  assert(first.safetyMeta.realDeposit === false, 'real deposits must be disabled');
  assert(first.safetyMeta.realBalance === false, 'real balances must be disabled');
  assert(first.safetyMeta.realOrder === false, 'real orders must be disabled');
  assert(first.safetyMeta.brokerageConnection === false, 'brokerage connection must be disabled');
  assert(first.safetyMeta.financialAdvice === false, 'financial advice must be disabled');

  const expectedSourceTables: PortfolioInsightSourceTable[] = [
    'allocation_decisions',
    'trade_intents',
    'portfolio_analysis_snapshots',
    'mock_deposits'
  ];

  for (const expected of expectedSourceTables) {
    assert(
      first.sourceTables.includes(expected),
      `portfolio insight sourceTables must include ${expected}`
    );
    assert(
      portfolioInsightSeedFixture.sourceTables.includes(expected),
      `portfolio insight seed fixture must include ${expected}`
    );
  }

  assert(first.allocationRationales.length === 3, 'must expose three rationale rows');
  assert(first.statusTimeline.length === 4, 'must expose four timeline rows');
  assert(
    first.allocationRationales.every(
      (rationale) => rationale.safetyLabel === 'mock rationale only'
    ),
    'rationale rows must keep mock safety labels'
  );
  assert(
    first.statusTimeline.every((item) => item.safetyLabel === 'read-only timeline'),
    'timeline rows must keep read-only labels'
  );
  assert(
    first.statusTimeline.some((item) => item.state === 'policy_blocked'),
    'timeline must include policy-blocked state'
  );
  assert(
    first.statusTimeline.every(
      (item) =>
        item.previousStatus.length > 0 &&
        item.nextStatus.length > 0 &&
        item.actorRole.length > 0 &&
        item.reasonCode.length > 0 &&
        item.changedAt.endsWith('Z')
    ),
    'timeline rows must expose status transition metadata'
  );

  const payloadWithoutSafetyMeta = {
    ...first,
    safetyMeta: undefined
  };
  const serialized = JSON.stringify(payloadWithoutSafetyMeta);
  const forbiddenPayloadTerms = [
    'brokerAccount',
    'accountNumber',
    'withdrawable',
    'orderExecution',
    'tradeFill',
    'paymentIntent',
    'checkout',
    'confirmedHolding',
    'suitabilityScore'
  ];
  for (const term of forbiddenPayloadTerms) {
    assert(!serialized.includes(term), `portfolio insight payload must not include ${term}`);
  }

  const seedSql = readFileSync(
    'docs/database/seeds/008_portfolio_insight_seed.sql',
    'utf8'
  );
  const sampleSql = readFileSync(
    'docs/database/samples/portfolio-insight-read-model.sample.sql',
    'utf8'
  );

  for (const expected of [
    'portfolio_analysis_snapshots',
    'allocation_decisions',
    'trade_intents',
    'mockOnly',
    'realDeposit',
    'realBalance',
    'realOrder',
    'brokerageConnection',
    'financialAdvice'
  ]) {
    assert(seedSql.includes(expected), `008 seed must mention ${expected}`);
    assert(sampleSql.includes(expected), `portfolio insight sample SQL must mention ${expected}`);
  }
  assert(
    seedSql.includes('Mock allocation rationale reviewed') &&
      seedSql.includes('Execution boundary blocked'),
    '008 seed must include rationale and timeline rows'
  );

  console.log('portfolio-insight-read-model smoke passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
