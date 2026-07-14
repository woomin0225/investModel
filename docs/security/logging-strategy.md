# investModel Logging Strategy

<!--
This document closes BK-096 by separating app logs, audit logs, and error logs for the MVP.
It is an operating strategy, not a connection to any external paid logging provider.
-->

## Scope

- Task ID: `BK-096`
- Applies to: app events, API errors, admin actions, creator review actions, mock portfolio state, and automation runs
- Out of scope: external vendor setup, production retention configuration, real brokerage logs, real payment logs, and legal-final disclosure records

## Log Streams

| Stream | Purpose | Examples | Retention Owner |
| --- | --- | --- | --- |
| App log | Operational health and user-visible flow diagnostics | route loaded, mock screen rendered, API latency bucket | engineering |
| Audit log | Security and compliance-relevant decisions | admin review action, creator draft submission, model status transition, role change | security/compliance |
| Error log | Exceptions and failed policy checks | validation failure, policy_blocked transition, webhook signature failure | engineering/security |
| Automation run log | Codex and checklist execution trace | selected Backlog ID, verification command, commit hash, unresolved issue IDs | project operator |

## Required Separation

- App logs can describe product flow but must not become an audit source of record.
- Audit logs must include actor role, action, target public ID, decision status, reason code, and timestamp.
- Error logs may include stack traces in non-production, but production errors must prefer normalized error codes and request IDs.
- Automation run logs stay in Google Sheets `Runs` and must reference commit hashes instead of copying full diffs or secrets.

## Never Log

- Passwords, session tokens, OAuth tokens, API keys, webhook secrets, Stripe keys, database URLs, or recovery codes.
- Raw brokerage account identifiers, bank account identifiers, payment card data, or real deposit/withdrawal details.
- Full request bodies for model draft submissions, disclosures, or review comments.
- User free-text fields before redaction review.
- Uploaded model files, source code, embeddings, or private creator artifacts.
- Legal advice conclusions or suitability determinations.

## Redaction Rules

- Use public IDs when possible, such as `model_public_id`, `model_version_public_id`, and `user_public_id`.
- Replace secrets with `[redacted_secret]` before serialization.
- Replace free text with length and checksum metadata when debugging is required.
- Keep `MockDeposit` and `TradeIntent` explicitly named as mock or simulation when they appear in logs.
- Store request correlation as `request_id`, not as raw headers or cookies.

## MVP Event Shape

```ts
type InvestModelLogEvent = {
  stream: 'app' | 'audit' | 'error' | 'automation';
  eventName: string;
  requestId?: string;
  actorRole?: 'user' | 'creator' | 'admin' | 'system';
  targetPublicId?: string;
  status: 'ok' | 'blocked' | 'failed';
  reasonCode?: string;
  isMockOnly?: boolean;
  createdAt: string;
};
```

## Review Checklist

- A log event that changes model state must also be represented in `AuditLog`.
- A failed policy check must use `blocked` or `policy_blocked`, not a generic server error.
- Any new external logging provider requires security review before adding keys or SDK initialization.
- Production logs must be sampled or rate-limited for repeated validation failures.
- Logs must not imply real order execution, real deposit movement, or connected brokerage behavior during the MVP.

## Open Follow-Up

- `IS-001` remains open for real Stripe test key and Docker setup validation.
- `IS-003` is resolved as of 2026-07-14 for real phone verification of the current mobile shell.
- `BK-097` should evaluate monitoring candidates against this redaction and stream separation baseline.
