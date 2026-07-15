<!--
이 문서는 investModel mock seed와 data loader 구조를 정의한다.
프론트 화면, API route, 테스트, 미래 DB seed가 같은 mock 원천을 재사용하게 하고
실제 금융 데이터나 외부 API와 섞이지 않도록 경계를 고정한다.
-->

# Mock Seed And Data Loader Strategy

이 문서는 현재 `lib/mock/*.ts` 파일을 향후 도메인별 fixture/loader/DTO mapper 구조로 정리하기 위한 기준이다. 당장 큰 파일 이동은 하지 않고, 새 mock 데이터나 API route가 생길 때 아래 구조를 따른다.

관련 문서:

- `docs/mock-data/mock-data-policy.md`
- `docs/mock-data/model-catalog.md`
- `docs/mock-data/portfolio-deposit-data.md`
- `docs/mock-data/signal-feed-data.md`
- `docs/mock-data/mock-seed-parity-contract.md`
- `docs/api/dto-contract.md`
- `docs/api/screen-api-mapping.md`
- `docs/architecture/folder-structure.md`

## Goals

- 화면, API, 테스트가 mock 데이터를 중복 복붙하지 않는다.
- mock 데이터가 DTO와 DB seed 전환 경로를 동시에 만족한다.
- money-like, performance-like, trade-like 값의 mock/simulated/backtest context를 유지한다.
- 실제 입금, 실제 주문, 브로커 계좌, 외부 유료 API, 비밀값을 mock loader 안으로 들이지 않는다.
- 나중에 DB-backed route로 바꿀 때 화면 컴포넌트 변경을 최소화한다.

## Current Files

| Current file | Current role | Target domain folder | First loader name |
| --- | --- | --- | --- |
| `lib/mock/invest-model-discovery.ts` | Discover Models card data | `lib/mock/models` | `getMockModelCards` |
| `lib/mock/invest-model-model-detail.ts` | Model Detail page data | `lib/mock/models` | `getMockModelDetail` |
| `lib/mock/invest-model-home.ts` | Home portfolio-like data | `lib/mock/portfolio` | `getMockPortfolioSummary` |
| `lib/mock/invest-model-signals.ts` | Realtime signal data | `lib/mock/signals` | `getMockSignalEvents` |
| `lib/mock/invest-model-feed.ts` | Feed post data | `lib/mock/feed` | `getMockFeedPosts` |
| `lib/mock/invest-model-admin-review.ts` | Admin review queue/detail data | `lib/mock/admin` | `getMockAdminReviewQueue` |
| `lib/mock/invest-model-admin-report.ts` | Admin report queue data | `lib/mock/admin` | `getMockAdminReports` |

## Target Folder Structure

Use this structure when mock files are next touched or split:

```text
lib/mock/
  models/
    fixtures.ts
    loaders.ts
    mappers.ts
    index.ts
  portfolio/
    fixtures.ts
    loaders.ts
    mappers.ts
    index.ts
  signals/
    fixtures.ts
    loaders.ts
    mappers.ts
    index.ts
  feed/
    fixtures.ts
    loaders.ts
    mappers.ts
    index.ts
  admin/
    fixtures.ts
    loaders.ts
    mappers.ts
    index.ts
  index.ts
```

### File Roles

| File | Owns | Must not own |
| --- | --- | --- |
| `fixtures.ts` | deterministic seed rows with public ids and mock context | filtering by current user, API response headers, DB client calls |
| `loaders.ts` | read/query helpers for screens, API routes, and tests | React rendering, external network calls, secret access |
| `mappers.ts` | fixture-to-DTO or fixture-to-seed mapping helpers | database writes, route auth decisions |
| `index.ts` | public exports for the domain mock module | cross-domain business logic |

## Loader Rules

Loaders should be pure and deterministic.

```ts
type MockLoaderContext = {
  locale?: "ko" | "en";
  now?: string;
  userPublicId?: string;
  scenario?: "default" | "empty" | "high_risk" | "policy_blocked";
};
```

