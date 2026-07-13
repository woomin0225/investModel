<!--
This harness-linked document defines how AllocationDecision and TradeIntent move through the mock-only decision pipeline.
AI workers must read this before implementing decision-engine APIs, loaders, tests, or UI copy that touches pre-order simulation.
-->

# AllocationDecision And TradeIntent State Transitions

## Scope

This document defines the boundary from AI model analysis to `TradeIntent` creation for the MVP. The pipeline is mock-only and mobile/PWA-first. It must never create, submit, execute, fill, settle, or reconcile a real securities order.

`AllocationDecision` is model-generated allocation analysis. `TradeIntent` is a pre-order simulation intent created after policy checks. Both are upstream of any future brokerage integration.

## Canonical Status Names

The TypeScript contract in `lib/domain/types.ts` is the current source for public domain status names.

### AllocationDecisionStatus

| Status | Meaning | User visible? | New actions |
| --- | --- | --- | --- |
| `draft` | A model has produced an allocation analysis candidate, but policy checks have not completed. | no | policy check can start |
| `policy_checked` | The candidate passed MVP policy checks and can be converted into simulated intent records. | limited | create simulated `TradeIntent` records |
| `blocked` | The candidate failed a policy, mandate, disclosure, model state, or mock portfolio guard. | yes, as a warning | no simulated trade intent |
| `ready_for_simulation` | Simulated trade intents were created and are ready for mock portfolio preview. | yes | display in simulated portfolio context |

### TradeIntentStatus

| Status | Meaning | User visible? | New actions |
| --- | --- | --- | --- |
| `pending_policy_check` | A pre-order simulation intent exists but has not passed policy checks. | no | approve or block |
| `approved_for_simulation` | The intent is allowed to affect mock portfolio projections only. | yes | display simulated effect |
| `blocked` | The intent failed a policy, mandate, model state, data, or compliance guard. | yes, as a warning | no simulated effect |
| `cancelled` | The simulated intent was cancelled by the system or a later model/portfolio state change. | historical only | no new action |

## AllocationDecision Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `draft` | decision-engine | `allocation_decision_created` | model version is `live`; portfolio is mock-only |
| `draft` | `policy_checked` | decision-engine | `allocation_decision_policy_checked` | all mandatory policy checks pass |
| `draft` | `blocked` | decision-engine/compliance | `allocation_decision_blocked` | any mandatory policy check fails |
| `policy_checked` | `ready_for_simulation` | decision-engine | `allocation_decision_ready_for_simulation` | one or more simulated `TradeIntent` records created |
| `policy_checked` | `blocked` | decision-engine/compliance | `allocation_decision_blocked_after_check` | late policy, data, or disclosure guard fails |

`ready_for_simulation` does not mean a real order is ready. It means the app can show a simulated portfolio preview with explicit mock labels.

## TradeIntent Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `pending_policy_check` | decision-engine | `trade_intent_created` | parent `AllocationDecision` is `policy_checked` |
| `pending_policy_check` | `approved_for_simulation` | decision-engine | `trade_intent_approved_for_simulation` | instrument, mandate, leverage, and mock portfolio checks pass |
| `pending_policy_check` | `blocked` | decision-engine/compliance | `trade_intent_blocked` | any policy check fails |
| `approved_for_simulation` | `cancelled` | user/system/admin | `trade_intent_cancelled` | model, portfolio, or selection becomes paused, revoked, blocked, suspended, or retired |
| `blocked` | `cancelled` | system/admin | `trade_intent_blocked_cancelled` | historical cleanup only; keep audit trail |

There is intentionally no transition from `approved_for_simulation` to `submitted`, `executed`, `filled`, or `settled`.

## Mandatory Policy Checks

Before an `AllocationDecision` becomes `policy_checked` or a `TradeIntent` becomes `approved_for_simulation`, the backend must verify:

- The `InvestmentModel` and selected `ModelVersion` are `live`.
- The user selection is active and still points to the reviewed model version.
- The target portfolio is a mock portfolio, not a real account.
- The mock deposit state allows simulated allocation and has no payment, bank, custody, or brokerage identifier.
- The `PortfolioMandate` permits the asset class, market, instrument type, and leverage exposure.
- The model disclosure includes risk, performance, limitation, and legal-placeholder context.
- The intent has a deterministic source signal or decision rationale for audit review.
- No real broker, payment, custody, order, account, or settlement integration is present in the request payload.
- High-risk or leveraged exposure is marked for warning display before simulation.
- Required mock market/news inputs are available; missing data must block or cancel the simulation.

## Forbidden States And Labels

Do not introduce these states, table columns, DTO fields, API names, or UI labels for this MVP pipeline:

- `order_submitted`
- `broker_submitted`
- `executed`
- `filled`
- `settled`
- `paid`
- `withdrawable`
- `real_balance`
- `broker_order_id`
- `execution_id`
- `account_number`

If a future real trading product is approved, it must use a separate checklist, legal/compliance review, and new domain boundary. It must not be added by extending `TradeIntent`.

## API Guard Rules

| API or service | Guard |
| --- | --- |
| `POST /api/decision-engine/allocation-decisions` | system/internal only; model version must be `live`; portfolio must be mock-only |
| `POST /api/decision-engine/allocation-decisions/:id/policy-check` | system/internal only; record every failed guard as audit metadata |
| `POST /api/decision-engine/trade-intents` | system/internal only; parent decision must be `policy_checked` |
| `POST /api/decision-engine/trade-intents/:id/approve-simulation` | system/internal only; never call external broker/payment services |
| `POST /api/decision-engine/trade-intents/:id/cancel` | user/system/admin according to ownership and review context; keep historical audit |
| `GET /api/portfolio/mock-summary` | user only; show simulated effects from `approved_for_simulation` only |

Public APIs may expose simulated summaries, but they must not expose internal policy notes, external-account placeholders, or language that implies a user can place real trades.

## User-Facing Copy Rules

Required labels:

- `pre-order simulation`
- `simulated trade intent`
- `mock portfolio preview`
- `not submitted to a broker`
- `not a real order`

Forbidden labels:

- `order placed`
- `trade executed`
- `filled`
- `settled`
- `cash available`
- `broker balance`
- `live trading`

## Audit Events

| Event | Result |
| --- | --- |
| `allocation_decision_created` | `allowed` |
| `allocation_decision_policy_checked` | `allowed` |
| `allocation_decision_blocked` | `policy_blocked` or `review_required` |
| `allocation_decision_ready_for_simulation` | `allowed` |
| `allocation_decision_blocked_after_check` | `policy_blocked` or `review_required` |
| `trade_intent_created` | `allowed` |
| `trade_intent_approved_for_simulation` | `allowed` |
| `trade_intent_blocked` | `policy_blocked` or `review_required` |
| `trade_intent_cancelled` | `allowed` |
| `trade_intent_real_order_blocked` | `policy_blocked` |

`trade_intent_real_order_blocked` should be recorded if any code path attempts to attach broker, execution, payment, account, or settlement data to `TradeIntent`.

## Follow-Up Links

- `BK-146`: convert these transitions into tests and fixture assertions.
- `BK-133`: align mock loaders and DTO labels with these status names.
- `BK-059`: keep API naming consistent with the pre-order simulation boundary.
