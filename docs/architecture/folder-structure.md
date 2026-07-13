<!--
이 문서는 investModel 프로젝트의 폴더 구조와 import 경계를 고정한다.
AI 작업자는 새 코드나 문서를 만들기 전에 이 기준을 확인해 도메인, mock, UI, API 책임이 흩어지지 않게 해야 한다.
-->

# Folder Structure

## Purpose

이 구조 결정은 스타터 코드 위에 investModel 도메인을 얹을 때 파일 위치와 책임을 흔들리지 않게 하기 위한 기준이다. 초기 구현은 모바일 PWA와 mock 데이터 중심이며, 실제 입금, 실제 주문, 실제 계좌 연결, 외부 유료 API는 포함하지 않는다.

## Current Root Boundaries

| Path | Role | Rule |
| --- | --- | --- |
| `app/invest-model` | 모바일 PWA 화면 라우트 | 화면 조립만 담당한다. DB row나 ORM 세부사항을 직접 import하지 않는다. |
| `components/invest-model` | investModel 전용 UI 컴포넌트 | `MobileShell`, 공통 카드, 화면 단위 UI 조각을 둔다. 도메인 로직을 실행하지 않는다. |
| `lib/domain` | canonical domain type과 상태 이름 | `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `TradeIntent`, `MockDeposit`, `SignalEvent` 같은 이름의 기준점이다. |
| `lib/mock` | 화면/API 개발용 mock fixture | 실제 자산처럼 보이는 이름을 피하고 `mock`, `simulated`, `placeholder` 문맥을 유지한다. |
| `lib/design` | 모바일 디자인 토큰 | 색상, 간격, safe area, 모바일 chrome 값을 코드에서 재사용한다. |
| `lib/db` | 기존 스타터 DB/마이그레이션 | 현재 스타터 구조를 보존한다. investModel MySQL 전환 기준은 `docs/database`를 우선한다. |
| `docs` | 제품/도메인/API/DB/mock 결정 문서 | 구현 전에 합의된 기준을 기록한다. |
| `harness` | 수정 가능한 프로젝트 하네스 | 작업 방향 원칙을 둔다. 빈칸이 필요한 영역은 임의 작성하지 않고 placeholder로 둔다. |

## Target Domain Folders

`BK-135`에서 skeleton을 만들 때 아래 구조를 우선한다.

```text
lib/domain/
  models/
  portfolio/
  signals/
  feed/
  compliance/
  audit/
  index.ts
```

각 폴더의 책임은 다음과 같다.

| Folder | Owns | Must not own |
| --- | --- | --- |
| `lib/domain/models` | `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, model status | React component, DB query, external API call |
| `lib/domain/portfolio` | `MockDeposit`, `PortfolioSnapshot`, `PositionSnapshot`, `TradeIntent` status | real deposit, brokerage order, account connection |
| `lib/domain/signals` | `SignalEvent`, signal type, source/data context | buy/sell/hold recommendation |
| `lib/domain/feed` | `FeedPost`, disclosure/review post type | legal approval decision |
| `lib/domain/compliance` | review state, blocked reason, risk notice labels | final legal judgment |
| `lib/domain/audit` | audit action names and actor/resource labels | UI rendering |

## Target Mock Folders

`BK-133`에서 loader 구조를 만들 때 아래 구조를 우선한다.

```text
lib/mock/
  models/
  portfolio/
  signals/
  feed/
  index.ts
```

초기에는 화면별 파일을 그대로 둘 수 있다. 단, 새 mock 데이터가 늘어나면 도메인별 fixture로 이동하고 화면 파일은 조립만 담당한다.

| Folder | Owns | Notes |
| --- | --- | --- |
| `lib/mock/models` | model catalog fixture | `docs/mock-data/model-catalog.md`와 맞춘다. |
| `lib/mock/portfolio` | mock deposit, selected model, simulated portfolio | 실제 예치금/보유 자산처럼 보이는 이름을 금지한다. |
| `lib/mock/signals` | signal event fixture | `TradeIntent`를 생성하지 않는다. |
| `lib/mock/feed` | feed post fixture | 투자 조언/수익 보장 문구를 넣지 않는다. |

## Component Boundaries

`components/invest-model`은 화면에 가까운 UI만 가진다.

- `mobile-shell.tsx`: 모바일 앱 chrome, safe area, 하단 탭
- `ui.tsx`: 반복 카드, 섹션, badge 등 작은 investModel 전용 UI
- 향후 screen component가 필요하면 `components/invest-model/screens`를 만든다.
- 범용 디자인 시스템으로 승격할 때만 `components/ui`로 옮긴다.

UI 컴포넌트는 DTO 또는 ViewModel shape에 의존할 수 있지만 DB row shape에 직접 의존하지 않는다.

## API And Server Boundaries

API route가 생기면 아래 구조를 우선한다.

```text
app/api/
  models/
  signals/
  feed/
  model-selections/
```

API route는 다음 순서를 따른다.

1. request parsing
2. auth/RBAC guard
3. domain service or mock loader call
4. DTO mapping
5. response with data source context

초기 mock route는 `lib/mock`을 읽을 수 있다. 실제 DB 전환 시 route가 DB row를 그대로 반환하지 않고 DTO mapper를 거치도록 한다.

## Import Direction

허용 방향:

```text
app -> components -> lib/domain
app -> lib/mock -> lib/domain
app/api -> lib/mock or future service -> lib/domain
```

금지 방향:

```text
lib/domain -> app
lib/domain -> components
lib/domain -> lib/mock
components -> lib/db
components -> app/api
```

## Naming Rules

- 화면 route 폴더는 Next.js 관례에 맞춰 kebab-case를 사용한다.
- React component는 `PascalCase`를 사용한다.
- 도메인 타입은 `domain-contract-harness.md`의 canonical term을 우선한다.
- DTO는 `ModelCardDto`, `ModelDetailDto`, `SignalEventDto`, `FeedPostDto`처럼 `Dto` 접미사를 사용한다.
- 실제 금융 동작처럼 보이는 `Deposit`, `Order`, `Balance` 단독 이름은 초기 MVP에서 피하고 `MockDeposit`, `TradeIntent`, `mockBalance`처럼 문맥을 명시한다.

## Next Work

- `BK-135`: 위 구조에 맞춘 domain skeleton 또는 README를 만든다.
- `BK-133`: mock fixture를 도메인별 loader로 정리한다.
- `BK-136`: barrel export와 import alias 규칙을 별도 문서로 확정한다.
- `BK-137`: UI 컴포넌트와 DTO/ViewModel 경계를 별도 문서로 확정한다.
