# Task Selection

<!--
이 참조 문서는 Codex가 사용자의 요청과 Google Sheets 체크리스트를 비교해 다음 작업을 고르는 기준입니다.
자동화 실행과 일반 작업 지시에서 같은 우선순위 규칙을 사용하게 합니다.
-->

## Matching A User Request

1. Search exact task ID first, such as `BK-012`.
2. Search title and detail in `Backlog`, `In Progress`, `Done`, and `Issues`.
3. Treat an already completed task as context, not new work, unless the user asks for revision.
4. If the request changes scope, create a new task and link the prior task in `dependencies` or `notes`.

## Default Priority Order

1. `In Progress` rows that are not blocked
2. `Issues` rows with status `open` or `blocked` that affect P0/P1 work
3. `Backlog` rows with `P0`
4. `Backlog` rows with `P1`
5. `Backlog` rows with `P2`
6. `Backlog` rows with `P3`

## Blocked Work

Do not silently skip a blocked task. Record why it is blocked and choose the next dependency-ready task.

## New Work

Add new work to `Backlog` before implementation when:

- no close existing task exists
- the request expands the project scope
- the request introduces a new feature, bug, design change, automation, integration, or research item

