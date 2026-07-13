<!--
이 문서는 ModelVersion과 ModelDisclosure의 심사 상태 전이를 정의한다.
AI 작업자는 모델 설명, mandate, 위험, 성과, 고지 문구를 구현할 때 버전 변경과 재심사 조건을 이 문서 기준으로 판단해야 한다.
-->

# ModelVersion And Disclosure Review State Transitions

## Scope

`ModelVersion`은 모델 설명, `PortfolioMandate`, `ModelRiskProfile`, 성과 출처, disclosure copy를 고정하는 단위다. `ModelDisclosure`는 위험, 성과, 제한, 법률 placeholder 문구를 다룬다.

이 문서는 어떤 변경이 새 버전이나 재심사를 요구하는지 정의한다. Codex는 최종 법률 문구를 임의 확정하지 않는다.

## ModelVersion States

| Status | Owner | User visible? | Meaning |
| --- | --- | --- | --- |
| `draft` | creator | no | 제작자가 버전 내용을 작성 중이다. |
| `pending_review` | creator + admin | no | 제출되어 review snapshot이 고정된 상태다. |
| `changes_requested` | creator + admin | no | 운영자가 수정 요청을 남겼다. |
| `rejected` | admin | no | 제출된 버전이 거절되었다. |
| `approved` | admin | no | 공개 후보로 승인되었다. |
| `live` | admin | yes | 현재 사용자에게 노출되는 버전이다. |
| `superseded` | system/admin | historical only | 새 live 버전으로 대체되었다. |
| `retired` | admin | historical only | 더 이상 사용하지 않는 버전이다. |

## ModelVersion Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `draft` | creator | `creator_model_version_created` | parent model owned by creator |
| `draft` | `pending_review` | creator | `creator_model_review_submitted` | required fields complete |
| `pending_review` | `changes_requested` | admin | `admin_model_changes_requested` | reason code required |
| `changes_requested` | `pending_review` | creator | `creator_model_review_resubmitted` | prior review id required |
| `pending_review` | `rejected` | admin | `admin_model_review_rejected` | rejection reason required |
| `pending_review` | `approved` | admin | `admin_model_version_approved` | checklist pass required |
| `approved` | `live` | admin | `admin_model_published_live` | parent model publish allowed |
| old `live` | `superseded` | system/admin | `system_model_version_superseded` | new version becomes live |
| `approved` | `retired` | admin | `admin_model_version_retired` | release candidate abandoned |
| `live` | `retired` | admin | `admin_model_version_retired` | active selection impact recorded |

## Disclosure Review States

| Status | Owner | User visible? | Meaning |
| --- | --- | --- | --- |
| `draft` | creator | no | 문구 작성 중이다. |
| `pending_review` | creator + admin | no | 심사 대기 중이다. |
| `changes_requested` | creator + admin | no | 수정 요청이 있다. |
| `approved_placeholder` | admin | yes when version live | placeholder 문구가 제품 검토를 통과했다. 최종 법률 승인은 아니다. |
| `legal_review_required` | admin/compliance | no or restricted | 외부 법률 검토가 필요한 문구다. |
| `rejected` | admin | no | 문구가 거절되었다. |
| `superseded` | system/admin | historical only | 새 disclosure로 대체되었다. |

## Disclosure Transitions

| From | To | Actor | Audit action | Guard |
| --- | --- | --- | --- | --- |
| none | `draft` | creator | `creator_disclosure_draft_created` | linked draft version |
| `draft` | `pending_review` | creator | `creator_disclosure_review_submitted` | required disclosure types present |
| `pending_review` | `changes_requested` | admin | `admin_disclosure_changes_requested` | reason code required |
| `changes_requested` | `pending_review` | creator | `creator_disclosure_review_resubmitted` | prior review id required |
| `pending_review` | `approved_placeholder` | admin | `admin_disclosure_placeholder_approved` | no final legal claim |
| `pending_review` | `legal_review_required` | admin | `admin_disclosure_legal_review_required` | sensitive legal/financial wording |
| `pending_review` | `rejected` | admin | `admin_disclosure_rejected` | rejection reason required |
| `approved_placeholder` | `superseded` | system/admin | `system_disclosure_superseded` | new approved placeholder becomes active |

## Changes That Require New Review

Any of these changes must move the related version or disclosure back to review:

| Change type | Required action |
| --- | --- |
| `PortfolioMandate.allowedAssetClasses` changed | new `ModelVersion` review |
| `PortfolioMandate.prohibitedAssetClasses` changed | new `ModelVersion` review |
| leverage policy changed | new `ModelVersion` review + risk disclosure review |
| target market changed | new `ModelVersion` review |
| derivative/structured product policy changed | new `ModelVersion` review |
| risk summary changed materially | disclosure review |
| performance/backtest source changed | disclosure review |
| wording adds guaranteed return/no-loss claim | `policy_blocked` or `legal_review_required` |
| wording implies final legal approval | `legal_review_required` |
| model artifact execution status changed | security review before product review |

## Forbidden Mutations

| Object | Forbidden mutation |
| --- | --- |
| live `ModelVersion` | in-place mandate/risk/performance/disclosure update |
| pending review snapshot | creator mutation after submission |
| approved disclosure | adding final legal claim without legal review state |
| rejected version | direct transition to approved/live |
| superseded version | becoming live again without new review |

Forbidden mutations should create `policy_blocked` audit events when attempted through authenticated APIs.

## API Guard Rules

| API | Guard |
| --- | --- |
| `POST /api/creator/models/:id/versions` | creator owns model; creates `draft` only |
| `PATCH /api/creator/models/:id/versions/:versionId` | owner only; status is `draft` or `changes_requested` |
| `POST /api/creator/models/:id/versions/:versionId/submit-review` | required fields complete; freezes snapshot |
| `POST /api/admin/models/:id/reviews/:reviewId/approve` | admin only; checklist pass |
| `POST /api/admin/models/:id/disclosures/:disclosureId/request-changes` | admin only; reason code required |
| `POST /api/admin/models/:id/disclosures/:disclosureId/legal-review-required` | admin only; sensitive wording reason required |

## Public Exposure Rules

- Public model detail can read only the active `live` version and `approved_placeholder` disclosures.
- `legal_review_required`, `pending_review`, `changes_requested`, and `rejected` disclosures must not appear in user-facing surfaces.
- Creator dashboard can show own draft/review state and review reasons.
- Admin views can show all review states but must not expose secrets or external private credentials.
- Historical `superseded` versions can appear only as audit/history context, not new selection targets.

## Follow-Up Links

- `BK-146`: turn these transitions into test cases and audit event map.
- `BK-141`: route guard design should reference these status checks.
- `BK-143` completion unblocks detailed disclosure review implementation planning.
