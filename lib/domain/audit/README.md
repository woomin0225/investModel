<!--
이 폴더는 AuditLog로 이어질 actor, resource, action 이름의 경계를 맡는다.
상태 전이와 관리자/제작자 주요 액션은 나중에 이 경계를 통해 추적 가능해야 한다.
-->

# Audit Domain

Owns:

- audit actor labels
- audit resource labels
- audit action names
- future audit event mapping

Rules:

- Important creator/admin/system actions should be representable as audit events.
- Do not put UI rendering or database adapter code here.
- Keep action names stable enough to be reused by tests, API guards, and admin views.
- If an action changes model state, portfolio state, review state, or permissions, plan an audit event.
