# Domain Contract Harness

<!--
이 하네스는 investModel의 핵심 도메인 용어, MVP 경계, API 초안, mock data, 폴더 구조, RBAC, 상태 전이, 자동화 기준을 한곳에 묶어 두는 기준 문서입니다.
클래스, 인터페이스, DB, API, 화면 구현의 이름과 책임이 흔들리지 않도록 작업 전에 확인합니다.
-->

## Canonical Domain Terms

아래 이름은 우선 사용하는 공식 이름입니다. 새 코드, DB 매핑, API DTO, 화면 컴포넌트에서 같은 개념을 다른 이름으로 만들지 않습니다.

| Term | 역할 | 사용 위치 | 금지/주의 |
| --- | --- | --- | --- |
| `InvestmentModel` | 제작자가 등록하고 사용자가 선택하는 AI 투자 모델의 공개 단위 | 모델 목록, 모델 상세, `investment_models` | `Strategy`, `Bot`, `Advisor`로 대체하지 않습니다. |
| `ModelVersion` | 모델 설명, mandate, 위험, 성과 기준이 고정되는 버전 단위 | 상세, 심사, `model_versions` | live 모델 수정은 새 버전 또는 재심사 흐름으로 다룹니다. |
| `ModelRiskProfile` | 모델이 스스로 가진 위험 성향, 레버리지, 시장, 자산군 특성 | 위험 배지, `model_risk_profiles` | 사용자 투자성향 설정처럼 표현하지 않습니다. |
| `PortfolioMandate` | 모델이 운용할 수 있는 범위와 금지 조건 | 모델 설명, 정책 검사, `portfolio_mandates` | 사용자가 직접 비율을 조정하는 설정값이 아닙니다. |
| `TradeIntent` | 실제 주문 전 단계의 의사결정/주문 의도 | 결정 파이프라인, `trade_intents` | 실제 주문, 체결, 브로커 API 호출로 해석하지 않습니다. |
| `MockDeposit` | 초기 개발용 가상 입금 상태 | 홈/포트폴리오 mock, `mock_deposits` | 실제 입금, 결제, 계좌 잔고로 표현하지 않습니다. |
| `AllocationDecision` | 모델이 시장/뉴스/가격 신호를 보고 만든 배분 판단 | 결정 파이프라인, `allocation_decisions` | 사용자에게 확정 투자 조언처럼 표시하지 않습니다. |
| `ComplianceReview` | 모델, 문구, 상태 변경의 검토 기록 | 운영자 심사, `compliance_reviews` | 법률 판단 완료를 Codex가 임의로 확정하지 않습니다. |
| `SignalEvent` | 가격/뉴스/트래픽 기반의 모델 입력 또는 시장 신호 | Realtime Signals, `model_signal_events` | 단독 매수/매도 추천으로 표시하지 않습니다. |
| `FeedPost` | 모델/시장/운영 인사이트 피드 | Feed Insights, `feed_posts` | 수익 보장 또는 투자 권유 문구를 넣지 않습니다. |

## MVP Boundary

초기 MVP는 화면 구조, 모델 탐색, 모델 상세, mock 포트폴리오, mock 신호, feed, 심사/상태 설계를 검증하는 단계입니다.

허용:

- 승인된 mock `InvestmentModel` 목록과 상세 표시
- mock `SignalEvent`, mock `FeedPost`, mock `PortfolioSummary` 표시
- 사용자의 모델 선택 상태를 mock 또는 DB 레코드로 저장
- `TradeIntent`를 실제 주문 전 simulation-ready 또는 blocked 상태로만 표현
- 운영자/제작자/사용자 권한 경계 설계와 검증

금지:

- 실제 입금, 결제, 출금, 브로커 계좌 연결
- 실제 매수/매도 주문 실행
- 사용자가 안정형/공격형/주식 비율/채권 비율/레버리지 선호를 직접 설정하는 UI
- 외부 모델 파일 실행 또는 업로드 파일 실행
- 수익 보장, 손실 방지, 법적 적합성 확정 문구

검토 필요:

- 실계좌 연동
- 실제 시장 데이터 유료 API 연결
- 모델 파일 업로드/샌드박스 실행
- 고위험/레버리지 모델 공개 정책
- 법률/금융 고지 최종 문구

## API Draft Contract

초기 API는 Figma 5개 화면과 MySQL DB 설계를 연결하기 위한 초안입니다. 구현 전에 DTO 이름과 권한을 이 문서 기준으로 맞춥니다.

| Method | Path | 목적 | 주요 DTO | 권한 |
| --- | --- | --- | --- | --- |
| `GET` | `/api/models` | 승인/공개된 모델 목록 조회 | `ModelCardDto[]` | public 또는 signed-in |
| `GET` | `/api/models/:id` | 모델 상세, mandate, 위험, 고지 조회 | `ModelDetailDto` | public 또는 signed-in |
| `GET` | `/api/signals` | mock 또는 수집된 신호 랭킹 조회 | `SignalEventDto[]` | signed-in |
| `GET` | `/api/feed` | 모델/시장 인사이트 피드 조회 | `FeedPostDto[]` | signed-in |
| `POST` | `/api/model-selections` | 사용자가 특정 모델 버전을 선택 | `ModelSelectionDto` | user |
| `GET` | `/api/portfolio/mock-summary` | mock 입금/포트폴리오 요약 조회 | `PortfolioSummaryDto` | user |
| `POST` | `/api/creator/models` | 제작자 모델 draft 생성 | `InvestmentModelDraftDto` | creator |
| `POST` | `/api/admin/models/:id/reviews` | 운영자 심사 결과 기록 | `ComplianceReviewDto` | admin |

