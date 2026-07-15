/**
 * Verifies the BK-088 rebalance decision record contract remains mock-only
 * and aligned with the current decision engine and TradeIntent policy helpers.
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

const recordContract = readText('docs/domain/rebalance-decision-record.md');
const transitionDoc = readText(
  'docs/domain/allocation-trade-intent-state-transitions.md'
);
const decisionEngine = readText('lib/domain/decision/mock-decision-engine.ts');
const policyHelper = readText('lib/domain/portfolio/trade-intent-policy.ts');
const decisionSmoke = readText('scripts/smoke/mock-decision-engine-smoke.ts');
const portfolioData = readText('docs/mock-data/portfolio-deposit-data.md');

[
  'AllocationDecision',
  'TradeIntentPolicyCheckResult',
  'TradeIntentDto',
  'PortfolioMandate',
  'recordPublicId',
  'allocationDecisionPublicId',
  'modelVersionPublicId',
  'portfolioPublicId',
  'rationaleSummary',
  'policyDecision',
  'policyReasons',
  'policyWarnings',
  'auditAction',
  'sourceQuotePublicId',
  'sourceNewsEventPublicIds',
  'generatedAt',
  'mock-only source data',
  'pre-order simulation only',
  'not a real order',
  'not submitted to a broker',
  'no execution',
  'no fill',
  'no settlement',
  'no real deposit or cash movement',
  'no brokerage account connection',
  'no external paid API',
  'mock-decision-engine-smoke.ts',
  'rebalance-decision-record-smoke.ts'
].forEach((needle) => {
  assertIncludes(recordContract, needle, `record contract documents ${needle}`);
});

assertIncludes(
  transitionDoc,
  'rebalance-decision-record.md',
  'state-transition document links the rebalance decision record'
);

[
  'rationaleSummary',
  'sourceQuote',
  'sourceNewsEvents',
  'policyCheck',
  'Mock decision engine output is pre-order simulation only',
  'does not submit real orders, move funds, or connect brokerage accounts'
].forEach((needle) => {
  assertIncludes(decisionEngine, needle, `decision engine keeps ${needle}`);
});

[
  'auditAction',
  'trade_intent_approved_for_simulation',
  'trade_intent_blocked',
  'trade_intent_real_order_blocked',
  'safetyBoundary'
].forEach((needle) => {
  assertIncludes(policyHelper, needle, `policy helper keeps ${needle}`);
});

[
  'ready_for_simulation',
  'approved_for_simulation',
  'mandate violation should block allocation decision',
  'pre-order simulation boundary',
  'warnings should avoid execution-like wording'
].forEach((needle) => {
  assertIncludes(decisionSmoke, needle, `decision smoke covers ${needle}`);
});

[
  'Recent Pre-Order TradeIntents',
  'These records are not orders.',
  'must never be sent to broker APIs',
  'shown as executions',
  'described as fills'
].forEach((needle) => {
  assertIncludes(portfolioData, needle, `portfolio mock data keeps ${needle}`);
});
