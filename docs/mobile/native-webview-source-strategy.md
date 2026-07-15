# Native WebView Source Strategy

Last checked: 2026-07-15

## Decision

The first investModel Capacitor shell should use a server-backed WebView source.

Use this order:

1. Local developer browser checks: `npm run dev` on the workstation.
2. Android/iOS device smoke: `CAPACITOR_DEV_SERVER_URL` pointed at a LAN-accessible Next.js dev server.
3. Internal alpha: `CAPACITOR_DEV_SERVER_URL` pointed at an HTTPS staging deployment.
4. Bundled static export: deferred to a separate feasibility task.

Do not generate Android or iOS native projects until this strategy is accepted by the related platform scaffold tasks.

## Why Server-Backed First

The current app is not a static-only PWA. The investModel routes depend on server code and API routes for DB-backed read models, including:

- `/api/models` and `/api/models/[modelId]`
- `/api/signals` and `/api/signals/[signalId]`
- `/api/feed`, `/api/feed/[postId]`, rankings, reads, saves, likes, comments, and replies
- `/api/portfolio/mock-summary`
- `/api/notifications` and mark-all-read
- `/api/my` and `/api/my/activity`
- `/api/search`
- `/api/model-selections`

Many investModel pages call route handlers directly from server components for read-model hydration, while client actions call relative `/api/...` endpoints. A bundled static export would need a replacement API host, route rewrites, auth/session decisions, and offline/error copy before it can behave like the current app.

## Current Capacitor Config Contract

`capacitor.config.ts` keeps the first scaffold narrow:

- `appId`: `com.investmodel.app`
- `appName`: `investModel`
- `webDir`: `out`, kept only as a Capacitor-required placeholder until a static export decision exists
- `server.url`: populated only when `CAPACITOR_DEV_SERVER_URL` is set
- `server.cleartext`: allowed only when the configured URL starts with `http://`, for local/LAN device smoke

The config must not add native permissions, native plugins, push delivery, biometric unlock, secure storage, store submission behavior, broker/bank/payment connections, or real financial operations.

## Local And LAN Device Smoke

Use local/LAN mode only for development devices controlled by the team.

Example:

```bash
npm run dev -- --hostname 0.0.0.0
CAPACITOR_DEV_SERVER_URL=http://192.168.0.10:3000 npx cap run android
```

Requirements:

- The phone and workstation are on the same trusted network.
- The URL opens `/invest-model` in the phone browser before Capacitor testing.
- Mock, simulated, no-order, no-brokerage, and no-advice boundaries remain visible.
- No production secrets or real financial account data are exposed through the LAN server.
- No native permission prompt appears.

This mode is acceptable for Android emulator and physical Android smoke. It is also acceptable for iOS simulator/device smoke on a Mac, but only as a development check.

## HTTPS Staging Internal Alpha

Use HTTPS staging before inviting broader internal testers.

Staging must be available before this becomes the default native source:

- HTTPS URL with a valid certificate.
- Production-like Next.js server runtime for API routes.
- Database seed or mock-ingestion data that does not include real funds, real orders, broker accounts, bank accounts, private credentials, or paid external data keys.
- Clear unavailable/offline copy that does not imply real account failure or financial loss.
- Authentication and user-scope decisions reviewed, especially IS-006.
- IS-001 production build issue understood and either resolved or explicitly scoped away from the staging runtime being used.

Staging still does not mean App Store or Play Store readiness.

## Bundled Static Export Conditions

Do not use bundled static export for the first shell.

It can be reconsidered only after a separate task proves all of the following:

- `next.config.ts` can support a static export without breaking required investModel routes.
- Every DB-backed read model has an approved static snapshot, embedded seed, or remote API strategy.
- Client actions that mutate Feed, Notifications, My Page, and model selections have a safe remote API or disabled/offline behavior.
- Search, Signals, Feed ranking, Portfolio mock summary, and My Page activity have deterministic static or remote contracts.
- Error states clearly say the app is a simulated prototype and not a real account/order system.

Until then, `webDir: 'out'` is a placeholder only, not a commitment to static export.

## IS-001 Relationship

IS-001 says the production build currently fails when Stripe uses a placeholder secret during `/pricing` prerendering, and Docker/Postgres local setup was not verified.

For BK-411:

- IS-001 blocks treating a production build as solved.
- IS-001 does not block documenting or using a LAN Next.js dev server for internal native smoke.
- IS-001 must be resolved or routed around before an HTTPS staging deployment is promoted as a reliable internal alpha source.
- Native platform scaffold tasks must keep this issue linked until build/deploy behavior is proven.

## Security Boundary

This strategy is for WebView source selection only.

It does not authorize:

- real deposits, withdrawals, payments, or custody
- real brokerage, bank, exchange, or account linking
- buy/sell order execution, fills, settlement, or broker API calls
- paid external market/news/search APIs
- production secrets or webhook secrets
- push notifications
- biometric unlock
- native secure token storage
- final legal, suitability, or investment advice wording

Any task that needs one of those items must stop and create or link a separate Issue.

## Next Tasks

- BK-412 can check Android environment readiness without native source changes.
- BK-413 can generate Android only after confirming the selected WebView source for that run.
- BK-416 can check iOS environment readiness on a Mac without native source changes.
- BK-417 can generate iOS only after the Mac/Xcode gate and this source strategy are accepted.
- BK-421 should include a native prerequisite runner that checks `npx tsc --noEmit`, PWA manifest smoke, visual structure smoke, and the chosen `CAPACITOR_DEV_SERVER_URL`.
