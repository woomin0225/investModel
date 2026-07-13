# Mock AI Model Catalog

<!--
This document defines the first mock InvestmentModel catalog for investModel mobile and API development.
Every model here is a mock/backtest placeholder and must not be presented as real performance, legal approval, or executable AI trading logic.
-->

## Catalog Rules

- Public discovery may show only `approved` or `live` mock models.
- `pending_review`, `paused`, `suspended`, and `retired` models may stay in fixtures only to test hidden or blocked states.
- Every performance value is `backtest_placeholder`.
- Every AUM or balance-like value is `simulated`.
- `PortfolioMandate` belongs to the model. Users must not edit stock/bond ratio, leverage preference, or risk appetite.
- Model artifacts remain `metadata_only`; uploaded model execution is blocked in the MVP.

## ModelCardDto Coverage

| Model | Status | Risk | Markets | Asset labels | Backtest return | Drawdown | Public discovery |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Quant US Leverage Alpha | `live` | `high` | US | US equities, leveraged ETF | +18.4% placeholder | -24.0% placeholder | yes |
| Macro ETF Balance | `approved` | `medium` | US, Global | Equity ETF, bond ETF | +9.7% placeholder | -11.2% placeholder | yes |
| Defensive Income Rotation | `live` | `low` | US | Dividend equities, short bond ETF, cash-like ETF | +5.2% placeholder | -6.4% placeholder | yes |
| Asia Tech Momentum | `approved` | `high` | Korea, Japan, US ADR | Tech equities, growth ETF | +14.1% placeholder | -19.8% placeholder | yes |
| Global Bond Shield | `live` | `low` | US, Global | Treasury ETF, investment-grade bond ETF, cash-like ETF | +4.3% placeholder | -3.8% placeholder | yes |
| Review Only Prototype | `pending_review` | `very_high` | Hidden | Not public | hidden | hidden | no |

## Detailed Mock Models

### Quant US Leverage Alpha

| Field | Value |
| --- | --- |
| `modelPublicId` | `model_quant_us_leverage_alpha_mock` |
| `modelVersionPublicId` | `version_quant_us_leverage_alpha_v1_mock` |
| `slug` | `quant-us-leverage-alpha` |
| `creatorName` | `Northstar Quant Lab` |
| `status` | `live` |
| `risk` | High risk, danger tone |
| `targetMarkets` | US |
| `assetClassLabels` | US equities, leveraged ETF |
| `leverageAllowed` | true |
| `strategySummary` | Momentum model that rotates US mega-cap equities and leveraged index ETFs using price trend and news-traffic inputs. |
| `PortfolioMandate` | US-listed equities and leveraged ETFs only; no bonds; weekly rebalance; concentration limit placeholder. |
| `forbiddenAssets` | Crypto, single-name options, private funds, unlisted securities |
| `backtestReturn` | +18.4%, `backtest_placeholder` |
| `maxDrawdown` | -24.0%, `backtest_placeholder` |
| `requiredDisclosure` | High volatility, leverage, and rapid drawdown placeholder; requires legal review before production copy. |
| `ModelCardDto` notes | Show high-risk badge, leverage chip, US equities market chip, and backtest placeholder label. |
| `ModelDetailDto` notes | Show that the user cannot override leverage or allocation settings. |

### Macro ETF Balance

| Field | Value |
| --- | --- |
| `modelPublicId` | `model_macro_etf_balance_mock` |
| `modelVersionPublicId` | `version_macro_etf_balance_v1_mock` |
| `slug` | `macro-etf-balance` |
| `creatorName` | `Atlas Allocation Studio` |
| `status` | `approved` |
| `risk` | Medium risk, medium tone |
| `targetMarkets` | US, Global |
| `assetClassLabels` | Equity ETF, bond ETF |
| `leverageAllowed` | false |
| `strategySummary` | Macro allocation model that shifts between broad equity and bond ETFs based on macro trend, volatility, and news-traffic context. |
| `PortfolioMandate` | ETF-only; stock/bond mix is model-owned; monthly rebalance; no derivatives. |
| `forbiddenAssets` | Leveraged ETFs, inverse ETFs, individual options, crypto |
| `backtestReturn` | +9.7%, `backtest_placeholder` |
| `maxDrawdown` | -11.2%, `backtest_placeholder` |
| `requiredDisclosure` | Backtest methodology and allocation-risk placeholder; requires legal review before production copy. |
| `ModelCardDto` notes | Show ETF-only, drawdown guard, and monthly rebalance chips. |
| `ModelDetailDto` notes | Explain that stock/bond ratio is embedded in the model mandate, not user preference. |

### Defensive Income Rotation

