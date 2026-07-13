# Google Sheets Schema

<!--
이 문서는 Google Sheets 작업 원장의 탭과 컬럼 구조를 정의합니다.
Codex가 작업할 때 어떤 데이터를 읽고 써야 하는지 처음 보는 사람도 이해할 수 있게 합니다.
-->

## Tabs

- `Backlog`: 아직 해야 할 작업
- `In Progress`: 현재 진행 중인 작업
- `Done`: 완료된 작업
- `Issues`: 문제, 차단, 재확인 항목
- `Decisions`: 제품/기술 방향 결정
- `Runs`: Codex 실행 기록
- `Harness`: 하네스 점검 기록

## Backlog Columns

```text
id,status,priority,area,title,detail,dependencies,required_harness,assigned_agent,acceptance_criteria,risk_flag,notes,issue_ids,commit_hash,created_at,started_at,completed_at
```

## Status Values

- todo
- in_progress
- blocked
- review
- done
- deferred

## Risk Flag Values

- none
- legal_review
- security_review
- financial_operation
- user_confirmation
- external_account

