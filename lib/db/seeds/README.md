# Runtime Seed Helpers

This directory is reserved for TypeScript seed helpers that execute tracked seed
plans through the application database layer.

The existing `lib/db/seed.ts` remains the starter account/team seed. investModel
domain seed helpers should be added here after the matching DBML, SQL, Drizzle
schema, and migration files are ready.

## Rules

- Do not hardcode secrets or external API keys.
- Do not create real balances, deposits, orders, fills, broker accounts, or bank
  connections.
- Keep seed helpers idempotent so repeated local setup does not duplicate rows.
- Prefer public ids and deterministic sample values so UI smoke tests can read
  stable rows.
- Keep inserts aligned with `docs/database/seeds` and sample read-model files.
