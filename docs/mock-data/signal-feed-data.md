<!--
이 문서는 investModel 모바일 화면의 Realtime Signals와 Feed Insights에 사용할 mock 신호/피드 데이터 기준을 정의한다.
AI 작업자는 이 문서를 보고 실제 매매, 실제 뉴스 수집, 실제 계좌 연결 없이 화면/API/DB fixture를 일관되게 작성해야 한다.
-->

# Mock Signal And Feed Data

## Purpose

`SignalEvent`와 `FeedPost` mock 데이터는 초기 모바일 PWA 화면을 빠르게 구현하기 위한 관찰/설명용 데이터다. 이 데이터는 투자 추천, 매수/매도/보유 지시, 실제 주문 의도, 실제 입금 상태를 만들지 않는다.

초기 MVP에서는 다음 원칙을 지킨다.

- 모든 데이터는 `mock`, `observed_placeholder`, `informational_placeholder` 중 하나의 문맥으로 표시한다.
- `SignalEvent`는 AI 모델이 참고할 수 있는 관찰 입력이다. 사용자의 직접 투자 행동을 지시하지 않는다.
- `FeedPost`는 모델 제작자/운영자/시스템의 설명성 글이다. 수익 보장, 법률 판단, 개인별 투자 조언을 포함하지 않는다.
- 실제 뉴스 API, 실제 시세 API, 실제 주문 API, 유료 API 키, 외부 비밀값을 사용하지 않는다.

## Related Files

- `lib/mock/invest-model-signals.ts`
- `lib/mock/invest-model-feed.ts`
- `docs/api/dto-contract.md`
- `docs/mock-data/mock-data-policy.md`
- `docs/mock-data/model-catalog.md`
- `docs/database/invest-model.dbml`

## DB Mapping

| Mock area | Future DB tables | Notes |
| --- | --- | --- |
| Realtime signal list | `model_signal_events`, `investment_models`, `model_versions` | 각 신호는 공개 모델/버전 식별자와 연결한다. |
| News traffic context | `news_articles`, `news_traffic_snapshots`, `model_signal_events` | 초기에는 headline/traffic score를 mock으로만 둔다. |
| Price trend context | `market_instruments`, `market_price_snapshots`, `model_signal_events` | 실제 가격 대신 방향성과 설명 문구만 둔다. |
| Feed insight list | `feed_posts`, `investment_models`, `users`, `model_disclosures` | 작성자 이름은 mock display name만 사용한다. |

## SignalEvent Contract

초기 fixture는 아래 필드를 우선 사용한다.

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `signalPublicId` | string | yes | `sig_` 접두어를 사용한다. |
| `modelVersionPublicId` | string | yes | 모델 버전 공개 ID placeholder다. |
| `linkedModelName` | string | yes | 화면에 노출되는 모델명이다. |
| `signalType` | string | yes | `news_traffic`, `price_trend`, `macro`, `risk` 중 하나다. |
| `title` | string | yes | 매매 지시처럼 보이지 않는 관찰 제목으로 작성한다. |
| `summary` | string | yes | 왜 신호가 생겼는지 설명하되 추천 문구는 금지한다. |
| `score` | number | yes | 0-100 정수. 정렬/강조용이다. |
| `scoreDisplay` | string | yes | 화면 표시용 문자열이다. |
| `sourceLabel` | string | yes | `Mock news traffic`, `Mock market trend` 같은 출처 문맥이다. |
| `capturedAt` | string | yes | ISO 8601 형식의 mock timestamp다. |
| `dataContext` | string | yes | `mock` 또는 `observed_placeholder`만 허용한다. |
| `notices` | string[] | yes | mock/비추천/비실거래 고지를 포함한다. |

## SignalEvent Seed Rows

