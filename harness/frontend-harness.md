# Frontend Harness

<!--
이 하네스는 프론트엔드 구현 원칙을 설명합니다.
화면, 컴포넌트, 상태관리, 사용자 고지 UI를 만들 때 이 기준을 따릅니다.
-->

## Principles

- 투자 모델의 위험 정보는 모델 선택 전 반드시 보이게 한다.
- 사용자가 직접 투자 성향을 조절하는 UI를 만들지 않는다.
- 모델 비교 화면은 수익률뿐 아니라 변동성, 손실 구간, 레버리지 여부, 투자 시장을 함께 보여준다.
- 관리자 화면은 조밀하고 실무적인 정보 구조를 우선한다.

## Naming

- React component는 `PascalCase`
- hooks는 `use` prefix
- 화면 단위 폴더는 kebab-case
- 도메인 타입은 `InvestmentModel`, `ModelRiskProfile`처럼 명확히 작성한다.

## Required UI States

- loading
- empty
- error
- pending review
- suspended model
- high risk warning
- unavailable market data

