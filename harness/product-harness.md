# Product Harness

<!--
이 하네스는 AI 모델 투자 앱의 제품 정의, 핵심 사용자, 주요 흐름, MVP 범위를 설명합니다.
기능을 추가할 때 제품의 본질에서 벗어나지 않도록 기준으로 사용합니다.
-->

## Product Identity

investModel은 사용자가 직접 투자성향을 세밀하게 설정하는 로보어드바이저가 아닙니다.
여러 제작자가 등록한 AI 투자 모델을 사용자가 선택하고, 각 모델이 미리 정의한 운용 성향과 제한 범위에 따라 mock 또는 검토된 투자 흐름을 보여주는 모델 마켓플레이스형 투자 플랫폼입니다.

## Platform Direction

investModel의 기본 제품 형태는 데스크톱 앱이 아니라 휴대폰에서 사용하는 모바일 앱입니다.
초기 개발은 Next.js 모바일 웹/PWA 형태로 빠르게 검증하고, 이후 필요하면 Capacitor 또는 React Native 계열로 네이티브 앱 포장을 검토합니다.

우선순위:

1. 모바일 브라우저에서 390px 기준 화면을 자연스럽게 표시합니다.
2. PWA 설치, 홈 화면 아이콘, 모바일 safe area, 하단 탭 내비게이션을 준비합니다.
3. 실제 앱스토어/플레이스토어 배포가 필요해지면 네이티브 포장 방식을 별도 결정합니다.

## Core Users

- 일반 사용자: 승인된 AI 투자 모델을 탐색하고 선택합니다.
- 모델 제작자: AI 모델 설명, 운용 범위, 위험, 성과 근거를 등록하고 심사를 요청합니다.
- 운영자: 모델 심사, 위험 문구 검토, 신고/중지/감사 로그를 관리합니다.

## Core Objects

- User
- ModelCreator
- InvestmentModel
- ModelVersion
- ModelDisclosure
- ModelRiskProfile
- PortfolioMandate
- MockDeposit
- AllocationDecision
- TradeIntent
- AuditLog
- ComplianceReview

## MVP Scope

초기 MVP는 `harness/domain-contract-harness.md`의 MVP Boundary를 따릅니다.

포함:

- Figma 기반 Home, Discover Models, Realtime Signals, Model Detail, Feed Insights 화면
- mock 모델, mock 신호, mock 포트폴리오, mock 피드
- 모델 상태와 심사 흐름의 설계
- RBAC와 API 계약 초안

제외:

- 실제 입금/출금
- 실제 브로커 주문
- 실제 계좌 연결
- 외부 AI 모델 파일 실행
- 법률/금융 문구 확정

## Core Flows

1. 모델 제작자가 AI 모델 draft를 등록합니다.
2. 모델 설명, 운용 범위, 위험, 금지사항, backtest/성과 근거를 제출합니다.
3. 운영자가 심사합니다.
4. 사용자가 승인된 live 모델 목록을 탐색합니다.
5. 사용자가 모델 상세 설명과 위험을 확인하고 모델을 선택합니다.
6. 초기 단계에서는 `MockDeposit`으로 가상 입금 상태를 표현합니다.
7. 모델은 시장/뉴스/가격 추세 데이터를 바탕으로 `AllocationDecision`을 만듭니다.
8. 시스템은 정책/위험/컴플라이언스 검사를 수행합니다.
9. 허용 범위에서만 `TradeIntent`를 simulation 상태로 남깁니다.
10. 사용자와 운영자에게 투명한 기록을 제공합니다.

## User-Filled Placeholders

아래 항목은 사용자가 직접 정하거나 전문가 검토 후 채웁니다. Codex가 임의로 확정하지 않습니다.

- 대상 국가/시장:
- 지원할 초기 자산군:
- 실제 주문 연동 여부:
- 법률 자문 기준:
- 허용할 고위험 모델:
