# Pre-Release Integrated Review

This review is a BK-100 snapshot for investModel's current mobile-first MVP. It is not a public launch approval, legal approval, financial-operation approval, or production-readiness certification.

## Scope

- Review date: 2026-07-14
- Related tasks: BK-079, BK-080, BK-099, BK-100
- Review basis: product direction, security first review, release scope gates, feature review matrix, legal placeholder template
- Current target stage: Prototype, with selected Internal Alpha preparation

## Current Decision

| Stage | Current status | Reason |
| --- | --- | --- |
| Prototype | Allowed to continue | Mobile PWA mock flows, model discovery, model detail, signals, feed, creator/admin mock review, and docs are aligned with the MVP boundary. |
| Internal Alpha | Not ready yet | Auth/RBAC, DB-backed state, persisted audit logs, staging environment, and monitoring decisions need implementation or confirmation before broader internal use. |
| Closed Beta | Blocked | External users require stronger legal copy review, real device verification, incident handling, data retention rules, and beta access control. |
| Public Launch | Blocked | IS-001, IS-003, legal copy review, production monitoring, production secret handling, and public launch checks are not complete. |
| Financial-operation launch | Blocked | Real deposits, real orders, brokerage account connection, withdrawals, fills, settlement, and account linking remain outside the approved scope. |

## Release-Allowed Items

These items can continue in small implementation or documentation tasks under the current harness.

| Area | Allowed now | Guardrail |
| --- | --- | --- |
| Mobile PWA | Continue 390px-first route, bottom tab, safe area, and language toggle work | Keep real phone verification tracked by IS-003 |
| Mock model marketplace | Continue approved/live mock `InvestmentModel` browsing and detail UI | Keep pending or unreviewed mock models out of public discovery |
| Signals and feed | Continue observed `SignalEvent` and informational `FeedPost` surfaces | No buy, sell, hold, rebalance, recommendation, or guaranteed-return wording |
| Mock portfolio | Continue `MockDeposit`, simulated portfolio, and pre-order simulation UI | Never label mock money as cash, balance, deposit, custody, or brokerage holding |
| Creator/admin review | Continue draft, pending review, and admin review workflow design | Treat `ComplianceReview` as workflow state, not final legal suitability approval |
| API and DTO contracts | Continue mock-backed DTO and route contract work | Do not expose raw DB rows; keep mock/backtest/context fields explicit |
| Documentation and QA | Continue small docs, smoke checks, and checklist updates | Keep one work unit per automation run and record Sheets/Runs |

## Release-Blocked Items

These items must not ship or be implemented without separate approval and recorded review gates.

| Blocked item | Required gate |
| --- | --- |
| Real deposits, withdrawals, payments, custody, or account balance handling | `financial_operation`, legal review, security review |
| Real brokerage connection, order execution, fills, settlement, or `TradeFill`-style domain objects | `financial_operation`, legal review, security review |
| User risk appetite, stock/bond ratio, leverage preference, or direct allocation controls | Product principle review |
| Final legal terms, final risk disclosure, suitability wording, or compliance claims | Qualified legal/compliance review |
| Guaranteed return, principal protection, no-loss, risk-free, or approved-advice wording | Legal/compliance review and likely scope change |
| Uploaded AI model file execution | Sandbox/security design and explicit approval |
| Paid external market/news/pricing APIs or production secrets | Secret-management and provider review |
| Public launch with unresolved IS-001 or IS-003 | Issue resolution or explicit launch waiver |

## Open Risks

| Issue | Status | Release impact |
| --- | --- | --- |
| IS-001 | Open | Blocks production build/key validation and any payment/pricing production-readiness claim. |
| IS-003 | Open | Blocks real-phone UX confidence and public/mobile launch readiness. |
| Legal copy | Review-bound | BK-099 defines placeholders only; final terms and public risk disclosures are not approved. |
| Audit persistence | Follow-up | Existing review notes mention returned audit payloads, but durable audit storage remains separate work. |
| Monitoring | Follow-up | Candidate review exists, but production monitoring is not enabled and no DSN/API key is connected. |

## Required Before Internal Alpha

- Confirm staging data, logs, monitoring, and secrets remain separated from production.
- Implement or verify auth and RBAC gates for creator/admin flows.
- Persist audit logs for model review and disclosure state changes.
- Keep all finance-like UI visibly mock, simulated, backtest, placeholder, or pre-order simulation.
- Keep final legal and financial copy review-bound.
- Run type checks and mobile route smoke checks after any code change.

## Required Before Closed Beta Or Public Launch

- Resolve IS-003 with actual phone verification.
- Resolve IS-001 or isolate the unrelated production pricing build blocker from investModel launch claims.
- Complete legal/compliance review for public terms, risk disclosures, performance methodology notes, and high-risk acknowledgements.
- Confirm production secret handling and monitoring without committing secret values.
- Define incident response, rollback, user support, and data retention procedures.
- Re-run product, security, compliance, and mobile UX review after the above gates.

## Verdict

investModel can continue as a mobile-first Prototype with mock and simulated flows. It should not be presented as ready for Public Launch, real trading, real deposits, brokerage connectivity, or final legal/compliance disclosure until the blocked gates and open issues are resolved.
