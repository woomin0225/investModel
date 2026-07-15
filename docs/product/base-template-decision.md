# Base Template Decision

<!--
이 문서는 investModel이 어떤 베이스 코드에서 시작했는지와 그 선택 이유를 기록한다.
새 팀원이나 자동화 에이전트가 프로젝트 출발점을 오해하지 않도록, 유지할 기반과 교체할 부분을 분리해 설명한다.
-->

## Decision

investModel의 첫 베이스 코드는 현재 저장소의 Next.js SaaS starter 기반을 유지한다.

이 선택은 최종 제품 방향이 SaaS 결제 앱이라는 뜻이 아니다. 초기 개발 단계에서 인증, 라우팅, 서버 컴포넌트, 기본 UI 구조, GitHub 연동, 배포 친화적인 Next.js 구조를 빠르게 확보하기 위한 출발점으로만 사용한다.

## Why This Base Fits The First Phase

- Next.js App Router 구조가 이미 있으므로 모바일 웹/PWA 화면을 빠르게 추가할 수 있다.
- 기존 인증, 대시보드, 미들웨어, 서버 액션 패턴을 RBAC와 관리자 심사 흐름 설계의 참고 자료로 쓸 수 있다.
- shadcn/ui와 Tailwind 기반이라 Figma에서 정리한 모바일 컴포넌트 토큰을 단계적으로 옮기기 쉽다.
- GitHub push, 자동화 체크리스트, 문서 기반 하네스 운영을 바로 적용할 수 있는 일반적인 웹앱 구조다.
- 초기 MVP가 mock 데이터 기반이므로 실제 증권 주문, 실제 입금, 외부 AI 모델 실행 없이 화면과 도메인 계약을 먼저 검증할 수 있다.

## Known Mismatch

- 원본 스타터는 PostgreSQL/Drizzle 기반이지만 investModel 목표 DB는 MySQL이다.
- 원본 스타터에는 Stripe 결제 기능이 포함되어 있지만 investModel 초기 MVP에서는 실제 입금과 결제를 구현하지 않는다.
- 원본 README와 일부 라우트에는 SaaS 구독 앱 흔적이 남아 있다.
- 금융/투자 앱에 필요한 모델 심사, 공시, 감사 로그, mock 자금 경계는 별도 도메인 작업으로 확장해야 한다.

## Rejected Starting Points

- From-scratch Next.js: 초기 구조를 직접 만들 수는 있지만 인증, 배포, 기본 UI, 운영 문서 기반을 다시 만드는 비용이 크다.
- React Native or Expo from scratch: 최종 모바일 앱 가능성은 있지만, 현재는 Figma 기반 화면과 도메인 계약을 빠르게 검증하는 Next.js 모바일 런타임이 더 적합하다. 네이티브 앱 트랙은 이 런타임을 재사용하는 Capacitor-first 내부 테스트 경로로 다룬다.
- Backend-only prototype: 모델/포트폴리오 도메인을 설계할 수는 있지만 사용자가 보는 모바일 화면의 안전 문구와 UX를 검증하기 어렵다.
- Finance/brokerage starter: 실제 주문, 계좌 연결, 입금 흐름을 암시할 위험이 있어 현재 MVP의 mock-only 경계와 맞지 않는다.

## Guardrails

- 실제 입금, 실제 주문, 실제 계좌 연결은 이 베이스 선택의 범위에 포함하지 않는다.
- Stripe 기능은 원본 스타터 잔여 기능으로 취급하며, investModel 자금 기능으로 해석하지 않는다.
- DB 전환은 MySQL 기준 문서와 `database-harness.md`를 우선한다.
- 모바일 우선 구현은 `/invest-model` 하위 Next.js 모바일/PWA 런타임부터 진행하고, Capacitor 패키징은 내부 테스트 shell로 분리한다.

## Linked Checklist

- `BK-001`: 프로젝트 베이스 템플릿 선택
- `BK-002`: 리포지토리 초기화
- `BK-022`: 데이터베이스 선택
- `BK-121`: MVP 범위 문서
- `BK-152`: PWA 기본 설정 추가
