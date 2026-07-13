<!--
이 문서는 investModel의 UI 컴포넌트가 도메인 타입, DTO, ViewModel과 어떤 경계로 연결되는지 정의하는 아키텍처 보조 문서입니다.
처음 보는 개발자도 components/invest-model이 DB row, ORM, API route 내부 구현에 묶이지 않도록 판단할 수 있어야 합니다.
-->

# UI 컴포넌트와 도메인 경계

## 목적

`BK-137`의 결정 사항으로, `components/invest-model`이 어떤 데이터 shape에 의존할 수 있고 어떤 내부 구현을 몰라야 하는지 정한다. 목표는 모바일 PWA UI가 빠르게 커져도 DB row, ORM, API route, mock fixture에 직접 묶이지 않게 하는 것이다.

이 문서는 아래 기준을 따른다.

- `harness/frontend-harness.md`
- `harness/backend-harness.md`
- `docs/architecture/folder-structure.md`
- `docs/architecture/import-barrel-rules.md`
- `docs/api/dto-contract.md`

## 핵심 원칙

`components/invest-model`은 화면 표시 컴포넌트 계층이다. 이 계층은 투자 모델을 보여주고, 모바일 safe area와 하단 탭을 유지하고, risk/mock/simulated 상태를 명확히 표현한다.

이 계층은 데이터 저장 방식이나 조회 방식을 소유하지 않는다.

허용되는 의존성은 다음과 같다.

- React, Next.js UI primitive, icon, styling helper
- `lib/design`의 디자인 토큰
- `lib/i18n/invest-model`의 화면 문구와 locale helper
- `lib/domain`의 안정화된 type만 필요한 경우
- API DTO 또는 화면 전용 ViewModel type

금지되는 의존성은 다음과 같다.

- `lib/db/**`
- ORM model, SQL row, migration schema
- `app/api/**`
- raw mock fixture 또는 internal seed
- secret, brokerage, bank, payment, external paid API client

## 데이터 흐름

권장 데이터 흐름은 아래와 같다.

```text
DB row or mock fixture
  -> mapper
  -> API DTO
  -> page or screen container
  -> ViewModel or primitive props
  -> components/invest-model UI component
```

초기 MVP에서는 DB 대신 mock fixture가 출발점이 될 수 있다. 그래도 UI 컴포넌트는 fixture 파일을 직접 import하지 않고 page 또는 screen container에서 props로 받는다.

## 컴포넌트 종류별 경계

### Shell 컴포넌트

예: `MobileShell`, `BottomNav`

Shell 컴포넌트는 navigation, safe area, locale, header, 하단 탭을 소유한다. domain type이나 DTO를 직접 알 필요가 없다.

허용 props:

- `activeTab`
- `title`
- `eyebrow`
- `locale`
- `currentPath`
- `children`

금지 props:

- DB id
- user account row
- model row
- authorization policy object
- server-only session object

### Reusable UI 컴포넌트

예: `RiskBadge`, `SectionHeader`, `SoftBanner`, `MetricCard`

Reusable UI 컴포넌트는 label, tone, display text처럼 이미 표시용으로 정리된 값을 받는다. domain enum을 직접 받아도 되는 경우는 UI tone과 1:1로 안정화된 값뿐이다.

권장 props:

```ts
type RiskBadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "low" | "medium" | "high" | "blocked";
};
```

피해야 할 props:

```ts
type RiskBadgeProps = {
  model_risk_profile_id: number;
  modelVersionRow: unknown;
  rawRiskScore: string;
};
```

### Model 카드와 상세 컴포넌트

예: `ModelCard`, `InvestmentModelCard`, `InvestmentModelDetail`

이 컴포넌트들은 모델 설명, 시장, 위험, 성과, mandate, disclosure label을 표시한다. DB row가 아니라 `ModelCardDto`, `ModelDetailDto`, 또는 화면 전용 ViewModel에서 뽑은 primitive props를 받는다.

권장 props:

- `name`
- `summary`
- `marketLabel`
- `riskLabel`
- `riskTone`
- `statusLabel`
- `statusTone`
- `performanceLabel`
- `mandateLabel`
- `leverageLabel`
- `disclosureLabel`

금지 props:

- `investment_models.id`
- `model_versions.id`
- `model_risk_profiles` row 전체
- `portfolio_mandates` row 전체
- `created_by_user_id`
- `approved_by_admin_id`
- SQL timestamp object

