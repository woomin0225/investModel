# Creator Performance Upload Flow

Related task: BK-083

## Scope

This document defines the creator flow for submitting model performance material for review. It covers metadata, source files, review routing, and public exposure rules.

It does not approve a performance claim, finalize legal copy, execute uploaded model files, connect a broker account, or publish unreviewed return data.

## Goals

- Let a verified `creator` attach performance evidence to a draft `ModelVersion`.
- Keep all submitted data private until admin and compliance review passes.
- Preserve visible `backtest`, `sample`, `placeholder`, source, volatility, and drawdown context.
- Route sensitive wording to `ComplianceReview` instead of letting creator copy go public.
- Create audit events for submission, changes requested, approval, rejection, and policy blocks.

## Creator Inputs

The upload form should accept only performance evidence metadata and non-executable supporting files.

| Field | Required | Rule |
| --- | --- | --- |
| `modelPublicId` | yes | Creator must own the parent `InvestmentModel`. |
| `modelVersionPublicId` | yes | Version must be `draft` or `changes_requested`. |
| `performancePeriod` | yes | Text range such as `2023-01 to 2024-12`; no future guarantee wording. |
| `measurementSource` | yes | Backtest, paper simulation, or reviewer-supplied source label. |
| `returnMetric` | optional | Stored as review-only until approved; never shown without risk metrics. |
| `volatilityMetric` | optional | Required if `returnMetric` is submitted. |
| `maxDrawdownMetric` | optional | Required if `returnMetric` is submitted. |
| `methodologySummary` | yes | Plain explanation of measurement method, not marketing copy. |
| `supportingFile` | optional | CSV, PDF, or image proof only; executable model artifacts remain out of scope. |
| `creatorNotes` | optional | Creator-facing notes; reviewed before any public summary is derived. |

## Blocked Inputs

The flow must block or route to review when submitted material includes:

- guaranteed return, no loss, principal protection, or risk-free claims
- legal approval or suitability wording
- live brokerage, account, deposit, order, execution, fill, or settlement identifiers
- executable model artifacts or scripts
- unpaired return values without volatility and drawdown context
- public display flags that bypass review

Blocked attempts should produce a `policy_blocked` result and an audit event. Borderline wording should become `legal_review_required` or `changes_requested`, not public copy.

## State Flow

```text
draft performance material
-> creator submits review
-> pending_review snapshot
-> admin changes_requested | rejected | approved_placeholder
-> live display only when the linked ModelVersion becomes live
```

The submission should not mutate a live `ModelVersion` in place. If a live model needs updated performance material, create a new draft `ModelVersion` or disclosure review item.

## Review Snapshot

On submission, freeze a snapshot so the creator cannot change the reviewed payload after the fact.

| Snapshot field | Purpose |
| --- | --- |
| `performanceSubmissionPublicId` | Creator-visible review id. |
| `modelPublicId` | Parent model public id. |
| `modelVersionPublicId` | Draft or changes-requested version under review. |
| `submittedByCreatorPublicId` | Creator actor id. |
| `submittedAt` | ISO timestamp. |
| `performancePeriod` | Measurement period. |
| `measurementSource` | Backtest, paper simulation, or other source label. |
| `metrics` | Return, volatility, drawdown as review-only values. |
| `methodologySummary` | Reviewable method summary. |
| `supportingFileRefs` | Non-executable file references after malware/type checks. |
| `publicExposure` | Always `not_public` until approval and live version publication. |

## API Shape Draft

| Method | Path | Actor | Result |
| --- | --- | --- | --- |
| `POST` | `/api/creator/models/:modelId/performance-submissions` | creator | Creates `pending_review` submission snapshot. |
| `GET` | `/api/creator/models/:modelId/performance-submissions` | creator | Lists own submission status and change requests. |
| `GET` | `/api/admin/performance-submissions` | admin | Review queue with private creator evidence. |
| `POST` | `/api/admin/performance-submissions/:id/request-changes` | admin | Moves submission to `changes_requested`. |
| `POST` | `/api/admin/performance-submissions/:id/reject` | admin | Moves submission to `rejected`. |
| `POST` | `/api/admin/performance-submissions/:id/approve-placeholder` | admin | Allows placeholder display when linked live version permits it. |

No endpoint should expose raw uploaded files to public users. Public model detail pages should consume reviewed DTO fields only.

## Public Display Rules

Performance material can reach public model surfaces only when all conditions are true:

- linked `InvestmentModel` is `live`
- linked `ModelVersion` is the current live version
- performance submission is `approved_placeholder`
- related `ModelDisclosure` is `approved_placeholder`
- return-like values are paired with source, volatility, max drawdown, and non-guarantee context
- no final legal or financial wording is generated by Codex

If any condition fails, the public DTO should omit performance details or show a neutral placeholder such as `performance under review`.

## Audit Events

| Event | Result |
| --- | --- |
| `creator_performance_submission_created` | `review_required` |
| `creator_performance_submission_resubmitted` | `review_required` |
| `creator_performance_claim_blocked` | `policy_blocked` |
| `admin_performance_changes_requested` | `review_required` |
| `admin_performance_submission_rejected` | `denied` |
| `admin_performance_placeholder_approved` | `allowed` |
| `system_performance_submission_superseded` | `allowed` |

Audit metadata must not include private API keys, brokerage account identifiers, payment identifiers, or raw executable artifacts.

## Acceptance Checklist

- Creator can submit performance evidence only for own draft or changes-requested versions.
- Unreviewed performance data is not public.
- Return-like values require volatility and max drawdown context.
- Sensitive or promotional wording is blocked or sent to review.
- Uploaded supporting files are non-executable and private by default.
- Public display waits for both model version and disclosure review state.
- All state changes create audit candidates.

## Follow-Up

- BK-084 should turn this queue into an admin review screen.
- A later backend task should define `PerformanceSubmissionDto` and validation helpers.
- Public launch still requires qualified legal and financial review for final performance methodology language.
