# Stripe Build Isolation For investModel

Reviewed: 2026-07-14
Task: BK-158
Related issue: IS-001

This note defines how automated investModel work should treat the existing SaaS starter Stripe pricing and payment surface while `IS-001` remains open. It does not add Stripe keys, change payment behavior, connect live payments, or mark the production build blocker resolved.

## Current Boundary

The investModel MVP is a mobile-first PWA prototype with mock-only financial state. The original starter still contains Stripe-oriented routes, setup scripts, and pricing copy. Those files are not investModel funding, deposit, brokerage, or order-execution features.

Until `IS-001` is resolved, automation must keep these facts separate:

- investModel routes such as `/invest-model` can be checked with targeted smoke tests and mobile viewport checks.
- Production `next build` can still be blocked by starter pricing or payment code that expects a real Stripe test secret.
- A passing targeted investModel check is not a passing production release build.
- A real Stripe test key, webhook secret, or Stripe CLI login must be provided by the project owner outside the repository.

## Allowed Without Secrets

Automation may do the following without user-provided secrets:

- Document the Stripe starter surface and its effect on build readiness.
- Run targeted static checks on files changed for investModel work.
- Run route-level smoke checks for mock-only investModel pages when a local server is already available.
- Keep `IS-001` open and link it from deployment, build, or Stripe-related checklist rows.
- Propose a later code task that isolates or disables starter pricing routes, as long as it is reviewed before implementation.

## Not Allowed Without User Confirmation

Automation must stop before doing any of the following:

- Entering or inventing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or Stripe CLI credentials.
- Replacing a real Stripe key with a committed placeholder that makes production readiness look complete.
- Claiming `next build` is production-ready while the pricing route still requires a real Stripe test key.
- Enabling live checkout, billing portal, real deposits, broker funding, account linking, or order execution.
- Removing payment or pricing code as a broad refactor without a dedicated checklist task and review.

## Verification Labels

Use precise verification language while `IS-001` is open:

| Situation | Allowed wording | Avoid |
| --- | --- | --- |
| Markdown-only work | `git diff --check passed for the changed document.` | `build passed` |
| investModel route smoke test | `/invest-model returned 200 in local smoke check.` | `production app verified` |
| TypeScript targeted check | `Targeted type/static check passed.` | `release build ready` |
| Skipped production build | `next build skipped because IS-001 requires external Stripe test secret validation.` | `build is clean enough` |

## Isolation Options For A Future Task

These options are candidates only. Choose one through a separate Backlog item before changing code.

| Option | Description | Tradeoff |
| --- | --- | --- |
| Configure test secrets externally | Keep starter pricing routes and provide Stripe test secrets through local or CI secret stores. | Closest to the starter path, but remains externally blocked. |
| Gate starter pricing route | Make `/pricing` unavailable in investModel prototype environments unless payment secrets are configured. | Reduces accidental build/runtime coupling, but requires careful UX and route behavior review. |
| Remove starter payment surface from MVP | Delete or archive starter pricing, checkout, and billing portal paths from the MVP app. | Simplest product boundary, but larger code change that needs explicit approval. |
| Split investModel app from SaaS starter billing | Keep billing code in a separate package or future branch. | Clean long-term boundary, but too large for one automation heartbeat. |

## Release Impact

`IS-001` blocks any claim that production build, payment setup, or public launch readiness is complete. It does not block continued mock-only investModel prototype work, mobile PWA layout checks, domain DTO work, or documentation updates that do not require Stripe credentials.

Before public launch or paid functionality:

- Resolve `IS-001` with owner-provided test secrets stored outside code, or remove/isolate the Stripe starter surface through an approved task.
- Re-run the appropriate build command in the approved environment.
- Confirm no Stripe path is described as a deposit, brokerage, or investment execution feature.
- Keep `MockDeposit` and `TradeIntent` copy visibly simulated and separate from payment or order execution.

## Issue Status

- `IS-001` remains open. This document records the operating boundary and follow-up options only.
- `IS-003` is resolved as of 2026-07-14 for the current mobile shell; rerun phone-device verification after major mobile shell changes.