DB row의 snake_case 필드는 UI props에 들어오기 전에 mapper에서 camelCase DTO 또는 display label로 변환한다.

## DTO와 ViewModel 기준

DTO는 API boundary의 계약이다. ViewModel은 특정 화면에 맞게 DTO를 표시용으로 재구성한 값이다.

사용 기준은 다음과 같다.

- `app/api/**`는 DB row 또는 mock fixture를 DTO로 변환한다.
- `app/invest-model/**` page는 DTO를 받아 화면 단위 ViewModel 또는 primitive props로 나눈다.
- `components/invest-model/**`는 ViewModel 또는 primitive props를 렌더링한다.

ViewModel 이름은 화면 맥락을 드러낸다.

```ts
type ModelCardViewModel = {
  name: string;
  summary: string;
  marketLabel: string;
  riskLabel: string;
  riskTone: "neutral" | "low" | "medium" | "high" | "blocked";
  statusLabel: string;
  performanceLabel: string;
};
```

DTO를 컴포넌트 props로 바로 받는 것은 리스트 item처럼 화면과 DTO가 거의 1:1인 경우에만 허용한다. 이 경우에도 컴포넌트 내부에서 DB 이름을 추측하거나 API route를 호출하지 않는다.

## Mock 데이터 사용 기준

`components/invest-model`은 raw mock fixture를 직접 import하지 않는다.

허용되는 구조:

```text
lib/mock/models
  -> getMockModelCards()
  -> app/invest-model/models/page.tsx
  -> <ModelCard ... />
```

피해야 할 구조:

```text
components/invest-model/model-card.tsx
  -> import { modelFixtures } from "@/lib/mock/models/fixtures"
```

예외는 demo-only 또는 story/test 전용 파일이다. 그 경우 파일명 또는 폴더명에 `demo`, `story`, `test`를 명시하고 production route에서 import하지 않는다.

## 금지 문구와 금융 경계

UI props와 displayed copy는 실제 금융 행위처럼 보이면 안 된다.

금지되는 이름과 문구:

- `Deposit` 단독 표기
- `Balance` 단독 표기
- `Order`
- `Execution`
- `Fill`
- `Settlement`
- `BrokerageAccount`
- `guaranteed return`
- `personalized advice`

허용되는 이름과 문구:

- `MockDeposit`
- `mockBalance`
- `simulatedMarketValue`
- `TradeIntent`
- `pre-order simulation`
- `backtest`
- `placeholder`
- `requiresLegalReview`

컴포넌트는 `mock`, `simulated`, `placeholder`, `backtest` 맥락을 숨기지 않는다. 성과 수익률은 변동성, drawdown, 출처 label과 함께 표시한다.

## Server/Client Boundary

`components/invest-model`의 컴포넌트는 기본적으로 표시 계층이다. client interaction이 필요한 경우에도 server-only 객체를 props로 넘기지 않는다.

금지:

- server session 객체 전달
- DB client 전달
- payment 또는 brokerage client 전달
- API route handler import

허용:

- 선택 버튼 disabled 여부
- policy notice label
- route href
- callback이 필요한 경우 명확한 UI action callback

## 리뷰 체크리스트

새 UI 컴포넌트 또는 props를 추가할 때 아래를 확인한다.

- props가 DB row shape나 snake_case column name에 묶이지 않았는가?
- 컴포넌트가 `lib/db`, `app/api`, raw mock fixture를 import하지 않는가?
- domain type import가 필요한 경우 `import type`을 사용했는가?
- model risk, mandate, disclosure가 사용자 편집 투자성향처럼 보이지 않는가?
- mock/simulated/backtest/placeholder 맥락이 화면에서 숨겨지지 않는가?
- 실제 입금, 실제 주문, 계좌 연결, 법률 판단을 암시하는 prop 또는 copy가 없는가?
- 390px 모바일 화면에서 label이 카드나 버튼 밖으로 밀려나지 않는가?

## 후속 작업

이 문서는 `BK-141`의 API guard 설계와 이후 UI 구현 작업의 리뷰 기준으로 사용한다. 자동 검사까지는 `BK-137`의 이 문서와 `docs/architecture/import-barrel-rules.md`를 작업 전 확인 기준으로 삼는다.
