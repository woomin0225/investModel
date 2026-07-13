# Naming Harness

<!--
이 하네스는 폴더, 클래스, 인터페이스, DB 모델, API 이름의 일관성을 지키기 위한 기준입니다.
베이스 코드를 investModel 도메인에 맞게 바꿀 때 이름이 흔들리지 않도록 사용합니다.
-->

## Canonical Source

핵심 도메인 이름은 `harness/domain-contract-harness.md`의 Canonical Domain Terms를 우선합니다.

## Domain Naming

- `Strategy`보다 `InvestmentModel`을 사용합니다.
- `RiskSetting`보다 `ModelRiskProfile`을 사용합니다.
- 실제 주문과 혼동될 수 있는 `Order` 대신 초기 단계에서는 `TradeIntent`를 사용합니다.
- 사용자가 직접 투자성향을 고르는 것처럼 보이는 `UserPreference` 이름은 피합니다.
- 모델이 정한 운용 범위는 `PortfolioMandate`로 표현합니다.
- 초기 개발용 가상 입금은 `MockDeposit`으로 부르고 실제 입금과 분리합니다.
- 시장/뉴스/트래픽 기반 신호는 `SignalEvent`로 부릅니다.

## Type Naming

- DB row와 화면 DTO를 섞지 않습니다.
- 화면 응답 타입은 `ModelCardDto`, `ModelDetailDto`, `SignalEventDto`처럼 `Dto` 접미사를 붙입니다.
- UI 전용 변환 타입이 필요하면 `ViewModel` 접미사를 사용합니다.
- enum/status 값은 DBML, API, UI에서 같은 문자열을 사용합니다.

## Required Comments

모든 공개 class/interface/type 파일의 최상단 또는 선언 직전에는 짧은 역할 주석을 둡니다.

```ts
/**
 * InvestmentModel은 제작자가 등록하고 사용자가 선택하는 AI 투자 모델의 공개 단위입니다.
 * 사용자의 투자성향 설정이 아니라 모델 자체의 운용 성향과 제한 범위를 담습니다.
 */
export interface InvestmentModel {}
```
