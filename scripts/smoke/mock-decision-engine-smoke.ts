import { createMockDecisionEngine } from '@/lib/domain/decision/mock-decision-engine';
import { createMockMarketDataProvider } from '@/lib/domain/signals/market-data-provider';
import { createMockNewsTrafficProvider } from '@/lib/domain/signals/news-traffic-provider';
import type { PortfolioMandate } from '@/lib/domain/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const mandate: PortfolioMandate = {
  modelVersionPublicId: 'model_version_mock_alpha',
  allowedAssetClasses: ['equity', 'etf'],
  prohibitedAssetClasses: ['crypto'],
  allowedMarkets: ['US'],
  rebalancePolicy: 'Mock monthly review only',
  mandateSummary:
    'Mock model may simulate US equity and ETF exposure without real order execution.'
};

const allowedPolicyContext = {
  modelIsLive: true,
  userSelectionIsActive: true,
  portfolioIsMockOnly: true,
  mockDepositAllowsAllocation: true,
  disclosureReviewed: true
};

async function main() {
  const engine = createMockDecisionEngine(
    createMockMarketDataProvider(),
    createMockNewsTrafficProvider()
  );

  const allowedResult = await engine.run({
    modelVersionPublicId: 'model_version_mock_alpha',
    portfolioPublicId: 'portfolio_mock_user_1',
    symbols: ['NVDA', 'QQQ'],
    market: 'US',
    mandate,
    policyContext: allowedPolicyContext,
    generatedAt: '2026-07-14T00:40:00+09:00'
  });

  assert(
    allowedResult.allocationDecision.decisionStatus === 'ready_for_simulation',
    'allowed mock inputs should produce ready_for_simulation decision'
  );
  assert(
    allowedResult.tradeIntents.length === 2,
    'allowed mock inputs should produce two simulated TradeIntent records'
  );
  assert(
    allowedResult.tradeIntents.every(
      (item) =>
        item.tradeIntent.status === 'approved_for_simulation' &&
        item.tradeIntent.userFacingLabel === 'simulated trade intent' &&
        item.tradeIntent.persistence === 'not_persisted' &&
        item.tradeIntent.safetyBoundary.noBrokerSubmission &&
        item.policyCheck.decision === 'allowed'
    ),
    'trade intents should remain approved simulation DTOs only'
  );
  assert(
    allowedResult.sourceSummary.isMockOnly,
    'decision source summary should be mock-only'
  );
  assert(
    allowedResult.warnings.some((warning) =>
      warning.includes('pre-order simulation only')
    ),
    'decision output should warn about pre-order simulation boundary'
  );
  assert(
    allowedResult.warnings.every(
      (warning) =>
        !/\bexecute|executed|broker order|payment|settlement\b/i.test(warning)
    ),
    'warnings should avoid execution-like wording'
  );

  const blockedResult = await engine.run({
    modelVersionPublicId: 'model_version_mock_alpha',
    portfolioPublicId: 'portfolio_mock_user_1',
    symbols: ['TQQQ'],
    market: 'US',
    mandate: {
      ...mandate,
      allowedAssetClasses: ['equity'],
      prohibitedAssetClasses: ['etf']
    },
    policyContext: allowedPolicyContext,
    generatedAt: '2026-07-14T00:40:00+09:00'
  });

  assert(
    blockedResult.allocationDecision.decisionStatus === 'blocked',
    'mandate violation should block allocation decision'
  );
  assert(
    blockedResult.tradeIntents[0]?.tradeIntent.status === 'blocked',
    'mandate violation should block trade intent simulation'
  );
  assert(
    blockedResult.tradeIntents[0]?.policyCheck.reasons.some((reason) =>
      reason.includes('PortfolioMandate')
    ),
    'blocked policy check should explain mandate violation'
  );

  console.log(
    `mock-decision-engine smoke passed: ${allowedResult.tradeIntents.length} simulated intents, blocked status ${blockedResult.tradeIntents[0]?.tradeIntent.status}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
