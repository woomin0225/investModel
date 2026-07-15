# Rebalance Decision Record

This document defines the BK-088 rebalance decision record for the mock-only
decision pipeline. It records why a simulated allocation changed, but it does
not create a real rebalance order.

## Scope

The record is derived from the current mock decision engine output:

- `AllocationDecision`
- `TradeIntentPolicyCheckResult`
- simulated `TradeIntentDto`
- mock market quote evidence
- mock news traffic evidence
- `PortfolioMandate`

The record is a backend/audit contract. It may later become a DB row or audit
event payload, but this work does not add a table, migration, seed row, broker
integration, or order execution path.

## Required Fields

| Field | Source | Purpose |
| --- | --- | --- |
| `recordPublicId` | generated public id | Stable external reference for review and support |
| `allocationDecisionPublicId` | `AllocationDecision.publicId` | Links the reason record to the simulated decision |
| `modelVersionPublicId` | `AllocationDecision.modelVersionPublicId` | Identifies the reviewed model version |
| `portfolioPublicId` | `AllocationDecision.portfolioPublicId` | Identifies the mock portfolio only |
| `decisionStatus` | `AllocationDecision.decisionStatus` | Shows `ready_for_simulation` or `blocked` |
| `rationaleSummary` | `AllocationDecision.rationaleSummary` | Explains why the model considered a change |
| `policyDecision` | `TradeIntentPolicyCheckResult.decision` | Records allowed, review-required, or blocked policy result |
| `policyReasons` | `TradeIntentPolicyCheckResult.reasons` | Keeps human-readable blocked reasons |
| `policyWarnings` | `TradeIntentPolicyCheckResult.warnings` | Keeps high-risk or leverage warnings |
| `auditAction` | `TradeIntentPolicyCheckResult.auditAction` | Connects to audit log vocabulary |
| `sourceQuotePublicId` | mock market quote/instrument id | Evidence from mock market input |
| `sourceNewsEventPublicIds` | mock news traffic ids | Evidence from mock news input |
| `generatedAt` | decision engine timestamp | Deterministic review timestamp |
| `safetyBoundary` | `tradeIntentSafetyBoundary` | Proves no broker, order, fill, or settlement side effect |

## Allowed Statuses

- `ready_for_simulation`
- `blocked`
- `approved_for_simulation`
- `pending_policy_check`

These statuses are mock decision states only. They must not be renamed to order
states.

## Required Safety Boundary

Every record must preserve these facts:

- mock-only source data
- pre-order simulation only
- not a real order
- not submitted to a broker
- no execution
- no fill
- no settlement
- no real deposit or cash movement
- no brokerage account connection
- no external paid API

## Representative Record Shape

```ts
type RebalanceDecisionRecord = {
  recordPublicId: string;
  allocationDecisionPublicId: string;
  modelVersionPublicId: string;
  portfolioPublicId: string;
  decisionStatus: 'ready_for_simulation' | 'blocked';
  rationaleSummary: string;
  policyDecision: 'allowed' | 'policy_blocked' | 'review_required';
  policyReasons: string[];
  policyWarnings: string[];
  auditAction:
    | 'trade_intent_approved_for_simulation'
    | 'trade_intent_blocked'
    | 'trade_intent_real_order_blocked';
  sourceQuotePublicId: string;
  sourceNewsEventPublicIds: string[];
  generatedAt: string;
  safetyBoundary: {
    mockOnly: true;
    noBrokerSubmission: true;
    noRealOrder: true;
    noExecution: true;
    noSettlement: true;
  };
};
```

## Verification

Run these checks before treating rebalance-decision record work as done:

```bash
npx tsx scripts/smoke/mock-decision-engine-smoke.ts
npx tsx scripts/smoke/rebalance-decision-record-smoke.ts
```

The first smoke verifies the mock engine produces rationale and policy results.
The second smoke verifies this record contract stays aligned with the engine,
policy helper, state-transition document, and portfolio mock data.
