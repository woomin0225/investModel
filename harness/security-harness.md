# Security Harness

<!--
이 하네스는 보안, 개인정보, 자금 관련 데이터 보호 원칙을 정의합니다.
인증, 권한, API, 모델 연동, 감사 로그를 다룰 때 반드시 확인합니다.
-->

## Principles

- 비밀값과 토큰은 코드에 저장하지 않습니다.
- 사용자 자금, 계좌, 주문 관련 데이터는 최소 권한으로 접근합니다.
- 관리자 액션은 모두 audit log에 기록합니다.
- 모델 제작자는 다른 제작자 또는 사용자 자금 데이터에 접근할 수 없습니다.
- 실제 금융 연동은 명시 승인, 보안 검토, 법률/금융 검토 없이 구현하지 않습니다.

## Required Controls

- Role-based access control
- Admin audit log
- Secret management
- Rate limiting
- Input validation
- Model upload scanning
- Webhook signature verification

## RBAC Baseline

역할과 권한의 기본값은 `harness/domain-contract-harness.md`의 RBAC Contract를 따릅니다.

- `user`: 공개 모델 조회, 모델 선택, 본인 mock 상태 조회
- `creator`: 본인 모델 draft 작성, 심사 요청
- `admin`: 심사, 중지, 감사 로그 확인
- `system`: 예약 작업, mock sync, audit event 생성

권한 실패는 API에서 명확한 403 또는 policy-blocked 응답으로 처리합니다.
