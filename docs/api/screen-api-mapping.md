<!--
이 문서는 investModel 모바일 화면과 API/DTO/mock fallback의 연결을 정의한다.
프론트엔드가 화면별 필요한 데이터를 알 수 있게 하고, 백엔드가 어떤 route와 DTO를 우선 구현해야 하는지 판단하는 기준이다.
-->

# Screen API Mapping

이 문서는 Figma 초기 모바일 구조와 현재 `/invest-model` 화면을 `docs/api/route-inventory.md`, `docs/api/dto-contract.md`, `docs/api/auth-error-response-rules.md`에 연결한다. 초기 구현은 모바일 웹/PWA 기준이며, 모든 금액/성과/주문 유사 데이터는 mock, simulated, backtest, placeholder, informational context를 유지한다.

## Mapping Rules

- 화면 컴포넌트는 DB row shape에 직접 의존하지 않고 DTO 또는 mock view data를 사용한다.
- API가 아직 구현되지 않은 화면은 `lib/mock/**` fallback을 우선 사용한다.
- mock fallback은 실제 API 응답과 같은 DTO 이름과 의미를 유지해야 한다.
- `TradeIntent`는 실제 주문이 아니라 pre-order simulation으로만 표시한다.
- `MockDeposit`은 실제 입금, 결제, 계좌 잔고가 아니라 개발용 가상 상태로만 표시한다.
- legal/financial/security blocked 상태는 일반 validation error처럼 보이지 않게 `policy_blocked` 또는 `review_required`로 표시한다.

## Primary Mobile Screens

| Screen | Route | Primary API | DTO | Current fallback | Auth level | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Home / My AI Investment | `/invest-model` | `GET /api/portfolio/mock-summary`; `GET /api/signals?limit=3`; `GET /api/feed?limit=2` | `PortfolioSummaryDto`; `SignalEventDto[]`; `FeedPostDto[]` | `lib/mock/invest-model-home.ts`; `lib/mock/invest-model-signals.ts`; `lib/mock/invest-model-feed.ts` | `user` for portfolio, signed-in for signals/feed | mock balance, selected model, recent signals, recent feed only. No real account balance. |
| Discover Models | `/invest-model/models` | `GET /api/models` | `ModelCardDto[]` | `lib/mock/invest-model-discovery.ts` | `public` or signed-in | only approved/live models; pending_review excluded. |
| Realtime Signals | `/invest-model/signals` | `GET /api/signals` | `SignalEventDto[]` | `lib/mock/invest-model-signals.ts` | signed-in | observed inputs only; no recommendation/order language. |
| Signal Detail | `/invest-model/signals/[signalId]` | future `GET /api/signals/:signalId` | future `SignalDetailDto` from `BK-298` | `SignalEventDto` list item plus future detail mock | signed-in | route param uses public id only; observed context only; no buy/sell/hold advice. |
| Model Detail | `/invest-model/models/[modelId]` | `GET /api/models/:id`; `POST /api/model-selections` after acknowledgement | `ModelDetailDto`; `ModelSelectionDto` | detail data derived from `lib/mock/invest-model-discovery.ts` and page-local copy | public or signed-in for detail; `user` for selection | selection stores model version only, not user allocation preferences. |
| Feed Insights | `/invest-model/feed` | `GET /api/feed` | `FeedPostDto[]` | `lib/mock/invest-model-feed.ts` | signed-in | informational model/market/review notes only. |
| Feed Detail | `/invest-model/feed/[postId]` | future `GET /api/feed/:postId` | future `FeedPostDetailDto` from `BK-299` | `FeedPostDto` list item plus future detail mock | signed-in | route param uses public id only; informational content only; comments/actions are separate contracts. |

## Supporting Screens