| signalPublicId | linkedModelName | signalType | title | summary | score | sourceLabel | dataContext |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sig_mock_001` | Quant US Leverage Alpha | `news_traffic` | AI chip headlines accelerating | 반도체/AI 인프라 관련 mock headline volume이 높아진 상황을 관찰 신호로 표시한다. | 92 | Mock news traffic | `observed_placeholder` |
| `sig_mock_002` | Macro ETF Balance | `price_trend` | Short-term yields cooling | 단기 금리 방향성이 완만해졌다는 mock trend를 ETF 비중 점검 맥락으로 표시한다. | 78 | Mock market trend | `mock` |
| `sig_mock_003` | Defensive Income Rotation | `risk` | Drawdown guard near threshold | 방어형 인컴 모델의 손실 방어 조건이 mock 기준선에 가까워진 상태를 표시한다. | 71 | Mock model risk guard | `mock` |
| `sig_mock_004` | Asia Tech Momentum | `news_traffic` | Asia tech earnings traffic spike | 아시아 기술주 실적 관련 mock traffic이 증가한 상태를 관찰 신호로 표시한다. | 84 | Mock news traffic | `observed_placeholder` |
| `sig_mock_005` | Global Bond Shield | `macro` | Global duration bid strengthens | 글로벌 장기채 선호가 강해지는 mock macro context를 표시한다. | 69 | Mock macro context | `mock` |
| `sig_mock_006` | Macro ETF Balance | `news_traffic` | Consumer traffic fading | 소비재 관련 mock attention이 낮아지는 흐름을 시장 배경으로 표시한다. | 58 | Mock news traffic | `observed_placeholder` |

각 신호의 `notices`에는 아래 문구를 포함한다.

- `Mock data only`
- `Not investment advice`
- `No trade intent created`

## FeedPost Contract

초기 fixture는 아래 필드를 우선 사용한다.

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `postPublicId` | string | yes | `feed_` 접두어를 사용한다. |
| `modelPublicId` | string | no | 특정 모델과 연결되지 않으면 `null`이다. |
| `linkedModelName` | string | no | 전체 공지라면 `All models`를 사용한다. |
| `authorDisplayName` | string | yes | mock 작성자 표시명이다. |
| `postType` | string | yes | `model_note`, `market_context`, `risk_note`, `review_note` 중 하나다. |
| `title` | string | yes | 피드 카드 제목이다. |
| `excerpt` | string | yes | 모바일 카드에 들어갈 1-2문장 요약이다. |
| `tags` | string[] | yes | 화면 필터/칩에 사용할 짧은 태그다. |
| `publishedAt` | string | yes | ISO 8601 형식의 mock timestamp다. |
| `timeLabel` | string | yes | `12m ago` 같은 화면 표시 문자열이다. |
| `dataContext` | string | yes | `mock` 또는 `informational_placeholder`만 허용한다. |
| `notices` | string[] | yes | 정보성/mock/비추천 고지를 포함한다. |

## FeedPost Seed Rows

| postPublicId | linkedModelName | postType | title | excerpt | tags | dataContext |
| --- | --- | --- | --- | --- | --- | --- |
| `feed_mock_001` | Quant US Leverage Alpha | `model_note` | Leverage model is watching AI infra traffic | 이 모델은 AI 인프라 관련 mock attention이 높을 때만 레버리지 노출 설명을 강조한다. 실제 주문은 생성하지 않는다. | `AI`, `Leverage`, `US` | `informational_placeholder` |
| `feed_mock_002` | Macro ETF Balance | `market_context` | Yield cooling context for balanced ETF sleeve | mock 금리 흐름이 완만해진 상황을 균형형 ETF 모델 설명에 연결한다. | `ETF`, `Macro`, `Yield` | `mock` |
| `feed_mock_003` | Defensive Income Rotation | `risk_note` | Defensive guardrail entered watch state | 방어형 인컴 모델의 손실 방어 조건이 watch 상태에 들어간 것으로 표시한다. | `Risk`, `Income`, `Guardrail` | `mock` |
| `feed_mock_004` | Asia Tech Momentum | `risk_note` | Concentration notice for Asia tech momentum | 아시아 기술주 momentum 설명에는 지역/섹터 집중 위험을 함께 노출한다. | `Asia`, `Tech`, `Concentration` | `informational_placeholder` |
| `feed_mock_005` | Global Bond Shield | `market_context` | Duration context remains model-defined | 채권 duration 관련 설명은 모델의 mandate 안에서만 해석되며 사용자별 조정 UI는 제공하지 않는다. | `Bond`, `Duration`, `Macro` | `mock` |
| `feed_mock_006` | All models | `review_note` | Disclosure review queue placeholder | 공개 전 모델 설명, mandate, 위험 고지 검토가 필요하다는 운영자용 placeholder다. | `Review`, `Disclosure`, `Ops` | `informational_placeholder` |

각 피드의 `notices`에는 아래 문구를 포함한다.

- `Mock content`
- `For product preview only`
- `Not personalized financial advice`

## Fixture Conversion Rules

TS fixture나 API route로 옮길 때는 아래 규칙을 유지한다.

1. `score`는 숫자로 유지하고, 화면 표시용 문구는 `scoreDisplay`에 둔다.
2. `sourceLabel`, `capturedAt`, `dataContext`, `notices`를 제거하지 않는다.
3. `SignalEvent`에서 `TradeIntent`를 직접 생성하지 않는다.
4. `FeedPost`에서 수익률 보장, 매수/매도/보유 명령, 사용자 맞춤 조언 문구를 쓰지 않는다.
5. 실제 API 호출이 필요해 보이면 구현하지 말고 `Issues`에 외부 API/비밀값 확인 항목을 남긴다.
6. DB seed로 전환할 때는 `investment_models`와 `model_versions`의 public ID를 먼저 고정한 뒤 foreign key를 연결한다.

## Acceptance Checklist

- 모바일 `Realtime Signals` 화면은 `title`, `summary`, `scoreDisplay`, `sourceLabel`, `timeLabel` 또는 `capturedAt`을 표시할 수 있어야 한다.
- 모바일 `Feed Insights` 화면은 `postType`, `title`, `excerpt`, `tags`, `timeLabel`을 표시할 수 있어야 한다.
- 모든 mock 행은 실제 입금, 실제 주문, 실제 외부 계좌 연결과 무관해야 한다.
- 하네스 검토 시 금융 조언처럼 보이는 문구가 있으면 `risk_note` 또는 `Issues`로 분리한다.
