---
name: "zero-to-app-forge"
description: "Use when starting a brand-new app project from zero: choose or import a starter template, create project harnesses, create Codex custom agents, initialize Google Sheets-style backlog tracking, set up Git workflow rules, and produce the first implementation checklist."
---

# Zero To App Forge

<!--
이 스킬은 새 앱 프로젝트를 0에서 시작할 때 사용하는 공용 시작 스킬입니다.
특정 앱의 디자인/비즈니스 내용은 임의로 채우지 않고, 프로젝트별 하네스와 사용자 입력으로 분리합니다.
-->

## Workflow

1. Identify the product domain, user roles, core flows, and risk level.
2. Recommend a starter template only after matching the product needs.
3. Create a project harness set:
   - `core-harness.md`
   - `product-harness.md`
   - `design-harness.md`
   - `frontend-harness.md`
   - `backend-harness.md`
   - `security-harness.md`
   - `naming-harness.md`
   - domain-specific harnesses as needed
4. Create project-scoped custom agents under `.codex/agents`.
5. Create `AGENTS.md` with the harness order and workflow rules.
6. Create a Google Sheets-compatible backlog CSV.
7. Create Git commit and push rules.

## Rules

- Put a short top comment in every harness, custom agent, class, and interface explaining its role.
- Do not invent brand direction, legal conclusions, or business rules. Use placeholders where the user must decide.
- Prefer a vertical workflow with selective parallel subagents for exploration, review, and testing.
- Record risky or blocked items in the checklist instead of silently implementing them.

