# Admin 2FA Review

This note records the `BK-090` security review for administrator two-factor authentication.

## Decision

Administrator accounts must require 2FA before any production or beta workflow allows high-impact admin actions.

For the current mock-only mobile/PWA MVP, 2FA is a required launch gate for admin actions, not an implemented provider integration in this work unit. The current implementation must not connect an external authenticator service, store OTP secrets, or request user secret values until a dedicated security task defines the provider, recovery flow, storage, and audit behavior.

## Scope

Applies to the `admin` role from the RBAC matrix:

- model review approval, rejection, and changes-requested actions
- model pause, suspend, retire, or forced stop actions
- disclosure review state changes
- audit log access
- any future action that can expose private review data or affect model availability

Does not apply as a hard requirement in this MVP note:

- public model browsing
- normal user model selection
- creator draft editing
- mock portfolio viewing
- system mock sync jobs

Creator 2FA remains recommended for later review, especially before creator identity verification, model file upload, payout, or external account features exist.

## Required Controls

Admin 2FA should be implemented with these minimum controls before production use:

- enforce 2FA after password login and before admin route access
- require recent 2FA confirmation for high-impact admin actions
- record audit events for enrollment, challenge success, challenge failure, recovery, and bypass attempts
- deny admin actions when 2FA is not enrolled or the challenge is stale
- keep recovery codes hashed, single-use, and never displayed after generation
- rate-limit challenges and recovery attempts
- avoid storing OTP seeds, recovery codes, or provider secrets in client-visible state

## Product Boundary

This review does not authorize real deposits, real brokerage orders, account connection, legal suitability decisions, or any external paid security provider setup. It only records the security requirement for future admin access control.

## Follow-Up Implementation Gate

Create a dedicated implementation task before adding 2FA code. That task should choose:

- provider or in-house TOTP strategy
- database fields and encryption strategy
- recovery-code lifecycle
- admin route guard behavior
- API error shape for missing or stale 2FA
- smoke tests for allowed, denied, and recovery cases

## Related Work

- `BK-021`: auth strategy
- `BK-079`: first security review
- `BK-090`: admin 2FA review
- `BK-141`: RBAC middleware/API guard design
- `IS-001`: external secret/build issue remains separate
- `IS-003`: real mobile-device verification was resolved on 2026-07-14 for the current mobile shell
