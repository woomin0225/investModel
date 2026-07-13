<!--
This review records the first harness compliance pass for investModel.
It helps future agents see which project boundaries were checked and whether any new Issues are required.
-->

# Harness Compliance Review 1

## Scope

- Task: `BK-050` 하네스 위반 1차 리뷰
- Date: 2026-07-14
- Reviewed harnesses:
  - `harness/core-harness.md`
  - `harness/product-harness.md`
  - `harness/risk-compliance-harness.md`
  - `harness/domain-contract-harness.md`
- Reviewed surfaces:
  - `app/invest-model/**`
  - `app/api/creator/**`
  - `app/api/admin/**`
  - `app/api/model-selections/**`
  - `components/invest-model/**`
  - `lib/domain/**`
  - `lib/mock/**`
  - `docs/product/**`
  - `docs/domain/**`
  - `docs/api/**`
  - `docs/mock-data/**`
  - `docs/security/**`
  - `docs/qa/**`

## Review Checklist

| Rule | Result | Notes |
| --- | --- | --- |
| Users must not directly set risk appetite, stock/bond ratio, or leverage preference. | Pass | `PortfolioMandate` remains model-owned. Forbidden user preference fields are rejected in `lib/domain/portfolio/portfolio-mandate.ts`. |
| Real deposits, withdrawals, payments, broker accounts, and orders must not be implemented. | Pass with existing blocker | investModel domain uses `MockDeposit`, `TradeIntent`, `mock`, `simulated`, and `not_persisted` boundaries. Starter Stripe routes remain outside investModel and are already tracked by `IS-001`. |
| `TradeIntent` must remain pre-order simulation only. | Pass | `lib/domain/portfolio/trade-intent.ts` blocks broker, execution, fill, settlement, payment, and account identifiers. |
| Model artifact execution must stay blocked in MVP. | Pass | Model artifact metadata remains `metadata_only`; runtime execution is documented as blocked until later review. |
| Public model discovery must not expose draft or pending review models. | Pass | Discovery flow uses approved/live visibility helpers and excludes pending review mock data. |
| Model selection must not imply money movement or order placement. | Pass | `POST /api/model-selections` returns `persistence: not_persisted` and flags real deposit, real order, and brokerage connection as false. |
| Performance and feed copy must not guarantee returns or act as trading advice. | Pass | Search hits are mostly guardrails, disclaimers, or forbidden examples. Mock detail/feed copy labels investment advice, return guarantee, and buy/sell recommendation as excluded. |
| Admin/creator actions must preserve RBAC and audit boundaries. | Pass | Creator draft and admin review flows use role checks, mock-safe status transitions, and `AuditLog` payloads without persistence claims. |

## Findings

No new harness violation was found in the investModel domain, mobile PWA screens, mock data, API contracts, or QA documents reviewed in this pass.

The only material residual risk is the original SaaS starter Stripe/payment surface. It can make production build and `/pricing` prerender depend on real Stripe configuration, but it is already recorded as `IS-001`. This review does not create a duplicate issue.

`IS-003` remains open because actual phone-device verification cannot be completed by automation. Local 390px checks and core flow smoke tests have already been recorded separately.

## Evidence

Commands used during review:

```text
rg -n "(realBalance|brokerOrderId|executionId|fillId|settlementId|paymentId|accountNumber|guarantee|guaranteed|profit guaranteed|수익 보장|원금 보장|매수 추천|매도 추천|투자 성향|riskPreference|stockRatio|bondRatio|leveragePreference)" app components lib docs harness -S
rg -n "(STRIPE|stripe|deposit|withdraw|broker|order|trade|execution|recommendation|advice|법률|입금|출금|주문|계좌|추천|권유)" app components lib docs -S
```

Interpreted results:

- Forbidden financial-operation terms in `lib/domain/portfolio/trade-intent.ts` are explicitly rejected input fields.
- `MockDeposit` copy and DTOs are marked mock-only and `not_persisted`.
- Korean and English UI copy uses disclaimer language for mock/backtest/placeholder states.
- Starter Stripe findings are not investModel feature code and are already covered by `IS-001`.

## Next Review Targets

- `BK-080`: 제품 방향성 리뷰 should specifically re-check that later UI additions still avoid user-controlled investment preferences.
- `BK-079`: 보안 1차 리뷰 should run after RBAC and input validation tests are added.
- `IS-001`: Stripe starter surface should be removed, isolated, or configured before production build is considered clean.
- `IS-003`: Phone-device validation still needs user-side confirmation.
