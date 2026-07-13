# Project Agent Rules

<!--
이 파일은 Codex와 하위 에이전트가 이 프로젝트에서 항상 따라야 하는 최상위 작업 규칙입니다.
처음 보는 사람은 이 파일을 통해 프로젝트의 운영 방식, 검증 기준, 하네스 우선순위를 이해할 수 있어야 합니다.
-->

## Required Harness Order

작업 전 아래 하네스를 필요한 범위만큼 확인한다.

1. `harness/core-harness.md`
2. `harness/product-harness.md`
3. `harness/risk-compliance-harness.md`
4. 작업 영역별 하네스: `frontend`, `backend`, `model-marketplace`, `security`, `naming`, `design`

## Operating Rule

- 사용자가 명시적으로 멀티에이전트를 요청하면 planner가 작업을 나누고 필요한 agent를 병렬 또는 순차로 호출한다.
- 기본 흐름은 수직형이다: planner -> designer/developer -> reviewer/qa -> recorder.
- 탐색, 리뷰, 테스트, 영향 범위 분석은 수평형 병렬 실행을 허용한다.
- 모든 클래스, 인터페이스, agent, harness 파일 최상단에는 역할 설명 주석을 둔다.
- 투자 조언, 수익 보장, 법적 적합성에 관한 단정 표현을 피한다.
- 실제 투자 집행, 주문, 자금 이동, 외부 계정 연결은 명시적 사용자 승인 및 적절한 법률/보안 검토 없이는 구현하지 않는다.

## Git Rule

- 하나의 작업 단위가 끝나면 한국어 커밋 메시지를 작성한다.
- 커밋 전 lint/test/build 또는 그에 준하는 검증을 실행한다.
- push가 거절되면 `git pull --rebase` 후 충돌을 해결하고 다시 검증한다.

## Google Sheets Rule

- 작업 시작 시 Backlog 또는 In Progress를 확인한다.
- 작업 완료 시 Done으로 이동하고 구현 요약, 검증 결과, 문제사항, 커밋 해시를 기록한다.
- 문제가 남으면 Issues에 기록하고 다음 체크 대상에 연결한다.