| Field | Value |
| --- | --- |
| `modelPublicId` | `model_defensive_income_rotation_mock` |
| `modelVersionPublicId` | `version_defensive_income_rotation_v1_mock` |
| `slug` | `defensive-income-rotation` |
| `creatorName` | `Harbor Income Systems` |
| `status` | `live` |
| `risk` | Low risk, low tone |
| `targetMarkets` | US |
| `assetClassLabels` | Dividend equities, short bond ETF, cash-like ETF |
| `leverageAllowed` | false |
| `strategySummary` | Defensive model that rotates dividend equities, short-duration bonds, and cash-like exposure during risk-off signals. |
| `PortfolioMandate` | Income tilt; no leverage; weekly risk review; maximum single-position placeholder. |
| `forbiddenAssets` | Leveraged ETFs, derivatives, high-yield bonds, crypto |
| `backtestReturn` | +5.2%, `backtest_placeholder` |
| `maxDrawdown` | -6.4%, `backtest_placeholder` |
| `requiredDisclosure` | Lower-risk does not mean risk-free; income and drawdown copy requires legal review. |
| `ModelCardDto` notes | Show low-risk badge, income focus, no leverage, and lower volatility chips. |
| `ModelDetailDto` notes | Include a risk notice that cash-like exposure is simulated and not a deposit product. |

### Asia Tech Momentum

| Field | Value |
| --- | --- |
| `modelPublicId` | `model_asia_tech_momentum_mock` |
| `modelVersionPublicId` | `version_asia_tech_momentum_v1_mock` |
| `slug` | `asia-tech-momentum` |
| `creatorName` | `Seoul Signal Works` |
| `status` | `approved` |
| `risk` | High risk, high tone |
| `targetMarkets` | Korea, Japan, US ADR |
| `assetClassLabels` | Tech equities, growth ETF |
| `leverageAllowed` | false |
| `strategySummary` | Regional technology momentum model using price strength, earnings-event traffic, and sector rotation signals. |
| `PortfolioMandate` | Listed technology equities and growth ETFs; no leverage; regional concentration allowed by model mandate. |
| `forbiddenAssets` | Private placements, leveraged ETFs, crypto, unlisted startup shares |
| `backtestReturn` | +14.1%, `backtest_placeholder` |
| `maxDrawdown` | -19.8%, `backtest_placeholder` |
| `requiredDisclosure` | Sector concentration and regional FX-risk placeholder; requires legal review before production copy. |
| `ModelCardDto` notes | Show high-risk and regional tech chips without implying personalized suitability. |
| `ModelDetailDto` notes | Include market scope and concentration warning placeholders. |

### Global Bond Shield

| Field | Value |
| --- | --- |
| `modelPublicId` | `model_global_bond_shield_mock` |
| `modelVersionPublicId` | `version_global_bond_shield_v1_mock` |
| `slug` | `global-bond-shield` |
| `creatorName` | `Cedar Risk Lab` |
| `status` | `live` |
| `risk` | Low risk, low tone |
| `targetMarkets` | US, Global |
| `assetClassLabels` | Treasury ETF, investment-grade bond ETF, cash-like ETF |
| `leverageAllowed` | false |
| `strategySummary` | Defensive fixed-income model that adjusts duration and credit exposure from macro and volatility signals. |
| `PortfolioMandate` | Bond ETF universe; no leverage; no high-yield exposure unless explicitly reviewed later. |
| `forbiddenAssets` | Leveraged ETFs, equities, high-yield bonds, crypto |
| `backtestReturn` | +4.3%, `backtest_placeholder` |
| `maxDrawdown` | -3.8%, `backtest_placeholder` |
| `requiredDisclosure` | Bond funds can lose value; cash-like ETF exposure is not a bank deposit. |
| `ModelCardDto` notes | Show low-risk badge, bond ETF chip, and defensive placeholder return. |
| `ModelDetailDto` notes | Explain duration and credit risk in placeholder form. |

### Review Only Prototype

| Field | Value |
| --- | --- |
| `modelPublicId` | `model_review_only_prototype_mock` |
| `modelVersionPublicId` | `version_review_only_prototype_v0_mock` |
| `slug` | `review-only-prototype` |
| `creatorName` | `Internal QA Fixture` |
| `status` | `pending_review` |
| `risk` | Very high risk, danger tone |
| `targetMarkets` | Hidden |
| `assetClassLabels` | Not public |
| `leverageAllowed` | true |
| `strategySummary` | Hidden fixture used to verify that pending-review models do not appear in public discovery. |
| `PortfolioMandate` | Not public. |
| `forbiddenAssets` | Not public. |
| `backtestReturn` | hidden |
| `maxDrawdown` | hidden |
| `requiredDisclosure` | Review-blocked fixture. |
| `ModelCardDto` notes | Keep in fixtures only. Must be filtered out of public model lists. |
| `ModelDetailDto` notes | Return `404 not_found` or `403 forbidden` unless creator/admin access exists later. |

## Fixture Update Notes

When this catalog is converted into `lib/mock` data:

- Keep the existing `Review Only Prototype` hidden-filter behavior.
- Add `modelPublicId` and `modelVersionPublicId` fields before wiring API routes.
- Use `dataContext: 'mock'` and performance `context: 'backtest'` or `backtest_placeholder`.
- Keep every model artifact `metadata_only`.
- Add `PolicyNoticeDto` values for leverage, backtest placeholder, legal-review placeholder, and mock-only status.
- Do not add real AUM, real holdings, real account balances, broker fields, or execution fields.