API 응답은 DB row를 그대로 노출하지 않습니다. 화면에는 DTO를 전달하고, DTO 이름은 도메인 타입과 역할이 겹치지 않게 `Dto` 접미사를 붙입니다.

## Mock Data Strategy

초기 화면과 API는 DB 연결 전에도 동작할 수 있어야 합니다. mock 데이터는 실제 투자 데이터처럼 보이지 않도록 이름과 상태에 `mock`, `simulated`, `backtest`, `placeholder`를 명확히 포함합니다.

기본 위치:

- `lib/mock/models`
- `lib/mock/signals`
- `lib/mock/portfolio`
- `lib/mock/feed`

mock 데이터 작성 규칙:

- 실제 고객 자산처럼 보이는 필드명은 피합니다. 예: `realBalance` 금지, `mockBalance` 허용.
- 성과 수치는 `backtest`, `sample`, `placeholder` 출처를 함께 둡니다.
- `TradeIntent` mock은 `intent`, `blocked`, `simulation_ready` 같은 주문 전 상태만 사용합니다.
- 실제 DB seed로 전환할 수 있도록 DBML의 주요 식별자와 관계를 유지합니다.

## Folder Structure Contract

스타터 구조 안에서 investModel 도메인은 아래 경계를 기본으로 둡니다.

```text
lib/domain/models
lib/domain/portfolio
lib/domain/signals
lib/domain/compliance
lib/domain/rbac
lib/domain/state
lib/mock
components/invest-model
app/api
docs
harness
```

규칙:

- `lib/domain/**`에는 UI 렌더링 세부사항을 넣지 않습니다.
- `components/invest-model/**`는 DB row shape에 직접 의존하지 않고 DTO 또는 view model에 의존합니다.
- `lib/mock/**`는 실제 DB 클라이언트나 외부 API를 import하지 않습니다.
- 도메인 타입 파일 최상단에는 역할 주석을 둡니다.
- barrel export는 순환 참조가 생기지 않는 좁은 단위에서만 사용합니다.

## RBAC Contract

기본 역할:

| Role | 허용 | 금지 |
| --- | --- | --- |
| `user` | 공개 모델 조회, 모델 선택, 본인 mock 포트폴리오 조회 | 모델 등록/심사, 타인 데이터 조회 |
| `creator` | 본인 모델 draft 작성, 심사 요청, 반려 사유 확인 | 승인 없이 live 전환, 타 제작자 모델 수정 |
| `admin` | 모델 심사, 중지/반려, 고지 검토, 감사 로그 확인 | 비밀값 노출, 법률 판단 임의 확정 |
| `system` | scheduled/mock data sync, audit event 생성 | 사용자 승인 없는 실제 주문/입금 실행 |

모든 admin/creator 중요 액션은 `AuditLog` 대상입니다. 권한 실패는 화면과 API에서 동일하게 403 또는 정책 차단 응답으로 다룹니다.

## State Transition Contract

`InvestmentModel.status`:

```text
draft -> pending_review -> approved -> live
live -> paused -> live
live -> suspended
live -> retired
pending_review -> draft
approved -> retired
```

`TradeIntent.status`:

```text
draft -> policy_checking -> simulation_ready
draft -> policy_checking -> blocked
simulation_ready -> archived
blocked -> archived
```

`MockDeposit.status`:

```text
created -> simulated_available -> simulated_allocated
simulated_available -> cancelled
simulated_allocated -> archived
```

상태 변경 규칙:

- 상태 전이는 actor, reason, created_at을 남깁니다.
- 사용자에게 노출되는 모델은 기본적으로 `live`만 허용합니다.
- `suspended`, `retired` 모델은 새 선택을 막습니다.
- `TradeIntent`는 어떤 상태에서도 실제 주문 실행을 의미하지 않습니다.

## Automation Contract

자동 작업은 다음 순서를 따릅니다.

1. Google Sheets에서 관련 Backlog/In Progress/Issues/Harness를 확인합니다.
2. 요청이 기존 체크리스트에 없으면 새 Backlog 항목을 추가합니다.
3. 관련 하네스를 읽고, `domain-contract-harness.md`가 필요한 도메인 작업인지 확인합니다.
4. 작업을 수행합니다.
5. 문서/코드 유형에 맞는 검증을 수행합니다.
6. Sheets에 완료/문제/다음 작업을 기록합니다.
7. 코드 또는 문서 파일이 변경되었으면 한국어 커밋 메시지로 commit/push합니다.

자동 작업 중단 조건:

- 실제 자금 이동, 실제 주문, 브로커/은행 계좌 연결이 필요할 때
- 법률/금융 적합성 판단을 확정해야 할 때
- 하네스끼리 충돌하거나 사용자의 명시 확인이 필요한 때
- 비밀값, 계정 연결, 외부 유료 API 키가 필요한 때
