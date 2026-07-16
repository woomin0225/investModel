# investModel 390px Mobile Smoke Checklist

<!--
BK-460: This checklist is for recurring heartbeat runs that touch investModel mobile UI.
It is structural QA guidance only; it does not approve legal, financial, real-money, account, broker, or physical-device behavior.
-->

## Purpose

Use this checklist whenever a heartbeat changes investModel frontend UI, QA docs, or visual structure guards. The goal is to keep the app usable in a `390px` mobile frame with Capacitor-first constraints, fixed bottom tabs, visible safe-area spacing, clear pressed/focus states, and explicit mock/simulated safety boundaries.

This checklist is executable without paid services, real accounts, broker access, external market-data APIs, or physical devices.

## Minimum Commands

Run these for UI or visual-structure changes:

```powershell
npx tsc --noEmit
npx tsx scripts/qa/invest-model-visual-structure-smoke.ts
git diff --check
```

For documentation-only updates to this checklist or related QA docs, run:

```powershell
git diff --check -- docs/qa/invest-model-390px-smoke-checklist.md
rg -n "390px|safe area|bottom tab|touch|pressed|focus|mock|simulated|no real|TradeIntent|MockDeposit" docs/qa/invest-model-390px-smoke-checklist.md
```

## Structural Checklist

Before marking a mobile UI task done, confirm:

| Check | What to verify | Evidence to record in `Runs.verification` |
| --- | --- | --- |
| Mobile shell | Changed screens still render through `MobileShell` and set the correct `activeTab`. | `invest-model-visual-structure-smoke` pass or targeted source check. |
| Width discipline | Main content stays inside the shared `390px` frame and does not introduce page-level horizontal scroll. | Smoke pass plus targeted source check for constrained shell/layout classes when relevant. |
| Safe area | Fixed bottom tabs do not cover the last meaningful content; bottom padding keeps scrollable content reachable. | Smoke pass or source check for `env(safe-area-inset-bottom)` and bottom spacing. |
| Bottom tabs | Tab labels, current state, and focus rings remain visible and tap targets stay at least `44px`. | Smoke pass for `BottomNav`, `aria-current`, and touch target tokens. |
| Touch targets | Primary buttons, filter chips, cards, and icon controls keep `min-h-invest-touch-target` or an equivalent 44px-safe hit area. | Smoke pass or targeted `rg` for touched components. |
| Pressed and focus states | Interactive cards and controls keep active/pressed feedback, visible focus rings, and reduced-motion behavior. | Smoke pass for `investMotionClass` or targeted `rg` for `active:`, `focus`, and `motion-reduce`. |
| Text fit | Korean and English titles, badges, buttons, and safety lines wrap or clamp without clipping outside their parent. | Smoke pass for long-token checks and targeted source review for changed copy. |
| Card hierarchy | Repeated lists use a rail/grouping treatment rather than card-looking wrappers around card children. | Smoke pass for `investCardClass.listRail` or targeted `rg` for list rail classes. |
| Safety copy | `MockDeposit`, `AllocationDecision`, `SignalEvent`, and `TradeIntent` remain visibly mock, simulated, observational, or pre-order-only. | Targeted `rg` for mock/simulated/no real/order/broker copy in changed files. |
| Forbidden implications | No CTA or card copy implies real deposit, withdrawal, order execution, broker/account linking, guaranteed return, or legal approval. | Targeted forbidden-word scan and manual source review of changed copy. |
| Empty/error states | Empty, loading, unavailable, and error states keep the same mobile shell and do not ask for real account, broker, deposit, or order actions. | Smoke pass or targeted source check for changed state components. |
| Locale paths | Language toggle and detail back links keep route context and do not strand users outside the tab flow. | Smoke pass or targeted source check for changed routes. |

## Quick Targeted Scans

Use these scans when a run touches the relevant area:

```powershell
rg -n "real deposit|withdraw|cash available|order placed|executed|filled|broker|connect account|guaranteed|risk free|legally approved|suitability approved" app/invest-model components/invest-model docs
rg -n "min-h-invest-touch-target|size-invest-touch-target|active:|focus-visible|focus:ring|motion-reduce" app/invest-model components/invest-model
rg -n "rounded-invest-card bg-invest-bg-soft p-1.5|space-y-2.5 rounded-invest-card bg-invest-bg-soft" app/invest-model components/invest-model
```

The first scan can return allowed explanatory policy text, but any new user-facing CTA or state label must be reviewed carefully. Real-money, real-order, account-linking, guaranteed-return, or legal-approval wording must not be introduced by automation.

## Completion Rule

Record the exact commands and targeted scans in `Runs.verification`. If visual checks cannot run, do not silently mark the task done; record the blocker or create a follow-up Backlog item.
