# Staging Environment Plan

BK-098 defines the minimum environment separation rules before investModel enables any real investment-adjacent production flow. This plan does not enable real deposits, real brokerage orders, account linking, legal judgement, paid external API keys, or production secret entry.

## Scope

- Keep local, staging, and production data separate by default.
- Require explicit review gates before a staging build can be promoted to production.
- Preserve current domain boundaries: `MockDeposit` stays simulated funding, and `TradeIntent` stays a pre-order or model intent record until a separate approved financial-operation task changes that contract.
- Keep IS-001 and IS-003 open because they require external production key/device verification.

## Environment Tiers

| Tier | Purpose | Data | Secret Policy | Allowed Finance Behavior |
| --- | --- | --- | --- | --- |
| local | Developer iteration and harness checks | Local fixtures and mock seed data only | `.env.local` values stay on the developer machine and never enter git | Mock flows, simulations, and backtests only |
| staging | Pre-production QA for mobile PWA, admin review, logging, and release gates | Separate staging database, storage, logs, analytics, and monitoring project | Secrets live only in the deployment secret manager; placeholders are used until approved | Mock or sandbox-only behavior with visible non-production labels |
| production | Real user traffic after release approval | Production database and production-only storage/log projects | Production secrets are entered only after security/legal approval | No real deposits, orders, or account linking until explicitly approved |

## Data Separation Rules

- Use distinct `DATABASE_URL` values for local, staging, and production.
- Use separate object storage buckets, log streams, analytics projects, and monitoring projects per tier.
- Do not copy production personal, portfolio, financial, or audit data into local or staging.
- Seed data must be synthetic and visibly marked as mock, simulated, placeholder, fixture, or backtest data.
- Staging records must use synthetic users and synthetic portfolio histories.
- Automation and checklist records may reference staging verification, but they must not store secrets or user financial identifiers.
- Admin review, creator publication, model selection, and portfolio simulation audit events must include environment metadata so logs cannot be confused across tiers.

## Configuration Baseline

Configuration names may be documented, but values must not be committed.

| Config | Local | Staging | Production |
| --- | --- | --- | --- |
| `DATABASE_URL` | Local database or local test DB | Staging database only | Production database only |
| `STRIPE_SECRET_KEY` | Empty or test placeholder | Empty or sandbox key only after approval | Blocked by IS-001 until real test key validation is complete |
| `SENTRY_DSN` | Optional local disabled value | Staging monitoring project | Production monitoring project after approval |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional local disabled value | Staging telemetry endpoint | Production telemetry endpoint after approval |
| Brokerage API keys | Empty | Empty unless a future sandbox task is approved | Empty until a future financial-operation task is approved |

## Promotion Gates

A staging version can be considered for production only when all applicable gates pass.

| Gate | Requirement | Status Source |
| --- | --- | --- |
| Type safety | TypeScript or equivalent project type checks pass | CI or local verification |
| Route smoke | Mobile-first routes render without blank screens | Visual structure smoke |
| Mobile viewport | 390px viewport layout has no major overlap and keeps bottom tabs usable | Frontend QA |
| Real phone check | Physical phone verification is complete | IS-003 |
| Secret hygiene | No secret values in repo, logs, screenshots, fixtures, or Google Sheets | Security review |
| Logging redaction | BK-096 logging strategy is followed for sensitive fields | Security review |
| Error monitoring | BK-097 candidate decision is made before production monitoring is enabled | Security review |
| Production build key check | Stripe or payment-related test-key blocker is resolved | IS-001 |
| Domain safety | `MockDeposit` and `TradeIntent` remain non-executing unless separately approved | Domain contract review |
| Risk copy | UI copy avoids real-trading, guaranteed-return, legal, or advisory claims | Risk/compliance review |

## Rollback And Incident Rules

- Use feature flags or environment variables to disable finance-like UI paths quickly.
- Revert the deployed version or disable the staging-to-production promotion when environment labels, mock labels, or audit logs are wrong.
- Preserve audit logs during rollback; do not delete evidence while correcting a deployment.
- Rotate secrets immediately if a secret value appears in logs, screenshots, fixtures, issue text, or Google Sheets.
- Record any production-data exposure risk as an `Issues` row before continuing automation work.

## Implementation Checklist

| Item | Required Before Production |
| --- | --- |
| Separate database per tier | Yes |
| Separate storage/log/analytics/monitoring project per tier | Yes |
| Synthetic-only staging seed data | Yes |
| Visible staging/mock labels in user-facing finance screens | Yes |
| Secret manager configured outside git | Yes |
| IS-001 resolved for production build key validation | Yes |
| IS-003 resolved for physical phone verification | Yes |
| Real deposits/orders/account links remain disabled | Yes |

## Next Follow-Up Candidates

- Add a release checklist item that confirms environment labels are visible in staging builds.
- Add a small QA script check for mock/staging labels on mobile investment screens.
- Revisit the monitoring candidate decision before enabling a production `SENTRY_DSN` or `OTEL_EXPORTER_OTLP_ENDPOINT`.
