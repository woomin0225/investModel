# investModel MVP Scope

<!--
This document defines what investModel may build in the first mobile/PWA MVP and what must stay out of scope.
It gives future agents a clear boundary before adding screens, APIs, mock data, DB mappings, or automation.
-->

## Product Stage

The first investModel stage is a mobile-first PWA prototype. It validates the model marketplace, mock portfolio display, model signals, feed, and review workflow without moving real money, connecting real accounts, executing real orders, or running uploaded AI model files.

The MVP should feel like a phone app, but its financial flows remain mock-only until explicit legal, security, and financial-operation review is recorded.

## In Scope

| Area | MVP allowance | Connected screens | Connected domain objects |
| --- | --- | --- | --- |
| Mobile shell | Safe-area layout, bottom tabs, PWA manifest, app icon, mobile-first routing | Home, Models, Signals, Feed, Portfolio | none |
| Model discovery | Show approved/live mock `InvestmentModel` cards with strategy summary, risk level, markets, and backtest labels | Discover Models, Model Detail | `InvestmentModel`, `ModelVersion`, `ModelRiskProfile`, `ModelDisclosure` |
| Model detail | Show model mandate, risk profile, forbidden assets, leverage policy, disclosures, and metadata-only artifact status | Model Detail | `PortfolioMandate`, `ModelDisclosure`, `ModelVersion` |
| Mock portfolio | Show selected model, mock balance, simulated allocation, sample positions, and pre-order activity | Home, Portfolio | `UserModelSelection`, `MockDeposit`, `Portfolio`, `PortfolioPosition` |
| Signals | Show observed mock market/news/traffic inputs and scores without converting them into recommendations | Realtime Signals | `SignalEvent`, `MarketInstrument`, `NewsArticle`, `NewsTrafficSnapshot` |
| Feed | Show informational model notes, market context, risk notes, and review notes | Feed Insights | `FeedPost`, `InvestmentModel`, `ModelDisclosure` |
| Review workflow design | Define draft, pending review, approved, live, paused, suspended, and retired state behavior | Creator/Admin future views | `ComplianceReview`, `AuditLog` |
| API contracts | Document and later implement mock-backed read APIs and model-selection simulation APIs | All MVP screens | DTOs mapped from `docs/domain/dbml-type-mapping.md` |
| Mock data | Keep UI and route development moving with explicit mock/backtest/placeholder labels | All MVP screens | `lib/mock/**` data aligned to DBML |

## Out Of Scope

These features must not be implemented in the first MVP:

- Real deposits, withdrawals, payments, bank account linking, or stored-value behavior.
- Real brokerage account linking, broker API calls, order placement, execution, fills, or settlement.
- Any type named or presented as `Order`, `BrokerOrder`, `Execution`, or `TradeFill`.
- User controls for personal risk appetite, stock/bond ratio, leverage preference, or direct allocation editing.
- Running, sandboxing, importing, or executing uploaded third-party AI model files.
- Claims that a model is legally approved, suitable for a user, guaranteed to profit, or protected from loss.
- Production use of paid market/news APIs or secrets.
- App Store or Play Store packaging decisions beyond PWA readiness notes.

## Review Required Later

These areas may be planned, but implementation must wait for explicit recorded review:

| Area | Required review | Reason |
| --- | --- | --- |
| Real money movement | `financial_operation`, `legal_review`, `security_review` | May trigger payment, custody, licensing, and consumer protection obligations. |
| Broker connection | `financial_operation`, `legal_review`, `security_review` | Could create regulated trading and account-access obligations. |
| External paid market/news APIs | `security_review` | Requires secret handling, provider terms, rate-limit policy, and data provenance. |
| Uploaded model files | `security_review`, `legal_review` | Requires malware scanning, sandboxing, model provenance, and liability review. |
| Performance or risk claim copy | `legal_review` | Must avoid misleading return, suitability, or loss-protection claims. |
| High-risk/leverage model publication | `legal_review`, `security_review` | Needs stronger disclosure, review workflow, and user acknowledgement. |
| Native app packaging | `security_review`, product decision | Needs store policy, signing, update, and device capability decisions. |

## MVP API Boundary

The MVP API layer may expose mock-backed or DB-backed DTOs for these flows:

- `GET /api/models` for `ModelCardDto[]`
- `GET /api/models/:id` for `ModelDetailDto`
- `GET /api/signals` for `SignalEventDto[]`
- `GET /api/feed` for `FeedPostDto[]`
- `POST /api/model-selections` for simulated model selection only
- `GET /api/portfolio/mock-summary` for `PortfolioSummaryDto`

Every response that contains money-like, performance-like, or trade-like data must carry enough fields or copy for the UI to mark it as mock, simulated, backtest, placeholder, or informational.

## UI Copy Boundary

Use plain product language such as:

- "mock balance"
- "simulated portfolio"
- "backtest placeholder"
- "observed signal"
- "pre-order simulation"
- "metadata-only model"

Avoid copy that implies:

- guaranteed profit
- legal approval
- user suitability
- real deposit
- real account balance
- executed order
- live brokerage connection

## Exit Criteria

The first MVP scope is satisfied when:

- The five mobile screens are implemented with mock data and no overlapping UI at 390px width.
- The PWA manifest, icon, theme color, and start URL are available.
- Model, signal, feed, portfolio, and selection API contracts are documented before backend implementation.
- Mock data is structured so it can later be replaced by DB/API reads without renaming core domain terms.
- Every money-like or trade-like UI element is clearly marked as mock or simulation.
- Real financial operations remain blocked and tracked through Issues or later review tasks.