Rules:

- `now` is injectable so tests do not depend on current time.
- `userPublicId` may filter mock user-owned data but must not create real auth logic.
- `scenario` may select empty/error/policy examples for QA.
- Loaders return DTO-like data, not raw DB rows.
- Loaders never call `fetch`, DB clients, payment providers, brokerage providers, or paid market data clients.

## Mapper Rules

Use explicit mapper names:

| Mapper | Purpose |
| --- | --- |
| `toModelCardDto` | model fixture -> `ModelCardDto` |
| `toModelDetailDto` | model fixture -> `ModelDetailDto` |
| `toPortfolioSummaryDto` | portfolio fixtures -> `PortfolioSummaryDto` |
| `toSignalEventDto` | signal fixture -> `SignalEventDto` |
| `toFeedPostDto` | feed fixture -> `FeedPostDto` |
| `toAdminReviewDto` | admin review fixture -> review queue/detail DTO |
| `toDbSeedRows` | fixture -> future MySQL seed rows |

Mapper constraints:

- Public ids remain public ids; no UI/API mapper should expose internal numeric DB ids.
- Decimal and money-like values stay string-based where DTO contracts require it.
- `PolicyNoticeDto[]` is preserved when data crosses from fixture to DTO.
- `TradeIntent` stays `pre_order_simulation`, never `order`, `execution`, `fill`, or `settlement`.
- `MockDeposit` stays `mock` or `simulated`, never real cash, bank balance, or broker balance.

## API Route Usage

Initial API route implementation should use loaders in this order:

```text
request parsing
auth/RBAC guard
mock loader call
DTO mapper
ApiSuccessDto response
```

Example:

```ts
const models = getMockModelCards({ locale, scenario: "default" });
return success(models, { dataContext: "mock" });
```

When DB-backed routes are introduced, replace only the loader internals:

```text
DB query -> DB row mapper -> same DTO -> same screen
```

Screens should not know whether data came from mock fixtures or DB-backed routes.

## DB Seed Usage

Future DB seed scripts may import fixture-to-seed mappers only from `mappers.ts`.

Allowed:

- deterministic model catalog rows
- deterministic risk/disclosure placeholder rows
- deterministic mock portfolio rows for local demos
- deterministic signal/feed rows with placeholder context

Blocked:

- real customer data
- live market/news fetches
- real account balances
- broker orders or fills
- secrets or external API keys

## Scenario Fixtures

Use scenarios for QA instead of editing core fixtures repeatedly.

| Scenario | Purpose |
| --- | --- |
| `default` | normal mobile screen population |
| `empty` | empty list/empty portfolio states |
| `high_risk` | high-risk model warning and acknowledgement UI |
| `policy_blocked` | disabled actual financial operation or review-required state |

Scenario data must still obey the same safety naming rules.

## Migration Plan

1. Keep current `lib/mock/invest-model-*.ts` files working.
2. When a mock file is next edited, move only that domain into the target folder structure.
3. Add domain-level `index.ts` for stable imports.
4. Update screens/API routes to import loaders rather than raw arrays.
5. Add smoke tests for loader purity and forbidden field names.
6. Add DB seed mappers only after MySQL schema and seed flow are stable.

## Verification Checklist

Before marking a loader change done:

- `rg` confirms no forbidden terms such as `realBalance`, `brokerAccount`, `orderExecution`, `tradeFill`.
- `tsc --noEmit` passes when TypeScript files changed.
- Any API route using loaders still returns DTO-shaped data.
- Mock data still includes mock/simulated/backtest/placeholder context.
- Public discovery excludes non-live or non-approved models.
- UI code imports loaders or DTO-shaped data, not DB seed rows.

## Follow-Up Tasks

- `BK-136`: decide barrel export and import alias rules before adding many `index.ts` files.
- `BK-137`: document UI component dependency boundaries so components do not depend on DB seed rows.
- `BK-141`: API guards should run before calling loaders for user/creator/admin routes.
