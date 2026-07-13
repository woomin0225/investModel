# Product Harness

<!--
이 하네스는 AI 모델 투자 앱의 제품 정의, 핵심 사용자, 주요 흐름을 설명합니다.
기능을 추가할 때 제품의 본질에서 벗어나지 않도록 기준점 역할을 합니다.
-->

## Core Users

- 투자 AI 모델을 등록하려는 모델 제작자
- 모델을 선택해 자금을 위임하려는 일반 사용자
- 모델 심사, 리스크 검토, 신고/분쟁을 관리하는 운영자

## Core Objects

- User
- ModelCreator
- InvestmentModel
- ModelDisclosure
- ModelRiskProfile
- PortfolioMandate
- UserDeposit
- AllocationDecision
- TradeIntent
- AuditLog
- ComplianceReview

## Core Flows

1. 모델 제작자가 AI 모델 등록 신청
2. 모델 설명, 투자 범위, 위험, 금지사항, 과거 백테스트/실거래 지표 제출
3. 운영자 심사
4. 사용자가 모델 목록 탐색
5. 사용자가 모델 설명을 확인하고 선택
6. 사용자가 앱에 자금 입금
7. 모델이 시장/뉴스/가격 추세 데이터를 바탕으로 운용 의사결정 생성
8. 시스템이 정책/위험/컴플라이언스 검사
9. 허용된 범위에서 주문 또는 포트폴리오 조정
10. 사용자와 운영자에게 투명한 기록 제공

## Placeholder

아래 항목은 사용자가 직접 채워야 한다.

- 대상 국가/시장:
- 지원할 초기 자산군:
- 실제 주문 연동 여부:
- 법률 자문 기준:
- 수익 모델:

