# Security Harness

<!--
이 하네스는 보안, 개인정보, 자금 관련 데이터 보호 원칙을 정의합니다.
인증, 권한, API 키, 외부 연동, 감사 로그를 다룰 때 반드시 확인합니다.
-->

## Principles

- 비밀키와 토큰은 코드에 저장하지 않는다.
- 사용자 자금, 계좌, 주문 관련 데이터는 최소 권한으로 접근한다.
- 관리자 액션은 모두 audit log에 기록한다.
- 모델 제작자는 다른 제작자 또는 사용자 자금 데이터에 접근할 수 없다.

## Required Controls

- Role-based access control
- Admin audit log
- Secret management
- Rate limiting
- Input validation
- Model upload scanning
- Webhook signature verification

