<!--
이 폴더는 ComplianceReview, review 상태, 차단 사유, 위험 고지 라벨처럼 검토 경계를 맡는다.
Codex가 법률/금융 적합성 판단을 최종 확정하는 공간이 아니다.
-->

# Compliance Domain

Owns:

- `ComplianceReview`
- review status naming
- blocked reason labels
- risk notice labels

Rules:

- Treat legal/financial wording as review state, not final approval.
- Preserve auditability for model, disclosure, and status changes.
- Do not hide sensitive changes behind generic validation errors.
- Escalate real legal judgment, real fund movement, or real order execution to Issues.
