# Performance Copy Review

Related task: BK-074

Review date: 2026-07-14

## Scope

This review checks whether current investModel performance copy could read like a return guarantee, principal protection claim, risk-free claim, investment advice, or trading encouragement.

Reviewed areas:

- `app/invest-model/**`
- `components/invest-model/**`
- `lib/i18n/invest-model.ts`
- `lib/mock/invest-model-discovery.ts`
- `lib/mock/invest-model-model-detail.ts`
- `lib/mock/invest-model-feed.ts`
- `docs/api/**`
- `docs/mock-data/**`
- `docs/product/**`
- `docs/compliance/**`

## Findings

| Check | Result | Evidence |
| --- | --- | --- |
| Return-like values carry context | Pass | Discovery and detail copy label returns as `backtest`, `sample`, or `placeholder`. |
| Performance is paired with risk context | Pass | `PerformanceMetricGroup` keeps return, volatility, and max drawdown together. Model detail copy uses volatility, max drawdown, and source labels beside the return sample. |
| No return guarantee wording in user-facing copy | Pass | Current user-facing copy uses non-guarantee disclaimers such as "not a future return claim" and "not investment advice, a return guarantee, or a buy/sell recommendation." |
| Lower-risk/income wording avoids principal protection | Pass | Defensive income copy explicitly says income focus does not imply principal protection or guaranteed return, and low risk is relative mock labeling. |
| Feed and signal copy avoid trading encouragement | Pass | Feed and signal surfaces describe prototype observations and mock commentary, not buy/sell/hold instructions. |
| Legal and financial final copy remains placeholder-bound | Pass with follow-up | Final legal, risk, and performance methodology copy still requires qualified review before public launch or external beta. |

## Notes

No new issue was opened from this review. The reviewed code and docs already preserve the required `mock`, `simulated`, `backtest`, `placeholder`, or `informational` context for performance-like values.

Existing open issues remain unrelated to this review:

- `IS-001`: production build pricing route requires a real Stripe test key and Docker is unavailable.
- `IS-003`: actual phone-device verification is still pending user-side confirmation.

## Follow-Up

- Keep any future ranking, sorting, marketing, or model-comparison copy tied to a reviewed measurement methodology.
- Do not change `backtest`, `sample`, `placeholder`, max drawdown, volatility, or source labels into promotional copy.
- Public launch copy must wait for legal or compliance review outside Codex.

## Verification

Commands used:

```powershell
rg -n "guarantee|guaranteed|guaranteed return|return guarantee|profit|risk-free|loss protection|principal protection|원금 보장|수익 보장|무위험|손실 방지|확정 수익|보장|성과|수익률|return|drawdown|performance|backtest" app components lib docs -g "*.ts" -g "*.tsx" -g "*.md"
rg -n "performance|성과|수익률|return|drawdown|backtest|guarantee|guaranteed|보장|risk-free|무위험" lib/i18n/invest-model.ts lib/mock app/invest-model components/invest-model -g "*.ts" -g "*.tsx"
```
