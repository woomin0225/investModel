# Backend Harness

<!--
이 하네스는 백엔드, API, 데이터 모델, 작업 큐 구현 원칙을 설명합니다.
투자 관련 도메인은 감사 가능성, 권한 분리, 실제 주문과의 분리를 최우선으로 합니다.
-->

## Principles

- 모든 투자 관련 의사결정과 상태 변경은 audit log 대상으로 봅니다.
- 모델 제작자, 일반 사용자, 운영자 권한을 분리합니다.
- 모델이 생성한 의사결정과 실제 주문 가능성 검사는 분리합니다.
- API 응답에는 데이터 출처, 생성 시점, mock 여부를 표현할 수 있어야 합니다.
- DB row를 API 응답으로 직접 노출하지 않고 DTO를 사용합니다.

## Required Domains

- auth
- users
- model-creators
- investment-models
- disclosures
- model-versions
- mock-deposits
- portfolios
- market-data
- signals
- decision-engine
- compliance-review
- audit-logs

## API Contract

초기 API 목록, DTO, 권한은 `harness/domain-contract-harness.md`의 API Draft Contract를 따릅니다.

기본 규칙:

- `GET /api/models`는 승인된 live 모델만 노출합니다.
- `GET /api/models/:id`는 모델의 mandate, risk profile, disclosure를 함께 제공합니다.
- `POST /api/model-selections`는 모델 버전 기준으로 선택을 기록합니다.
- mock 포트폴리오 API는 실제 자산처럼 보이지 않도록 `mock` 표현을 유지합니다.
- financial/legal blocked 상태는 일반 validation error와 구분합니다.

## Folder Boundary

도메인 폴더 구조는 `harness/domain-contract-harness.md`의 Folder Structure Contract를 따릅니다.

## Do Not

- 모델 출력을 바로 실제 주문으로 연결하지 않습니다.
- 검증되지 않은 모델이 사용자 자금 또는 mock 자금 상태를 변경하게 하지 않습니다.
- 운영자 승인 없이 모델 설명의 핵심 위험/성과 필드를 live에 반영하지 않습니다.
- 실제 입금, 실제 계좌 연결, 실제 주문 실행 API를 몰래 추가하지 않습니다.
