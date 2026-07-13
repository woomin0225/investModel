<!--
이 문서는 investModel을 휴대폰 앱처럼 배포하기 위한 PWA, Capacitor, Expo/React Native, Tauri 선택지를 비교하는 모바일 제품 설계 문서입니다.
초기 구현자가 앱스토어 배포, 푸시 알림, 생체 인증, 금융 연동 가능성을 검토할 때 현재 PWA 우선 원칙과 보안 게이트를 함께 확인할 수 있어야 합니다.
-->

# 네이티브 앱 포장 방식 검토

## 결론

현재 단계의 investModel은 Next.js 모바일 PWA를 유지한다.

이유는 다음과 같다.

- 현재 제품은 Prototype 단계이며 mock-only 화면, mock portfolio, mock signal/feed 검증이 우선이다.
- `app/manifest.ts`, 앱 아이콘, standalone display, portrait orientation이 이미 준비되어 있다.
- 실제 입금, 실제 주문, 브로커 계좌 연결, 네이티브 결제, 외부 유료 API key는 모두 별도 gate 전까지 금지되어 있다.
- 앱스토어 배포, push notification, biometric unlock이 아직 핵심 MVP 검증을 막지 않는다.

네이티브 포장은 지금 구현하지 않고, 앱스토어 또는 기기 API가 명확히 필요한 시점에 별도 체크리스트로 전환한다.

## 비교 기준

| 기준 | 지금 필요한가 | 판단 |
| --- | --- | --- |
| 모바일 390px 앱 같은 사용감 | 필요 | PWA로 충분 |
| 홈 화면 설치 아이콘 | 필요 | PWA로 충분 |
| 하단 탭, safe area, portrait UX | 필요 | PWA로 충분 |
| 앱스토어/플레이스토어 배포 | 아직 아님 | 추후 gate |
| Push notification | 아직 아님 | Capacitor 또는 Expo 검토 후보 |
| Biometric unlock | 아직 아님 | Capacitor 또는 Expo 검토 후보 |
| 네이티브 secure storage | 아직 아님 | 실제 auth/secret 정책 후 검토 |
| 인앱 결제 | 금지 | 금융/스토어 정책 검토 전 구현 금지 |
| 브로커/은행 계좌 연결 | 금지 | `financial_operation` gate 필요 |
| 모델 파일 로컬 실행 | 금지 | `model_runtime_security` gate 필요 |

## 선택지 비교

### PWA

현재 기본 선택지다.

장점:

- Next.js 코드베이스를 그대로 사용한다.
- 모바일 화면, 다국어, mock 데이터, API 설계를 빠르게 검증할 수 있다.
- 앱스토어 심사 없이 내부 확인과 반복 개발이 빠르다.
- 실제 금융 기능이 없는 Prototype 단계에 적합하다.

제약:

- iOS push notification, background job, native secure storage 같은 기능은 브라우저 제약을 받는다.
- 앱스토어 배포가 제품 신뢰나 사용자 획득에 필수라면 부족할 수 있다.
- 네이티브 생체 인증 UX는 제한적이다.

유지 조건:

- 주요 화면이 390px 모바일 viewport에서 겹침 없이 동작한다.
- PWA manifest와 아이콘이 최신 상태다.
- mock/simulated/backtest 문구가 앱처럼 보이는 환경에서도 숨겨지지 않는다.

### Capacitor

Next.js/PWA를 WebView 기반 네이티브 shell로 감쌀 때의 1순위 후보로 둔다.

장점:

- 현재 웹 UI를 대부분 재사용할 수 있다.
- 앱스토어/플레이스토어 배포 경로를 만들 수 있다.
- push notification, biometric, secure storage 같은 플러그인 검토가 가능하다.
- PWA에서 네이티브로 점진 전환하기 쉽다.

제약:

- WebView 성능과 네이티브 UX 품질을 별도 QA해야 한다.
- plugin permission, native build, store signing, CI가 추가된다.
- 금융 관련 네이티브 기능은 보안/법률/운영 검토가 필요하다.

도입 조건:

- 앱스토어 배포가 Closed Beta 또는 Public Launch의 명시 조건이 된다.
- push notification 또는 biometric unlock이 핵심 retention/security 요구가 된다.
- `financial_operation`, `secret_management_review`, `security_review` 범위가 문서화된다.

