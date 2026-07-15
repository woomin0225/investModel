# Sheet Schema

<!--
이 참조 문서는 stock-app-sheet-operator 스킬이 Google Sheets의 각 탭을 어떻게 읽고 써야 하는지 정의합니다.
새 작업, 완료 작업, 문제사항, 결정사항, 실행 로그를 일관된 컬럼으로 관리하기 위한 기준입니다.
-->

## Backlog / In Progress / Done

```text
id,status,priority,area,title,detail,dependencies,required_harness,assigned_agent,acceptance_criteria,risk_flag,notes,issue_ids,commit_hash,created_at,started_at,completed_at
```

## Issues

```text
issue_id,status,priority,related_task_id,area,title,detail,owner,created_at,resolved_at,resolution_notes,next_check
```

Recommended status values:

- `open`
- `blocked`
- `monitoring`
- `resolved`
- `deferred`

## Decisions

```text
decision_id,date,area,title,decision,reason,related_task_ids,owner,revisit_date
```

## Runs

```text
run_id,start_time,end_time,trigger,selected_task_id,agents_used,summary,verification,commit_hash,next_action
```

## Harness

```text
harness_id,name,path,last_checked_at,checked_by,notes,change_allowed
```

## ID Rules

- Backlog task: `BK-###`
- Issue: `IS-###`
- Decision: `DC-###`
- Run: `RUN-YYYYMMDD-###`
- Harness: `HN-###`
# Current Operating Addendum: agents_used

`agents_used` must list the actual roles used in the run, separated by semicolons. Examples: `Codex coordinator; planner`, `Codex coordinator; frontend-developer; qa-tester`. If multi-agent tooling is unavailable, write `Codex coordinator (multi-agent unavailable)` and explain the reason in `verification`.

