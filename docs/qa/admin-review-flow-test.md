# 운영자 심사 흐름 QA 결과

<!--
이 문서는 investModel의 모델 등록 초안 -> 운영자 심사 -> 승인/반려 -> audit log 반환 흐름이 backend/security 하네스를 지키는지 기록한다.
실제 DB 저장, 모델 공개, 모델 파일 실행, 실제 주문/입금 연결은 테스트하지 않는다.
-->

## 범위

- 작업 ID: `BK-049`
- 대상 흐름: 모델 등록 초안 -> 운영자 심사 -> 승인/반려 -> audit log 반환
- 기준 코드: `lib/domain/models/creator-draft.ts`, `lib/domain/models/admin-review.ts`, `lib/domain/audit/audit-log.ts`
- 제외 범위: 실제 DB 저장, 실제 public publish, 실제 모델 파일 실행, 실제 주문/입금/계좌 연결

## 자동 확인 항목

| 항목 | 결과 | 확인 방식 |
| --- | --- | --- |
| `creator`와 `admin`만 모델 초안 생성 가능 | 통과 | `canCreateModelDraft` role guard 확인 |
| 일반 `user`는 모델 초안 생성 불가 | 통과 | `canCreateModelDraft('user') === false` 확인 |
| 모델 초안은 private draft로 유지 | 통과 | `status='draft'`, `visibility='private'`, `publicDiscoveryEligible=false` 확인 |
| 모델 artifact는 metadata-only 유지 | 통과 | `modelArtifactStatus='metadata_only'` 확인 |
| `admin`만 심사 가능 | 통과 | `canReviewInvestmentModel` role guard 확인 |
| `pending_review -> approved` 승인 전이 가능 | 통과 | `buildAdminModelReviewResult` 승인 결과 확인 |
| 승인 시 audit log가 반환됨 | 통과 | `admin_model_approved` audit action과 model public id 확인 |
| 반려 코멘트는 제작자에게 보이는 comment로 기록 | 통과 | `reviewComment.visibility='creator_visible'` 확인 |
| 잘못된 전이는 정책 차단 | 통과 | `pending_review -> publish_live`가 `policy_blocked`로 차단됨 |
| MVP에서는 저장/공개/실거래 없음 | 통과 | `persistence='not_persisted'` 확인 |

## 실행한 검증

```powershell
npx tsc --noEmit
npx tsx scripts/qa/invest-model-admin-review-flow-smoke.ts
git diff --check -- scripts/qa/invest-model-admin-review-flow-smoke.ts docs/qa/admin-review-flow-test.md
```

## 실패 상태 기록

- 현재 자동 smoke test에서 실패 항목 없음.
- 실제 관리자 세션, 실제 DB 저장, production 배포 환경의 보안 검증은 후속 RBAC/API 테스트와 환경 구성 이후 별도로 확인해야 한다.
- 실제 모델 공개, 실제 모델 파일 실행, 실제 주문/입금 연결은 MVP 금지 범위이므로 이 테스트에서 수행하지 않는다.
