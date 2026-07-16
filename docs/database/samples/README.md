# Database Sample Artifacts

This directory is for sample datasets, representative query outputs, and
read-model examples that explain what the UI should display from the database.

Use this directory when a task needs to show expected rows or screen-facing
sample values without applying them directly to MySQL.

## Roles

- Keep example rows aligned with `docs/database/seeds`.
- Keep screen read-model examples aligned with `docs/api` DTO contracts.
- Label simulated money, observed signals, and informational feed content
  clearly.
- Avoid secrets, real accounts, real orders, broker connections, or paid API
  assumptions.

## Planned Files

- `user-1-home-read-model.sample.sql`
- `signals-score-read-model.sample.sql`
- `feed-detail-interactions.sample.sql`
- `user-notifications-sample.sql`
- `portfolio-timeline-read-model.sample.sql`
- `price-history-read-model.sample.sql`
- `my-page-read-model.sample.sql`
