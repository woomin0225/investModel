# Automation Harness

<!--
이 하네스는 Codex automation, Google Sheets, GitHub 연동으로 장기 개발을 자동 진행할 때의 운영 원칙입니다.
무인 실행 시 위험한 작업을 제한하고, 작업 기록이 누락되지 않도록 합니다.
-->

## Automation Loop

1. Google Sheets에서 다음 작업을 선택한다.
2. 관련 하네스를 확인한다.
3. 필요한 agent를 호출한다.
4. 구현한다.
5. 검증한다.
6. Sheets를 업데이트한다.
7. Git commit/push를 수행한다.
8. 다음 작업으로 넘어갈 수 있으면 계속한다.

## Stop Conditions

- 실제 자금 이동 구현
- 외부 브로커 주문 API 연결
- 법률 판단이 필요한 기능
- 하네스 충돌
- 사용자 비밀 정보 필요
- 테스트/빌드 실패를 세 번 이상 해결하지 못함

