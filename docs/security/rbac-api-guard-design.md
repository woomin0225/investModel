<!--
이 문서는 investModel API와 server action에서 RBAC 권한을 검사하는 guard 구조를 정의하는 보안 설계 문서입니다.
아직 인증 방식이 확정되지 않았더라도 구현자가 guard 위치, 실패 응답, audit 후보, 테스트 전략을 같은 기준으로 적용할 수 있어야 합니다.
-->

# RBAC Middleware/API Guard 설계

## 목적

`BK-141`의 설계 산출물로, Next.js route handler, server action, 미래의 background job에서 역할 기반 권한 검사를 어디서 수행하고 어떤 응답을 반환할지 정한다.

이 문서는 아래 기준을 따른다.

- `harness/security-harness.md`
- `harness/backend-harness.md`
- `docs/security/rbac-matrix.md`
- `docs/api/auth-error-response-rules.md`
- `docs/api/route-inventory.md`

## 범위

이번 설계는 guard 구조와 계약만 정한다. 실제 인증 provider, session adapter, database-backed user lookup, rate limiter, audit log 저장 구현은 별도 작업에서 진행한다.

MVP에서 계속 금지되는 범위:

- 실제 입금, 출금, 결제
- 실제 증권 주문, 체결, 정산
- 브로커 계좌 연결
- 모델 파일 실행 또는 외부 업로드 모델 실행
- Codex가 최종 법률/금융 승인 문구를 확정하는 흐름

위 범위는 request shape가 유효해도 `policy_blocked` 또는 `review_required`로 차단한다.

## Guard 계층

Guard는 세 계층으로 나눈다.

| Layer | Location | Role |
| --- | --- | --- |
| Request guard | route handler 또는 server action 시작부 | requestId 생성, session 확인, role 추출 |
| Permission guard | route-specific handler 안 | role/action/resource/ownership/policy 검사 |
| Policy guard | service 또는 command 전 | financial/legal/security blocked 조건 검사 |

Next.js middleware는 public routing, locale, coarse redirect 같은 얇은 처리는 할 수 있다. 하지만 resource ownership, model state, review state, audit 후보가 필요한 검사는 route handler 내부에서 수행한다.

## Canonical Types

초기 구현은 `lib/domain/types.ts`의 `AccessRole`, `PermissionResult`, `DomainPublicId`를 기준으로 한다.

권장 guard type은 다음과 같다.

```ts
import type { AccessRole, DomainPublicId, PermissionResult } from "@/lib/domain";

type AuthLevel = "public" | "signed_in" | "user" | "creator" | "admin" | "system";

type GuardAction =
  | "list_models"
  | "view_model_detail"
  | "view_signals"
  | "view_feed"
  | "select_model_version"
  | "view_mock_portfolio"
  | "create_creator_model"
  | "review_model"
  | "policy_blocked_financial_operation";

type GuardResourceType =
  | "InvestmentModel"
  | "ModelVersion"
  | "UserModelSelection"
  | "MockDeposit"
  | "Portfolio"
  | "SignalEvent"
  | "FeedPost"
  | "ComplianceReview"
  | "AuditLog";

type GuardActor = {
  role: AccessRole;
  userPublicId?: DomainPublicId;
  creatorPublicId?: DomainPublicId;
  systemRunId?: string;
};

type GuardTarget = {
  resourceType: GuardResourceType;
  resourcePublicId?: DomainPublicId;
  ownerUserPublicId?: DomainPublicId;
  ownerCreatorPublicId?: DomainPublicId;
  modelStatus?: string;
  versionStatus?: string;
};

type GuardDecision = {
  result: PermissionResult;
  httpStatus: 200 | 401 | 403 | 404 | 409 | 423;
  errorCode?: "unauthenticated" | "forbidden" | "not_found" | "policy_blocked" | "review_required" | "conflict";
  reason?: string;
  hiddenResource?: boolean;
  requiredReview?: "legal_review" | "security_review" | "financial_operation" | "user_confirmation";
  auditRequired: boolean;
};
```

`system` role은 사람이 로그인해서 얻는 role이 아니다. scheduler 또는 내부 job run context로만 생성한다.

## Guard 함수 구조

권장 파일 위치는 다음과 같다.

```text
lib/security/
  guard-types.ts
  route-guards.ts
  policy-guards.ts
  audit-candidates.ts
```

초기 route guard는 다음 흐름을 따른다.

```ts
type RequireRoleInput = {
  requestId: string;
  actor: GuardActor | null;
  minimumRole: AuthLevel;
  action: GuardAction;
  target?: GuardTarget;
};

function requireRole(input: RequireRoleInput): GuardDecision {
  // 1. public route면 unauthenticated actor도 허용한다.
  // 2. signed_in 이상인데 actor가 없으면 401 unauthenticated를 반환한다.
  // 3. role이 부족하면 403 forbidden 또는 hidden resource 404를 반환한다.
  // 4. creator/user ownership이 필요한 route는 target owner public id를 비교한다.
  // 5. creator/admin/system 주요 실패는 auditRequired=true를 반환한다.
}
```

