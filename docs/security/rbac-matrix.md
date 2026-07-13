<!--
이 문서는 investModel의 초기 RBAC 권한 매트릭스를 정의한다.
AI 작업자는 API guard, 관리자 화면, 모델 제작자 흐름을 만들기 전에 이 표를 기준으로 역할/액션/리소스 권한을 확인해야 한다.
-->

# RBAC Matrix

## Scope

이 문서는 MVP 단계의 역할 기반 접근 제어 기준이다. 초기 구현은 모바일 PWA와 mock 데이터 중심이며, 실제 입금, 실제 주문, 브로커 계좌 연결, 법률 판단 확정은 허용하지 않는다.

## Roles

| Role | Description | Boundary |
| --- | --- | --- |
| `public` | 로그인하지 않은 방문자 | 공개 모델 목록/상세의 제한된 정보만 볼 수 있다. |
| `user` | 일반 투자 앱 사용자 | 공개 모델 선택과 본인의 mock 포트폴리오 조회만 가능하다. |
| `creator` | AI 모델 제작자 | 본인 모델 draft 작성, 심사 요청, 반려 사유 확인만 가능하다. |
| `admin` | 운영/심사 담당자 | 모델 심사, 중지, 고지 검토, 감사 로그 조회를 수행한다. |
| `system` | 예약 작업/내부 자동화 | mock sync, audit event 생성처럼 명시된 내부 작업만 수행한다. |

## Resources

| Resource | Description | Primary API area |
| --- | --- | --- |
| `InvestmentModel` | 제작자가 등록하고 사용자가 선택하는 AI 투자 모델 | `/api/models`, `/api/creator/models`, `/api/admin/models` |
| `ModelVersion` | 모델 설명, mandate, 위험, 성과 출처가 고정되는 버전 | `/api/models/:id`, `/api/creator/models/:id/versions` |
| `PortfolioMandate` | 모델이 허용/금지하는 투자 범위 | model detail, creator draft |
| `ModelDisclosure` | 위험/성과/제한/법률 placeholder 고지 | model detail, admin review |
| `UserModelSelection` | 사용자가 특정 모델 버전을 선택한 기록 | `/api/model-selections` |
| `MockDeposit` | 초기 개발용 mock 입금 상태 | `/api/portfolio/mock-summary` |
| `Portfolio` | mock 포트폴리오 상태 | `/api/portfolio/mock-summary` |
| `SignalEvent` | 모델 분석용 관찰 신호 | `/api/signals` |
| `FeedPost` | 모델/시장/운영 인사이트 피드 | `/api/feed` |
| `ComplianceReview` | 운영자 심사 기록 | `/api/admin/models/:id/reviews` |
| `AuditLog` | creator/admin/system 주요 액션 기록 | admin audit views |

## Action Matrix

Legend:

- `allow`: 허용
- `own`: 본인 소유/본인 데이터만 허용
- `reviewed`: 운영자 심사 또는 승인 상태에서만 허용
- `deny`: 금지
- `n/a`: MVP 범위 아님

