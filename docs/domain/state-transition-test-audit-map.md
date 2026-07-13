<!--
This document maps investModel state transitions to required test cases and audit log events.
AI workers must use it before implementing transition guards, route tests, fixtures, or audit-log assertions.
-->

# State Transition Test And Audit Map

## Scope

This map converts the current state-transition documents into testable backend expectations. It covers:

- `InvestmentModel`
- `ModelVersion`
- `ModelDisclosure`
- `UserModelSelection`
- `MockDeposit`
- `Portfolio`
- `AllocationDecision`
- `TradeIntent`

The map is intentionally implementation-neutral. It defines the minimum tests, fixtures, and audit assertions that future route handlers, services, and mock loaders must satisfy.

## Test Fixture Baseline

Every state-transition test suite should include these fixtures:

| Fixture | Required fields | Notes |
| --- | --- | --- |
| `creatorUser` | `publicId`, `role=creator` | owns the target draft model |
| `otherCreatorUser` | `publicId`, `role=creator` | must be denied from mutating another creator's model |
| `adminUser` | `publicId`, `role=admin` | can perform review and admin transitions |
| `regularUser` | `publicId`, `role=user` | can select live models and own mock portfolio state |
| `systemActor` | `role=system` | can create scheduled/mock audit events only |
| `liveModelVersion` | model, version, risk, mandate, disclosure | no real broker or account identifiers |
| `mockPortfolio` | user, model selection, mock deposit | portfolio status must start with `mock_` or documented mock state |
| `auditLogSink` | captures action, actor, result, entity ids, reason | must be asserted for every state-changing path |

Fixtures must not contain bank account numbers, card ids, brokerage ids, payment provider ids, broker order ids, execution ids, or settlement ids.

## Required Assertion Shape

Each transition test should assert:

| Assertion | Required check |
| --- | --- |
| `previousStatus` | original status is recorded and unchanged on blocked transitions |
| `nextStatus` | allowed transitions persist the expected next status |
| `actorRole` | only the documented actor can perform the transition |
| `reasonCode` | required for review, pause, suspend, retire, block, or reject paths |
| `auditAction` | exact audit action is emitted once |
| `auditResult` | `allowed`, `policy_blocked`, or `review_required` is recorded |
| `publicExposure` | user-facing queries expose only allowed statuses |
| `forbiddenSideEffect` | no real deposit, broker order, execution, fill, settlement, or account link is created |

## InvestmentModel Test Map

| Case id | Transition | Actor | Expected result | Audit action | Key assertions |
| --- | --- | --- | --- | --- | --- |
| `IM-001` | none -> `draft` | creator | allowed | `creator_model_draft_created` | creator owns model; not public |
| `IM-002` | `draft` -> `pending_review` | creator | allowed | `creator_model_review_submitted` | required draft fields complete |
| `IM-003` | `pending_review` -> `changes_requested` | admin | allowed | `admin_model_changes_requested` | reason code required |
| `IM-004` | `changes_requested` -> `pending_review` | creator | allowed | `creator_model_review_resubmitted` | prior review id required |
| `IM-005` | `pending_review` -> `rejected` | admin | allowed | `admin_model_review_rejected` | rejection reason required |
| `IM-006` | `pending_review` -> `approved` | admin | allowed | `admin_model_version_approved` | review checklist pass required |
| `IM-007` | `approved` -> `live` | admin | allowed | `admin_model_published_live` | approved version exists |
| `IM-008` | `live` -> `paused` | creator/admin | allowed | `creator_live_model_pause_requested` or `admin_model_paused` | user-impact reason required |
| `IM-009` | `paused` -> `live` | admin | allowed | `admin_model_resumed` | issue resolved or review complete |
| `IM-010` | `live` -> `suspended` | admin | allowed | `admin_model_suspended` | policy/safety reason required |
| `IM-011` | `live` -> `retired` | creator/admin | allowed | `creator_model_retirement_requested` or `admin_model_retired` | active selection impact recorded |
| `IM-012` | `draft` -> `live` | creator/admin | policy_blocked | `investment_model_transition_blocked` | status unchanged; no public exposure |
| `IM-013` | `retired` -> `live` | admin | policy_blocked | `investment_model_transition_blocked` | new version path required |

## ModelVersion And Disclosure Test Map

| Case id | Transition | Actor | Expected result | Audit action | Key assertions |
| --- | --- | --- | --- | --- | --- |
| `MV-001` | none -> `draft` | creator | allowed | `creator_model_version_created` | parent model owned by creator |
| `MV-002` | `draft` -> `pending_review` | creator | allowed | `creator_model_review_submitted` | snapshot frozen after submit |
| `MV-003` | `pending_review` -> `changes_requested` | admin | allowed | `admin_model_changes_requested` | reason code required |
| `MV-004` | `pending_review` -> `approved` | admin | allowed | `admin_model_version_approved` | checklist pass required |
| `MV-005` | `approved` -> `live` | admin | allowed | `admin_model_published_live` | old live version becomes `superseded` when applicable |
| `MV-006` | mutate submitted snapshot | creator | policy_blocked | `model_version_mutation_blocked` | pending-review snapshot unchanged |
| `MD-001` | `pending_review` -> `approved_placeholder` | admin | allowed | `admin_disclosure_placeholder_approved` | no final legal claim |
| `MD-002` | `pending_review` -> `legal_review_required` | admin | review_required | `admin_disclosure_legal_review_required` | sensitive wording reason required |
| `MD-003` | publish `legal_review_required` disclosure | admin/system | policy_blocked | `disclosure_publication_blocked` | not visible to users |

