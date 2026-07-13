# Error Monitoring Candidates

<!--
This document closes BK-097 by evaluating monitoring candidates without installing SDKs,
creating accounts, adding API keys, or connecting paid external services.
-->

## Scope

- Task ID: `BK-097`
- Dependency: `BK-096` logging stream and redaction baseline
- Purpose: choose an error monitoring direction that can support Next.js, security review, and sensitive-data controls
- Out of scope: vendor signup, paid plan choice, SDK initialization, DSN/API key entry, production retention configuration

## Evaluation Criteria

| Criterion | Requirement |
| --- | --- |
| Sensitive data control | Must support source-side filtering or server-side scrubbing before storage. |
| Next.js support | Must support server and client errors in a Next.js app. |
| Vendor lock-in | Prefer OpenTelemetry-compatible export or a clear migration path. |
| Audit separation | Error events must not replace `AuditLog` records. |
| MVP safety | Must not collect raw request bodies, cookies, tokens, account IDs, or model file contents by default. |
| Operations fit | Must support issue grouping, alert routing, and low-volume startup usage. |

## Candidate Summary

| Candidate | Fit | Security Notes | Decision |
| --- | --- | --- | --- |
| Sentry | Strong for Next.js exception grouping and release context. | Official docs describe data collection and advanced data scrubbing. Must configure SDK `beforeSend` and server-side scrubbing before production. | Good first candidate after security review. |
| OpenTelemetry Collector | Strong vendor-neutral pipeline for traces, metrics, and logs. | Official collector processors can transform telemetry; attributes/redaction patterns can remove sensitive fields before export. Requires more setup than a hosted SDK. | Best baseline for future vendor portability. |
| Datadog Logs/APM | Strong hosted observability suite. | Official docs recommend source collection scrubbing for prohibited sensitive data. Higher operational and cost footprint. | Defer until production ops budget exists. |
| CloudWatch Logs | Strong if the stack deploys on AWS. | Official docs support log data protection policies to audit and mask sensitive ingested data. AWS-only fit. | Consider only with AWS deployment decision. |
| Better Stack | Simple logs/incident/on-call path. | Official docs describe S3-compatible bucket storage for tighter control over archived telemetry. Need separate source redaction discipline. | Candidate for lightweight logging, not primary error SDK yet. |

## Recommended MVP Path

1. Keep current prototype on local logs plus Google Sheets `Runs` until production hosting is chosen.
2. Add a small internal error event wrapper before any vendor SDK:
   - `eventName`
   - `requestId`
   - `actorRole`
   - `targetPublicId`
   - `status`
   - `reasonCode`
   - `isMockOnly`
3. Use `BK-096` redaction rules at source before sending events outside the app.
4. Revisit Sentry first for Next.js exception grouping only after:
   - DSN is provided through environment variables
   - `beforeSend` strips request bodies, cookies, headers, tokens, and free text
   - server-side scrubbing rules are configured
   - sample events are reviewed in a non-production project
5. Add OpenTelemetry Collector only when infra work starts needing vendor-neutral routing or multiple telemetry destinations.

## Required Redaction Baseline

Never send these fields to any monitoring vendor:

- passwords, session tokens, OAuth tokens, API keys, webhook secrets, Stripe keys, database URLs, or recovery codes
- raw bank, brokerage, card, deposit, withdrawal, or order identifiers
- full request bodies, cookies, auth headers, and query strings
- model source files, uploaded artifacts, embeddings, private creator data, or legal review free text
- raw `MockDeposit` and `TradeIntent` payloads unless reduced to mock-safe public IDs and status codes

## Candidate References

- Sentry Next.js data collection: `https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/data-collected/`
- Sentry advanced data scrubbing: `https://docs.sentry.io/security-legal-pii/scrubbing/advanced-datascrubbing/`
- OpenTelemetry Collector processors: `https://opentelemetry.io/docs/collector/components/processor/`
- Datadog sensitive log data access: `https://docs.datadoghq.com/logs/guide/manage-sensitive-logs-data-access/`
- CloudWatch Logs data masking: `https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html`
- Better Stack own-bucket storage: `https://betterstack.com/docs/logs/host-data-in-your-own-bucket/`

## Follow-Up

- `IS-001` remains open because production build validation needs a real Stripe test key and Docker setup.
- `IS-003` remains open because phone verification requires user/device access.
- Before any SDK install, create a small Backlog item for an internal `InvestModelErrorEvent` wrapper and source redaction test.
