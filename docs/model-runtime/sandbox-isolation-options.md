# Sandbox Isolation Options

Reviewed: 2026-07-14
Task: BK-066

This document records candidate isolation patterns for future external model execution. It does not approve model uploads, arbitrary code execution, broker integration, real deposits, real orders, or production financial automation. The current investModel runtime remains `metadata_only`, as defined in `docs/model-runtime/ai-model-runtime-approach.md`.

## Current Decision

Do not run creator-provided model files in the MVP.

The first safe implementation path is documentation and review only:

1. Keep `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, and `ModelRiskProfile` as metadata.
2. Use first-party mock logic for `SignalEvent`, `AllocationDecision`, `MockDeposit`, and simulated portfolio screens.
3. Reject executable uploads until `BK-067` defines an upload security policy.
4. Require separate `security_review`, marketplace review, and financial-operation review before a model output can influence anything beyond simulation.

## Candidate Options

| Option | Isolation strength | Operational complexity | Suitable phase | Notes |
| --- | --- | --- | --- | --- |
| No runtime, metadata only | Strongest because nothing executes | Low | MVP | Current default. Allows product learning without code execution risk. |
| Ephemeral Docker worker | Low to medium | Medium | Internal dry-run only | Must use strict CPU, memory, PID, filesystem, capability, and network controls. Not enough by itself for untrusted public model execution. |
| Kubernetes restricted job | Medium | High | Controlled staging | Add namespace-level policy, resource limits, read-only filesystem, non-root user, no privilege escalation, and no host mounts. |
| gVisor sandboxed container | Medium to high | Medium to high | Future dry-run candidate | Adds a user-space kernel boundary for container workloads, with compatibility testing required. |
| Firecracker or managed microVM | High | High | Future untrusted-code candidate | Stronger VM boundary, but requires runtime orchestration, image lifecycle, logging, cost, and operational ownership. |

## Baseline Controls For Any Future Sandbox

Any sandbox option must fail closed unless all controls are present:

- No outbound network by default.
- No access to application secrets, environment variables, auth cookies, payment keys, broker credentials, admin tokens, or service metadata.
- Read-only curated input bundle.
- Read-only root filesystem where supported.
- Non-root execution.
- No privilege escalation.
- Minimal Linux capabilities.
- CPU, memory, process, disk, and wall-clock limits.
- Immutable artifact hash and input bundle version on every run.
- Output schema validation before persistence.
- Audit log entry for artifact hash, `ModelVersion`, actor, policy version, result, timeout, and validation status.
- Output limited to a simulated `AllocationDecision` candidate or review artifact.
- No direct `TradeIntent` execution request and no broker or deposit side effect.

## Option Notes

### Metadata Only

This is the only approved MVP option. It prevents the most important class of runtime risk because creator code never runs. Product surfaces can still show model descriptions, mandate boundaries, risk notes, status transitions, and mock-only analysis.

### Ephemeral Docker Worker

Docker can enforce memory and CPU constraints, and Docker's `none` network driver can start a container with only loopback networking. Those controls are useful for internal dry-runs, but standard containers still share the host kernel and need hardening before any untrusted creator code is considered.

Minimum required flags or equivalents:

- `--network none`
- memory and CPU limits
- PID limit
- read-only root filesystem
- dropped capabilities
- no privileged mode
- no mounted Docker socket
- no host path mounts
- no secrets or app `.env` injection

### Kubernetes Restricted Job

Kubernetes can add scheduling, resource limits, namespaces, and policy enforcement. The future target must use the Restricted Pod Security profile or stricter equivalent, resource requests/limits, a non-root security context, disabled privilege escalation, read-only root filesystem, and no host namespaces or hostPath mounts.

Kubernetes is not a sandbox by itself. It is an orchestration layer that must be paired with runtime hardening and strong admission policy.

### gVisor Sandboxed Container

gVisor adds an application-kernel layer for containers and can run with Kubernetes through a runtime class. It is a plausible future dry-run option when compatibility with creator artifacts is acceptable and operational ownership is clear.

Before use, investModel needs:

- Runtime compatibility tests for supported languages and package formats.
- Performance and timeout benchmarks.
- Logging rules that prevent secret or user-data leakage.
- A policy for disabled syscalls, filesystem access, and network egress.

### Firecracker Or Managed MicroVM

Firecracker-style microVMs offer stronger isolation than standard containers by using a lightweight VM boundary. AWS Lambda MicroVMs are also based on Firecracker virtualization. This is the strongest candidate class for future untrusted model execution, but it is operationally heavy.

Before use, investModel needs:

- A worker control plane.
- Artifact image build and quarantine process.
- Per-run network and secret policy.
- Cost controls.
- Observability and audit retention.
- Incident response for malicious or runaway artifacts.

## No-Go Conditions

Stop implementation and record an Issue if any future task requires:

- Running uploaded creator code inside the Next.js app process.
- Passing `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, broker credentials, user holdings, or private account data into model code.
- Allowing outbound network access before a documented egress policy exists.
- Converting model output directly into a real order, broker request, deposit, withdrawal, or financial recommendation.
- Treating sandbox success as legal, suitability, or marketplace approval.
- Accepting executable artifacts before file type, dependency, malware, provenance, size, and checksum policy are defined.

## Recommended Next Step

Use `BK-067` to define the model upload security policy before any runnable artifact endpoint, worker, job queue, or sandbox proof-of-concept is added.

## Sources Checked

- Docker resource constraints: https://docs.docker.com/engine/containers/resource_constraints/
- Docker none network driver: https://docs.docker.com/engine/network/drivers/none/
- Kubernetes Pod Security Standards: https://kubernetes.io/docs/concepts/security/pod-security-standards/
- Kubernetes memory limits: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/
- Kubernetes security context: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/
- gVisor overview: https://gvisor.dev/docs/
- gVisor Kubernetes quick start: https://gvisor.dev/docs/user_guide/quick_start/kubernetes/
- Firecracker project: https://firecracker-microvm.github.io/
- AWS Lambda MicroVMs guide: https://docs.aws.amazon.com/lambda/latest/dg/lambda-microvms-guide.html
