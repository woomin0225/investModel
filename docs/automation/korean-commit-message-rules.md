<!--
This document defines Korean commit message rules for investModel automated and manual work units.
AI workers must use it before committing code, documents, sheet-driven workflow changes, or safety-related updates.
-->

# Korean Commit Message Rules

## Purpose

Every investModel commit should make the work unit clear to a Korean-speaking project owner while still using familiar Git prefixes. A good commit message tells what changed, not what the worker did internally.

Use this with:

- `docs/automation/google-sheets-field-contract.md`
- `docs/automation/verification-commit-push-rules.md`
- `docs/automation/sheet-state-deduplication-rules.md`

## Format

Use this one-line format by default:

```text
<type>: <Korean summary>
```

Examples:

```text
feat: 투자 모델 상세 컴포넌트 추가
fix: mock 포트폴리오 금액 라벨 수정
docs: 구글 시트 필드 계약 정리
chore: 자동화 실행 기준 보강
test: 모델 심사 API 권한 검증 추가
```

## Type Prefixes

| Type | Use when | Example |
| --- | --- | --- |
| `feat` | user-facing feature, API, component, mock behavior, domain helper | `feat: 모델 심사 상태 변경 API 추가` |
| `fix` | bug fix, incorrect label, broken route, type error, layout overlap | `fix: 모바일 하단 탭 겹침 수정` |
| `docs` | Markdown docs, product plans, API docs, automation rules | `docs: MVP 금지 기능 범위 정리` |
| `chore` | project setup, tooling, non-user-facing maintenance | `chore: 하네스 확인 순서 보강` |
| `test` | tests, smoke checks, validation fixtures | `test: AuditLog 생성 검증 추가` |
| `refactor` | internal code restructuring without behavior change | `refactor: 모델 mock 데이터 구조 분리` |
| `style` | formatting-only changes with no behavior change | `style: 문서 표 정렬 수정` |
| `ci` | GitHub Actions or automation runner configuration | `ci: 타입 검사 워크플로 추가` |
| `build` | package/build dependency or build config changes | `build: PWA manifest 설정 보강` |
| `revert` | revert a previous commit intentionally | `revert: 모델 등록 폼 초안 되돌림` |

## Summary Rules

The summary after the prefix must:

- be Korean
- be concise, ideally 20 Korean words or fewer
- name the changed product or code surface
- use nouns and verbs that match the checklist task
- avoid internal process words such as `작업함`, `수정 진행`, `처리`
- avoid implying legal approval, real deposits, real orders, brokerage connection, or guaranteed returns

Prefer:

```text
feat: 운영자 모델 심사 목록 추가
docs: 자동화 검증 기준 정리
fix: 영어 전환 시 하단 탭 링크 유지
```

Avoid:

```text
feat: 작업 완료
fix: 여러 가지 수정
docs: 문서 업데이트
chore: 자동으로 처리함
```

## Body Rules

Most commits should be one line only. Add a body when the change touches one of these:

- security or RBAC
- legal/financial boundary
- real-vs-mock behavior
- admin audit log
- known unresolved issue such as `IS-001`
- intentional blocked/review outcome

Body format:

```text
<type>: <Korean summary>

- <what changed>
- <verification>
- <remaining boundary or blocker>
```

Example:

```text
feat: 모델 심사 상태 변경 API 추가

- admin role만 모델 심사 상태 전이를 요청할 수 있게 했다.
- AuditLog payload를 반환하지만 실제 DB 저장과 모델 공개는 하지 않는다.
- 검증: tsc 통과, admin 202/user 403/invalid transition 409 확인.
```

## Work Type Examples

| Work type | Commit example |
| --- | --- |
| frontend component | `feat: 투자 모델 카드 컴포넌트 추가` |
| mobile page | `feat: 모바일 신호 화면 추가` |
| backend API | `feat: 모델 등록 초안 API 추가` |
| domain type | `feat: 감사 로그 도메인 스키마 추가` |
| mock data | `feat: 심사 대기 모델 mock 데이터 추가` |
| automation docs | `docs: 구글 시트 필드 계약 정리` |
| harness docs | `chore: 도메인 계약 하네스 보강` |
| database docs | `docs: MySQL ERD 스크립트 정리` |
| safety fix | `fix: 실거래처럼 보이는 문구 제거` |
| UI bug fix | `fix: 모델 카드 긴 배지 줄바꿈 수정` |
| API guard fix | `fix: 제작자 API 권한 검사 강화` |
| tests | `test: 모델 심사 상태 전이 검증 추가` |

## Safety Wording

Do not use commit messages that suggest completed financial, legal, or account operations unless that scope has been explicitly approved and implemented later.

Forbidden or risky summaries:

```text
feat: 실제 주문 실행 추가
feat: 입금 연동 완료
feat: 법률 승인 문구 추가
feat: 브로커 계좌 연결 완료
feat: 수익 보장 모델 공개
```

Use safe MVP wording instead:

```text
feat: TradeIntent 사전 검증 초안 추가
feat: MockDeposit 상태 모델 추가
docs: 법률 검토 필요 문구 placeholder 정리
docs: 브로커 계좌 연결 검토 항목 기록
fix: 수익 보장처럼 보이는 문구 제거
```

## Push And Sheet Recording

After a successful commit and push:

1. Record the short commit hash in Backlog and Done.
2. Record the same hash in Runs.
3. Put the exact commit message or concise Korean summary in task notes when helpful.
4. If push fails, do not mark the task `done` unless the failure is explicitly recorded and no code/doc change needs to be delivered.

## Quick Checklist

Before committing:

1. Confirm the selected task id.
2. Stage only files for that task.
3. Run the required verification.
4. Choose the correct type prefix.
5. Write a Korean summary.
6. Add a body only for safety, security, legal/financial, or blocker context.