| Screen | Route | Primary API | DTO | Current fallback | Auth level | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Creator Model Draft | `/invest-model/creator/models/new` | `POST /api/creator/models` | `InvestmentModelDraftDto` | form-local request state plus draft API helper | `creator` | metadata-only draft; no uploaded model execution. |
| Admin Review Queue | `/invest-model/admin/reviews` | future `GET /api/admin/model-reviews` | `ComplianceReviewDto[]` or review queue DTO | `lib/mock/invest-model-admin-review.ts` | `admin` | read-only queue until full RBAC/audit guard exists. |
| Admin Review Detail | `/invest-model/admin/reviews/[reviewId]` | future `GET /api/admin/model-reviews/:reviewId`; `POST /api/admin/models/:id/reviews` | `ComplianceReviewDto`; `ApiSuccessDto<ComplianceReviewDto>` | `lib/mock/invest-model-admin-review.ts` | `admin` | approval/reject action must audit and must not be Codex legal judgment. |
| Admin Reports | `/invest-model/admin/reports` | future `GET /api/admin/reports`; future `POST /api/admin/reports/:id/actions` | report queue DTO; action result DTO | `lib/mock/invest-model-admin-report.ts` | `admin` | report actions may pause/hide mock records only until policy gates are implemented. |

## Screen Details

### Home / My AI Investment

Data needs:

- selected model name, risk badge, version reference
- mock balance and simulated market value
- current simulated allocation or sample positions
- recent observed `SignalEventDto` rows
- recent informational `FeedPostDto` rows
- `PolicyNoticeDto[]` for mock-only and no-live-trading boundaries

API sequence:

1. `GET /api/portfolio/mock-summary`
2. `GET /api/signals?limit=3`
3. `GET /api/feed?limit=2`

Fallback:

- Use `lib/mock/invest-model-home.ts` for portfolio summary.
- Use signal/feed mocks when API is unavailable.
- Empty state should explain that this is a mock/simulated portfolio, not a real account.

### Discover Models

Data needs:

- `ModelCardDto[]`
- filter state for market, asset class, risk level, and strategy tags
- review/live status and backtest placeholder labels

API sequence:

1. `GET /api/models`
2. Optional query params later: `market`, `riskLevel`, `assetClass`, `cursor`

Fallback:

- Use `lib/mock/invest-model-discovery.ts`.
- Apply `approved`/`live` filtering before rendering.
- Do not expose `draft`, `pending_review`, `suspended`, or `retired` models in public discovery.

### Realtime Signals

Data needs:

- `SignalEventDto[]`
- signal score, source label, linked model, captured time
- policy notices that signals are observed inputs only

API sequence:

1. `GET /api/signals`
2. Optional query params later: `modelId`, `signalType`, `since`, `cursor`

Fallback:

- Use `lib/mock/invest-model-signals.ts`.
- Hide or neutralize language that sounds like direct buy/sell advice.
- Never generate a live `TradeIntent` from this screen.

### Signal Detail

Route contract:

- Screen route: `/invest-model/signals/[signalId]`.
- `signalId` is the `SignalEventDto.signalPublicId` or a stable URL-safe alias that resolves to the same public record.
- Do not use internal numeric database ids in links, route params, API requests, logs shown to users, or test fixtures.
- Links from the Signals list must preserve locale query state with `?lang=ko` or `?lang=en` when present.
- If a SignalEvent is missing, hidden, retired from display, or not visible to the actor, render an unavailable/not-found state and do not reveal whether a private record exists.
- The page must label the record as observed/mock or observed-placeholder context. It must not include buy, sell, hold, rebalance, order, execution, broker, or TradeIntent creation copy.

Data needs:

- signal headline, source type, score display, captured time, linked model name
- source attribution and observed input summary
- future score history and score breakdown from `BK-298`
- policy notices that this is observed context, not an investment recommendation

API sequence:

1. Future `GET /api/signals/:signalId`
2. Optional related context later: score snapshots, linked feed posts, linked model detail

Fallback:

- Until `SignalDetailDto` exists, detail links may use the list `SignalEventDto` record and a safe placeholder detail section.
- Empty/unavailable state should keep the bottom tab shell and safe-area spacing intact on 390px mobile.

### Model Detail

Data needs:

- `ModelDetailDto`
- mandate: allowed markets, asset classes, forbidden assets, leverage policy, rebalance policy
- disclosures and performance context
- risk acknowledgement state for high-risk models
- model selection result after POST

API sequence:

1. `GET /api/models/:id`
2. If user confirms required risk notices: `POST /api/model-selections`

Fallback:

- Use model detail mock derived from discovery data and page-local detail copy.
- Selection action can remain disabled or mock-safe until backend persistence is ready.
- If model is not public-safe, show `404 not_found` style unavailable state rather than exposing hidden status.

### Feed Insights

Data needs:

- `FeedPostDto[]`
- linked model, author label, post type, tags, informational body
- `PolicyNoticeDto[]` for no guaranteed return and no financial advice

