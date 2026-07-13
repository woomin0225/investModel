<!--
이 문서는 UserModelSelection, MockDeposit, Portfolio의 상태 전이와 실제 자금 이동 금지 경계를 정의한다.
AI 작업자는 홈/포트폴리오/API 구현 전에 이 문서를 기준으로 mock 상태가 실제 입금, 실제 계좌, 실제 보유자산처럼 보이지 않게 해야 한다.
-->

# User Selection, MockDeposit, And Portfolio State Transitions

## Scope

이 문서는 사용자가 `InvestmentModel`을 선택한 뒤 MVP 화면에서 보게 되는 mock 입금, mock 포트폴리오, simulated position 상태를 정의한다. 여기의 상태는 실제 결제, 실제 입금, 실제 출금, 실제 보유자산, 브로커 계좌 연결, 주문 체결을 의미하지 않는다.

## UserModelSelection States

| Status | Meaning | User visible? | New actions |
| --- | --- | --- | --- |
| `draft` | 선택 플로우에서 모델 확인 중이다. | yes | risk acknowledgement 가능 |
| `active` | live 모델 버전을 mock 포트폴리오에 연결했다. | yes | pause/revoke 가능 |
| `paused` | 사용자가 선택을 임시 중지했다. | yes | resume/revoke 가능 |
| `revoked` | 사용자가 선택을 해제했다. | historical only | no new allocation |
| `blocked_model_unavailable` | 모델이 paused/suspended/retired되어 신규 mock 배분이 차단됐다. | yes with notice | choose another model |

### UserModelSelection Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `draft` | user | `user_model_selection_started` | target model is `live` |
| `draft` | `active` | user | `user_model_selection_activated` | risk acknowledgement recorded |
| `active` | `paused` | user | `user_model_selection_paused` | user owns selection |
| `paused` | `active` | user | `user_model_selection_resumed` | model version still `live` |
| `active` or `paused` | `revoked` | user | `user_model_selection_revoked` | user owns selection |
| `active` or `paused` | `blocked_model_unavailable` | system/admin | `system_model_selection_blocked` | model status is `paused`, `suspended`, or `retired` |

## MockDeposit States

`MockDeposit` is a simulated development object. It must never be wired to payment, banking, withdrawal, custody, or brokerage logic.

| Status | Meaning | User visible? | Notes |
| --- | --- | --- | --- |
| `created` | mock deposit record was created for UI/API testing. | yes | not a payment initiation |
| `simulated_available` | mock balance is available for simulated allocation. | yes | not stored value |
| `simulated_allocated` | some mock amount is connected to a mock portfolio. | yes | not invested cash |
| `cancelled` | mock deposit fixture was cancelled. | yes | no refund semantics |
| `archived` | no longer shown in primary UI. | historical only | audit/history only |

### MockDeposit Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `created` | user/system | `mock_deposit_created` | source type must be `mock` |
| `created` | `simulated_available` | system | `mock_deposit_marked_available` | no external payment reference |
| `simulated_available` | `simulated_allocated` | system | `mock_deposit_allocated_to_portfolio` | linked to mock portfolio only |
| `created` or `simulated_available` | `cancelled` | user/system | `mock_deposit_cancelled` | no refund/payment behavior |
| `cancelled` or `simulated_allocated` | `archived` | system | `mock_deposit_archived` | keep audit record |

Forbidden:

- `MockDeposit` cannot transition to `settled`, `paid`, `withdrawn`, `refunded`, or `broker_transferred`.
- `MockDeposit` cannot store bank account, card, brokerage account, or payment provider identifiers.
- `MockDeposit` cannot trigger `TradeIntent` execution or real order creation.

## Portfolio States

| Status | Meaning | User visible? | Notes |
| --- | --- | --- | --- |
| `mock_pending` | mock portfolio shell is being prepared. | yes | loading/empty state |
| `mock_active` | selected model and mock balance are connected. | yes | primary MVP state |
| `mock_paused` | simulated updates are paused. | yes | no new simulated allocation |
| `mock_blocked` | policy/model availability prevents simulated updates. | yes with warning | user action or admin review needed |
| `closed` | mock portfolio is no longer primary. | historical only | no new simulated changes |

### Portfolio Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `mock_pending` | system | `mock_portfolio_created` | user selection exists |
| `mock_pending` | `mock_active` | system | `mock_portfolio_activated` | selection is active; mock balance available |
| `mock_active` | `mock_paused` | user/system | `mock_portfolio_paused` | user owns portfolio or model unavailable |
| `mock_paused` | `mock_active` | user/system | `mock_portfolio_resumed` | selection active and model live |
| `mock_active` or `mock_paused` | `mock_blocked` | system/admin | `mock_portfolio_blocked` | policy/model/data issue |
| `mock_blocked` | `mock_active` | system/admin | `mock_portfolio_unblocked` | issue resolved |
| any mock state | `closed` | user/system | `mock_portfolio_closed` | keep historical record |

## Position Snapshot Rules

Simulated positions should be represented as snapshots, not real holdings.

- Use `simulatedMarketValue`, not `marketValue` alone.
- Use `mockBalance`, not `cashBalance` alone.
- Use `positionContext = simulated` or equivalent DTO field.
- Do not show execution, fill, settlement, account number, or broker order id.
- If a model becomes `paused`, `suspended`, or `retired`, keep existing snapshots viewable with a notice but block new simulated allocation.

## API Guard Rules

| API | Guard |
| --- | --- |
| `POST /api/model-selections` | user only; target model version must be `live`; record risk acknowledgement |
| `GET /api/portfolio/mock-summary` | user only; user owns selection/portfolio |
| `POST /api/portfolio/mock-deposits` | user/system only; source type must be `mock` |
| `POST /api/portfolio/mock-deposits/:id/cancel` | user owns mock deposit; no refund behavior |
| `POST /api/portfolio/:id/pause` | user owns portfolio; mock state only |
| `POST /api/portfolio/:id/close` | user owns portfolio; keep history |

## User-Facing Copy Rules

Required labels:

- `mock deposit`
- `simulated portfolio`
- `simulated position`
- `pre-order simulation`
- `not connected to a bank, broker, or custody account`

Forbidden labels:

- `real deposit`
- `available cash`
- `settled cash`
- `broker balance`
- `executed order`
- `filled position`
- `withdrawable`

## Audit Events

| Event | Result |
| --- | --- |
| `user_model_selection_started` | `allowed` |
| `user_model_selection_activated` | `allowed` |
| `user_model_selection_paused` | `allowed` |
| `user_model_selection_revoked` | `allowed` |
| `system_model_selection_blocked` | `review_required` |
| `mock_deposit_created` | `allowed` |
| `mock_deposit_marked_available` | `allowed` |
| `mock_deposit_allocated_to_portfolio` | `allowed` |
| `mock_deposit_cancelled` | `allowed` |
| `mock_portfolio_blocked` | `policy_blocked` or `review_required` |
| `mock_financial_operation_blocked` | `policy_blocked` |

## Follow-Up Links

- `BK-145`: define `AllocationDecision` and `TradeIntent` pre-order simulation status.
- `BK-146`: convert selection, mock deposit, and portfolio transitions into test cases.
- `BK-133`: align mock loaders with these status names.
