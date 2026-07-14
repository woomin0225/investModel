# 핵심 화면 하드코딩 데이터 제거 계획

BK-261은 BK-260에서 만든 DB-backed read model/API 경계를 기준으로 Home, Models, Signals, Feed, Portfolio 화면의 잔여 mock 배열과 하드코딩 문구를 제거하거나 안전한 fallback으로 격리하기 위한 파일별 계획이다.

## 공통 원칙

- 화면은 DB row shape을 직접 import하지 않고 API route 또는 도메인 DTO만 참조한다.
- `lib/mock/**` 값은 로컬 DB 실패, 오래된 공유 링크, visual smoke fixture 같은 명시적 fallback 용도로만 남긴다.
- fallback을 유지할 때는 UI에 `mock`, `sample`, `fallback`, `simulation-only` 문맥을 표시한다.
- 실제 입금, 실제 주문, 브로커/은행 연결, 수익 보장, 법률 판단 문구는 추가하지 않는다.
- UI 변경 후에는 `npx tsc --noEmit`과 390px visual structure smoke를 통과해야 한다.

## 화면별 전환 계획

| 화면 | 현재 DB 경로 | 제거/격리할 잔여 하드코딩 | 대체 DTO/API | 필요한 UI 상태 | 390px 검증 |
| --- | --- | --- | --- | --- | --- |
| Home `app/invest-model/page.tsx` | `GET /api/portfolio/mock-summary`를 서버 컴포넌트에서 호출해 `InvestModelPortfolioSummary`를 읽는다. | `investModelHomeMock.timeline`, backtest return fallback, metrics copy 기반 label. | `InvestModelPortfolioSummary`에 Home activity/timeline용 read model을 추가하거나 `GET /api/home/summary`를 만든다. | loading은 서버 route 호출 전 skeleton 후보, empty는 선택 모델 없음, error는 DB unavailable, fallback은 mock-safe timeline. | 첫 화면 metric 3개, activity row, bottom nav가 겹치지 않아야 한다. |
| Discover Models `app/invest-model/models/page.tsx` | `GET /api/models`가 `ModelCardDto[]`를 반환한다. | 화면 summary 숫자와 footer badge copy는 UI copy로 유지하되 모델 목록 mock 배열 의존은 제거 완료 상태. | `ModelCardDto[]`, 이후 BK-284에서 query/filter DTO 확장. | loading, empty, error/unavailable, suspended/pending model 제외. | 검색/필터 영역과 모델 카드 title/risk badge가 줄바꿈되어야 한다. |
| Model Detail `app/invest-model/models/[modelId]/page.tsx` | `GET /api/models/[modelId]`가 `ModelDetailDto`를 반환한다. | `findMockInvestmentModelDetail` legacy fallback과 `MockInvestmentModelDetail` 기반 view shape. | `ModelDetailDto`를 화면 view model로 완전히 변환하고 fallback은 404/DB unavailable 전용으로 축소한다. | loading, notFound, DB unavailable fallback, high-risk disclosure, suspended/retired model. | mandate/risk/disclosure block에서 긴 한국어가 카드 밖으로 나가지 않아야 한다. |
| Realtime Signals `app/invest-model/signals/page.tsx` | `GET /api/signals`가 `SignalEventDto[]`를 반환하고 filter query를 넘긴다. | `signalsCopy.signals` fallback filter, summary/metrics copy 기반 mock count. | `SignalEventDto[]`; BK-264에서 URL filter와 DB query를 확정하고 score snapshot DTO로 확장. | loading, empty per filter, error fallback, unavailable external data notice. | filter chip active state와 Signal card score/source rows가 겹치지 않아야 한다. |
| Signal Detail `app/invest-model/signals/[signalId]/page.tsx` | `GET /api/signals/[signalId]`가 `SignalEventDto`를 반환한다. | seed/mock evidence copy 중 DB seed에 없는 설명성 항목. | `SignalEventDto`, 이후 score snapshot/detail evidence DTO. | notFound, DB unavailable, seed/mock-only source notice. | source/evidence rows와 related action links가 390px에서 두 줄로 안정적으로 접혀야 한다. |
| Feed `app/invest-model/feed/page.tsx` | `GET /api/feed`, `GET /api/feed/rankings`를 호출한다. | `feedCopy.posts` fallback, summary metric copy, action icons가 아직 상세/읽음/저장/댓글 흐름과 완전히 결합되지 않은 부분. | `FeedPostDto[]`, `FeedPostRankingDto[]`; BK-273 이후 category query DTO, BK-278 이후 action state DTO. | loading, empty per category, error fallback, ranking empty. | 상단 설명 제거 작업(BK-272) 후 첫 화면에서 FeedPost list가 바로 보여야 한다. |
| Feed Detail `app/invest-model/feed/[postId]/page.tsx` | `GET /api/feed/[postId]`가 detail/comment/user state DTO를 반환한다. | 세부 copy와 일부 action label은 유지 가능하지만 카드에서 detail action으로 이어지는 흐름은 BK-278에서 연결 필요. | `FeedPostDetailDto`, comment/reply/like/save/read API DTO. | notFound, comment empty, action pending/error, user state unavailable. | 본문, 댓글, action bar가 bottom nav와 겹치지 않아야 한다. |
| Portfolio `app/invest-model/portfolio/page.tsx` | `GET /api/portfolio/mock-summary`가 `InvestModelPortfolioSummary`를 반환한다. | 상단 simulation box와 `timeline`/checkpoint mock text가 dashboard 전용 구조로 남아 있다. | `InvestModelPortfolioSummary`; BK-280에서 `PortfolioAnalysisTimelineDto` 또는 timeline read model 추가. | loading, empty portfolio, error, mock-only/financial-operation boundary. | 상단 box 제거 후 금액, 선택 모델, timeline rows가 첫 viewport에서 과밀하지 않아야 한다. |

## 우선 제거 순서

1. BK-272: Feed 상단 설명/요약 박스를 제거해 DB FeedPost list를 첫 화면에 올린다.
2. BK-264: Signals filter를 URL/searchParams와 DB query 기준으로 고정한다.
3. BK-262: Top search button을 `/invest-model/search` 흐름으로 연결하고 검색 결과 empty/error 상태를 통일한다.
4. BK-279/BK-280: Portfolio 상단 simulation box를 dashboard 구조로 바꾸고 timeline read model을 분리한다.
5. BK-284/BK-285: Models 검색/필터와 상세 관련 콘텐츠를 DB 관계로 확장한다.

## 남겨도 되는 하드코딩

- locale별 label, section title, accessibility label, legal/safety boundary copy.
- smoke test fixture를 위한 route 목록과 기대 문구.
- DB unavailable 상태에서만 보이는 mock-safe fallback data.

## 금지

- 화면에서 `@/lib/db/**` 또는 DB schema 타입을 직접 import하지 않는다.
- `MockDeposit`을 실제 잔고처럼 이름 붙이거나 입금/출금 CTA로 연결하지 않는다.
- `SignalEvent`를 매수, 매도, 보유 추천으로 표현하지 않는다.
- `TradeIntent`를 주문, 체결, broker API 호출로 연결하지 않는다.
