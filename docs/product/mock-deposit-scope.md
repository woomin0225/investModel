# MockDeposit Scope

<!--
This document defines the first MVP boundary for deposit-like behavior in investModel.
It lets future agents design MockDeposit screens, DTOs, and API routes without accidentally implementing real payments, bank transfers, stored value, withdrawals, or brokerage funding.
-->

## Purpose

`MockDeposit` exists only to make the mobile/PWA MVP understandable before reviewed financial infrastructure exists. It may show a simulated funding state for layout, onboarding, and portfolio flow testing, but it must never behave like a real payment, real bank transfer, cash account, stored-value wallet, brokerage funding source, or withdrawable balance.

This scope connects `BK-035` to the existing MVP boundary, feature review matrix, mock data policy, and future `BK-036` implementation.

## Allowed In The MVP

| Capability | Allowed behavior | Required label |
| --- | --- | --- |
| Mock deposit display | Show a deterministic simulated amount used by Home and Portfolio screens. | `mock deposit` |
| Pending mock state | Show a visual pending state for flow testing only. | `mock pending` |
| Cancelled mock state | Show cancelled/expired states for empty-state and history UI. | `mock cancelled` |
| Simulated allocation link | Connect mock funds to simulated portfolio values and selected model state. | `simulated allocation` |
| API/DTO planning | Define DTO fields, validation, and mock-backed responses. | `not_persisted` or `mock_backed` |
| DB schema planning | Map future `mock_deposits` rows to DBML without connecting payment rails. | `source_type=mock` |

## Not Allowed In The MVP

These items are blocked until explicit `financial_operation`, `legal_review`, and `security_review` work is approved and recorded:

- Accepting card, bank, ACH, wire, open banking, or payment provider details.
- Calling Stripe, Plaid, broker funding, banking, exchange, or payment APIs for deposits or withdrawals.
- Storing account numbers, routing numbers, payment method ids, card tokens, bank names, or external account ids.
- Showing a value as real cash, available cash, settled cash, withdrawable funds, bank balance, brokerage balance, or stored value.
- Letting users transfer money, cancel real transfers, withdraw funds, or reconcile settlement.
- Using `Deposit`, `Wallet`, `BankAccount`, `CashBalance`, or `Payment` as a production domain replacement for `MockDeposit`.

## Canonical Statuses

For MVP design and `BK-036`, use these mock-only statuses:

| Status | Meaning | UI/API treatment |
| --- | --- | --- |
| `created` | A mock deposit fixture was initialized for demo flow testing. | Internal or setup state only. |
| `simulated_available` | Mock funds are available for simulated portfolio display. | Show as mock, never as cash. |
| `simulated_allocated` | Mock funds are visually linked to a selected model or simulated portfolio. | Show as simulated allocation. |
| `cancelled` | A mock fixture was cancelled for UI state coverage. | Show as mock cancelled. |
| `archived` | A mock fixture is no longer active in the current demo state. | Hide from active balance totals. |

Do not add `completed`, `settled`, `withdrawable`, `paid`, `charged`, `refunded`, or `transferred` as `MockDeposit` statuses in the MVP because they imply real financial operations.

## Required Data Fields

Future mock DTOs or domain helpers should include:

| Field | Rule |
| --- | --- |
| `mockDepositPublicId` | Public id only; do not expose internal numeric ids. |
| `userPublicId` | Public user id for ownership checks and future RBAC. |
| `amount` | Decimal string, deterministic fixture value. |
| `currency` | ISO-style currency code such as `USD` or `KRW`; not a real account currency balance. |
| `status` | One of the canonical mock-only statuses above. |
| `sourceType` | Always `mock` in the MVP. |
| `displayLabel` | Must include `mock`, `simulated`, or equivalent localized copy. |
| `createdAt` | Fixture or API timestamp for state history. |
| `safetyBoundary` | Flags such as `noRealDeposit`, `noWithdrawal`, `noBankConnection`, `noPaymentProvider`. |

## UI Copy Boundary

Use:

- "mock deposit"
- "mock pending"
- "simulated available"
- "simulated allocation"
- "not connected to a bank or broker"
- "for MVP display only"

Avoid:

- "deposit completed"
- "cash available"
- "withdraw"
- "bank transfer"
- "settled funds"
- "payment successful"
- "real balance"
- "brokerage cash"

## API Boundary

Allowed future routes may be mock-backed only:

| Route | MVP behavior |
| --- | --- |
| `GET /api/portfolio/mock-summary` | Return mock deposit and simulated portfolio DTOs. |
| `GET /api/mock-deposits` | Return current user's mock deposit fixtures if needed. |
| `POST /api/mock-deposits` | Create a mock fixture only if clearly labeled `mock_backed` and `not_persisted` or DB-backed as mock data. |

Every response must include metadata showing that real financial operations are disabled:

```json
{
  "meta": {
    "routeStatus": "mock_backed",
    "financialOperationsEnabled": false,
    "realDeposit": false,
    "withdrawalEnabled": false,
    "bankConnection": false,
    "paymentProvider": false
  }
}
```

## Handoff To Future Tasks

- `BK-036` should implement the `MockDeposit` model or helper from this scope.
- `BK-131` remains the fixture reference for portfolio screen sample data.
- `BK-144` remains the state-transition reference for `MockDeposit`, `Portfolio`, and `UserModelSelection`.
- Any request for real deposits, withdrawals, payment providers, bank linking, or brokerage funding must stop and create or update an `Issues` row before implementation.
