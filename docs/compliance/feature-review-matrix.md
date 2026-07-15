# Feature Review Matrix

<!--
This matrix classifies investModel features as allowed, blocked, legal review, security review, or financial-operation review.
Agents must check it before implementing financial, model, account, signal, disclosure, API, or automation work.
-->

## Status Legend

| Status | Meaning | Automation behavior |
| --- | --- | --- |
| `allowed` | Safe for the current mobile/PWA MVP when existing harness rules are followed. | Implement in small tasks with normal verification. |
| `blocked` | Not allowed in the current MVP. | Stop implementation and record an Issue if requested. |
| `legal_review` | Needs legal or financial-compliance review before implementation or final copy. | Document placeholder only; do not finalize behavior or claims. |
| `security_review` | Needs security, privacy, secret, sandbox, or abuse review. | Design only; do not connect live systems or secrets. |
| `financial_operation` | Could move money, connect accounts, or execute trades. | Stop implementation unless the user provides explicit approval and required reviews are recorded. |

## MVP Feature Matrix

| Feature or request | Status | MVP handling | Required evidence before implementation |
| --- | --- | --- | --- |
| Mobile PWA shell, safe area, bottom tabs, app icon, manifest | `allowed` | Build and verify on mobile-width screens. | Frontend harness and PWA checklist. |
| Approved/live mock model discovery | `allowed` | Show only approved/live mock `InvestmentModel` cards. | Mock labels, status filtering, model-marketplace rules. |
| Model detail with risk, mandate, disclosures, forbidden assets | `allowed` | Display model-owned risk and mandate data. | Clear risk copy, no suitability claim, disclosure placeholders when needed. |
| Mock balance or simulated portfolio display | `allowed` | Use `MockDeposit`, `Portfolio`, and explicit mock/simulated copy. | UI copy must not imply real cash, custody, or brokerage holdings. |
| Observed signal list from mock news, traffic, macro, or price inputs | `allowed` | Show `SignalEvent` as observed context only. | No buy/sell/hold recommendation wording. |
| Feed posts for model notes, market context, risk notes, review notes | `allowed` | Show informational `FeedPost` content. | No performance guarantee or trading encouragement. |
| Model selection in MVP | `allowed` | Store or simulate `UserModelSelection` for a specific model version. | Selection must not let users tune risk, stock ratio, bond ratio, or leverage. |
| API route inventory and DTO contracts | `allowed` | Document and implement mock-backed DTOs first. | DBML/type mapping and MVP scope docs. |
| Real deposits, payments, withdrawals, or bank account linking | `financial_operation` | Block in MVP. | Explicit user approval, legal review, security review, payment/banking architecture. |
| Real brokerage account connection | `financial_operation` | Block in MVP. | Explicit user approval, legal review, security review, broker integration design. |
| Real buy/sell order placement, execution, fills, settlement | `financial_operation` | Block in MVP. | Explicit user approval, legal review, security review, brokerage approval. |
| Introducing `Order`, `BrokerOrder`, `Execution`, or `TradeFill` domain types | `blocked` | Use `TradeIntent` only for pre-order simulation. | Separate reviewed scope change and checklist update. |
| User risk appetite, leverage preference, stock/bond ratio, or direct allocation controls | `blocked` | Do not add user-editable investment preference UI. | Product decision changing core model-owned mandate rule. |
| Uploaded AI model file execution | `security_review` | Metadata-only in MVP. Do not run files. | Sandbox, malware scanning, provenance, permissions, liability review. |
| Uploaded model file storage without execution | `security_review` | Design only unless explicitly approved. | Storage policy, scanning, access control, retention policy. |
| External paid market, news, traffic, or pricing API | `security_review` | Mock or static data first. | Secret management, provider terms, cost controls, provenance, rate limits. |
| Performance claims, rankings, or return marketing copy | `legal_review` | Use backtest/mock/placeholder labels only. | Reviewed disclosure text and measurement methodology. |
| High-risk or leveraged model publication | `legal_review` | Keep as mock or hidden unless reviewed. | Risk disclosure, admin review state, user acknowledgement design. |
| Legal disclaimer, terms, risk disclosure final text | `legal_review` | Placeholder only. | Legal counsel or approved compliance source. |
| Creator model draft and review workflow | `allowed` | Implement draft/pending-review/admin-review states without live trading. | RBAC and audit log rules. |
| Admin model approval, pause, suspend, retire actions | `security_review` | Design and guarded mock/admin workflow first. | RBAC matrix, audit log map, operator action records. |
| Audit log event creation for review or status changes | `allowed` | Design and implement for non-financial MVP state changes. | Actor, entity, action, before/after fields. |
| Scheduled automation that updates checklist, docs, mock data, or code | `allowed` | Keep one small work unit per run and commit/push. | Automation harness, Google Sheet run records. |
| Automation that creates money movement, orders, account connections, or secrets | `financial_operation` | Block and record an Issue. | Explicit approval plus all required reviews. |
| Native app packaging | `security_review` | Capacitor-first planning is allowed for an internal test app, but no native permissions or store release by default. | WebView source strategy, signing approach, update policy, privacy and device permission review. |
| App Store or Play Store submission | `security_review` | Keep as a separate release-readiness task after the internal native shell is validated. | Store policy, signing, support process, privacy policy, release notes, and legal/financial copy review. |

## Required Stop Checks

Before implementing a request, stop and record an Issue when any of these are true:

- The task needs a real bank, payment, broker, exchange, custody, or account connection.
- The task needs a secret, paid API key, production credential, webhook secret, or user private data source.
- The task changes `TradeIntent` into an executed order or creates order/fill terminology.
- The task asks Codex to decide legal suitability, legal approval, investment suitability, or final risk disclosure language.
- The task would hide mock/backtest/placeholder labels from money-like, performance-like, or trade-like UI.
- The task asks uploaded model files to run before sandbox and security review exist.

## Allowed Copy Patterns

Use these patterns in MVP UI and API documentation:

- "mock balance"
- "simulated portfolio"
- "backtest placeholder"
- "observed signal"
- "pre-order simulation"
- "metadata-only model artifact"
- "requires legal review"
- "not a broker order"

Avoid these patterns unless reviewed and explicitly approved:

- "guaranteed return"
- "approved investment advice"
- "real deposit"
- "live account balance"
- "order executed"
- "risk-free"
- "suitable for you"
- "legal approved"
