# Backend Harness

<!--
이 하네스는 백엔드, API, 데이터 모델, 작업 큐 구현 원칙을 설명합니다.
투자 관련 도메인은 감사 가능성과 권한 분리를 최우선으로 합니다.
-->

## Principles

- 모든 투자 관련 의사결정은 audit log를 남긴다.
- 모델 제작자, 일반 사용자, 운영자 권한을 분리한다.
- 모델이 생성한 투자 의사결정과 실제 주문 가능 여부 검사를 분리한다.
- 외부 API 응답, 뉴스 데이터, 가격 데이터의 출처와 시점을 기록한다.

## Required Domains

- auth
- users
- model-creators
- investment-models
- disclosures
- deposits
- portfolios
- market-data
- decision-engine
- compliance-review
- audit-logs

## Do Not

- 모델 출력을 바로 주문으로 연결하지 않는다.
- 검증되지 않은 모델이 사용자 자금을 운용하게 하지 않는다.
- 관리자 승인 없이 모델 설명의 핵심 리스크 필드를 수정하지 않는다.

