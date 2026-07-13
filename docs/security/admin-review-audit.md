<!--
이 문서는 investModel 운영자(admin)의 모델 심사, 중지, 고지 검토, 신고 처리, 감사 로그 권한을 정의한다.
AI 작업자는 관리자 API나 화면을 만들 때 모든 관리자 액션이 감사 가능하며, 법률 판단 확정이나 실제 금융 실행으로 오해되지 않게 해야 한다.
-->

# Admin Review And Audit Authority

## Scope

이 문서는 `admin` 역할의 모델 심사와 감사 권한을 정의한다. 운영자는 모델 공개 흐름을 통제하지만, Codex가 법률/금융 적합성 판단을 최종 확정하거나 실제 주문/입금/계좌 연결을 수행한다는 뜻은 아니다.

## Admin Can

| Capability | Resource | Required condition |
| --- | --- | --- |
| View submitted model review queue | `ComplianceReview` | role is `admin` |
| View submitted snapshot | `ModelVersion` | review target is `pending_review` or previously reviewed |
| Request creator changes | `ComplianceReview` | reason and required fields are recorded |
| Reject submitted model | `ComplianceReview` | rejection reason is recorded |
| Approve model version for release candidate | `ModelVersion` | required disclosure placeholders and risk fields exist |
| Publish approved model live | `InvestmentModel` | status is `approved`; audit event required |
| Pause live model | `InvestmentModel` | user-impact reason is recorded |
| Suspend live model | `InvestmentModel` | policy/safety reason is recorded |
| Retire model | `InvestmentModel` | active selection impact is recorded |
| Review disclosure wording | `ModelDisclosure` | final legal text remains review-scoped, not Codex-final |
| Create review feed post | `FeedPost` | informational/admin context only |
| View audit log | `AuditLog` | secret values and private raw credentials are never shown |

## Admin Cannot

| Denied action | Reason |
| --- | --- |
| View secret values or raw API keys | Secret management boundary. |
| Execute real order, deposit, withdrawal, or brokerage account connection | MVP forbids real financial operations. |
| Rewrite creator model artifact to bypass review | Review must be traceable and creator/system ownership preserved. |
| Approve legal wording as final legal advice on behalf of Codex | Legal finalization requires external review. |
| Hide audit log entries for material state changes | Admin actions must be auditable. |
| Publish a model with missing mandate, risk profile, or disclosure placeholder | User-facing model pages need risk context. |
| Modify user model selections or mock portfolio balances without a recorded support/review reason | User data boundary. |

## Admin Review Actions

| Action | From | To | Audit action | Required reason |
| --- | --- | --- | --- | --- |
| Request changes | `pending_review` | `changes_requested` | `admin_model_changes_requested` | `missing_field`, `unclear_risk`, `sensitive_claim`, `mandate_gap`, `performance_source_gap` |
| Reject model | `pending_review` | `rejected` | `admin_model_review_rejected` | `policy_violation`, `unsupported_claim`, `incomplete_submission`, `security_risk` |
| Approve version | `pending_review` | `approved` | `admin_model_version_approved` | `review_complete` |
| Publish model | `approved` | `live` | `admin_model_published_live` | `release_approved` |
| Pause model | `live` | `paused` | `admin_model_paused` | `operational_issue`, `creator_request`, `market_data_unavailable`, `review_needed` |
| Resume model | `paused` | `live` | `admin_model_resumed` | `issue_resolved`, `review_complete` |
| Suspend model | `live` | `suspended` | `admin_model_suspended` | `policy_risk`, `security_risk`, `misleading_claim`, `external_review_needed` |
| Retire model | `live` or `approved` | `retired` | `admin_model_retired` | `creator_request`, `product_decision`, `compliance_reason` |
| Approve disclosure placeholder | `pending` | `approved` | `admin_disclosure_placeholder_approved` | `review_complete` |
| Request disclosure changes | `pending` | `changes_requested` | `admin_disclosure_changes_requested` | `sensitive_claim`, `missing_risk`, `unclear_performance_source` |

## Review Checklist

Before approving a model version, admin review must confirm:

- `PortfolioMandate` exists and lists allowed/prohibited asset classes.
- leverage policy is explicit.
- target market is explicit.
- derivative or structured product policy is explicit.
- rebalance policy is explicit.
- model risk summary exists.
- performance or backtest context is labeled as placeholder/sample/backtest and not future promise.
- risk/performance/limitation disclosure placeholders exist.
- no wording guarantees returns, avoids loss, implies legal approval, or encourages a specific trade.
- no model state change creates real order execution, real deposits, withdrawals, or brokerage connection.

## Audit Event Fields

Every admin action that changes state must produce an audit event with:

| Field | Rule |
| --- | --- |
| `actorRole` | must be `admin` |
| `actorPublicId` | admin public id |
| `resourceType` | canonical resource name such as `InvestmentModel`, `ModelVersion`, `ModelDisclosure`, `ComplianceReview` |
| `resourcePublicId` | public id only, not internal DB id in UI |
| `previousStatus` | required for state changes |
| `nextStatus` | required for state changes |
| `action` | stable snake_case action name from this document |
| `result` | `allowed`, `denied`, `policy_blocked`, or `review_required` |
| `reasonCode` | controlled reason string |
| `notes` | short internal note, no secrets |
| `createdAt` | ISO timestamp |

## Admin API Guard Baseline

| API | Rule |
| --- | --- |
| `GET /api/admin/models/reviews` | admin only; returns review queue DTO |
| `GET /api/admin/models/:id/reviews/:reviewId` | admin only; includes submitted snapshot and review history |
| `POST /api/admin/models/:id/reviews/:reviewId/request-changes` | admin only; reason and changed fields required |
| `POST /api/admin/models/:id/reviews/:reviewId/reject` | admin only; rejection reason required |
| `POST /api/admin/models/:id/reviews/:reviewId/approve` | admin only; checklist pass required |
| `POST /api/admin/models/:id/publish` | admin only; model/version must be approved |
| `POST /api/admin/models/:id/pause` | admin only; user-impact reason required |
| `POST /api/admin/models/:id/suspend` | admin only; policy/safety reason required |
| `POST /api/admin/models/:id/retire` | admin only; active selection impact must be recorded |
| `GET /api/admin/audit-logs` | admin only; no secrets or raw credentials in response |

## Feed And User-Facing Messaging

Admin-created feed or review notices must:

- state that content is informational.
- avoid personalized advice.
- avoid guaranteed return or no-loss language.
- distinguish mock/simulated state from real assets.
- avoid saying legal approval is complete unless external legal review has explicitly supplied final copy.

## Blocked Admin Cases

Admin action should return `policy_blocked` when:

- request tries to publish a model without required risk/disclosure context.
- request tries to turn a `TradeIntent` into a real broker order.
- request tries to create or update real deposit/withdrawal status.
- request tries to expose secret values.
- request tries to suppress or delete material audit history.
- request tries to approve final legal language without external legal review state.

## Relation To Other Documents

- `docs/security/rbac-matrix.md` defines the broad role/action matrix.
- `docs/security/creator-review-flow.md` defines creator-owned draft and submission flow.
- This document defines the admin side of review, status change, audit, and public safety gates.
- Conflicts should be resolved in favor of the stricter rule.
