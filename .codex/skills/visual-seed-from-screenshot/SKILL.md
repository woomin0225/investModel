---
name: "visual-seed-from-screenshot"
description: "Use when the user provides web or app screenshots and wants Codex to convert observable UI patterns into a project-specific initial design harness, component inventory, layout rules, and frontend implementation checklist without inventing unobserved brand direction."
---

# Visual Seed From Screenshot

<!--
이 스킬은 사용자가 제공한 화면 캡처를 프로젝트 초기 디자인 기준으로 바꾸는 프로젝트별 스킬입니다.
관찰 가능한 UI 요소만 추출하고, 사용자의 디자인 의도가 필요한 부분은 placeholder로 남깁니다.
-->

## Workflow

1. Inspect the screenshot visually.
2. Extract only observable facts:
   - layout
   - spacing rhythm
   - color candidates
   - typography clues
   - component patterns
   - navigation structure
   - density and hierarchy
3. Update `harness/design-harness.md`.
4. Propose component names and frontend tasks.
5. Mark uncertain or user-owned design choices as placeholders.

## Do Not

- Do not infer brand philosophy from a screenshot.
- Do not copy protected branding, logos, or distinctive assets.
- Do not claim exact color/spacing values unless measured from the image.
- Do not hide investment risk information for visual cleanliness.