Policy guard는 금융/법률/보안 경계를 검증한다.

```ts
function blockDisallowedFinancialOperation(action: GuardAction): GuardDecision | null {
  // 실제 입금, 주문, 계좌 연결, broker execution 계열 action은 항상 policy_blocked.
  // MockDeposit, TradeIntent pre-order simulation은 별도 allowed route에서만 허용한다.
}
```

Guard는 raw string을 throw하지 않는다. 항상 `GuardDecision`을 반환하고, route handler가 `ApiErrorDto`로 변환한다.

## Route 적용 기준

| Route | Guard | Ownership/State | Failure |
| --- | --- | --- | --- |
| `GET /api/models` | public | only `live` models in response | excluded, no error |
| `GET /api/models/:id` | public | non-public model hidden for public/user | `404 not_found` |
| `GET /api/signals` | signed_in | inaccessible model-scoped signal hidden | `401` or `404` |
| `GET /api/feed` | signed_in | private/admin-only post hidden | `401` or `404` |
| `POST /api/model-selections` | user | model/version must be live; user cannot override mandate | `404`, `409`, `policy_blocked` |
| `GET /api/portfolio/mock-summary` | user | actor owns portfolio/mock state | `401` or `404` |
| `POST /api/creator/models` | creator | creator owns draft; live status write blocked | `403`, `404`, `policy_blocked` |
| `POST /api/admin/models/:id/reviews` | admin | audit candidate required | `403`, `404`, `review_required` |

Public-safe read route는 private resource 존재 여부를 숨긴다. Admin-only route는 role 부족을 명확히 `403 forbidden`으로 반환한다.

## Error DTO 변환

`GuardDecision`은 `docs/api/auth-error-response-rules.md`의 `ApiErrorDto`로 변환한다.

```ts
function toApiError(decision: GuardDecision, requestId: string) {
  return {
    ok: false,
    error: {
      code: decision.errorCode,
      message: getSafeErrorMessage(decision),
      requestId,
      reason: decision.reason,
      requiredReview: decision.requiredReview,
      auditRequired: decision.auditRequired
    }
  };
}
```

메시지는 사용자에게 보여도 안전해야 한다. hidden resource인 경우 존재 여부를 암시하지 않는다.

## Audit Candidate 기준

Guard가 직접 audit log를 저장하지 않는다. 대신 audit 후보를 반환하거나 route handler가 후보를 만든다.

Audit 후보가 필요한 경우:

- creator/admin route의 `403`, hidden `404`, `409`
- `policy_blocked`
- `review_required`
- creator draft 생성/수정/심사 제출
- admin 승인/반려/변경 요청/중지/은퇴
- user model selection 생성/취소
- system mock sync 또는 signal/feed seed update

Audit 후보 필드:

```ts
type AuditCandidate = {
  actorRole: AccessRole;
  actorPublicId?: DomainPublicId;
  systemRunId?: string;
  resourceType: GuardResourceType;
  resourcePublicId?: DomainPublicId;
  action: GuardAction;
  result: PermissionResult;
  reason: string;
  requestId: string;
  createdAt: string;
};
```

UI에 노출되는 audit record는 internal DB id를 포함하지 않는다.

## 테스트 전략

초기 테스트는 순수 함수 단위로 시작한다. 인증 provider와 DB가 붙기 전에도 guard matrix를 검증할 수 있어야 한다.

필수 테스트:

- public actor can list live models.
- public actor receives hidden `404` for draft model detail.
- unauthenticated actor receives `401` for signed-in routes.
- user cannot call admin review route and receives `403`.
- creator cannot edit another creator's draft and receives hidden `404`.
- user can view own mock portfolio but not another user's mock portfolio.
- model selection blocks non-live model/version.
- mandate override request returns `policy_blocked`.
- real deposit/order/brokerage action returns `policy_blocked` with `financial_operation`.
- legal final approval action returns `review_required` with `legal_review`.
- creator/admin denied and policy-blocked paths mark `auditRequired=true`.

Route-level tests should assert:

- `requestId` exists on success and error.
- status code and `error.code` match the matrix.
- raw DB row fields and internal numeric ids are not returned.
- `MockDeposit` and `TradeIntent` remain mock/simulation concepts.

## Implementation Order

1. Add guard types and pure decision helpers in `lib/security`.
2. Add `toApiError` mapping helper matching `ApiErrorDto`.
3. Add unit tests for the matrix above.
4. Wrap mock-backed MVP routes that already exist.
5. Add audit candidate creation for creator/admin/user selection paths.
6. Wire real audit persistence only after DB/repository boundary is selected.

## Open Decisions

The following decisions remain outside this work unit.

- Which authentication provider/session adapter to use.
- Where user/creator/admin role assignment is persisted.
- Whether Next.js middleware should enforce coarse route grouping.
- Which rate limiting provider to use.
- When audit candidates become persisted `AuditLog` rows.

Until those decisions are made, implementation must remain mock-safe and must not add real financial operation paths.
