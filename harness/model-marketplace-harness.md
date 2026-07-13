# Model Marketplace Harness

<!--
이 하네스는 모델 제작자가 AI 투자 모델을 등록하고 사용자가 선택하는 마켓플레이스 구조를 정의합니다.
모델 등록, 설명, 심사, 공개 상태, 비활성화 기준을 설계할 때 사용합니다.
-->

## Model Registration Requirements

모델 등록 시 최소로 입력해야 할 정보:

- 모델 이름
- 제작자 정보
- 투자 대상 시장
- 투자 자산군
- 레버리지 사용 여부
- 공매도 또는 파생상품 사용 여부
- 리밸런싱 주기
- 주요 입력 데이터
- 금지 투자 범위
- 위험 설명
- backtest 또는 성과 지표의 출처와 기준
- 모델 버전
- `PortfolioMandate`
- 법률/위험 고지 placeholder

## Model Status

모델 상태 전이는 `harness/domain-contract-harness.md`의 State Transition Contract를 따릅니다.

기본 상태:

- `draft`
- `pending_review`
- `approved`
- `live`
- `paused`
- `suspended`
- `retired`

## Marketplace Rule

- 승인되지 않은 모델은 사용자에게 노출하지 않습니다.
- 성과 지표는 위험 지표와 함께 보여줍니다.
- 모델 제작자가 설명, 위험, mandate, 성과 기준을 바꾸면 재심사 상태로 전환합니다.
- live 모델의 핵심 설명 변경은 `ModelVersion` 기준으로 기록합니다.
- `suspended` 또는 `retired` 모델은 새 사용자 선택을 막습니다.

## Review Rule

- 운영자 심사는 `ComplianceReview`로 기록합니다.
- 승인, 반려, 중지, 재심사 요청은 모두 audit log 대상입니다.
- 법률 확정 문구가 필요한 경우 Codex가 임의로 채우지 않고 placeholder로 둡니다.
