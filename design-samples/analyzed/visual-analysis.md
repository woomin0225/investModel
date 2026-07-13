# Visual Seed Analysis

<!--
이 문서는 selected/에 들어온 디자인 참고 이미지를 관찰해 investModel 초기 디자인 구조에 반영할 패턴을 정리합니다.
고유 브랜드나 문구를 복제하지 않고, 레이아웃/밀도/컴포넌트 구조처럼 재사용 가능한 사실만 기록합니다.
-->

## Source

- 입력 폴더: `design-samples/selected/`
- 분석 이미지: PNG 20장
- 원본 해상도: 모든 샘플이 1170 x 2532
- 작업 기준 프레임: 모바일 앱 390 x 844
- 접촉 시트: `design-samples/analyzed/selected-contact-sheet.png`

## Observable Patterns

- 전체 화면은 흰색 또는 아주 옅은 회색/블루 배경 위에 카드와 리스트를 배치한다.
- 페이지 최상단에는 큰 제목과 우측 아이콘 버튼이 있고, 하단에는 4-5개 탭 내비게이션이 고정된다.
- 핵심 정보는 둥근 카드 안에 들어가며, 카드 사이에는 넓은 여백과 약한 구분선이 사용된다.
- 실시간 이슈/랭킹 화면은 상단 컬러 영역과 흰색 카드 리스트를 결합한다.
- AI 소개/추천 화면은 연한 블루 톤 배경, 큰 헤드라인, 세로형 기능 카드로 구성된다.
- 피드 화면은 게시물 카드, 태그, 미디어 썸네일, 반응 버튼을 포함한다.
- 계좌/홈 화면은 시장 지수, 알림 배너, 계좌 카드, 자산 리스트를 한 화면에 압축한다.
- 리스트 행은 좌측 순위/아이콘, 중앙 제목/설명, 우측 수치/상태값의 3단 구조가 많다.

## Palette Candidates

- Background: `#FFFFFF`, `#F7F9FC`, `#F2F6FF`
- Surface: `#FFFFFF`, `#F4F6FA`
- Divider: `#E9EEF5`
- Primary Blue: `#2F80ED`, `#4C8DFF`
- Positive/Risk Red: `#F04452`
- Secondary Blue: `#3182F6`
- Text Primary: `#202632`
- Text Secondary: `#7D8796`
- Text Disabled: `#A5ADBA`

## Typography Cues

- 화면 제목은 매우 크게 두고, 내부 패널 제목은 더 작고 단단하게 둔다.
- 본문은 14-16px 수준의 높은 가독성, 보조 설명은 12-13px 수준으로 보인다.
- 수익률, 순위, 금액 등 숫자는 굵기와 색으로 빠르게 구분한다.
- 버튼과 배지는 짧은 한국어 라벨 기준으로 폭을 고정하지 않고 내용에 맞게 확장한다.

## investModel Adaptation

초기 디자인은 다음 화면 구조로 가져간다.

1. `Home / My AI Investment`: 선택된 AI 모델, 예치금, 오늘의 모델 신호, 최근 운용 상태를 보여준다.
2. `Discover Models`: 사람들이 올린 AI 모델을 위험도, 시장, 전략 태그, 누적 성과 기준으로 탐색한다.
3. `Realtime Signals`: 뉴스 트래픽, 가격 추세, 시장 이슈를 모델 관점으로 랭킹화한다.
4. `Model Detail`: 모델 설명, 투자 대상, 레버리지 여부, 고위험 여부, 성과, 위험 고지를 명확히 보여준다.
5. `Feed / Insights`: 모델 운용 코멘트와 시장 뉴스 요약을 피드 형태로 제공한다.

## Component Inventory

- `MobileShell`
- `TopIconBar`
- `BottomNav`
- `SoftBanner`
- `MetricCard`
- `ModelCard`
- `RiskBadge`
- `SignalRankCard`
- `FeedPost`
- `ModelDetailMandate`
- `DisclosurePanel`
- `SectionHeader`
- `ChipTab`
- `FloatingActionButton`

## Open Placeholders

- 브랜드 로고와 최종 앱 아이콘
- 최종 브랜드 컬러
- 한국어 서비스 카피 톤
- 실제 투자 위험 고지 문구
- 모델 성과 산식과 표기 기준
- 앱 첫 출시 범위가 웹, 모바일 웹, 네이티브 앱 중 무엇인지
