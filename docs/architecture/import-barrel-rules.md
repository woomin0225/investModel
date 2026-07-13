<!--
이 문서는 investModel 코드베이스에서 import alias와 barrel export를 언제 쓰고 피할지 정하는 아키텍처 하네스 보조 문서입니다.
처음 보는 개발자도 public/internal export 경계, 순환 참조 방지 방향, 도메인 용어 일관성을 확인할 수 있어야 합니다.
-->

# Import Alias와 Barrel 규칙

## 목적

`BK-136`의 결정 사항으로, `lib/domain`, `lib/mock`, `components/invest-model`, `app/api` 사이의 import 방향과 barrel export 기준을 고정한다. 목표는 클래스, 인터페이스, mock 데이터, 화면 컴포넌트가 커질 때 경계가 흐려지지 않게 하고 순환 참조를 예방하는 것이다.

이 문서는 `harness/naming-harness.md`, `harness/frontend-harness.md`, `harness/backend-harness.md`, `docs/architecture/folder-structure.md`를 따른다.

## Alias 원칙

현재는 `tsconfig.json`의 `@/*` alias만 사용한다.

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

`@domain/*`, `@mock/*`, `@components/*` 같은 세부 alias는 아직 추가하지 않는다. 폴더 경계가 실제로 커지고 import 경로 반복이 생산성을 떨어뜨릴 때 별도 체크리스트로 검토한다.

권장 예시는 다음과 같다.

```ts
import { MobileAppShell } from "@/components/invest-model/mobile-app-shell";
import type { InvestmentModel } from "@/lib/domain/models";
import { getMockInvestmentModels } from "@/lib/mock/models";
```

금지 예시는 다음과 같다.

```ts
import type { InvestmentModel } from "@domain/models";
import { seedModels } from "@/lib/mock/models/fixtures";
import { query } from "@/lib/db/mysql";
```

## Import 방향

허용 방향은 아래를 기본으로 한다.

```text
app/** -> components/invest-model/** -> lib/domain/**
app/** -> lib/mock/** -> lib/domain/**
app/api/** -> lib/domain/**
app/api/** -> lib/mock/**
app/api/** -> lib/db/**          future only
```

금지 방향은 아래와 같다.

```text
lib/domain/** -> app/**
lib/domain/** -> components/**
lib/domain/** -> lib/mock/**
lib/domain/** -> lib/db/**
components/invest-model/** -> app/api/**
components/invest-model/** -> lib/db/**
lib/mock/** -> app/**
lib/mock/** -> app/api/**
lib/mock/** -> lib/db/**
lib/db/** -> app/**
lib/db/** -> components/**
```

도메인 계층은 가장 안쪽 계약이다. `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `TradeIntent`, `MockDeposit` 같은 확정 용어와 타입은 이 계층에서 흔들리지 않아야 한다.

## 영역별 규칙

`app/**`는 화면 조립과 라우팅을 담당한다. 모바일 화면 구현을 위해 `components/invest-model`, `lib/mock`, `lib/domain`을 import할 수 있다. 단, 일반 페이지 컴포넌트가 `lib/db`를 직접 import하지 않는다.

`components/invest-model/**`는 재사용 UI와 모바일 앱 화면 조각을 담당한다. DTO, ViewModel, domain type, 디자인 토큰은 import할 수 있다. `app/api`, `lib/db`, secret, 외부 클라이언트는 import하지 않는다. mock fixture 직접 import는 demo-only 컨테이너에서만 허용하고, 일반 컴포넌트는 props로 데이터를 받는다.

`lib/domain/**`는 순수 계약과 도메인 계산만 둔다. React, Next.js route, mock fixture, DB, 외부 API client, secret에 의존하지 않는다.

`lib/mock/**`는 초기 화면과 API 대체 데이터를 제공한다. 안정화된 domain type 또는 DTO type만 import한다. DB, API route, 외부 client, secret을 import하지 않는다.

`app/api/**`는 API boundary다. domain type, mock loader, 서비스/매퍼, 미래의 DB repository를 import할 수 있다. React component를 import하지 않는다.

## Barrel Export 규칙

Barrel 파일은 public boundary를 명확히 할 때만 사용한다.

허용되는 barrel은 다음과 같다.

- `lib/domain/index.ts`: 확정된 공개 타입, enum, 순수 helper만 export한다.
- `lib/domain/<area>/index.ts`: 해당 area의 공개 계약만 export한다.
- `lib/mock/<area>/index.ts`: mock loader와 mapper처럼 외부에서 써도 되는 함수만 export한다.
- `components/invest-model/index.ts`: 안정화된 재사용 컴포넌트만 export한다.

주의할 점은 다음과 같다.

- raw fixture, 내부 seed, 임시 helper는 public barrel에서 export하지 않는다.
- `export *`는 ownership이 숨겨질 때 피하고 named export를 우선한다.
- barrel이 barrel을 다시 re-export하는 체인은 한 단계까지만 허용한다.
- page-specific screen module은 public UI building block으로 확정되기 전까지 root barrel에서 export하지 않는다.
- internal 전용 파일은 `*.internal.ts` 접미사를 쓰거나 같은 파일 안에 비공개로 둔다.

권장 예시는 다음과 같다.

```ts
export type { InvestmentModel, ModelVersion } from "./types";
export { calculateMandateRiskLabel } from "./risk-label";
```

피해야 할 예시는 다음과 같다.

```ts
export * from "./fixtures";
export * from "../portfolio";
export * from "../../mock/models/internal-seed";
```

## Type Import 규칙

타입만 필요한 경우 `import type`을 사용한다.

```ts
import type { InvestmentModel } from "@/lib/domain/models";
```

런타임 값이 필요한 경우에만 일반 import를 사용한다.

```ts
import { getMockInvestmentModels } from "@/lib/mock/models";
```

이 규칙은 Next.js client/server boundary와 번들 크기, 순환 참조 예방에 중요하다.

## 순환 참조 점검 기준

새 파일을 만들거나 barrel을 추가할 때 아래 질문을 통과해야 한다.

- 이 파일이 자기보다 바깥 계층을 import하고 있지 않은가?
- domain type을 가져오기 위해 mock 또는 component barrel을 거치고 있지 않은가?
- public barrel에 internal seed나 fixture가 노출되지 않았는가?
- `components/invest-model`이 데이터 조회와 화면 표시를 동시에 책임지고 있지 않은가?
- API route가 React component나 client-only helper를 import하지 않는가?

순환 참조가 의심되면 직접 import로 풀고, public barrel 추가는 별도 작은 체크리스트 항목으로 분리한다.

## 점진 적용

기존 코드를 큰 폭으로 정리하지 않는다. 새 기능을 만들거나 해당 파일을 수정할 때 아래 순서로 점진 적용한다.

1. `@/*` alias로 경로를 통일한다.
2. 타입 import는 `import type`으로 바꾼다.
3. public barrel은 안정화된 타입과 helper부터 추가한다.
4. raw mock fixture와 internal helper는 public barrel 밖에 둔다.
5. 순환 참조가 생기면 barrel보다 직접 import를 우선한다.

## 후속 체크리스트 연결

이 문서는 `BK-137`의 순환 의존성 점검 스크립트와 `BK-141`의 ESLint import boundary 규칙 설계로 이어진다. 자동화가 추가되기 전까지는 코드 리뷰와 작업 전 하네스 확인으로 이 규칙을 적용한다.
