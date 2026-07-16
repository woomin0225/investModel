<!--
이 문서는 investModel의 출시 단계별 Scope Gate를 정의한다.
각 단계에서 허용되는 기능, 금지되는 기능, 필요한 검토, 데이터 범위를 고정해
프로토타입 개발이 실제 금융 서비스 기능으로 오해되어 확장되지 않게 막는다.
-->

# investModel Release Scope Gates

이 문서는 investModel을 `Prototype`, `Internal Alpha`, `Closed Beta`, `Public Launch`로 나누어 단계별 허용 범위와 차단 범위를 정한다. 모든 단계는 모바일/Capacitor-first 내부 테스트 앱 방향을 따르며, Next.js 모바일 웹/PWA는 공유 런타임과 검증 표면으로 유지한다. 실제 입금, 실제 주문, 계좌 연결, 법률 판단, 비밀값 입력, 외부 유료 API 키 사용은 별도 승인 전까지 금지한다.

관련 기준:

- `docs/product/mvp-scope.md`
- `docs/product/mock-deposit-scope.md`
- `docs/compliance/feature-review-matrix.md`
- `docs/security/rbac-matrix.md`
- `docs/automation/codex-recurring-workflow-prompt.md`

## Readability And Scope Invariants

이 문서는 사람이 그대로 읽고 판단할 수 있어야 한다. 한글 본문이나 주석이 깨져 보이면 정책 의미를 추측해 진행하지 말고, UTF-8 기준으로 원문을 복구한 뒤 검증한다.

모든 단계에서 유지해야 하는 불변 조건:

- `Prototype`은 기본 자동화 단계이며, mock/seed/local test 데이터만 사용한다.
- `Internal Alpha`는 내부 사용자와 staging 범위만 허용한다. 일부 DB 저장은 가능하지만 금융 동작은 여전히 mock이다.
- `Closed Beta`는 제한된 외부 테스터에게 앱 경험을 보여줄 수 있지만 실제 금융 실행은 금지한다.
- `Public Launch`도 기본 범위에는 실제 입금, 주문, 계좌 연결이 포함되지 않는다. 별도 `financial_operation` gate가 끝나기 전까지 추가하지 않는다.
- 모든 단계는 모바일/Capacitor-first 방향을 유지하고, Next.js 모바일 웹/PWA를 공유 검증 표면으로 사용한다.
- `MockDeposit`, `AllocationDecision`, `TradeIntent`, `SignalEvent`, `FeedPost`는 각각 모의 예치금, 모의 판단, 주문 전 의도, 관찰 신호, 정보성 피드로만 설명한다.
- 실제 자금 이동, 실제 주문/체결/정산, 브로커 또는 은행 계좌 연결, 최종 법률 판단, 운영 비밀값, 외부 유료 API 키는 별도 승인 전까지 금지한다.

## Universal Blockers

아래 항목은 별도의 `financial_operation` 승인, 법무/컴플라이언스 검토, 보안 검토, 운영 승인 전까지 모든 출시 단계에서 금지한다.

| Blocked scope | Reason | Required gate |
| --- | --- | --- |
| 실제 입금, 출금, 결제, 예치금 처리 | 사용자 자금 취급으로 규제/보안/정산 책임이 발생한다. | `financial_operation` |
| 증권 계좌 연결, 브로커 API 연결 | 민감 금융 데이터와 주문 권한이 연결된다. | `financial_operation` |
| 실제 주문, 체결, 정산, 포지션 변경 | 투자 실행으로 사용자 손실 가능성이 발생한다. | `financial_operation` |
| AI 모델 파일 실행, 외부 업로드 모델 런타임 실행 | 샌드박스, 악성 코드, 리소스 격리 검토가 필요하다. | `model_runtime_security` |
| 사용자가 직접 안정형/공격형/레버리지 선호를 선택하는 기능 | 제품 원칙상 투자 성향은 AI 모델 설명과 mandate에 포함되어야 한다. | `product_principle_review` |
| 법률 자문처럼 보이는 문구, 수익 보장 문구 | 금융 오인, 과장 광고, 법률 판단 위험이 있다. | `legal_copy_review` |
| 외부 유료 API 키, 비밀값, 운영 계정 입력 | 비밀값 관리와 비용/권한 승인이 필요하다. | `secret_management_review` |