API sequence:

1. `GET /api/feed`
2. Optional query params later: `postType`, `modelId`, `cursor`

Fallback:

- Use `lib/mock/invest-model-feed.ts`.
- Legal/financial placeholder copy must remain visibly review-bound.
- Feed posts must not encourage a securities transaction.

### Feed Detail

Route contract:

- Screen route: `/invest-model/feed/[postId]`.
- `postId` is the `FeedPostDto.postPublicId` or a stable URL-safe alias that resolves to the same public record.
- Do not use internal numeric database ids in links, route params, API requests, logs shown to users, or test fixtures.
- Links from the Feed list must preserve locale query state with `?lang=ko` or `?lang=en` when present.
- If a FeedPost is missing, hidden, unpublished, admin-only, or not visible to the actor, render an unavailable/not-found state and do not reveal whether a private record exists.
- The page must label the record as informational/mock or informational-placeholder content. It must not include guaranteed return, trading encouragement, suitability, legal approval, order, execution, or broker copy.

Data needs:

- post title, body, type, tags, author/display source, published time
- linked InvestmentModel and related SignalEvent references when available
- future comment tree, reaction state, bookmark state, read state, and ranking context from `BK-299`/`BK-302`
- policy notices that this is informational commentary, not investment advice

API sequence:

1. Future `GET /api/feed/:postId`
2. Future action APIs for comments, reactions, bookmarks, and reads remain separate from this screen route contract.

Fallback:

- Until `FeedPostDetailDto` exists, detail links may use the list `FeedPostDto` record and a safe placeholder detail section.
- Empty/unavailable state should keep the bottom tab shell and safe-area spacing intact on 390px mobile.

## Public Id And Detail Link Rules

These rules apply to Signal and Feed detail routes before list cards become links:

- `SignalEventDto.signalPublicId` and `FeedPostDto.postPublicId` are the canonical route identifiers for MVP detail pages.
- Any future slug may be added only as a presentation alias; the API and DB mapping still resolve through the public id.
- List cards should use `<Link>` for the primary row/title area, not nested interactive controls inside the same tap target.
- Filter chips, like/save/comment buttons, and other row actions must remain separate controls with their own labels and focus state.
- `withInvestModelLocale` or an equivalent helper should be used so locale is not lost during navigation.
- Missing or unauthorized records use the same not-found style. Private/admin-only existence must not be disclosed to normal users.
- Detail pages must include a visible mock/informational/observed safety label before any score, performance-like, or market commentary section.

## API Priority From Screens

| Priority | API | Why |
| --- | --- | --- |
| 1 | `GET /api/models` | Powers Discover Models and model navigation. |
| 2 | `GET /api/models/:id` | Powers Model Detail and risk/mandate review before selection. |
| 3 | `GET /api/portfolio/mock-summary` | Powers Home and future Portfolio, but must stay mock-only. |
| 4 | `GET /api/signals` | Powers Home preview and Realtime Signals. |
| 5 | `GET /api/feed` | Powers Home preview and Feed Insights. |
| 6 | `POST /api/model-selections` | Enables explicit model version selection after risk acknowledgement. |
| 7 | `POST /api/creator/models` | Supports creator flow after RBAC/audit guard is stable. |
| 8 | `POST /api/admin/models/:id/reviews` | Supports admin review after RBAC/audit guard is stable. |

## Error UI Mapping

| Error code | Screen treatment |
| --- | --- |
| `unauthenticated` | show sign-in required state for signed-in/user/creator/admin screens |
| `forbidden` | show role permission message; do not show raw policy internals |
| `not_found` | show unavailable state; do not reveal hidden draft/private resource existence |
| `policy_blocked` | show safety boundary message such as "MVP에서 실제 금융 동작은 사용할 수 없습니다." |
| `review_required` | show review-needed message and disable action until approved |
| `validation_error` | show field-level messages in forms |

## Follow-Up Tasks

- `BK-133`: convert mock documents/data into reusable loader modules so this mapping can share one fallback source.
- `BK-136`: define import alias and barrel export rules for DTO/mock/screen boundaries.
- `BK-137`: document UI component dependency boundaries so screens do not import DB or ORM shapes.
- `BK-141`: implement API guard helpers using the auth/error contract from `BK-127`.
