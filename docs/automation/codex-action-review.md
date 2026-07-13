# Codex Action Review

This note records whether investModel should add the Codex GitHub Action after the basic CI workflow.

## Scope

- Task: `BK-063`
- Reviewed date: `2026-07-14`
- Sources:
  - OpenAI Codex GitHub Action docs: <https://developers.openai.com/codex/github-action>
  - OpenAI codex-action security notes: <https://github.com/openai/codex-action/blob/main/docs/security.md>
- Decision level: engineering recommendation only, not a security approval.

## Current Recommendation

Do not enable Codex-driven automatic fixes yet.

The safe next step is a future read-only pull request review workflow, gated by explicit maintainer control, after repository secrets and branch protection are reviewed. The action requires an OpenAI API key stored as a GitHub secret, and investModel already has open secret/build setup risk in `IS-001`.

## Acceptable Future Use

A narrow first workflow may be considered when all conditions below are true:

- Trigger only on `pull_request` from trusted branches or after explicit maintainer approval.
- Use a prompt file committed under `.github/codex/prompts/`.
- Use read-only repository permissions for the Codex job.
- Avoid applying patches automatically.
- Post feedback in a separate job with only the minimum GitHub permissions needed.
- Keep Codex as the final step in its job or pass output to another isolated job.
- Store `OPENAI_API_KEY` only as a GitHub secret.
- Keep the action away from production deploy, brokerage, payment, account, or legal-copy workflows.

## Risks To Control

- Secret exposure: the action needs an API key and must not run in an unsafe mode on shared runners.
- Prompt injection: PR titles, descriptions, commit messages, screenshots, and repository instruction files can contain untrusted instructions.
- Overbroad permissions: automatic patching or write permissions could change product, compliance, or CI behavior without a reviewer.
- Financial misunderstanding: Codex feedback must not finalize investment, legal, disclosure, deposit, or order-execution copy.
- Cost and abuse: broad actor allowlists could allow untrusted use of the API key quota.

## Required Guardrails Before Enabling

- Branch protection requires human review before merge.
- GitHub Actions permissions default to least privilege.
- Allowed actors are restricted to trusted maintainers or default write collaborators.
- Prompts explicitly restate investModel boundaries:
  - `InvestmentModel` is a marketplace item, not a personalized advisor.
  - `PortfolioMandate` is model-owned and not user-edited in MVP.
  - `MockDeposit` is simulation-only.
  - `TradeIntent` is pre-order simulation only.
  - Real deposits, orders, broker accounts, legal conclusions, and final disclosure copy are out of scope.
- The workflow never receives user secrets beyond the dedicated API key.
- Review output is advisory and must not be treated as approval.

## Deferred Implementation Shape

If adopted later, start with a separate workflow such as `.github/workflows/codex-review.yml`:

- `permissions.contents: read`
- no checkout credentials persistence
- `openai/codex-action@v1`
- prompt file under `.github/codex/prompts/review.md`
- no auto-commit
- optional PR comment publishing in a separate, minimal-permission job

## Non-Goals

- No automatic code modification.
- No automatic dependency upgrade.
- No production deployment.
- No real financial operation.
- No legal or compliance approval automation.

