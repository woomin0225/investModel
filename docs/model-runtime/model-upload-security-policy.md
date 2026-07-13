# Model Upload Security Policy

Reviewed: 2026-07-14
Task: BK-067

This policy defines the minimum security rules before investModel accepts any creator-provided model artifact. It does not approve executable upload endpoints, sandbox execution, broker integration, real deposits, real orders, legal suitability decisions, or production financial automation.

The current runtime remains `metadata_only`.

## Policy Decision

No creator model artifact may be executed in the MVP.

Uploads, when later introduced, must start as quarantined inactive artifacts attached to a `ModelVersion`. They may support review, checksum tracking, and provenance records only. A separate `security_review` is required before any artifact moves from storage to scanning, dry-run, or sandbox execution.

## Allowed Artifact Classes

Only allow the smallest set of formats needed for the next reviewed phase.

| Phase | Allowed class | Execution allowed | Notes |
| --- | --- | --- | --- |
| MVP | Metadata fields only | No | Current default. No binary, archive, notebook, script, or model package upload. |
| Quarantine review | Inactive artifact record | No | Store object metadata, checksum, declared type, and review status only. File bytes stay inaccessible to runtime code. |
| Static review candidate | Plain manifest plus documented weights or config | No | Requires explicit allowlist and scanning tools before implementation. |
| Sandbox dry-run candidate | Reviewed package format | Mock-only sandbox | Requires `BK-066` sandbox controls and separate approval. |

Initial implementation should prefer metadata and manifests over executable code. If a file upload feature is added, start with documentation artifacts or non-executable manifests, not Python, JavaScript, notebooks, binaries, or containers.

## Default Blocklist

Reject these until a later security review explicitly allows a narrow subset:

- Executables, binaries, shared libraries, shell scripts, PowerShell scripts, Python scripts, JavaScript/TypeScript scripts, notebooks, macros, and containers.
- Archives that require extraction, including zip, tar, gzip, 7z, rar, and nested archives.
- Files with multiple extensions or misleading names, such as `model.pkl.exe` or `report.pdf.js`.
- Files with missing, unknown, or mismatched extension, MIME type, and file signature.
- Files that exceed documented size, file count, path length, or decompressed-size limits.
- Files containing secrets, API keys, broker credentials, payment keys, private user data, or production account identifiers.
- Files that declare dependencies, install commands, post-install scripts, network fetches, or privileged runtime requirements.

## Required Validation Pipeline

Before any future file bytes are persisted as an artifact, the upload path must enforce:

1. Authenticated creator identity and ownership check.
2. CSRF protection or equivalent same-site request protection.
3. Server-side allowlist validation for extension and artifact class.
4. MIME type check as a signal only; never trust `Content-Type` by itself.
5. File signature or magic-byte verification where a signature exists.
6. Generated storage filename; never use the user-provided filename as a storage path.
7. Filename length and character limits for display names.
8. Strict file size and request size limits.
9. Checksum calculation before storage.
10. Storage outside the app runtime and outside any public webroot.
11. Malware scan or sandbox scan before any review status can become `scan_passed`.
12. Dependency and manifest policy review before any future dry-run.
13. Audit log entry for creator, `ModelVersion`, checksum, size, declared type, validation result, scanner result, and reviewer action.

If any step is missing, the artifact status must stay `blocked` or `quarantined`.

## Artifact Statuses

Use explicit states that cannot be confused with executable readiness:

```text
not_allowed -> quarantined -> validation_failed
not_allowed -> quarantined -> scan_pending -> scan_failed
not_allowed -> quarantined -> scan_pending -> scan_passed -> review_pending
review_pending -> approved_for_metadata_only
review_pending -> rejected
```

No state in this policy means "approved for execution". A future execution state must be added only after a separate security review and sandbox implementation.

## Storage Rules

- Store file bytes in isolated object storage or a separate file service, not in the Next.js app filesystem.
- Use generated object keys based on artifact ID and checksum.
- Keep original filenames as display metadata only after sanitization.
- Serve downloads through an authorization-checking handler, not a direct public URL.
- Prefer octet-stream downloads for review artifacts.
- Never mount artifact storage into the app server or model runtime with write access.
- Never pass app `.env` values, `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, broker credentials, or user holdings to artifact scanning or review workers.

## Review Roles

| Actor | Allowed | Not allowed |
| --- | --- | --- |
| Creator | Submit metadata and later upload inactive artifacts after feature approval | Mark scans passed, approve public visibility, execute artifacts |
| Admin reviewer | Review metadata, reject artifacts, request changes, view scanner result summaries | Override missing scan/security gates without audit |
| Security reviewer | Approve policy changes, allowed artifact classes, scanners, sandbox transitions | Approve real financial operations alone |
| System worker | Calculate checksum, run scanner, write audit result | Read app secrets, create `TradeIntent`, connect broker APIs |

## Hard Stop Conditions

Stop implementation and record an Issue if a future task requires:

- Executing uploaded code in the app server, browser, CI runner, or unsandboxed worker.
- Accepting archives before zip-slip, path traversal, decompressed-size, and nested-archive rules exist.
- Storing uploaded files in a public directory or serving them directly by user-supplied path.
- Relying only on client-side validation, file extension, or `Content-Type`.
- Passing secrets, user holdings, payment keys, broker credentials, or production environment variables to uploaded artifacts.
- Converting artifact output into `TradeIntent`, real orders, deposits, withdrawals, or recommendations.
- Treating scan success as marketplace approval, legal approval, or financial suitability approval.

## Verification Checklist For Future Implementation

- Unit tests reject blocked extensions, spoofed MIME types, and mismatched signatures.
- Unit tests reject path traversal and generated-name bypass attempts.
- Size limit tests cover request body and stored object limits.
- Authorization tests prove creators cannot read or mutate other creators' artifacts.
- Audit tests prove every upload, validation failure, scan result, review action, and status transition is recorded.
- UI copy labels artifacts as inactive and not executable.
- Smoke tests prove no upload can produce `AllocationDecision`, `TradeIntent`, `MockDeposit`, or broker side effects.

## Sources Checked

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Unrestricted File Upload: https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload
- OWASP Web Security Testing Guide, unexpected file types: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types
- OWASP ASVS project: https://owasp.org/www-project-application-security-verification-standard/

## Related Work

- `BK-066`: sandbox isolation options.
- `BK-091`: webhook signature verification, separate from model artifact uploads.
- `IS-001`: remains open because real Stripe secrets are not provided or configured here.
- `IS-003`: remains open because this policy does not replace real phone-device verification.
