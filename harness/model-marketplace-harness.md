# Model Marketplace Harness

<!--
이 하네스는 외부 제작자가 AI 투자 모델을 등록하고 사용자가 선택하는 마켓플레이스 구조를 정의합니다.
모델 등록, 설명, 심사, 공개 상태, 비활성화 기준을 설계할 때 사용합니다.
-->

## Model Registration Requirements

모델 등록 시 최소 입력해야 할 정보:

- 모델 이름
- 제작자 정보
- 투자 대상 시장
- 투자 자산군
- 레버리지 사용 여부
- 공매도/파생상품 사용 여부
- 리밸런싱 주기
- 주요 입력 데이터
- 금지된 투자 범위
- 위험 설명
- 백테스트/성과 지표
- 모델 버전

## Model Status

- draft
- pending_review
- approved
- live
- paused
- suspended
- retired

## Marketplace Rule

- 승인되지 않은 모델은 사용자에게 노출하지 않는다.
- 성과 랭킹은 위험 지표와 함께 보여준다.
- 모델 제작자가 설명을 바꾸면 재심사 상태로 전환한다.

