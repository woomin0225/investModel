# Environment Variable Strategy

Reviewed: 2026-07-14
Task: BK-065

This document defines how investModel should separate local, CI, staging, and production environment variables. It intentionally contains variable names and storage rules only. No real secret values, account credentials, live payment keys, broker credentials, or deployment connections are added here.

## Principles

- Never commit real secrets. Commit only placeholder names, sample values, and documentation.
- Keep developer-only values in `.env.local`; it must remain local and gitignored.
- Keep reusable placeholder names in `.env.example`.
- Store CI secrets in GitHub Actions secrets only, and avoid printing them in logs.
- Store staging and production secrets in the hosting provider's managed environment configuration or secret manager after a deployment owner approves the target.
- Use `NEXT_PUBLIC_` only for values that are safe to expose in browser JavaScript.
- Do not put database credentials, auth secrets, Stripe secret keys, webhook secrets, broker credentials, or bank/payment credentials behind `NEXT_PUBLIC_`.
- Simulation and mock features must stay visibly separated from real money movement, real account linking, and real order execution.
- Rotate affected keys immediately if a secret is suspected to have been exposed.

## Environments

| Environment | Storage | Allowed values | Owner | Notes |
| --- | --- | --- | --- | --- |
| Local development | `.env.local` plus `.env.example` placeholders | Local test values only | Developer | `.env.local` stays outside git. Use test Stripe keys only when the owner provides them locally. |
| CI | GitHub Actions secrets | CI-only secrets such as optional test `STRIPE_SECRET_KEY` | Repository admin | The CI workflow must stay gated when a secret is absent. Secrets must not be echoed. |
| Staging | Hosting provider environment settings or secret manager | Staging database, staging auth, test payment values | Deployment owner | Configure only after `IS-001` is resolved and the staging target is approved. |
| Production | Hosting provider environment settings or secret manager | Production values after legal, security, and release review | Product owner | Not configured during the current mock-first phase. |

## Current Variables

| Variable | Secret | Scope | Rule |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Local, CI, staging, production | Never expose with `NEXT_PUBLIC_`. Use separate databases per environment. |
| `BASE_URL` | No | Local, CI, staging, production | Use the canonical server URL for callbacks and internal links. |
| `NEXT_PUBLIC_APP_URL` | No | Browser, PWA, staging, production | Public app URL only. Do not embed tokens or credentials. |
| `AUTH_SECRET` | Yes | Local, CI, staging, production | Required for signed auth/session behavior. Generate independently per environment. |
| `STRIPE_SECRET_KEY` | Yes | Local, CI, future staging | Test key only until `IS-001` is resolved. Codex must not request or enter the real value. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Future staging and production | Add only after webhook routing and deployment ownership are decided. |
| `AWS_REGION` | No | Future AWS deployment | Safe to document, but deployment account credentials stay out of the app repository. |
| `OPENAI_API_KEY` | Yes | Future automation only | Not an app runtime variable. If Codex Action is enabled later, store it only as a GitHub secret. |

## Prohibited Runtime Boundaries

The current product remains mock-first and mobile PWA-first. Environment variables must not enable any of the following without a new approved task, explicit user confirmation, and risk review:

- Real deposits, withdrawals, or bank transfers.
- Real broker account linking.
- Real order execution.
- Live Stripe payment keys.
- Legal or suitability decisions that determine whether a user may invest.
- Hidden switches that make mock data look like real account balances or executed trades.

If a new variable name implies real trading, broker access, deposits, live payments, or production financial authority, stop implementation and record or update an Issue before adding it.

## Domain Guardrails

Environment variables must preserve the domain separation used by the app:

- `MockDeposit` is a simulated funding event and must not be connected to banking credentials.
- `TradeIntent` is a user intent object and must not directly execute a real order.
- Portfolio and recommendation screens must continue to label mock or simulated states clearly.
- Server-side secrets belong on the server only; browser code receives only public URLs and public feature flags.

## Pre-Deployment Checklist

Before staging or production setup:

- Confirm all required names exist in `.env.example` without real values.
- Confirm `.env.local` and other local secret files are gitignored.
- Confirm CI stays green when optional secrets are absent.
- Confirm build or smoke tests do not require live payment, broker, or bank credentials.
- Confirm `IS-001` is either resolved or explicitly accepted as an external blocker.
- Confirm `IS-003` remains tracked for real phone-device verification.

## Issue Status

- `IS-001` remains open. This document defines the strategy but does not provide or configure a real Stripe key.
- `IS-003` remains open. This document does not replace physical mobile-device verification.
