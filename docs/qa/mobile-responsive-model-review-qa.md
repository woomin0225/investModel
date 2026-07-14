# Mobile Responsive Model Review QA

<!--
This record closes BK-094 by documenting mobile structural checks for model discovery, model detail, and admin review screens.
It did not replace physical device verification; IS-003 was later resolved on 2026-07-14 for the current mobile shell.
-->

## Scope

- Task ID: `BK-094`
- Screens checked: model discovery, model detail, admin review queue, admin review detail
- Viewport assumption: `390px` mobile frame with safe-area bottom navigation
- Out of scope: real phone device verification, production browser matrix, real approval API, real order/deposit/account flows

## Automated Verification

```powershell
npx tsx scripts/qa/invest-model-visual-structure-smoke.ts
```

The smoke test now includes:

- `Discover Models`: uses `MobileShell`, `activeTab="models"`, and `/invest-model/models` language-toggle path.
- `Model Detail`: keeps model detail copy tied to drawdown, volatility, leverage, concentration, and no-live-trading copy.
- `Admin Review Queue`: checks pending review model name, creator, blocked action, disclosure status, mobile shell, and bottom-tab placement.
- `Admin Review Detail`: checks strategy, mandate, performance source, required review items, `pending_review`, and disabled status-transition boundaries.

## Result

| Check | Result | Notes |
| --- | --- | --- |
| Mobile shell frame | Pass | Screens keep the constrained mobile frame and shared bottom navigation. |
| Safe area | Pass | Shared shell reserves `env(safe-area-inset-bottom)`. |
| Current path for language toggle | Pass | Listing, detail, and admin review paths are preserved. |
| Long unbroken text | Pass | Required mock copy avoids long unbroken tokens that can overflow narrow cards. |
| Mock/live boundary | Pass | Admin review remains read-only and does not expose real approval, TradeIntent, order, or deposit behavior. |

## Remaining Risk

- `IS-003` is resolved as of 2026-07-14 for the current mobile shell; rerun a physical-device spot check after major mobile shell changes.
- The automated check is code-structure and copy-invariant based; it is not a pixel screenshot test.
