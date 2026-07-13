# Figma 대비 시각 구조 QA 결과

<!--
이 문서는 Figma 초기 모바일 구조에서 구현된 investModel 5개 핵심 화면의 모바일 시각 구조를 점검한 결과를 기록한다.
실제 투자, 실제 입금, 실제 주문, 계좌 연결, 법률 판단은 QA 범위에 포함하지 않는다.
-->

## 범위

- 작업 ID: `BK-113`
- 기준 화면: Home, Discover Models, Realtime Signals, Model Detail, Feed Insights
- 기준 뷰포트: 390px 모바일 프레임, safe area, 하단 5탭 내비게이션
- Figma 기준: `https://www.figma.com/design/rF7vdXnlIrRxqAHD8dvtDa`

## 자동 점검 결과

| 항목 | 결과 | 확인 방식 |
| --- | --- | --- |
| 5개 핵심 화면이 `MobileShell`을 사용함 | 통과 | 페이지 소스 구조 확인 |
| 각 화면의 하단 탭 `activeTab`이 화면 목적과 일치함 | 통과 | route별 page 파일 검사 |
| 언어 전환용 `currentPath`가 핵심 화면에 유지됨 | 통과 | page 파일 검사 |
| 모바일 프레임 최대 폭이 토큰으로 제한됨 | 통과 | `MobileShell` source 검사 |
| 하단 safe area와 fixed bottom nav 여백이 있음 | 통과 | `MobileShell`/`BottomNav` source 검사 |
| 하단 탭이 5개이고 key가 중복되지 않음 | 통과 | `investModelNavItems` 검사 |
| Discover Models는 approved/live mock 모델만 노출함 | 통과 | `discoverableInvestmentModels` 검사 |
| Model Detail은 수익률을 drawdown/volatility와 함께 표시함 | 통과 | detail mock metrics 검사 |
| Realtime Signals는 TradeIntent를 만들지 않는다는 경계를 표시함 | 통과 | signal summary copy 검사 |
| Feed Insights는 투자 조언/추천처럼 보이지 않는 경계를 표시함 | 통과 | feed summary/post copy 검사 |
| 긴 영문 토큰이 모바일 카드 밖으로 넘칠 위험 | 통과 | 주요 mock copy의 긴 unbroken token 검사 |

## 실행한 검증

```powershell
npx tsc --noEmit
npx tsx scripts/qa/invest-model-visual-structure-smoke.ts
git diff --check -- scripts/qa/invest-model-visual-structure-smoke.ts docs/qa/figma-visual-structure-qa.md
```

## 제한 사항

- 현재 프로젝트 의존성에 Playwright가 없어 이 실행에서는 실제 PNG 스크린샷을 자동 저장하지 않았다.
- 실제 휴대폰 접속, safe area, 스크롤, 하단 탭 터치 확인은 열린 이슈 `IS-003`으로 유지한다.
- 추후 `BK-094` 모바일 반응형 테스트에서 Playwright 또는 실기기 스크린샷 기반 시각 회귀 검증을 확장한다.

