# Visual Regression Baseline

<!--
This document defines the minimum visual regression baseline for investModel mobile-first screens.
It does not approve final brand, legal, financial, or real-device behavior.
-->

## Scope

- Task: `BK-075`
- Baseline viewport: `390 x 844` mobile frame
- Shell requirement: `MobileShell` with fixed bottom navigation and bottom safe-area padding
- Screens in baseline:
  - `/invest-model`
  - `/invest-model/models`
  - `/invest-model/models/quant-us-leverage-alpha`
  - `/invest-model/signals`
  - `/invest-model/feed`
  - `/invest-model/portfolio`
  - `/invest-model/admin/reviews`
  - `/invest-model/admin/reviews/rev-quant-us-leverage-alpha`

## Pass Criteria

Each baseline screen must satisfy these checks before a visual change is accepted:

- The page renders inside the mobile frame without horizontal scrolling.
- Fixed bottom navigation does not cover the final visible content.
- Korean and English copy fit within cards, buttons, badges, and tabs.
- Risk, drawdown, volatility, mock-only, and no-live-trading labels remain visible when present.
- High-risk model warnings are not visually smaller or less prominent than performance summary content.
- Admin review screens keep review status, model risk, disclosure state, and forbidden actions readable.
- No UI element overlaps another element at the 390px baseline viewport.

## Failure Conditions

Treat any of these as a regression:

- A button, badge, card title, tab label, or risk notice clips text.
- A long model name or Korean sentence causes horizontal overflow.
- The bottom tab bar hides content that should be reachable by scrolling.
- A model screen shows performance without nearby drawdown or volatility context.
- Mock portfolio content looks like a real deposit, real balance, live order, broker account, or executed trade.
- Signal or feed content reads like buy, sell, hold, rebalance, or return-guarantee advice.

## Current Verification

The current automated baseline is structural rather than pixel-based:

```powershell
npx tsx scripts/qa/invest-model-visual-structure-smoke.ts
npx tsc --noEmit
```

The smoke test verifies `MobileShell`, active tabs, safe-area structure, public model filtering, performance-plus-risk context, mock portfolio boundaries, and long unbroken text tokens.

## Known Gap

Pixel screenshots are not yet captured automatically in this repository. Actual phone verification remains tracked separately by `IS-003`.