### Expo / React Native

모바일 UI를 네이티브 컴포넌트로 다시 만드는 선택지다.

장점:

- 네이티브 모바일 UX와 성능을 더 깊게 제어할 수 있다.
- push notification, biometric, secure storage, deep linking을 앱 중심으로 설계하기 쉽다.
- 장기적으로 완전한 모바일 앱 제품에 적합하다.

제약:

- 현재 Next.js 화면과 컴포넌트 재사용성이 낮아진다.
- 같은 화면을 웹/PWA와 네이티브로 이중 구현할 위험이 있다.
- 초기 mock 검증 속도가 느려지고 팀 부담이 커진다.

도입 조건:

- PWA/WebView가 주요 사용자 경험 요구를 만족하지 못한다.
- 장기적으로 웹보다 네이티브 앱이 제품의 중심 플랫폼으로 확정된다.
- 디자인 시스템, DTO, domain contract가 안정화되어 재구현 비용을 감당할 수 있다.

### Tauri Mobile

현재 우선순위가 낮다.

장점:

- Rust 기반 shell과 작은 번들 전략이 가능하다.
- desktop까지 함께 고려하는 경우 장점이 있을 수 있다.

제약:

- investModel은 현재 desktop 앱이 아니라 휴대폰 앱 우선이다.
- 모바일 생태계와 금융 앱 운영 사례 관점에서 Capacitor/Expo보다 검토 비용이 크다.
- 현재 MVP 요구와 직접 연결되는 장점이 적다.

판단:

- 별도 desktop/internal operator 앱 요구가 나오기 전까지 선택하지 않는다.

## 보안/금융 게이트

네이티브 포장이 가능해져도 아래 기능은 자동으로 허용되지 않는다.

| 기능 | 상태 | 필요한 gate |
| --- | --- | --- |
| 실제 입금/출금/결제 | 금지 | `financial_operation` |
| 브로커/은행 계좌 연결 | 금지 | `financial_operation`, `secret_management_review` |
| 실제 주문/체결/정산 | 금지 | `financial_operation`, 법률/운영 승인 |
| 네이티브 secure storage에 token 저장 | 보류 | `security_review` |
| push notification | 보류 | privacy/security review |
| biometric unlock | 보류 | auth/session 정책 결정 |
| 앱스토어 결제 | 보류 | store policy, legal/financial review |
| 업로드 AI 모델 실행 | 금지 | `model_runtime_security` |

네이티브 shell은 제품 기능을 허용하는 근거가 아니다. 기능 허용 여부는 release scope gate와 보안/금융 검토가 먼저 결정한다.

## 권장 로드맵

1. Prototype: Next.js PWA 유지.
2. Internal Alpha: PWA에 auth/RBAC/audit log를 붙이고 모바일 실기기 QA를 반복한다.
3. Closed Beta 준비: 앱스토어 배포가 필요한지, push/biometric이 핵심인지 결정한다.
4. 네이티브 필요 확정 시: Capacitor proof-of-concept를 별도 브랜치와 체크리스트로 만든다.
5. PWA/WebView 한계가 명확하면: Expo/React Native 재구현 비용을 다시 산정한다.

## 체크리스트

네이티브 포장 전 확인할 항목:

- 모바일 PWA 주요 화면이 390px와 실제 휴대폰에서 안정적인가?
- 앱스토어 배포가 제품 검증에 필요한가, 아니면 마케팅/신뢰 목적의 후순위인가?
- push notification이 없으면 핵심 사용 흐름이 깨지는가?
- biometric unlock이 실제 보안 요구인지 편의 기능인지 분리되었는가?
- 실제 금융 연동을 요구하지 않고도 앱스토어 심사 설명이 가능한가?
- mock/simulated/backtest 문구가 네이티브 shell에서도 명확히 보이는가?
- native permission, privacy policy, audit log, incident response 범위가 문서화되었는가?

## 후속 작업

필요 시 다음 작업을 별도 Backlog로 분리한다.

- Capacitor proof-of-concept 범위 정의
- App Store / Play Store 심사 문구 초안
- Push notification privacy policy 초안
- Biometric unlock threat model
- Native secure storage policy
- 실제 휴대폰 PWA 설치 QA 결과 반영
