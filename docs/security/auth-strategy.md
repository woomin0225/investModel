<!--
이 문서는 investModel MVP의 인증 방식 결정을 설명한다.
처음 보는 작업자가 Auth.js 도입 여부, 현재 스타터 인증 유지 이유, 역할 기반 권한 확장 방향을 이해할 수 있도록 기준을 고정한다.
-->

# Auth Strategy

## Decision

MVP 단계에서는 현재 Next.js SaaS starter의 기본 인증 구조를 유지한다.

- 이메일/비밀번호 로그인과 `bcryptjs` password hash를 사용한다.
- `jose` 기반 JWT를 `session` httpOnly cookie에 저장한다.
- 서버 액션은 `validatedAction`, `validatedActionWithUser`, `withTeam` helper를 통해 입력 검증과 사용자 확인을 수행한다.
- `/dashboard` 계열 보호는 기존 `middleware.ts`의 session cookie 확인과 refresh 흐름을 유지한다.

Auth.js는 지금 바로 도입하지 않는다. 소셜 로그인, 외부 IdP, OAuth provider, SSO, 계정 연결이 MVP 필수 요구가 될 때 별도 체크리스트로 재검토한다.

## Why This Fits MVP

현재 스타터는 이미 다음 기반을 갖고 있다.

- `lib/auth/session.ts`: password hash, JWT sign/verify, session cookie 설정
- `lib/auth/middleware.ts`: zod 기반 server action validation, signed-in user guard, team guard
- `middleware.ts`: protected route redirect와 session refresh
- `lib/db/schema.ts`: `users`, `teams`, `team_members`, `invitations`, `activity_logs`

새 인증 프레임워크를 지금 추가하면 DB 전환 직후의 blast radius가 커진다. 반면 MVP에서 필요한 것은 provider 확장보다 investModel 역할과 API guard를 안정적으로 얹는 일이다.

## Role Model Direction

현재 `users.role`은 starter의 `member` 기본값을 사용한다. investModel 도메인에서는 `public`, `user`, `creator`, `admin`, `system` 권한 구분이 필요하다.

다음 구현에서는 starter role을 그대로 의미 확장하지 말고, 명시적인 investModel 역할 경계를 추가한다.

- Human account roles: `user`, `creator`, `admin`
- Non-human actor: `system`
- Anonymous viewer: `public`

`system`은 로그인 가능한 사용자 계정 role로 저장하지 않는다. scheduled job, mock sync, audit event 생성처럼 내부 실행 주체를 표현할 때만 사용한다.

## Session Payload Rule

현재 세션 payload는 내부 numeric `user.id`만 담는다. MVP에서는 이 구조를 유지한다.

세션에 role, team, creator verification, admin permission snapshot을 많이 넣지 않는다. 권한 판단은 서버에서 최신 DB row와 RBAC helper를 통해 수행한다.

Allowed payload:

```ts
{
  user: { id: number },
  expires: string
}
```

Reason:

- role 변경이나 account suspension이 cookie 만료 전까지 오래 반영되지 않는 문제를 피한다.
- cookie payload를 작게 유지한다.
- secret이나 금융/투자 상태가 session cookie에 들어가지 않도록 한다.

## Required Follow-Up

1. Add a canonical auth role type that maps DB users to `HumanUserRole`.
2. Add route/API guard helpers for `user`, `creator`, and `admin`.
3. Keep `public` as a request context, not a stored role.
4. Add migration work if `users.role` needs values beyond starter `member`.
5. Add RBAC tests after guard helpers exist.

## Blocked Or Out Of Scope

The following are not implemented in this decision:

- OAuth or social login
- external identity provider
- brokerage account login
- bank account connection
- real-money payment authorization for investment funds
- legal suitability checks
- model creator identity verification with external vendors

Any of these require a new checklist item and security/legal review before implementation.

## Related Work

- `BK-021`: authentication strategy decision
- `BK-127`: API authentication and error response rules
- `BK-138`: RBAC matrix
- `BK-141`: RBAC middleware/API guard design
- `IS-001`: production build and Stripe test key issue remains separate from auth strategy
