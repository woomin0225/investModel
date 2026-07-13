# Product Direction Review

Review date: 2026-07-14

Related task: BK-080

## Scope

This review checks whether the current investModel frontend and domain docs still follow the product direction:

- Users choose an `InvestmentModel`.
- Users do not directly configure risk appetite, stock/bond ratio, leverage preference, or direct allocation.
- `PortfolioMandate` belongs to the model version, not to a user preference setup flow.
- Signal and feed surfaces remain observed context, not recommendations or order instructions.

Reviewed areas:

- `app/invest-model/**`
- `components/invest-model/**`
- `lib/domain/portfolio/portfolio-mandate.ts`
- `lib/domain/analytics/model-selection-event.ts`
- `lib/i18n/invest-model.ts`
- `docs/product/**`
- `docs/api/**`
- `docs/domain/**`

## Findings

| Check | Result | Evidence |
| --- | --- | --- |
| User-editable investment preference UI | Pass | No frontend screen exposes controls for user risk appetite, stock/bond ratio, leverage preference, or direct allocation. |
| Model-owned mandate wording | Pass | Creator and discovery/detail copy describe mandate, risk, leverage, and scope as model-defined. |
| Domain validation boundary | Pass | `PortfolioMandate` rejects forbidden user preference fields such as `riskPreference`, `stockRatio`, `bondRatio`, and `leveragePreference`. |
| Analytics boundary | Pass | `ModelSelectionEvent` rejects user preference and suitability-style fields. |
| Signal/feed wording | Pass | Current signal and feed copy labels content as observed or mock context and avoids buy/sell/hold recommendation language. |
| Performance/risk copy | Pass with follow-up | Existing mock detail copy includes placeholder and non-advice disclaimers. Continue with the separate performance wording review task before broader release. |

## Notes

The current app structure supports the marketplace direction: a user selects a reviewed AI investment model, and the model version owns its mandate and risk posture. This is aligned with `docs/product/mvp-scope.md`, `docs/product/release-scope-gates.md`, and `docs/domain/domain-glossary.md`.

No new issue was opened from this review. Existing open issues remain:

- `IS-001`: production build pricing route requires a real Stripe test key and Docker is unavailable.
- `IS-003`: actual phone-device verification is still pending user-side confirmation.

## Verification

Commands used:

```powershell
rg -n "riskPreference|risk preference|investment preference|preference|suitability|advisor|robo|recommend|recommendation|stockRatio|bondRatio|leveragePreference|사용자.*성향|투자성향|추천|권유|비율|주식.*채권|레버리지.*선호|직접.*설정" app components lib docs -g "*.ts" -g "*.tsx" -g "*.md"
rg -n "MockDeposit|TradeIntent|PortfolioMandate|InvestmentModel|model-owned|user.*edit|user.*override|사용자|모델" app/invest-model components/invest-model lib/domain docs/product docs/api -g "*.ts" -g "*.tsx" -g "*.md"
```
