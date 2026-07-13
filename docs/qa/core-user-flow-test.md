# 핵심 사용자 흐름 QA 결과

<!--
이 문서는 investModel의 모델 탐색 -> 상세 -> 위험 확인 -> 선택 전 확인 흐름이 모바일 MVP 경계와 프론트엔드 하네스를 지키는지 기록한다.
실제 주문, 실제 입금, 계좌 연결, 모델 파일 실행은 테스트하지 않는다.
-->

## 범위

- 작업 ID: `BK-048`
- 대상 흐름: 모델 탐색 -> 모델 상세 -> 위험/제한 확인 -> 선택 전 확인
- 기준 화면: `/invest-model/models`, `/invest-model/models/[modelId]`
- 기준 로케일: 한국어 기본, `?lang=en` 영어
- 제외 범위: 실제 선택 저장, 실제 입금, 실제 주문, 계좌 연결, 모델 파일 실행

## 자동 확인 항목

| 항목 | 결과 | 확인 방식 |
| --- | --- | --- |
| 공개 탐색 모델은 `approved` 또는 `live`만 노출 | 통과 | `isPublicDiscoverableInvestmentModel` 기준으로 한국어/영어 public model 목록 확인 |
| 공개 탐색 모델은 선택 비활성 상태가 아님 | 통과 | `getInvestmentModelStatusDisplay`의 `isSelectionDisabled=false` 확인 |
| 상세 화면 데이터가 존재함 | 통과 | 공개 모델 id로 `findMockInvestmentModelDetail` 조회 |
| 상세 화면에 위험 설명이 있음 | 통과 | `riskItems` 비어 있지 않음 |
| 상세 화면에 MVP 금지 동작 설명이 있음 | 통과 | `limitationItems` 비어 있지 않음 |
| 성과가 위험 지표와 함께 표시됨 | 통과 | `tone='risk'` 성과/손실 지표 존재 |
| 비활성 상태는 선택 불가로 표시됨 | 통과 | `paused`, `suspended`, `retired` 모두 `isSelectionDisabled=true` |

## 실행한 검증

```powershell
npx tsc --noEmit
npx tsx scripts/qa/invest-model-core-flow-smoke.ts
git diff --check -- scripts/qa/invest-model-core-flow-smoke.ts docs/qa/core-user-flow-test.md
```

## 실패 상태 기록

- 현재 자동 smoke test에서 실패 항목 없음.
- 실제 휴대폰 실기기 터치/스크롤/safe area 확인은 `IS-003`으로 남아 있으며, 이 문서에서는 자동 완료 처리하지 않는다.
- 실제 선택 저장은 후속 기능 범위이며, 현재 화면은 선택 전 확인과 mock-only 비활성 안내까지만 검증한다.
