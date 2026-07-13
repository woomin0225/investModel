<!--
이 문서는 investModel의 모델 제작자 권한과 draft -> pending_review 심사 요청 흐름을 정의한다.
AI 작업자는 제작자 API나 화면을 만들 때 이 문서를 기준으로 승인 없는 live 전환, 타 제작자 데이터 접근, 위험/성과 문구 우회 수정을 막아야 한다.
-->

# Creator Review Flow

## Scope

이 문서는 `creator` 역할이 본인 AI 투자 모델을 작성하고 심사 요청하는 MVP 흐름을 정의한다. 실제 모델 파일 실행, 실제 주문, 실제 입금, 최종 법률 승인 문구 작성은 범위 밖이다.

## Creator Can

| Capability | Resource | Required condition |
| --- | --- | --- |
| Create model draft | `InvestmentModel` | actor role is `creator`; owner is current creator |
| Edit draft model metadata | `InvestmentModel` | status is `draft` or `changes_requested`; owner only |
| Create draft version | `ModelVersion` | parent model belongs to creator; version is not live |
| Edit mandate draft | `PortfolioMandate` | version is draft; no user-editable preference fields |
| Edit risk profile draft | `ModelRiskProfile` | version is draft; risk labels require disclosure placeholder |
| Edit disclosure draft | `ModelDisclosure` | version is draft or changes requested |
| Submit for review | `ModelVersion` | required fields complete; disclosure placeholders present |
| View rejection/change request | `ComplianceReview` | review belongs to creator-owned model |
| Pause own live model | `InvestmentModel` | live user impact notice is queued; audit log required |
| Request retirement | `InvestmentModel` | admin review may be required if active selections exist |

## Creator Cannot

| Denied action | Reason |
| --- | --- |
| Change any model directly to `approved` or `live` | Admin review must own approval. |
| Edit another creator's model, version, disclosure, feed post, or review | Creator ownership boundary. |
| Modify live model copy in place | Live changes require new `ModelVersion` or review flow. |
| Hide leverage, market, asset class, or prohibited range fields | `PortfolioMandate` must remain reviewable. |
| Remove required risk/performance/disclosure placeholders | User-facing model pages need risk context. |
| Write guaranteed return, loss avoidance, or legal approval claims | Requires review and must not be Codex-finalized. |
| Create real `TradeIntent`, broker order, account link, deposit, or withdrawal | MVP explicitly forbids real financial operations. |
| View user mock deposits, portfolios, or model selections unrelated to own creator analytics | User financial data boundary. |
| Upload executable model artifact for runtime execution | Model execution sandbox is outside MVP and needs security review. |

## Draft Lifecycle

```text
draft -> pending_review
pending_review -> changes_requested
changes_requested -> pending_review
pending_review -> approved
approved -> live
live -> paused
live -> retired
live -> suspended
```

Creator-owned transitions:

| From | To | Creator allowed? | Notes |
| --- | --- | --- | --- |
| `draft` | `pending_review` | yes | Submit only after required fields pass validation. |
| `changes_requested` | `pending_review` | yes | Resubmission must reference prior review id. |
| `live` | `paused` | limited | Allowed only for own model and should create user-impact audit event. |
| `live` | `retired` | request only | Admin may need to approve if active user selections exist. |

Admin-only transitions:

| From | To |
| --- | --- |
| `pending_review` | `approved` |
| `approved` | `live` |
| `pending_review` | `changes_requested` |
| `pending_review` | `rejected` |
| `live` | `suspended` |

## Required Draft Fields

Before `Submit for review`, a creator draft must include:

- model name
- creator identity reference
- target market
- allowed asset classes
- prohibited asset classes
- leverage policy
- derivative or structured product policy
- rebalance policy
- primary input data categories
- risk summary
- backtest or performance placeholder source
- `PortfolioMandate`
- risk/performance/limitation disclosure placeholders
- model version label

If any field is missing, API should return a validation error rather than `policy_blocked`.

## Review Request Snapshot

When a creator submits a model version for review, the system should freeze a review snapshot:

| Snapshot field | Rule |
| --- | --- |
| `modelPublicId` | creator-owned model public id |
| `modelVersionPublicId` | submitted version public id |
| `portfolioMandate` | immutable copy or version-bound reference |
| `riskProfile` | immutable copy or version-bound reference |
| `disclosures` | risk/performance/limitation placeholders |
| `submittedByCreatorPublicId` | current creator actor |
| `submittedAt` | ISO timestamp |
| `sourceStatus` | `pending_review` |

Creators can edit a model again only by returning to `draft`/`changes_requested` or creating a new version. They cannot mutate the review snapshot after submission.

## API Guard Rules

| API | Creator rule |
| --- | --- |
| `POST /api/creator/models` | create draft only; status must be `draft` |
| `PATCH /api/creator/models/:id` | owner only; status must be `draft` or `changes_requested` |
| `POST /api/creator/models/:id/versions` | owner only; creates draft version |
| `PATCH /api/creator/models/:id/versions/:versionId` | owner only; version not submitted/live |
| `POST /api/creator/models/:id/submit-review` | owner only; required fields complete; creates audit event |
| `GET /api/creator/models/:id/reviews` | owner only; returns review status and change requests |
| `POST /api/creator/models/:id/pause` | owner only; live model only; user-impact audit event required |
| `POST /api/creator/models/:id/retirement-request` | owner only; admin review may be required |

## Audit Events

Creator flow should produce stable audit action names:

| Event | Result |
| --- | --- |
| `creator_model_draft_created` | `allowed` |
| `creator_model_draft_updated` | `allowed` |
| `creator_model_version_created` | `allowed` |
| `creator_model_review_submitted` | `review_required` |
| `creator_model_review_resubmitted` | `review_required` |
| `creator_live_model_pause_requested` | `review_required` or `allowed` |
| `creator_model_retirement_requested` | `review_required` |
| `creator_cross_owner_access_denied` | `denied` |
| `creator_live_status_write_blocked` | `policy_blocked` |
| `creator_sensitive_claim_blocked` | `policy_blocked` |

## Blocked Claim Examples

The creator flow must block or require review for wording like:

- guaranteed return
- no loss
- legally approved
- risk-free leverage
- will outperform market
- safe for all users
- broker order ready
- real deposit supported

These phrases should be treated as `policy_blocked` or `review_required` depending on context. Codex must not replace them with final legal wording; use placeholders and record review needs.

## Implementation Notes

- Keep creator-owned checks separate from admin review checks.
- Do not use internal DB ids in creator-facing URLs or audit UI.
- API responses should return DTOs, not raw DB rows.
- `creator` can see only review summaries for own models, not admin-only internal notes unless explicitly exposed.
- This document extends `docs/security/rbac-matrix.md`; conflicts should be resolved in favor of the stricter rule.
