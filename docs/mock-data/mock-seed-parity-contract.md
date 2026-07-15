# Mock Seed Parity Contract

This contract keeps the current UI mock fixtures aligned with the tracked
investModel DB seed without requiring a schema change, a one-off MySQL edit, or
any external provider.

## Scope

- Source fixtures:
  - `lib/mock/invest-model-discovery.ts`
  - `lib/mock/invest-model-feed.ts`
  - `lib/mock/invest-model-signals.ts`
  - `lib/mock/invest-model-portfolio.ts`
- Canonical seed:
  - `docs/database/seeds/001_invest_model_domain_seed.sql`
- Future mapper boundary:
  - `toDbSeedRows`

## Required Public Id Families

Fixture-to-seed mappers must preserve public identifiers as public identifiers.
They must not expose numeric database ids to screens, API DTOs, smoke tests, or
seed import logs.

| Domain | Seed id family | Fixture contract |
| --- | --- | --- |
| User | `user_demo_001` | Demo-only user context, never real customer data |
| Model | `model_demo_signal_001` | Public model id remains stable across routes and seed rows |
| Model version | `model_version_demo_signal_001` | Version id is explicit and seedable |
| Signals | `sig_mock_*` | SignalEvent rows remain observation-only |
| Feed | `feed_mock_*` | FeedPost rows remain commentary/context only |
| Portfolio selection | `selection_demo_signal_001` | Selection is mock/simulated and not account-linked |

## Money And Trade Boundary

All money-like, performance-like, and trade-like rows must carry mock context.

- `MockDeposit` is a simulated display source only.
- `TradeIntent` may be represented only as a pre-order simulation boundary.
- `blocked_policy_check` is the expected seed status for any order-like sample.
- Backtest and simulated values must not imply live returns or real assets.
- The seed and fixtures must state that there is no real deposit, no real order,
  no brokerage connection, no bank connection, no execution, and no fill.

## External Data Boundary

The parity path is deterministic.

- No real market data fetch.
- No live news traffic fetch.
- No external paid API.
- No secret or provider credential.
- No legal judgement text beyond placeholder/review-required copy.

## Mapper Expectations

When `toDbSeedRows` is introduced for these domains, it must:

1. Accept deterministic fixture objects and an injectable context.
2. Return seed-shaped rows without opening DB connections.
3. Keep decimal and money-like values string-based where DTO contracts require it.
4. Preserve `mock_seed`, `simulated`, `backtest`, or `placeholder` context labels.
5. Refuse forbidden fields such as `realBalance`, `brokerAccount`,
   `orderExecution`, `tradeFill`, `brokerOrder`, or `cashBalance`.

## Verification

Run the static smoke before treating fixture/seed parity work as done:

```bash
npx tsx scripts/smoke/mock-seed-parity-contract-smoke.ts
```

The smoke reads only tracked files and validates public id families, mock context
labels, and the no-real-money/no-real-order boundary.
