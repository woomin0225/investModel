# Automation Prompt

<!--
이 참조 문서는 10분마다 또는 반복적으로 Codex를 깨워 Google Sheets 기반 작업을 이어가게 할 때 사용하는 프롬프트 초안입니다.
자동 실행 중에도 하네스, 문제사항, 완료 기록이 누락되지 않도록 합니다.
-->

## Thread Automation Prompt

```text
Use $stock-app-sheet-operator.

This is an automated continuation for the AI model stock investment app.

1. Open the project Google Sheet.
2. Check Backlog, In Progress, Issues, Runs, and Harness.
3. If there is active non-blocked work in In Progress, continue it.
4. Otherwise choose the highest-priority dependency-ready Backlog item.
5. If unresolved Issues block the chosen task, record the blocker and choose the next safe task.
6. Check the required harness before making changes.
7. Implement one bounded work unit.
8. Run relevant verification.
9. Update the sheet:
   - move completed work to Done
   - update Issues
   - add Decisions when durable choices were made
   - add a Runs entry
10. Commit with a concise Korean commit message when code changed.
11. Stop and report if the task requires real fund movement, broker order execution, external account access, legal judgment, or user secrets.
```