| Action | public | user | creator | admin | system | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| List live models | allow | allow | allow | allow | deny | `live` 모델만 공개 목록에 노출한다. |
| View model detail | allow | allow | allow | allow | deny | `draft`, `pending_review`, `suspended`, `retired`는 공개 노출 금지. |
| Create model draft | deny | deny | own | allow | deny | creator는 본인 모델만 생성한다. |
| Edit model draft | deny | deny | own | allow | deny | `live` 버전 직접 수정 금지, 새 `ModelVersion` 또는 재심사 흐름 사용. |
| Submit model for review | deny | deny | own | allow | deny | 심사 요청 시 `ComplianceReview` 후보 생성. |
| Approve model review | deny | deny | deny | allow | deny | 승인/반려/수정요청은 admin만 가능. |
| Publish model live | deny | deny | deny | reviewed | deny | 승인된 모델/버전만 live 전환 가능. |
| Pause own model | deny | deny | own | allow | deny | creator pause는 사용자 영향 고지가 필요할 수 있다. |
| Suspend model | deny | deny | deny | allow | deny | 강제 중지는 admin만 가능하고 audit 필수. |
| Retire model | deny | deny | own | allow | deny | live 사용자 영향이 있으면 admin review 필요. |
| Create or edit disclosure | deny | deny | own | allow | deny | 민감 문구는 legal/compliance review가 필요하다. |
| Approve disclosure | deny | deny | deny | allow | deny | Codex가 법률 승인 문구를 최종 확정하지 않는다. |
| Select model version | deny | own | own | deny | deny | 사용자는 비율/레버리지 선호를 직접 조정하지 않는다. |
| View own mock portfolio | deny | own | deny | deny | deny | 본인 mock 상태만 조회한다. |
| Create mock deposit | deny | own | deny | deny | deny | 실제 결제/입금 아님. 실자금 구현은 별도 확인 필요. |
| Update mock deposit status | deny | deny | deny | deny | reviewed | system mock flow만 가능, 실제 자금 이동 금지. |
| View signals | deny | allow | allow | allow | deny | 신호는 추천이 아니라 관찰 입력이다. |
| Create signal event | deny | deny | deny | deny | reviewed | MVP에서는 mock/system seed만 허용한다. |
| View feed | deny | allow | allow | allow | deny | feed는 정보성 콘텐츠다. |
| Create model feed post | deny | deny | own | allow | deny | creator post는 본인 모델과 연결되어야 한다. |
| Create review feed post | deny | deny | deny | allow | deny | 운영 공지/심사 메모는 admin만 가능. |
| View audit log | deny | deny | deny | allow | deny | admin도 비밀값 원문은 볼 수 없다. |
| Run scheduled mock sync | deny | deny | deny | deny | reviewed | system actor와 run id가 기록되어야 한다. |
| Execute real order | deny | deny | deny | deny | deny | MVP 금지. 사용자 확인, 보안/법률/금융 검토 전 구현 금지. |
| Connect brokerage account | deny | deny | deny | deny | deny | MVP 금지. 외부 계정/비밀값 검토 전 구현 금지. |

## API Guard Baseline

| API | Minimum role | Required ownership/policy check |
| --- | --- | --- |
| `GET /api/models` | `public` | only `live` models |
| `GET /api/models/:id` | `public` | only public-safe DTO fields for non-admin |
| `GET /api/signals` | `user` | no trading recommendation response fields |
| `GET /api/feed` | `user` | no guaranteed return or personalized advice copy |
| `POST /api/model-selections` | `user` | selected `ModelVersion` must be live and not suspended/retired |
| `GET /api/portfolio/mock-summary` | `user` | requesting user owns the mock portfolio |
| `POST /api/creator/models` | `creator` | creator owns draft; no live status write |
| `POST /api/admin/models/:id/reviews` | `admin` | audit log required |

## Audit Requirements

Audit log is required for:

- creator creates or edits `InvestmentModel` draft
- creator submits `ModelVersion` for review
- admin approves, rejects, requests changes, suspends, pauses, or retires a model
- admin approves or changes disclosure review state
- user selects or revokes a model version
- system creates mock sync output or signal/feed seed update
- any policy-blocked attempt involving real deposit, real order, brokerage connection, or secret/API key access

Audit event fields should include:

| Field | Rule |
| --- | --- |
| `actorRole` | one of `user`, `creator`, `admin`, `system` |
| `actorPublicId` | optional for system, required for human actors |
| `resourceType` | canonical resource name such as `InvestmentModel` |
| `resourcePublicId` | public id, never internal DB id in logs shown to UI |
| `action` | stable snake_case action name |
| `result` | `allowed`, `denied`, `policy_blocked`, `review_required` |
| `reason` | short machine-readable reason |
| `createdAt` | ISO timestamp |

## Denied-By-Default Rules

- Any action not listed in the matrix is denied until documented.
- Creator cannot modify another creator's model, disclosure, feed post, or review state.
- User cannot set risk preference, stock/bond ratio, leverage preference, or mandate fields.
- Admin cannot expose secret values or make Codex-authored legal approval final.
- System cannot perform user-approved financial operations.
- No role can execute real fund movement or real brokerage orders in the MVP.

## Follow-Up Tasks

- `BK-139`: split creator draft/review flow from this baseline.
- `BK-140`: split admin review/audit authority from this baseline.
- `BK-141`: design the route guard and 403/policy-blocked response model.
- `BK-146`: map state transitions to test cases and audit actions.
