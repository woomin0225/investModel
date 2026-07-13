# Legal Terms And Risk Disclosure Placeholder Template

BK-099 defines the placeholder structure for future legal terms, product disclaimers, and model risk disclosures. This document is not legal advice, final terms, final disclosure text, investment advice, or a suitability decision. A qualified reviewer must replace or approve every placeholder before any public launch or external beta that relies on it.

## Placeholder Rules

- Use placeholders only to reserve location, review ownership, required context, and approval state.
- Do not treat any placeholder body as final legal, financial, tax, compliance, or investment language.
- Keep all user-facing copies visibly marked as requiring review until a reviewer supplies approved wording.
- Do not add claims about guaranteed returns, principal protection, regulatory compliance, suitability, or loss prevention.
- Keep `ModelDisclosure.requiresLegalReview` or the equivalent review flag set when wording is draft, sensitive, or reviewer-owned.
- Link production-visible disclosure changes to `ComplianceReview` and audit logs.

## Required Placeholder Surfaces

| Surface | Placeholder Owner | Required Context | Review Gate | Public Exposure Rule |
| --- | --- | --- | --- | --- |
| Terms of service | Legal reviewer | Product scope, user roles, jurisdiction, data handling, account limitations | `legal_review` | Do not expose as final terms until reviewed |
| General product disclaimer | Legal/compliance reviewer | MVP scope, mock-only state, no real deposits, no brokerage orders, no account linking | `legal_review` | May show as placeholder label only |
| Model risk disclosure | Legal/compliance reviewer | `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `ModelRiskProfile`, leverage policy, drawdown context | `legal_review` | User-facing model detail needs reviewed or approved-placeholder state |
| Performance methodology note | Compliance reviewer | Backtest source, sample period, fees/slippage assumptions, benchmark, limitations | `legal_review` | Never imply future returns |
| High-risk or leverage acknowledgement | Legal/compliance reviewer | High-risk reason, leverage allowance, max loss context, user acknowledgement requirement | `legal_review` | Keep gated until approved |
| Creator submission attestation | Legal/compliance reviewer | Creator responsibility, data provenance, prohibited claims, review workflow | `legal_review` | Creator-only draft until approved |
| Admin review notes | Admin/compliance reviewer | Review decision, reason code, linked model/version/disclosure id | `legal_review` when legal wording is involved | Internal only unless separately approved |

## Template Fields

Each legal or risk disclosure placeholder should carry these fields in docs, DTO planning, or future database records.

| Field | Purpose |
| --- | --- |
| `placeholderId` | Stable internal id for review tracking |
| `surface` | Screen, route, API DTO, email, or document where the copy will appear |
| `disclosureType` | `risk`, `performance`, `limitation`, `legal_placeholder`, or a reviewed extension |
| `audience` | `user`, `creator`, `admin`, `system`, or `public` |
| `owner` | Reviewer role that must provide or approve final wording |
| `sourceContext` | Linked `InvestmentModel`, `ModelVersion`, `PortfolioMandate`, `ModelRiskProfile`, or workflow |
| `draftBodyPlaceholder` | Short placeholder marker, not final copy |
| `requiresLegalReview` | Must remain true until approved by the reviewer |
| `reviewStatus` | `draft`, `pending_review`, `approved_placeholder`, `legal_review_required`, `rejected`, or `superseded` |
| `lastReviewedAt` | Timestamp when reviewer last acted |
| `reviewedBy` | Reviewer identity or role, never a secret |
| `auditEventName` | Audit event emitted when the placeholder changes state |

## Copy Slot Format

Use this format when a screen or document needs a placeholder block.

```text
[REQUIRES LEGAL/COMPLIANCE REVIEW]
Surface:
Audience:
Disclosure type:
Owner:
Source context:
Draft placeholder:
Blocked claims:
Review status:
Audit event:
```

`Draft placeholder` must describe the copy needed without writing final legal language. Example categories are "risk disclosure to be supplied by reviewer", "terms section to be supplied by reviewer", or "performance methodology note to be supplied by reviewer".

## Forbidden Placeholder Content

Do not write or approve placeholders that include:

- guaranteed return, no-loss, principal-protected, or risk-free claims
- statements that the service is legally approved, licensed, compliant, or suitable for a user
- instructions to buy, sell, hold, rebalance, deposit, withdraw, or connect a brokerage account
- statements that `MockDeposit` is real cash or that `TradeIntent` is a real order
- copied legal text from another product without review and provenance
- jurisdiction-specific legal conclusions without a reviewer

## Review Flow

| Step | Actor | Output |
| --- | --- | --- |
| Create placeholder | Product, creator, or admin workflow | `requiresLegalReview=true`, `reviewStatus=draft` |
| Submit for review | Creator or product owner | `reviewStatus=pending_review`, audit event recorded |
| Request changes | Admin/compliance reviewer | Reason code and notes recorded |
| Mark approved placeholder | Admin/compliance reviewer | Placeholder can be displayed as reviewed placeholder, not final legal advice |
| Require legal review | Admin/compliance reviewer | Public exposure blocked until qualified legal review |
| Supersede | System or admin | Prior placeholder retained for history |

## Current MVP Application

- Model Detail can show a reviewed placeholder label for risk, performance, limitation, and legal-placeholder sections.
- Feed Insights can show informational review notes, but not legal advice or investment recommendations.
- Creator draft flows can collect a disclosure placeholder field as draft metadata only.
- Admin review screens can route disclosure status changes, but Codex must not decide final legal suitability.
- Real deposits, real orders, account links, and paid external API integrations remain out of scope.

## Acceptance Checklist

| Check | Required |
| --- | --- |
| Placeholder fields exist for every legal/risk surface | Yes |
| Final legal wording is absent | Yes |
| `ModelDisclosure` and `ComplianceReview` are the canonical handoff objects | Yes |
| `MockDeposit` and `TradeIntent` are not described as real financial activity | Yes |
| User-facing exposure is blocked or visibly review-bound until approval | Yes |
| IS-001 and IS-003 remain open external blockers | Yes |
