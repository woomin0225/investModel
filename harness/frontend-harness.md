# Frontend Harness

<!--
이 하네스는 investModel의 프론트엔드 구현 원칙을 설명합니다.
화면, 컴포넌트, 상태 관리, 사용자 고지 UI를 만들 때 모바일 앱 사용감을 최우선 기준으로 삼습니다.
-->

## Platform Direction

investModel의 프론트엔드는 데스크톱 앱이 아니라 휴대폰 앱 사용감을 우선합니다.
초기 구현은 모바일 웹/PWA 기준으로 만들고, 모든 주요 화면은 390px 폭 모바일 프레임에서 먼저 검증합니다.

기본 전제:

- 하단 탭 내비게이션을 핵심 이동 방식으로 사용합니다.
- 모바일 safe area, 터치 타깃, 세로 스크롤, 한 손 조작성을 우선합니다.
- 데스크톱 화면은 보조 대응이며, 모바일 레이아웃을 깨지 않는 범위에서 확장합니다.
- PWA manifest, 앱 아이콘, 설치 가능성은 별도 체크리스트로 관리합니다.

## Principles

- 투자 모델의 위험 정보는 모델 선택 전에 반드시 보이게 합니다.
- 사용자가 직접 투자 성향을 조절하는 UI를 만들지 않습니다.
- 모델 비교 화면은 수익률만이 아니라 변동성, 손실 구간, 레버리지 여부, 투자 시장을 함께 보여줍니다.
- 관리자 화면은 조밀하고 실무적인 정보 구조를 우선합니다.
- 모바일에서 긴 한국어 문구가 버튼, 카드, 탭 안에서 겹치거나 잘리지 않게 합니다.

## Naming

- React component는 `PascalCase`를 사용합니다.
- hooks는 `use` prefix를 사용합니다.
- 화면 단위 폴더는 kebab-case를 사용합니다.
- 도메인 타입은 `InvestmentModel`, `ModelRiskProfile`, `PortfolioMandate`처럼 명확한 이름을 사용합니다.

## Required UI States

- loading
- empty
- error
- pending review
- suspended model
- high risk warning
- unavailable market data
- mock/simulated financial state

## Mobile QA

- 390px 폭 모바일 화면에서 먼저 확인합니다.
- 하단 탭이 콘텐츠를 가리지 않도록 safe area와 bottom padding을 둡니다.
- 터치 가능한 주요 요소는 손가락으로 누르기 쉬운 크기를 유지합니다.
- 모바일 브라우저와 PWA 설치 상태 모두에서 기본 이동 흐름을 확인합니다.
