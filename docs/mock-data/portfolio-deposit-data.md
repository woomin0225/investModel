# Mock Portfolio And Deposit Data

<!--
This document defines mock deposit, selected model, mock portfolio, position, and pre-order TradeIntent data for investModel Home and Portfolio screens.
All values are simulated UI development fixtures and must not be presented as real deposits, real account balances, real holdings, real orders, executions, fills, or settlement.
-->

## Scope

This mock dataset targets `PortfolioSummaryDto` from `docs/api/dto-contract.md` and aligns with the DB domains `user_model_selections`, `mock_deposits`, `portfolios`, `portfolio_positions`, `market_instruments`, `model_signal_events`, and `trade_intents`.

It is safe for MVP UI/API development because it contains no bank account, payment, broker account, order execution, fill, settlement, or external API data.

## Primary Fixture

| Field | Value |
| --- | --- |
| `portfolioPublicId` | `portfolio_mock_primary_001` |
| `userPublicId` | `user_mock_mobile_001` |
| `modelSelectionPublicId` | `selection_mock_quant_us_001` |
| `selectedModel.modelPublicId` | `model_quant_us_leverage_alpha_mock` |
| `selectedModel.modelVersionPublicId` | `version_quant_us_leverage_alpha_v1_mock` |
| `selectedModel.name` | Quant US Leverage Alpha |
| `selectedModel.risk` | High risk, danger tone |
| `mockBalance.amount` | `24800.00` |
| `mockBalance.currency` | USD |
| `mockBalance.display` | `$24,800 mock` |
| `mockBalance.context` | `mock` |
| `simulatedMarketValue.amount` | `18340.00` |
| `simulatedMarketValue.display` | `$18,340 simulated` |
| `simulatedTotalValue.amount` | `43140.00` |
| `simulatedTotalValue.display` | `$43,140 simulated` |

## Mock Deposit Records

| `mockDepositPublicId` | User | Amount | Currency | Status | Source type | Display label | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mock_deposit_mobile_seed_001` | `user_mock_mobile_001` | `25000.00` | USD | `completed` | `mock` | `$25,000 mock deposit` | Seeded UI fixture only; not a payment or stored-value balance. |
| `mock_deposit_mobile_seed_002` | `user_mock_mobile_001` | `1200.00` | USD | `pending` | `mock` | `$1,200 mock pending` | Pending visual state fixture; not an incoming bank transfer. |
| `mock_deposit_cancelled_001` | `user_mock_mobile_001` | `500.00` | USD | `cancelled` | `mock` | `$500 mock cancelled` | Cancelled visual state fixture; no refund or payment behavior. |

## User Model Selection

| Field | Value |
| --- | --- |
| `selectionPublicId` | `selection_mock_quant_us_001` |
| `userPublicId` | `user_mock_mobile_001` |
| `modelPublicId` | `model_quant_us_leverage_alpha_mock` |
| `modelVersionPublicId` | `version_quant_us_leverage_alpha_v1_mock` |
| `modelName` | Quant US Leverage Alpha |
| `status` | `active` |
| `riskAcknowledgedAt` | `2026-07-13T09:00:00.000Z` |
| `selectedAt` | `2026-07-13T09:05:00.000Z` |
| `selectionContext` | `mock` |
| Notice | High-risk/leverage model; this is a mock selection and does not imply real funding or trading. |

## Simulated Positions

| `instrumentPublicId` | Symbol | Name | Asset type | Allocation | Market value | Context | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `instrument_mock_qqq` | QQQ | Nasdaq 100 ETF sample | `etf` | 28% | `$12,079 simulated` | `simulated` | UI fixture; not a real holding. |
| `instrument_mock_tqqq` | TQQQ | Leveraged Nasdaq ETF sample | `etf` | 22% | `$9,491 simulated` | `simulated` | High-risk leveraged ETF placeholder. |
| `instrument_mock_msft` | MSFT | Microsoft sample equity | `stock` | 16% | `$6,902 simulated` | `simulated` | Sample large-cap equity exposure. |
| `instrument_mock_nvda` | NVDA | Nvidia sample equity | `stock` | 14% | `$6,040 simulated` | `simulated` | Sample momentum exposure. |
| `instrument_mock_cash_usd` | CASH-USD | Mock cash sleeve | `cash` | 20% | `$8,628 mock` | `mock` | Cash-like UI fixture; not a deposit product. |

Allocation totals should add to 100% for layout clarity. Market values are rounded UI fixtures and should not be reconciled against live prices.

## Recent Pre-Order TradeIntents

| `tradeIntentPublicId` | Title | Status | Context | Blocked reason |
| --- | --- | --- | --- | --- |
| `trade_intent_mock_001` | Increase QQQ sleeve after observed momentum signal | `approved_for_simulation` | `pre_order_simulation` | none |
| `trade_intent_mock_002` | Add TQQQ exposure after high traffic trend | `blocked` | `pre_order_simulation` | Blocked by leverage exposure placeholder policy. |
| `trade_intent_mock_003` | Hold cash sleeve during volatility spike | `pending_policy_check` | `pre_order_simulation` | Awaiting mock risk policy check. |

These records are not orders. They must never be sent to broker APIs, shown as executions, or described as fills.

## Portfolio Notices

| Code | Severity | Message |
| --- | --- | --- |
| `mock_portfolio_only` | `info` | This portfolio is a simulated MVP fixture and is not connected to a bank, broker, or custody account. |
| `high_risk_model` | `warning` | The selected mock model uses a high-risk mandate with leverage exposure placeholders. |
| `no_real_orders` | `blocked` | TradeIntent records are pre-order simulations only and cannot execute trades in the MVP. |
| `backtest_context` | `info` | Performance and allocation values are placeholders for layout and API contract testing. |

## Alternate Fixture Seeds

| Seed | Selected model | Use case | Notes |
| --- | --- | --- | --- |
| `portfolio_mock_balanced_001` | Macro ETF Balance | Medium-risk portfolio state and stock/bond mix display | Keep stock/bond mix model-owned; no user slider. |
| `portfolio_mock_income_001` | Defensive Income Rotation | Low-risk income-focused display and cash-like warning | Cash-like exposure is not a bank deposit. |
| `portfolio_mock_bond_001` | Global Bond Shield | Bond-heavy screen and lower-volatility metric display | Bond funds can lose value; not risk-free. |

## Conversion Notes For `lib/mock`

When this document is converted to TypeScript fixtures:

- Prefer `mockBalance`, `simulatedMarketValue`, `simulatedTotalValue`, and `recentTradeIntents` naming.
- Keep `amount` values as strings.
- Keep all values deterministic; do not calculate from live prices.
- Add explicit notices to every screen that displays money-like or trade-like values.
- Keep `TradeIntent.status` values aligned with `lib/domain/types.ts`.
- Do not introduce `Order`, `Execution`, `Fill`, `BrokerAccount`, `BankAccount`, or real account identifiers.
