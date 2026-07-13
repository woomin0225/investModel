# Accessibility Basic QA

<!--
This record closes BK-095 for the current mobile investModel prototype.
It is a structural accessibility pass, not a full assistive-technology audit.
-->

## Scope

- Task ID: `BK-095`
- Screens checked by structure smoke: Home, Discover Models, Realtime Signals, Model Detail, Admin Review Queue, Admin Review Detail, Feed Insights, Mock Portfolio
- Primary viewport: `390px` mobile PWA frame
- Out of scope: real phone screen reader testing, full WCAG audit, production browser matrix

## Automated Checks

```powershell
npx tsx scripts/qa/invest-model-visual-structure-smoke.ts
```

The smoke check now covers these accessibility basics:

- Bottom navigation has a stable `aria-label`.
- Active bottom tab exposes `aria-current="page"`.
- Shared mobile navigation and language links expose visible keyboard focus rings.
- Major icon-only controls in investModel pages keep non-empty `aria-label` values.
- Touch targets use `min-h-invest-touch-target` on shared navigation and major controls.
- Mobile copy avoids long unbroken tokens that can overflow narrow cards.

## Result

| Check | Result | Notes |
| --- | --- | --- |
| Bottom navigation label | Pass | Shared nav uses `aria-label="investModel mobile navigation"`. |
| Active tab state | Pass | Active tab uses `aria-current="page"`. |
| Keyboard focus visibility | Pass | Bottom nav, language toggle, and shared section action receive visible focus rings. |
| Touch target baseline | Pass | Shared shell and major controls keep the investModel touch target token. |
| Empty aria labels | Pass | Structure smoke rejects empty `aria-label` strings in checked pages. |

## Remaining Risk

- `IS-003` remains open because real phone and assistive-technology verification require user/device access.
- This pass does not replace a full WCAG color contrast measurement or screen reader session.
