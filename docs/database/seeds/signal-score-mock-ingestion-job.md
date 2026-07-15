# Signal Score Mock Ingestion Job

BK-301 defines the tracked mock ingestion contract for appending
`signal_score_snapshots` after the canonical app seed has been applied. This is
seed/mock infrastructure only. It must not fetch external realtime search,
traffic, market, or AI provider data while IS-004 is open.

## Scope

- Source rows: `model_signal_events`, existing `signal_score_snapshots`, and
  existing `signal_score_inputs`.
- Writer: the backend/system job calls
  `calculateMockSignalScoreSnapshots({ capturedAt })`.
- Output rows: one new `signal_score_snapshots` row per public
  `SignalEvent`, plus weighted `signal_score_inputs` rows for that snapshot.
- Context: appended rows use mock/observed score evidence only. They are not
  recommendations, orders, broker instructions, portfolio reallocations, or
  legal conclusions.

## Job Contract

The first implementation surface is a manual or scheduled backend job wrapper
around `calculateMockSignalScoreSnapshots`.

Required inputs:

- `runId`: a caller-generated id such as `mock-signal-score-20260715T120000Z`.
- `capturedAt`: the timestamp to persist into `captured_at` and `created_at`.
- `actor`: fixed to `system` for scheduled/mock ingestion.
- `reason`: fixed to `scheduled_mock_signal_score_append` or
  `manual_mock_signal_score_append`.

Required behavior:

- Apply `docs/database/seeds/001_invest_model_domain_seed.sql` or another
  reviewed whole-file seed before local verification.
- Append, not mutate, `signal_score_snapshots`.
- Store all input rows in `signal_score_inputs` with visible mock source labels.
- Reuse seeded AI attention and model inclusion inputs when present.
- Calculate `rank_delta` from the latest previous snapshot for the same signal.
- Keep `calculation_context` in the mock-safe family:
  `mock_seed` for the current service, `scheduled_mock` for a future scheduled
  wrapper, or `external_review_required` only as a blocked placeholder.

Idempotency rule:

- A job wrapper must treat `(runId, signalPublicId)` as the logical idempotency
  key before inserting a snapshot.
- Until a `run_id` column or audit table is introduced, idempotency must be
  enforced by the wrapper before calling the service for the same `capturedAt`
  window.
- Do not add a MySQL console one-off row to compensate for a duplicate run.

Audit rule:

- Record the job result in a tracked run log or future `audit_logs` entry with
  `runId`, `actor=system`, inserted snapshot count, inserted input count,
  `capturedAt`, and `calculationContext`.
- Do not record secrets, paid API keys, external account identifiers, or broker
  payloads.

## Verification Query

Use a repeatable query after the whole-file seed plus one mock ingestion run:

```sql
SELECT
  mse.public_id AS signal_public_id,
  sss.total_score,
  sss.rank_value,
  sss.rank_delta,
  sss.calculation_context,
  sss.captured_at,
  COUNT(ssi.id) AS input_count
FROM signal_score_snapshots sss
JOIN model_signal_events mse ON mse.id = sss.signal_event_id
LEFT JOIN signal_score_inputs ssi ON ssi.score_snapshot_id = sss.id
WHERE mse.public_id LIKE 'sig_mock_%'
GROUP BY
  mse.public_id,
  sss.id,
  sss.total_score,
  sss.rank_value,
  sss.rank_delta,
  sss.calculation_context,
  sss.captured_at
ORDER BY sss.captured_at DESC, sss.rank_value ASC;
```

Expected result:

- Each mock `SignalEvent` has the original seed snapshot and at least one newer
  appended snapshot after a successful mock ingestion run.
- New snapshots have at least four weighted inputs unless the source weight map
  is intentionally narrowed in a reviewed code change.
- Rank changes are visible through `rank_delta`.

## Safety Boundaries

- No external paid API keys.
- No browser search volume or news traffic provider connection while IS-004 is
  open.
- No `TradeIntent` creation.
- No portfolio, MockDeposit, broker, bank, order, execution, fill, or account
  mutation.
- No legal, financial, suitability, buy, sell, hold, rebalance, or performance
  guarantee copy.

