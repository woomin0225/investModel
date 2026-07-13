# Legal And Financial Placeholder Map

Related task: BK-124

Review date: 2026-07-14

## Purpose

This document marks where legal or financial-review copy must remain as a placeholder in the investModel MVP. Codex may create structure, labels, and review routing, but must not finalize legal terms, suitability language, disclosure text, performance claims, or high-risk model warnings.

## Rules

- Use placeholder wording only until a qualified reviewer supplies final copy.
- Keep `mock`, `simulated`, `backtest`, `placeholder`, or `informational` context visible anywhere money-like, performance-like, or trade-like data appears.
- Do not say a model is legally approved, suitable for a user, guaranteed to profit, protected from loss, or safe for a specific investor.
- Do not hide review state behind generic validation errors. Use `review_required`, `policy_blocked`, or explicit placeholder labels.
- Link final-copy work to later legal/compliance tasks instead of editing copy directly in this MVP pass.

## Placeholder Inventory

| Area | Location | Placeholder owner | MVP handling | Review needed before |
| --- | --- | --- | --- | --- |
| Terms of service and legal disclaimer | Future legal/terms screen, onboarding, footer/help surfaces | Legal reviewer | Keep as "requires legal review" route or copy placeholder. | Public launch or external beta. |
| Model risk disclosure | `ModelDetailDto.disclosures`, model detail screen, admin review screens | Legal or compliance reviewer | Show risk context as review-bound placeholder. Do not claim suitability. | Publishing reviewed public copy. |
| Performance non-guarantee wording | model cards, model detail performance group, feed posts | Legal or compliance reviewer | Show `backtest placeholder`, volatility, max drawdown, and source labels together. | Any marketing/ranking/performance claim. |
| High-risk and leverage warning | model detail, risk badge group, admin review queue | Legal or compliance reviewer | Keep high-risk copy conservative and placeholder-bound. | Live publication of high-risk/leverage models. |
| Mock deposit and portfolio notices | Home, future portfolio screen, `PortfolioSummaryDto` notices | Product plus compliance reviewer | Mark balances and positions as mock or simulated. | Any real money or account-linked feature. |
| TradeIntent notices | Home activity, future decision timeline, API DTO notices | Product plus compliance reviewer | Present as pre-order simulation only. | Any broker order or execution integration. |
| Feed legal/review notes | Feed Insights, `FeedPostDto.notices` | Compliance reviewer | Keep informational, non-advice, and review-bound. | Public feed posts with sensitive claims. |
| Creator draft disclosure input | `/invest-model/creator/models/new`, creator draft API | Creator plus compliance reviewer | Accept placeholder field as draft metadata only. | Admin approval or public display as reviewed copy. |
| Admin disclosure review | admin review list/detail, future disclosure action API | Admin/compliance reviewer | Show review state and audit intent. Do not finalize legal approval by Codex. | Changing review state to production-visible. |
| API error and policy response copy | `ApiErrorDto`, `PolicyNoticeDto`, route errors | Product plus compliance reviewer | Use `review_required` with `legal_review` for final-copy blockers. | External or production API exposure. |
| DB disclosure storage | `model_disclosures.title/body/requires_legal_review` | Legal or compliance reviewer | Store placeholder or reviewed copy with review flag. | Treating stored body as final legal copy. |

## Current Evidence

- `docs/compliance/feature-review-matrix.md` classifies final legal disclaimer, terms, risk disclosure text, performance claims, and high-risk publication as `legal_review`.
- `docs/api/dto-contract.md` defines `DisclosureSummaryDto` with `type: 'legal_placeholder'` and `requiresLegalReview`.
- `docs/domain/dbml-type-mapping.md` maps `model_disclosures` to `ModelDisclosure` and says legal-placeholder text is not final legal advice.
- `lib/i18n/invest-model.ts` and mock detail/feed data already label final legal/financial copy as reviewer-supplied placeholder text.
- `docs/product/mvp-scope.md` requires visible mock/backtest/placeholder context for money-like, performance-like, and trade-like data.

## Implementation Notes

Frontend:

- Keep placeholder and review labels visible on mobile at 390px.
- Do not replace placeholder notices with polished marketing copy.
- Pair every performance value with context such as backtest, sample, placeholder, volatility, drawdown, or source.

API and domain:

- Preserve `requiresLegalReview`, `disclosureType`, `reviewLabel`, `notices`, and context fields in DTOs.
- Do not expose raw DB disclosure rows as public API responses.
- Do not add suitability, approval, guarantee, account, order, execution, fill, or settlement fields.

Database:

- `model_disclosures.requires_legal_review` remains the handoff flag.
- `compliance_reviews` records workflow state only. It must not be presented as a legal or financial suitability judgment.

## Follow-Up

- `BK-074` should review existing performance copy for return-guarantee risk.
- `BK-099` should define the placeholder surfaces for legal terms and risk-disclosure documents.
- Public launch copy must wait for an explicit legal/compliance review decision outside Codex.
