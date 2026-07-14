# Model Version ORM Alignment Plan

BK-311 tracks the gap between the canonical database design and the current
Drizzle runtime schema for model detail, review, mandate, and performance read
models.

## Current State

- `docs/database/invest-model.dbml` defines `model_versions`,
  `portfolio_mandates`, `compliance_reviews`, and
  `model_performance_snapshots`.
- `docs/database/invest-model.mysql.sql` contains matching MySQL DDL for those
  tables and their foreign keys.
- `lib/db/schema.ts` currently stops at `investment_models`,
  `model_risk_profiles`, and `model_disclosures`.
- `lib/db/migrations` currently creates `users`, `teams`, model creator rows,
  `investment_models`, `model_risk_profiles`, and `model_disclosures`, but not
  the four ModelVersion-centered tables.

## Required Table Order

1. Add `model_versions`.
2. Add `investment_models.current_version_id` foreign key to
   `model_versions.id`.
3. Update `model_risk_profiles.model_version_id` and
   `model_disclosures.model_version_id` to reference `model_versions.id`.
4. Add `portfolio_mandates`.
5. Add `compliance_reviews`.
6. Add `model_performance_snapshots`.

The circular relationship between `investment_models.current_version_id` and
`model_versions.model_id` should be handled in migration order by creating
`model_versions` first with its `model_id` foreign key, then adding the
`current_version_id` foreign key after both tables exist.

## Runtime Schema Work

`lib/db/schema.ts` should add:

- `modelVersions`
- `portfolioMandates`
- `complianceReviews`
- `modelPerformanceSnapshots`

The existing `modelRiskProfiles` and `modelDisclosures` definitions should keep
their domain names but add explicit references to `modelVersions.id` once that
table exists in Drizzle.

Relations should support these read paths:

- InvestmentModel -> current ModelVersion
- InvestmentModel -> all ModelVersions
- ModelVersion -> PortfolioMandate
- ModelVersion -> ModelRiskProfile
- ModelVersion -> ModelDisclosure rows
- ModelVersion -> ModelPerformanceSnapshot rows
- ComplianceReview -> InvestmentModel, optional ModelVersion, optional reviewer

## Safety Boundaries

- `model_performance_snapshots` values are backtest or placeholder measurements,
  not future return promises.
- `compliance_reviews.status = approved` is an operator workflow state, not a
  legal suitability determination by Codex.
- `portfolio_mandates.user_override_allowed` must default to false for MVP work.
- This work must not add real order, broker, bank, deposit, or execution fields.

## Verification Plan

When the ORM and migration are implemented, verify with:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'model_versions',
    'portfolio_mandates',
    'compliance_reviews',
    'model_performance_snapshots'
  )
ORDER BY table_name;
```

Then check representative read-model joins:

```sql
SELECT im.slug, mv.version_label, pm.allowed_markets
FROM investment_models im
JOIN model_versions mv ON mv.model_id = im.id
LEFT JOIN portfolio_mandates pm ON pm.model_version_id = mv.id
LIMIT 5;
```

BK-311 should remain open until the Drizzle schema, migration, and local MySQL
table-existence verification are complete.
