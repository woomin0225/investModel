<!--
이 문서는 investModel API의 인증, 권한, 에러 응답 규칙을 정의한다.
프론트엔드, 백엔드, QA 작업자가 같은 실패 형식을 사용하게 하고
실제 금융 기능 차단을 일반 validation error와 섞지 않도록 막는다.
-->

# API Auth And Error Response Rules

이 문서는 `docs/api/route-inventory.md`와 `docs/security/rbac-matrix.md`를 API 구현 규칙으로 연결한다. MVP의 모든 API는 mock 또는 metadata-only 흐름을 기본값으로 삼으며, 실제 입금, 실제 주문, 브로커 계좌 연결, 법률 판단, 비밀값 접근은 별도 승인 전까지 `policy_blocked` 또는 `review_required`로 차단한다.

## Principles

- API는 raw DB row를 반환하지 않고 항상 DTO 또는 error DTO를 반환한다.
- 인증 실패, 권한 실패, 숨김 처리, 정책 차단, 입력 검증 실패를 구분한다.
- 존재 여부를 노출하면 안 되는 리소스는 `403` 대신 `404`를 사용할 수 있다.
- financial/legal/security blocked 상태는 `422 validation_error`로 표현하지 않는다.
- 모든 creator/admin/system 주요 실패와 정책 차단은 audit log 후보가 된다.

## Error DTO

모든 실패 응답은 아래 모양을 기본으로 한다.

```ts
type ApiErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "policy_blocked"
  | "review_required"
  | "validation_error"
  | "conflict"
  | "rate_limited"
  | "internal_error";

type ApiErrorDto = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    requestId: string;
    resource?: string;
    action?: string;
    reason?: string;
    fieldErrors?: Record<string, string[]>;
    requiredReview?: "legal_review" | "security_review" | "financial_operation" | "user_confirmation";
    auditRequired?: boolean;
  };
};
```

성공 응답은 아래처럼 `ok: true`를 사용한다.

```ts
type ApiSuccessDto<T> = {
  ok: true;
  data: T;
  meta?: {
    requestId: string;
    dataContext?: "mock" | "simulated" | "backtest" | "placeholder" | "informational";
  };
};
```

## Status Code Rules

| HTTP status | Error code | When to use | Example |
| --- | --- | --- | --- |
| `401` | `unauthenticated` | signed-in user가 필요한데 session이 없거나 만료됨 | `GET /api/feed` without session |
| `403` | `forbidden` | 인증은 되었지만 role/action 권한이 없음 | `user` calls admin review API |
| `404` | `not_found` | 리소스가 없거나 현재 actor에게 존재를 숨겨야 함 | public reads `draft` model detail |
| `409` | `conflict` | 현재 상태 때문에 요청 전이가 불가능함 | approve already retired model |
| `409` | `policy_blocked` | 상태/제품/컴플라이언스 정책이 동작을 막음 | create real order from `TradeIntent` |
| `423` | `review_required` | legal/security/financial review 없이는 진행 불가 | final legal copy approval attempt |
| `422` | `validation_error` | 요청 shape, 타입, 필수 필드가 잘못됨 | missing `modelVersionId` |
| `429` | `rate_limited` | rate limit 또는 abuse guard에 걸림 | repeated creator draft submit |
| `500` | `internal_error` | 예상하지 못한 서버 오류 | unexpected exception |

`review_required`에 `423 Locked`를 쓴다. 플랫폼 제약이나 클라이언트 호환성 때문에 `423`을 쓰기 어렵다면 `409 review_required`를 사용하되 `error.code`는 반드시 `review_required`로 유지한다.

## Authentication Levels

| Level | Meaning | Allowed examples |
| --- | --- | --- |
| `public` | 로그인 없이 접근 가능 | approved/live `GET /api/models`, public-safe model detail |
| `signed_in` | session이 필요하지만 특정 human role 제한은 약함 | `GET /api/feed`, `GET /api/signals` |
| `user` | 일반 사용자 role 필요 | `POST /api/model-selections`, `GET /api/portfolio/mock-summary` |
| `creator` | 모델 제작자 role 필요 | `POST /api/creator/models` |
| `admin` | 운영자 role 필요 | `POST /api/admin/models/:id/reviews` |
| `system` | 예약 작업 또는 내부 작업 actor | mock sync, audit event creation |

`system`은 사람 사용자 session으로 로그인할 수 있는 role이 아니다. system actor가 필요한 API는 일반 public/user/creator/admin 경로와 분리한다.

## 403 vs 404

다음 기준으로 권한 실패를 처리한다.

