# Naming Harness

<!--
이 하네스는 폴더, 클래스, 인터페이스, DB 모델, API 이름의 일관성을 유지하기 위한 기준입니다.
베이스 코드를 가져온 뒤 앱 도메인에 맞게 이름을 바꿀 때 사용합니다.
-->

## Domain Naming

- `Strategy`보다 `InvestmentModel`을 우선 사용한다.
- `RiskSetting`보다 `ModelRiskProfile`을 사용한다.
- `Order`는 실제 주문과 혼동될 수 있으므로 초기 단계에서는 `TradeIntent`를 사용한다.
- `UserPreference`는 사용자가 투자 성향을 고르는 것처럼 보일 수 있으므로 피한다.
- `Mandate`는 모델이 정한 운용 위임 범위를 의미할 때 사용한다.

## Example Interfaces

```ts
/**
 * InvestmentModel은 외부 제작자가 등록하고 사용자가 선택할 수 있는 AI 투자 모델의 공개/운영 정보를 나타낸다.
 * 사용자 투자 성향 설정이 아니라 모델 자체의 운용 성향과 제한 범위를 담는다.
 */
export interface InvestmentModel {}

/**
 * ModelRiskProfile은 AI 투자 모델이 사전에 정의한 위험 특성, 자산군, 레버리지 사용 여부를 설명한다.
 * 사용자가 앱에서 직접 변경하는 설정값이 아니다.
 */
export interface ModelRiskProfile {}
```

