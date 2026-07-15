# Operator Review Manual

This is the BK-092 operator manual draft for model review and user report
handling. It gives operators a consistent process, but it is not final legal,
financial, suitability, or compliance advice.

## Scope

Operators use this manual when they review:

- creator-submitted `InvestmentModel` drafts and `ModelVersion` snapshots
- `ModelDisclosure` placeholder wording
- `PortfolioMandate` and `ModelRiskProfile` completeness
- model reports about misleading performance, missing risk disclosure,
  inappropriate claims, or other model-copy concerns
- admin actions such as request changes, reject, approve, pause, suspend, or
  retire

The manual does not authorize real deposits, real broker orders, brokerage
account connections, compensation decisions, legal conclusions, or final public
disclosure copy.

## Required Documents

Read these before making an operator decision:

- `docs/security/admin-review-audit.md`
- `docs/security/creator-review-flow.md`
- `docs/compliance/feature-review-matrix.md`
- `docs/compliance/legal-financial-placeholder-map.md`
- `docs/compliance/performance-copy-review.md`
- `docs/domain/domain-glossary.md`
- `docs/domain/investment-model-state-transitions.md`
- `docs/domain/model-version-disclosure-state-transitions.md`
- `docs/domain/allocation-trade-intent-state-transitions.md`
- `harness/risk-compliance-harness.md`

If these documents disagree, use the stricter rule and record the conflict as an
Issue or review note.

## Model Review Checklist

Before approving a submitted `ModelVersion`, confirm:

- model name and summary are understandable and not misleading
- `PortfolioMandate` lists target markets, allowed asset classes, prohibited
  assets, leverage policy, derivative policy, and rebalance policy
- `ModelRiskProfile` states leverage exposure, volatility/drawdown context, and
  high-risk indicators
- `ModelDisclosure` contains placeholders for risk, limitations, performance
  source, and review-required copy
- performance references are labeled as backtest, sample, mock, or placeholder
- no copy promises returns, avoids losses, claims legal approval, or says the
  model is suitable for every user
- no user-editable stock/bond ratio, leverage preference, or risk appetite is
  introduced
- no real deposit, withdrawal, broker, account, order, execution, fill, or
  settlement feature is implied

## Report Handling Checklist

When a user submits a `ModelReport`:

1. Confirm the report has reporter public id, model public id, report type, and
   summary.
2. Classify the concern as:
   - `misleading_performance`
   - `missing_risk_disclosure`
   - `inappropriate_claim`
   - `other`
3. Check whether the report includes forbidden fields such as legal conclusion,
   compensation, refund, account, payment, secret, order, broker order,
   execution, or API key data.
4. Route normal concerns to operator review with status `pending_review`.
5. Escalate legal wording, suitability, compensation, or regulated-claim issues
   to `legal_review` without finalizing copy.
6. Escalate secrets, private account data, abuse, or model-file execution issues
   to `security_review`.
7. Block any request that asks the app to place orders, move funds, connect
   accounts, or decide compensation.

## Decision Outcomes

| Outcome | Use when | Required note |
| --- | --- | --- |
| `request_changes` | Required model, risk, mandate, disclosure, or performance-source fields are missing or unclear | Mention exact missing fields |
| `reject` | Submission contains unsupported claims, hidden risk, prohibited language, or incomplete critical data | Mention policy category |
| `approve` | Required metadata and placeholder disclosure checks pass | State that this is not final legal approval |
| `pause` | Live model has operational issue, stale evidence, creator request, or temporary review need | State user-impact reason |
| `suspend` | Live model has policy risk, misleading claim, security issue, or urgent review need | State safety reason |
| `retire` | Model should leave the marketplace permanently or by creator/product decision | State active-selection impact |
| `escalate_legal_review` | Legal, suitability, compensation, or final disclosure judgement is needed | State reviewer needed |
| `escalate_security_review` | Secrets, account data, sandbox, model-file, or abuse concern is present | State data/security risk |
| `policy_blocked` | Real order, real deposit, real account, broker, execution, fill, or settlement is requested | State forbidden feature |

## Audit Requirements

Every operator decision must capture:

- `actorRole=admin`
- operator public id
- resource type and public id
- previous status and next status, when state changes
- stable action name
- result: `allowed`, `denied`, `policy_blocked`, or `review_required`
- reason code
- short note without secrets
- timestamp

Do not delete or hide material audit history. If an audit entry is wrong, append
a correction record rather than overwriting history.

## User-Facing Response Rules

Operators may say:

- "received for review"
- "changes requested"
- "review required"
- "temporarily paused"
- "suspended pending review"
- "not a broker order"
- "mock or simulated state only"

Operators must not say:

- "legally approved"
- "guaranteed return"
- "risk-free"
- "suitable for you"
- "order placed"
- "trade executed"
- "fill confirmed"
- "cash available"
- "broker account connected"
- "refund approved"

## Stop Conditions

Stop and record an Issue when a request needs:

- real fund movement
- real order placement or execution
- broker, bank, custody, exchange, or payment account connection
- secret, production credential, paid API key, or private external provider data
- legal suitability judgement or final disclosure wording
- compensation, refund, or damages decision
- uploaded model file execution before sandbox and security review

## Verification

Run the static manual smoke before closing manual changes:

```bash
npx tsx scripts/smoke/operator-review-manual-smoke.ts
```

The smoke checks this manual against admin review, creator review, feature
matrix, model-report validation, and admin-review-flow smoke boundaries.