| Situation | Response | Reason |
| --- | --- | --- |
| actor role이 action을 수행할 권한이 없음 | `403 forbidden` | 권한 정책을 명확히 알려도 안전함 |
| public/user가 draft, pending_review, suspended, retired 모델을 조회 | `404 not_found` | 비공개 모델 존재 여부 노출 방지 |
| creator가 다른 creator의 draft를 수정 | `404 not_found` | cross-owner 모델 존재 여부 노출 방지 |
| admin이 아닌 actor가 admin review API 호출 | `403 forbidden` | admin 권한 실패가 명확함 |
| user가 다른 사용자의 mock portfolio 조회 | `404 not_found` | 다른 사용자 데이터 존재 여부 노출 방지 |
| signed-in이 필요한 API에 session 없음 | `401 unauthenticated` | 로그인 유도가 필요함 |

## Policy Blocked Rules

아래 요청은 입력 shape가 맞더라도 `validation_error`가 아니라 `policy_blocked` 또는 `review_required`로 반환한다.

| Blocked action | Error code | requiredReview | Notes |
| --- | --- | --- | --- |
| 실제 입금/출금/결제 생성 | `policy_blocked` | `financial_operation` | `MockDeposit`만 허용 |
| 브로커 계좌 연결 | `policy_blocked` | `financial_operation` | 외부 계정/비밀값 검토 필요 |
| 실제 주문/체결/정산 생성 | `policy_blocked` | `financial_operation` | `TradeIntent`는 pre-order simulation |
| 모델 파일 실행 또는 외부 업로드 모델 런타임 실행 | `review_required` | `security_review` | sandbox 검토 전 금지 |
| 법률 승인/성과 보장 문구 확정 | `review_required` | `legal_review` | Codex가 최종 법률 문구 확정 금지 |
| 사용자 직접 투자성향/주식채권비율/레버리지 선호 저장 | `policy_blocked` | `user_confirmation` | 제품 원칙상 모델 mandate에 포함 |
| 비밀값 또는 유료 API key 요구 | `review_required` | `security_review` | secret management 승인 필요 |

## Validation Error Shape

입력 형식 오류는 `422 validation_error`로 통일한다.

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "요청 값을 확인해 주세요.",
    "requestId": "req_...",
    "fieldErrors": {
      "modelVersionId": ["필수 값입니다."],
      "riskAcknowledged": ["고위험 모델 선택 전 확인이 필요합니다."]
    }
  }
}
```

Validation error에는 legal/financial 차단 이유를 넣지 않는다. 요청 값이 올바르지만 MVP에서 막힌 기능이면 `policy_blocked` 또는 `review_required`를 사용한다.

## Route Error Matrix

| Route | Auth level | Hidden resource rule | Special blocked errors |
| --- | --- | --- | --- |
| `GET /api/models` | `public` | non-live models excluded from list | none |
| `GET /api/models/:id` | `public` | draft/pending/suspended/retired -> `404` for non-admin | legal copy finalization is not part of this route |
| `GET /api/signals` | `signed_in` | inaccessible model-scoped signals -> `404` | signal cannot create `TradeIntent` |
| `GET /api/feed` | `signed_in` | private/admin-only posts -> `404` | guaranteed return copy -> `review_required` before publish |
| `POST /api/model-selections` | `user` | non-live model/version -> `404` or `409 conflict` depending on prior visibility | direct mandate override -> `policy_blocked` |
| `GET /api/portfolio/mock-summary` | `user` | other user's mock portfolio -> `404` | real balance/payment/account fields -> `policy_blocked` |
| `POST /api/creator/models` | `creator` | cross-owner draft -> `404` | live status write/model artifact execution -> `policy_blocked` |
| `POST /api/admin/models/:id/reviews` | `admin` | missing model -> `404` | legal approval finalization without review -> `review_required` |

## Audit Candidate Matrix

| Error | auditRequired | Audit result |
| --- | --- | --- |
| `401 unauthenticated` | usually false | none |
| `403 forbidden` on creator/admin route | true | `denied` |
| `404` caused by hidden ownership/resource policy | true for signed-in actors | `denied` |
| `409 conflict` on state transition | true | `denied` |
| `409 policy_blocked` | true | `policy_blocked` |
| `423 review_required` | true | `review_required` |
| `422 validation_error` | false unless abuse is suspected | none |

Audit logs shown in UI must use public ids, not internal DB ids.

## Frontend Handling

- `401`: show sign-in required state.
- `403`: show permission denied state, not a broken page.
- `404`: show resource unavailable state without hinting whether the resource exists.
- `policy_blocked`: show a deliberate MVP/safety boundary message.
- `review_required`: show a review-needed message and do not offer retry as if it were a temporary bug.
- `validation_error`: bind `fieldErrors` to form fields.

Frontend copy must not tell the user that a real financial operation is available soon unless a separate approved launch gate exists.

## Implementation Notes

- Route handlers should create `requestId` before validation and include it in success/error responses.
- API guard helpers should return structured results, not throw raw strings.
- Zod or equivalent validation should map parser output into `fieldErrors`.
- `policy_blocked` and `review_required` should be produced by policy/guard helpers, not form validators.
- Creator/admin routes must attach audit candidates even when the route currently uses mock-only data.
- `BK-141` should implement reusable route/server-action guard helpers based on this document.

