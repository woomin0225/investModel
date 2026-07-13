# Creator Registration Guide

This guide helps model creators prepare an `InvestmentModel` draft that can pass the first registration validation and enter `pending_review` without avoidable rework.

## Scope

The creator registration flow collects model description metadata only.

It does not:

- execute uploaded model files
- approve legal or financial disclosure copy
- publish a model to public discovery
- create a `MockDeposit`
- create a real deposit, brokerage order, account link, execution, fill, or settlement

Every submitted draft remains `draft`, `private`, and `metadata_only` until an admin review flow changes its status.

## Required Fields

Creators should prepare these fields before using the mobile draft form.

| Field | What to provide | Validation guidance |
| --- | --- | --- |
| `name` | A clear model name that does not imply guaranteed results. | Avoid names like "No Loss", "Guaranteed Alpha", or "Safe for Everyone". |
| `shortDescription` | A compact summary of the model's market and approach. | 12 to 220 characters. |
| `targetMarkets` | Markets the model is designed to analyze. | 1 to 8 labels, comma separated in the form. |
| `allowedAssetClasses` | Asset classes inside the model's allowed universe. | 1 to 12 labels. |
| `assetUniverseSummary` | A readable explanation of the investable universe. | 12 to 260 characters. |
| `strategySummary` | How the model forms its simulated allocation decisions. | 20 to 600 characters. |
| `leverageAllowed` | Whether the model mandate can use leverage. | Must be explicit true or false. |
| `derivativesAllowed` | Whether derivatives or structured products are allowed. | Must be explicit true or false. |
| `rebalancePolicy` | How often and under what conditions the model rebalances. | 4 to 120 characters. |
| `primaryDataInputs` | Price, macro, news, traffic, or risk inputs used by the model. | 1 to 12 labels. |
| `forbiddenAssets` | Assets or instruments the model must not use. | Optional, up to 20 labels. |
| `riskSummary` | Main loss, volatility, concentration, liquidity, or leverage risks. | 20 to 600 characters. |
| `performanceSource` | Backtest or placeholder performance source and measurement basis. | 8 to 160 characters. |
| `disclosurePlaceholder` | Placeholder text that marks risk, performance, and limitation disclosure for review. | 12 to 600 characters. |

## Good Draft Pattern

A strong draft describes the model as an `InvestmentModel`, not as a personalized adviser.

Use this pattern:

- identify the model's market and asset universe
- explain the model-owned `PortfolioMandate`
- state whether leverage or derivatives are allowed
- list prohibited assets and conditions
- explain rebalancing without letting users directly edit stock/bond ratio or leverage preference
- pair performance-like values with backtest, simulated, or placeholder context
- include a disclosure placeholder instead of final legal wording

## Review-Ready Examples

Acceptable wording:

- "US-listed equity and ETF momentum model using price trend and news-traffic inputs."
- "Weekly rebalance inside the model-owned `PortfolioMandate`; user overrides are not supported in the MVP."
- "Backtest placeholder measured on sample data; requires review before public performance display."
- "Risk summary covers leverage, concentration, volatility, and rapid drawdown potential."

Avoid wording:

- "Guaranteed return"
- "No loss"
- "Legally approved"
- "Safe for all users"
- "Broker order ready"
- "Real deposit supported"
- "This model will outperform the market"

Blocked or review-required wording should be replaced with factual metadata plus a review placeholder. Codex must not create final legal or financial copy for the creator.

## Submission Checklist

Before submission, confirm:

- The model is still a private draft.
- The submitted model artifact status is `metadata_only`.
- The model has a version label or clear version context.
- `PortfolioMandate` is written as model-owned, not user-configurable preferences.
- Every performance-like field has a source and context.
- Risk, limitation, and performance disclosures are placeholders for review.
- No real fund movement, brokerage account connection, or order execution is described as available.
- No creator-owned field exposes internal DB ids, user mock portfolio data, or secret values.

## Common Validation Failures

| Failure | Fix |
| --- | --- |
| Missing target market | Add at least one market label such as `US`, `Korea`, or `Global`. |
| Missing asset class | Add at least one allowed class such as `US equities`, `ETF`, or `Treasury ETF`. |
| Strategy too short | Expand the strategy to include inputs, rotation logic, and model boundary. |
| Risk summary too vague | Name concrete risks such as drawdown, leverage, concentration, volatility, or liquidity. |
| Performance source missing | Add whether it is backtest, sample, simulated, or placeholder data. |
| Final legal-sounding disclosure | Convert it to a placeholder that requires review. |
| User preference fields included | Remove stock/bond ratio, leverage preference, or risk appetite fields. |

## Related References

- `docs/security/creator-review-flow.md`
- `docs/api/dto-contract.md`
- `docs/mock-data/model-catalog.md`
- `docs/model-marketplace/creator-performance-upload-flow.md`
- `lib/domain/models/model-description.ts`
- `app/invest-model/creator/models/new/page.tsx`