## User And Mock Portfolio Test Map

| Case id | Transition | Actor | Expected result | Audit action | Key assertions |
| --- | --- | --- | --- | --- | --- |
| `US-001` | none -> `draft` | user | allowed | `user_model_selection_started` | target model is `live` |
| `US-002` | `draft` -> `active` | user | allowed | `user_model_selection_activated` | risk acknowledgement recorded |
| `US-003` | `active` -> `paused` | user | allowed | `user_model_selection_paused` | user owns selection |
| `US-004` | `paused` -> `active` | user | allowed | `user_model_selection_resumed` | model version still `live` |
| `US-005` | `active` -> `revoked` | user | allowed | `user_model_selection_revoked` | no new allocation after revoke |
| `US-006` | select non-live model | user | policy_blocked | `user_model_selection_blocked` | no selection created |
| `MDP-001` | none -> `created` | user/system | allowed | `mock_deposit_created` | source type is `mock` |
| `MDP-002` | `created` -> `simulated_available` | system | allowed | `mock_deposit_marked_available` | no external payment reference |
| `MDP-003` | `simulated_available` -> `simulated_allocated` | system | allowed | `mock_deposit_allocated_to_portfolio` | linked to mock portfolio only |
| `MDP-004` | transition to `settled` or `paid` | any | policy_blocked | `mock_financial_operation_blocked` | no payment or settlement semantics |
| `PF-001` | none -> `mock_pending` | system | allowed | `mock_portfolio_created` | user selection exists |
| `PF-002` | `mock_pending` -> `mock_active` | system | allowed | `mock_portfolio_activated` | selection active and mock balance available |
| `PF-003` | `mock_active` -> `mock_blocked` | system/admin | review_required | `mock_portfolio_blocked` | policy/model/data reason recorded |
| `PF-004` | show broker balance fields | any | policy_blocked | `mock_financial_operation_blocked` | no broker balance/account id exposed |

## Decision Pipeline Test Map

| Case id | Transition | Actor | Expected result | Audit action | Key assertions |
| --- | --- | --- | --- | --- | --- |
| `AD-001` | none -> `draft` | decision-engine | allowed | `allocation_decision_created` | model version is `live`; portfolio mock-only |
| `AD-002` | `draft` -> `policy_checked` | decision-engine | allowed | `allocation_decision_policy_checked` | all mandatory checks pass |
| `AD-003` | `draft` -> `blocked` | decision-engine/compliance | policy_blocked | `allocation_decision_blocked` | failed guard recorded |
| `AD-004` | `policy_checked` -> `ready_for_simulation` | decision-engine | allowed | `allocation_decision_ready_for_simulation` | simulated trade intents created |
| `TI-001` | none -> `pending_policy_check` | decision-engine | allowed | `trade_intent_created` | parent decision is `policy_checked` |
| `TI-002` | `pending_policy_check` -> `approved_for_simulation` | decision-engine | allowed | `trade_intent_approved_for_simulation` | mandate, leverage, and mock portfolio checks pass |
| `TI-003` | `pending_policy_check` -> `blocked` | decision-engine/compliance | policy_blocked | `trade_intent_blocked` | failed guard recorded |
| `TI-004` | `approved_for_simulation` -> `cancelled` | user/system/admin | allowed | `trade_intent_cancelled` | model, portfolio, or selection unavailable |
| `TI-005` | attach broker/execution/payment data | any | policy_blocked | `trade_intent_real_order_blocked` | no broker order, execution, fill, settlement, payment, or account data saved |

## Public Read Tests

| Case id | Surface | Required assertion |
| --- | --- | --- |
| `READ-001` | Discover Models | returns `live` models only |
| `READ-002` | Model Detail | non-live model shows limited notice or is hidden from new selection |
| `READ-003` | Creator Dashboard | creator can read only own model drafts/review states |
| `READ-004` | Admin Review Queue | admin can read review states without secrets |
| `READ-005` | Portfolio Mock Summary | values are labeled mock/simulated and never broker/cash/settled |
| `READ-006` | Signals/Feed | no buy/sell advice, guaranteed return, or legal approval language |

## Audit Log Minimum Fields

Every audit assertion should verify:

- `auditAction`
- `auditResult`
- `entityType`
- `entityPublicId`
- `actorRole`
- `actorPublicId` when actor is a user, creator, or admin
- `previousStatus`
- `nextStatus`
- `reasonCode`
- `createdAt`
- `metadata.policyGuard` when blocked or review-required

Audit metadata must not include secrets, private credentials, broker account identifiers, payment identifiers, raw uploaded model contents, or private market/news API keys.

## Fixture And Test File Targets

Future implementation should prefer these file locations:

| Purpose | Target path |
| --- | --- |
| domain transition fixtures | `lib/domain/state/__fixtures__` |
| state transition guard tests | `lib/domain/state/__tests__` |
| audit event assertion helpers | `lib/domain/audit/__tests__` |
| mock portfolio safety fixtures | `lib/mock/portfolio` |
| API route guard tests | route-local `__tests__` folders after API implementation |

Avoid coupling these tests directly to DB row shapes. Tests should assert domain/service behavior first and add DB integration coverage only after the MySQL schema is implemented.

## Follow-Up Links

- `BK-141`: route/API guard design should use this map.
- `BK-148`: sheet state movement rules should use the same audit-minded status vocabulary.
- `BK-149`: verification rules should list the future commands for these tests.