## Stage Summary

| Stage | Audience | Allowed data | Primary goal |
| --- | --- | --- | --- |
| Prototype | 개발자와 내부 기획자 | 정적 mock, seed data, 로컬/테스트 전용 데이터 | 모바일 앱 경험과 핵심 도메인 언어 검증 |
| Internal Alpha | 내부 팀 | staging DB, sanitized internal test data, 승인된 테스트 provider data | 인증, RBAC, 감사 로그, 운영 흐름 검증 |
| Closed Beta | 제한된 외부 테스터 | beta test accounts, DB-backed mock portfolio, approved test feed | 제한 공개 환경에서 온보딩, 모델 선택, 신고/검수 흐름 검증 |
| Public Launch | 일반 사용자 | production app data, approved market/news data, reviewed disclosure copy | 공개 서비스 운영 준비와 안정성 검증 |

## Prototype Gate

Prototype은 현재 개발 기본 단계다. UI와 도메인 흐름을 빠르게 검증하되 모든 금융 동작은 mock으로 고정한다.

허용 기능:

- 모바일 웹/PWA 기준의 홈, 모델 탐색, 모델 상세, 신호 피드, mock 포트폴리오 화면
- `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `TradeIntent`, `MockDeposit` 같은 도메인 타입과 mock 데이터
- 모델 제작자/운영자/사용자 역할을 흉내 내는 화면 및 mock 상태 전이
- 관리자 검수, 신고, 감사 로그의 mock 또는 문서 기반 흐름
- `TradeIntent`를 실제 주문이 아닌 "모델이 의도한 투자 판단 기록"으로만 표시

금지 기능:

- 실제 입금, 주문, 계좌 연결, 브로커 연동
- 실제 AI 모델 파일 실행 또는 사용자 업로드 모델 실행
- 실시간 금융 API 키 입력이나 유료 API 의존 기능
- 투자 자문처럼 해석될 수 있는 확정적 수익/추천 문구

진입 조건:

- `mvp-scope.md`와 `mock-deposit-scope.md`가 최신 상태다.
- mock 데이터와 실제 금융 데이터가 UI 문구에서 분리되어 있다.
- 모바일 390px 기준 주요 화면이 겹침 없이 확인된다.

승격 조건:

- 핵심 화면이 mock 데이터로 연결된다.
- 도메인 타입과 주요 API 초안이 하네스와 충돌하지 않는다.
- 실제 금융 기능을 막는 문구와 코드 경계가 유지된다.

## Internal Alpha Gate

Internal Alpha는 내부 사용자만 접근하는 staging 단계다. 이 단계부터 일부 데이터는 DB에 저장될 수 있지만, 금융 동작은 여전히 mock이다.

허용 기능:

- 인증된 내부 계정 기반 접근
- 사용자, 모델 제작자, 운영자 RBAC 적용
- 모델 등록/검수/공개 상태의 DB 저장
- 신고, 운영 메모, 감사 로그의 DB 저장
- 승인된 테스트 provider 또는 mock feed 기반 뉴스/시장 데이터 표시

금지 기능:

- 실제 자금 취급 또는 실제 주문 실행
- 외부 모델 파일 런타임 실행
- 비밀값이 필요한 외부 API를 코드나 문서에 직접 입력
- 내부 검토 없는 공개 사용자 초대

진입 조건:

- RBAC 매트릭스와 관리자 검수 흐름이 문서화되어 있다.
- staging DB 스키마가 `database-harness.md`와 일치한다.
- 감사 로그가 어떤 사용자 행동을 기록해야 하는지 정의되어 있다.

승격 조건:

- 내부 사용자로 주요 역할 흐름이 검증된다.
- 주요 상태 전이가 감사 로그와 함께 남는다.
- 오류/신고/운영 중단 기준이 확인된다.

## Closed Beta Gate

Closed Beta는 제한된 외부 테스터에게 앱 경험을 공개하는 단계다. 외부 사용자가 들어오더라도 실제 금융 실행은 금지된다.

허용 기능:

- 초대 기반 외부 테스터 계정
- DB-backed 모델 선택, mock 포트폴리오, mock signal/feed
- 모델 설명, mandate, 리스크 라벨의 검토된 표시
- 신고/문의/운영자 검수 흐름
- 제한된 모델 제작자 온보딩과 검수 대기 상태

금지 기능:

- 실제 입금, 출금, 주문, 브로커 계좌 연결
- 모델 성과를 실제 수익처럼 표현하는 문구
- 미검토 AI 모델 공개
- 법무 검토 전 최종 약관/투자 고지 문구 사용

진입 조건:

- 외부 테스터 초대/비활성화 절차가 있다.
- 신고와 운영자 조치 흐름이 최소 1회 이상 검증된다.
- 데이터 보관 범위와 삭제 요청 처리 기준이 문서화되어 있다.

승격 조건:

- 베타 사용자 피드백에 따른 P1/P2 리스크가 닫혀 있다.
- 모바일 주요 화면과 언어 전환이 안정적으로 작동한다.
- 운영자가 모델/신고/사용자를 중단하거나 숨길 수 있다.

## Public Launch Gate

Public Launch는 일반 사용자를 대상으로 공개 운영하는 단계다. 이 단계도 기본적으로는 실제 금융 실행을 포함하지 않는다. 실제 입금/주문/계좌 연결은 별도 `financial_operation` gate가 완료될 때만 Public Launch 범위에 추가할 수 있다.

허용 기능:

- 공개 사용자 가입과 기본 온보딩
- production DB 기반 모델 탐색, 모델 선택, mock/observed portfolio view
- 검토 완료된 고지 문구와 도움말
- production monitoring, audit log, incident response flow
- 운영자 모델 심사, 신고 처리, 공개/중단/retire 상태 관리

금지 기능:

- `financial_operation` 승인 없는 실제 자금/주문 기능
- 법무 검토 없는 수익률, 리스크, 책임 제한 문구
- 보안 검토 없는 외부 모델 실행
- 운영 모니터링 없이 외부 API 장애에 의존하는 핵심 화면

진입 조건:

- 법무/컴플라이언스가 공개 문구와 사용자 고지를 검토했다.
- production auth, RBAC, audit log, monitoring이 준비되어 있다.
- 장애 대응, 데이터 복구, 사용자 신고 처리 기준이 있다.

승격 조건:

- 공개 직전 smoke test와 모바일 회귀 테스트가 통과한다.
- P1/P2 열린 이슈가 없거나 명시적으로 launch waiver가 승인되어 있다.
- 운영자가 위험 모델을 즉시 `paused`, `suspended`, `retired`로 전환할 수 있다.

## Promotion Checklist

| Check | Prototype | Internal Alpha | Closed Beta | Public Launch |
| --- | --- | --- | --- | --- |
| Mobile 390px UI smoke | Required | Required | Required | Required |
| Mock/real wording separation | Required | Required | Required | Required |
| RBAC review | Planned | Required | Required | Required |
| Audit log coverage | Planned | Required | Required | Required |
| Legal copy review | Not required for placeholder copy | Required for alpha-facing sensitive copy | Required for beta-facing copy | Required for all public copy |
| Security review | Basic code review | Required for auth/DB | Required for external beta access | Required for production |
| Real money/order approval | Blocked | Blocked | Blocked | Separate `financial_operation` gate only |
| Google Sheets automation update | Required | Required | Required | Required |
| Commit and push after task | Required | Required | Required | Required |

## Automation Behavior

자동 실행은 현재 단계가 명시되지 않으면 `Prototype` 기준으로 작업한다.

- 체크리스트 작업이 실제 금융 기능을 요구하면 구현하지 않고 Issues에 기록한다.
- 새 기능이 단계별 Scope Gate를 넘어서면 작은 문서/체크리스트 작업으로 분리한다.
- 코드 변경 후 검증이 실패하면 Done으로 이동하지 않고 Issues 또는 In Progress에 남긴다.
- 문서만 변경한 작업은 `git diff --check`와 관련 키워드 검색으로 최소 검증한다.

## Naming Notes

- `InvestmentModel`: 사용자가 선택하는 AI 투자 모델 상품 단위
- `ModelVersion`: 모델 설명, mandate, 공개 상태가 고정되는 버전 단위
- `PortfolioMandate`: 모델이 선언한 투자 범위, 지역, 레버리지, 자산군 규칙
- `TradeIntent`: 실제 주문이 아닌 모델의 투자 의도 기록
- `MockDeposit`: 실제 입금이 아닌 화면/흐름 검증용 가상 예치금
