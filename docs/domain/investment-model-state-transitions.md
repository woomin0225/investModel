<!--
이 문서는 InvestmentModel 상태 전이와 상태별 허용 actor, API, 감사 로그, 사용자 노출 규칙을 정의한다.
AI 작업자는 모델 등록, 심사, 공개, 중지, 은퇴 흐름을 구현하기 전에 이 표를 기준으로 승인 없는 live 전환과 사용자 노출 버그를 막아야 한다.
-->

# InvestmentModel State Transitions

## Scope

`InvestmentModel.status`는 AI 투자 모델이 제작자 draft에서 사용자에게 공개되는 과정과 운영 중지/은퇴 상태를 나타낸다. 이 상태는 실제 주문, 실제 입금, 브로커 계좌 연결, 법률 승인 완료를 의미하지 않는다.

## Canonical States

| Status | Owner | User visible? | Selectable? | Meaning |
| --- | --- | --- | --- | --- |
| `draft` | creator | no | no | 제작자가 작성 중인 모델이다. |
| `pending_review` | creator + admin | no | no | 제작자가 심사를 요청했고 운영자 검토를 기다린다. |
| `changes_requested` | creator + admin | no | no | 운영자가 수정 요청을 남겼고 제작자가 보완해야 한다. |
| `rejected` | admin | no | no | 제출본이 거절되었고 새 draft/version이 필요하다. |
| `approved` | admin | no | no | 심사는 통과했지만 아직 공개되지 않은 release candidate다. |
| `live` | admin | yes | yes | 사용자 탐색/선택에 노출 가능한 공개 모델이다. |
| `paused` | creator/admin | limited | no new selection | 임시 중지 상태다. 기존 사용자 안내가 필요하다. |
| `suspended` | admin | limited/admin only | no | 정책, 보안, 고지 문제로 강제 중지된 모델이다. |
| `retired` | creator/admin | historical only | no | 더 이상 신규 선택이 불가능한 은퇴 모델이다. |

## Transition Matrix

| From | To | Allowed actor | API surface | Audit action | Guard |
| --- | --- | --- | --- | --- | --- |
| none | `draft` | creator | `POST /api/creator/models` | `creator_model_draft_created` | creator role required |
| `draft` | `pending_review` | creator | `POST /api/creator/models/:id/submit-review` | `creator_model_review_submitted` | required draft fields complete |
| `pending_review` | `changes_requested` | admin | `POST /api/admin/models/:id/reviews/:reviewId/request-changes` | `admin_model_changes_requested` | reason code required |
| `changes_requested` | `pending_review` | creator | `POST /api/creator/models/:id/submit-review` | `creator_model_review_resubmitted` | prior review id required |
| `pending_review` | `rejected` | admin | `POST /api/admin/models/:id/reviews/:reviewId/reject` | `admin_model_review_rejected` | rejection reason required |
| `pending_review` | `approved` | admin | `POST /api/admin/models/:id/reviews/:reviewId/approve` | `admin_model_version_approved` | review checklist pass required |
| `approved` | `live` | admin | `POST /api/admin/models/:id/publish` | `admin_model_published_live` | approved model version required |
| `live` | `paused` | creator/admin | creator pause request or admin pause API | `creator_live_model_pause_requested` or `admin_model_paused` | user-impact reason required |
| `paused` | `live` | admin | `POST /api/admin/models/:id/resume` | `admin_model_resumed` | issue resolved/review complete |
| `live` | `suspended` | admin | `POST /api/admin/models/:id/suspend` | `admin_model_suspended` | policy/safety reason required |
| `suspended` | `retired` | admin | `POST /api/admin/models/:id/retire` | `admin_model_retired` | active selection impact recorded |
| `live` | `retired` | creator/admin | creator retirement request or admin retire API | `creator_model_retirement_requested` or `admin_model_retired` | active selection impact recorded |
| `approved` | `retired` | admin | `POST /api/admin/models/:id/retire` | `admin_model_retired` | release candidate abandoned |

## Forbidden Transitions

| From | To | Reason |
| --- | --- | --- |
| `draft` | `live` | Admin review and approval are required. |
| `pending_review` | `live` | Approval and publish are separate admin actions. |
| `changes_requested` | `approved` | Creator must resubmit first. |
| `rejected` | `approved` | New draft/version review is required. |
| `suspended` | `live` | Resume requires explicit admin review path, not direct publish. |
| `retired` | `live` | Retired models require a new model/version path. |
| any | real order/execution state | `InvestmentModel.status` never represents brokerage execution. |

Forbidden transitions should return `policy_blocked` and create an audit event when attempted through an authenticated route.

## Public Exposure Rules

| Surface | Allowed statuses | Notes |
| --- | --- | --- |
| Discover Models | `live` | public/user-visible model cards only. |
| Model Detail | `live`; limited `paused`/`retired` historical view | no new selection for non-live states. |
| Creator Dashboard | creator-owned `draft`, `pending_review`, `changes_requested`, `rejected`, `approved`, `live`, `paused`, `retired` | creator cannot view other creators' models. |
| Admin Review Queue | `pending_review`, `changes_requested`, `rejected`, `approved`, `live`, `paused`, `suspended`, `retired` | admin-only DTO; no secrets. |
| User Model Selection | `live` only for new selection | existing selection may show paused/suspended/retired notice. |
| Feed Insights | `live` model posts plus admin notices | no personalized advice or guaranteed return language. |

## Status Change Payload

State-changing APIs should capture:

| Field | Rule |
| --- | --- |
| `modelPublicId` | public model id |
| `modelVersionPublicId` | required when status is tied to a version |
| `previousStatus` | required except creation |
| `nextStatus` | required |
| `actorRole` | `creator`, `admin`, or `system` |
| `actorPublicId` | required for creator/admin |
| `reasonCode` | controlled string from the transition rule |
| `reviewPublicId` | required for review-driven transitions |
| `userImpactRequired` | true for pause/suspend/retire when active selections exist |
| `createdAt` | ISO timestamp |

## Guard Rules

- Creator can create and edit only own `draft` or `changes_requested` models.
- Creator can submit or resubmit for review but cannot approve or publish.
- Admin can approve, publish, suspend, resume, or retire, but every state change must create an audit event.
- User-facing discovery must read only `live` models by default.
- Existing user selections for `paused`, `suspended`, or `retired` models must show a notice instead of allowing new selection.
- Status changes must not mutate `ModelVersion` review snapshots after submission.
- No status transition can create real deposits, withdrawals, brokerage account links, or real orders.

## Audit Event Names

| Transition | Audit action |
| --- | --- |
| create draft | `creator_model_draft_created` |
| submit review | `creator_model_review_submitted` |
| request changes | `admin_model_changes_requested` |
| resubmit review | `creator_model_review_resubmitted` |
| reject | `admin_model_review_rejected` |
| approve | `admin_model_version_approved` |
| publish live | `admin_model_published_live` |
| creator pause request | `creator_live_model_pause_requested` |
| admin pause | `admin_model_paused` |
| resume | `admin_model_resumed` |
| suspend | `admin_model_suspended` |
| retire | `admin_model_retired` or `creator_model_retirement_requested` |
| forbidden transition | `investment_model_transition_blocked` |

## Follow-Up Links

- `BK-143`: define `ModelVersion` and disclosure review state transitions in more detail.
- `BK-146`: convert this matrix into transition tests and audit event map.
- `BK-141`: implement route guard strategy for the API surfaces listed here.
