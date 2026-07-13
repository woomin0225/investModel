<!--
This document defines the MVP-safe approach for registering and eventually executing external AI model artifacts.
AI workers must read it before implementing model upload, sandbox execution, runtime APIs, worker jobs, or marketplace review gates.
-->

# AI Model Runtime Approach

## Purpose

investModel will eventually allow creators to register AI investment models in a marketplace. In the first mobile/PWA MVP, external model files must not be uploaded for execution, imported into the app runtime, or connected to real money movement. This document records the safe default so future work can plan runtime support without accidentally opening a security or financial-operation boundary.

The current default artifact mode is `metadata_only`.

## MVP Runtime Boundary

Allowed in the MVP:

- Register `InvestmentModel` and `ModelVersion` metadata.
- Show creator-provided model descriptions, mandate summaries, risk notes, and disclosure placeholders.
- Store or display the intended `PortfolioMandate` as metadata.
- Show mock `SignalEvent`, mock `AllocationDecision`, and simulated portfolio data produced by first-party mock logic.
- Review marketplace copy and status transitions before a model becomes visible.

Blocked in the MVP:

- Running arbitrary Python, JavaScript, binaries, notebooks, containers, or model packages from creators.
- Uploading a model file and executing it in any local, server, browser, worker, or scheduled job context.
- Passing secrets, user account data, real holdings, brokerage data, or private market API credentials into an external model.
- Allowing model code to access the network, local filesystem, environment variables, process APIs, or service credentials.
- Treating model output as a real order, brokerage instruction, financial recommendation, or suitability decision.
- Connecting `TradeIntent` to real order placement, real deposits, real withdrawals, settlement, or broker execution.

## Runtime Phase Plan

External model execution can only move forward through explicit review gates:

1. `metadata_only` prototype: creator model details, mandate, risk profile, disclosures, and status workflow only.
2. Quarantined artifact upload: accept files only as inactive artifacts with checksum, ownership, version, and storage metadata.
3. Static analysis and scanning: verify file type, size, dependency manifest, malware scan result, and provenance signals.
4. Sandbox dry-run: run approved artifacts only with mocked inputs, no secrets, no real user data, and no outbound network.
5. Simulation-only runtime: validate outputs against an internal schema and convert them only into simulated `AllocationDecision` candidates.
6. Separate legal, security, and financial-operation review before any path can influence real trading or real money movement.

No phase may skip the recorded review state in `ComplianceReview` and `AuditLog`.

## Sandbox Requirements

Any future sandbox must be treated as a separate runtime boundary from the app server:

- Run in an isolated worker or container with strict CPU, memory, disk, and wall-clock limits.
- Disable outbound network by default.
- Mount only a read-only curated input bundle.
- Provide no application secrets, user credentials, payment credentials, brokerage credentials, or admin tokens.
- Use a generated run ID and immutable artifact hash for every execution.
- Validate all model outputs before storing them.
- Limit accepted output to an `AllocationDecision` candidate or review artifact, never a direct `TradeIntent` execution request.
- Record artifact hash, `ModelVersion`, input bundle version, sandbox policy version, output schema validation result, and actor.
- Fail closed when validation, timeout, dependency policy, scanning, or review state is missing.

## Security Risks

The following risks must stay visible in future checklist work:

- Supply-chain malware in model packages or dependency manifests.
- Data exfiltration through network calls, logs, generated outputs, or covert channels.
- Prompt injection or instruction injection inside model artifacts, prompts, market/news inputs, or creator descriptions.
- Resource abuse through infinite loops, large memory usage, file expansion, or dependency downloads.
- Attempts to read environment variables, filesystem paths, credentials, cookies, or service metadata.
- Misleading performance claims, hidden leverage behavior, or mandate drift across `ModelVersion` updates.
- Unauthorized trading implication when simulated output is presented too close to an order or recommendation.

## Review Gates

Required gates before expanding beyond `metadata_only`:

- `security_review`: required for artifact upload, storage, scanning, dependency policy, sandboxing, runtime workers, or API execution paths.
- `legal_review`: required for public model claims, high-risk/leverage models, user acknowledgements, or any real-money-adjacent behavior.
- `model_marketplace_review`: required before public visibility, status changes to `approved` or `live`, and changes to mandate, risk, disclosure, or performance copy.
- `financial_operation`: required before any output can affect deposits, withdrawals, broker connection, order placement, fills, or settlement.

If a gate is missing, the implementation must stop and record an Issue instead of filling in the missing decision.

## Related Checklist

- `BK-043`: Define model metadata upload fields while staying in `metadata_only`.
- `BK-066`: Investigate sandbox architecture only after security review scope is recorded.
- `BK-067`: Define model upload security policy before accepting executable artifacts.
