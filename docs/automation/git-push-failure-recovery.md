<!--
This document defines the safe recovery procedure when investModel automated or manual work cannot push to GitHub.
AI workers must use it before retrying a rejected push, resolving rebase conflicts, or marking an automation task done after a Git delivery issue.
-->

# Git Push Failure Recovery

## Purpose

`BK-061` fixes the operating rule for a common automation failure: the local commit is valid, but `git push` is rejected because the remote branch moved. The goal is to deliver the small work unit without overwriting user work, hiding verification failures, or marking Google Sheets as done too early.

This document extends:

- `AGENTS.md`
- `harness/automation-harness.md`
- `docs/automation/korean-commit-message-rules.md`
- `docs/automation/verification-commit-push-rules.md`
- `docs/automation/codex-recurring-workflow-prompt.md`

## Non-Negotiables

- Do not use `git push --force`, `git reset --hard`, or destructive checkout commands to make an automation push succeed.
- Do not stage unrelated dirty files, design samples, generated local build output, secrets, `.env` files, or user-authored changes outside the selected task.
- Do not mark Backlog, Done, or Runs as successfully delivered until the final push succeeds, unless the row explicitly records a blocked/review outcome.
- Do not continue through a conflict that touches unrelated user changes. Stop, record an Issue, and wait for user confirmation.

## Standard Recovery Flow

When `git push` fails:

1. Stop the delivery step and inspect the current state.
2. Run `git status --short` and confirm only task-related files are staged or modified by the current worker.
3. Run `git branch --show-current` and confirm the intended branch.
4. Run `git fetch origin` to update remote refs.
5. If the failure is a non-fast-forward rejection, run `git pull --rebase origin <branch>`.
6. If the rebase applies cleanly, rerun the task verification.
7. Run `git diff --cached --check` when staged files remain, or the work-type verification from `docs/automation/verification-commit-push-rules.md`.
8. Push again with `git push`.
9. Record the final short commit hash in Backlog, Done, and Runs only after the push succeeds.

Use the current branch name in place of `<branch>`. For this project the normal branch is `main`, but automation should verify it instead of assuming.

## Conflict Rules

If `git pull --rebase` reports conflicts:

1. Run `git status --short` to list conflicted paths.
2. Resolve only files that belong to the selected checklist task.
3. Preserve user-authored changes when both versions are valid; prefer the smallest merged result that keeps the task scope intact.
4. Rerun the same verification that passed before the push attempt.
5. Continue with `git rebase --continue`.
6. Push only after verification passes again.

If a conflict touches an unrelated dirty file, an untracked user asset, a secret file, or a file outside the selected task boundary, stop the rebase work and record an Issue. `git rebase --abort` may be used to return to the pre-rebase state when it avoids accidental conflict edits, but the blocked state must be recorded before ending the run.

## Google Sheets Recording

During a push failure:

- Keep the selected Backlog row as `in_progress` or change it to `blocked`/`review` if recovery cannot finish safely.
- Do not add a Done row until the delivered commit has pushed successfully.
- Add a Runs row for the attempt even when it blocks.
- Include the push failure type, rebase action, verification rerun, and final push result in `Runs.verification`.
- If user confirmation, credentials, network repair, or external secrets are required, add or update an Issues row and link it from the task.

Suggested `Runs.verification` wording:

```text
git push non-fast-forward 거절 확인; git fetch origin 및 git pull --rebase origin main 수행; 충돌 없음; git diff --check 통과; git push 성공
```

Suggested blocked wording:

```text
git push 거절 후 rebase 충돌 발생; 충돌 파일이 선택 작업 범위를 벗어나 사용자 확인이 필요해 Issue 기록 후 중단
```

## Automation Prompt Addition

Add this rule to recurring automation instructions when maintaining the schedule:

```text
푸시가 non-fast-forward로 거절되면 force push를 사용하지 않는다. git fetch origin 후 현재 브랜치에 대해 git pull --rebase를 수행하고, 충돌은 선택한 작은 작업 단위에 속한 파일만 해결한다. 충돌 해결 뒤 동일 검증을 다시 실행하고 push가 성공한 뒤에만 Backlog/Done/Runs에 완료와 commit hash를 기록한다. 충돌이 사용자 변경이나 선택 작업 밖의 파일에 닿으면 Issues에 기록하고 중단한다.
```

## Related Checklist Items

- `BK-020`: Korean commit message rules.
- `BK-061`: this push failure procedure.
- `BK-147`: recurring automation prompt baseline.
- `BK-149`: verification, commit, and push criteria.
- `BK-150`: automation dry-run checklist.
