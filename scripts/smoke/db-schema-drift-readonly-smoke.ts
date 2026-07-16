import fs from 'node:fs';
import path from 'node:path';

type SourceKey = 'dbml' | 'sql' | 'schema';

type Source = {
  key: SourceKey;
  path: string;
  text: string;
};

const projectRoot = process.cwd();

const sources: Source[] = [
  {
    key: 'dbml',
    path: 'docs/database/invest-model.dbml',
    text: readProjectFile('docs/database/invest-model.dbml'),
  },
  {
    key: 'sql',
    path: 'docs/database/invest-model.mysql.sql',
    text: readProjectFile('docs/database/invest-model.mysql.sql'),
  },
  {
    key: 'schema',
    path: 'lib/db/schema.ts',
    text: readProjectFile('lib/db/schema.ts'),
  },
];

const sharedRuntimeTables = [
  'users',
  'model_creators',
  'investment_models',
  'model_versions',
  'model_risk_profiles',
  'model_disclosures',
  'portfolio_mandates',
  'compliance_reviews',
  'model_performance_snapshots',
  'market_instruments',
  'user_model_selections',
  'mock_deposits',
  'portfolios',
  'portfolio_positions',
  'allocation_decisions',
  'trade_intents',
  'model_signal_events',
  'signal_score_snapshots',
  'signal_score_inputs',
  'feed_posts',
  'feed_post_comments',
  'feed_post_reactions',
  'feed_post_saves',
  'feed_post_reads',
  'user_notifications',
];

const canonicalDocTables = [
  ...sharedRuntimeTables,
  'user_profiles',
  'search_query_logs',
  'portfolio_analysis_snapshots',
  'market_price_snapshots',
  'news_sources',
  'news_articles',
  'news_traffic_snapshots',
  'feed_post_ranking_snapshots',
  'audit_logs',
];

const canonicalTerms = [
  'mock_deposits',
  'trade_intents',
  'model_signal_events',
  'feed_posts',
  'user_notifications',
];

const allowedSchemaOnlyTables = [
  'teams',
  'team_members',
  'activity_logs',
  'invitations',
];

const expectedPlanningOnlyTables = [
  'user_profiles',
  'search_query_logs',
  'portfolio_analysis_snapshots',
  'market_price_snapshots',
  'news_sources',
  'news_articles',
  'news_traffic_snapshots',
  'feed_post_ranking_snapshots',
  'audit_logs',
];

const knownDriftTerms = [
  'display_name',
  'status',
  'source_article_id',
  'feed_post_ranking_snapshots',
];

const forbiddenRealExecutionTables = [
  'broker_orders',
  'order_executions',
  'executed_orders',
  'brokerage_accounts',
  'bank_accounts',
  'real_deposits',
  'payments',
  'withdrawals',
];

const sourcesByKey = Object.fromEntries(
  sources.map((source) => [source.key, source])
) as Record<SourceKey, Source>;

const dbmlTables = extractTables(sourcesByKey.dbml);
const sqlTables = extractTables(sourcesByKey.sql);
const schemaTables = extractTables(sourcesByKey.schema);

assertSameTableList(dbmlTables, sqlTables, 'DBML', 'SQL');

for (const table of sharedRuntimeTables) {
  for (const source of sources) {
    assertTable(source, table);
  }
}

for (const table of canonicalDocTables) {
  assertTable(sourcesByKey.dbml, table);
  assertTable(sourcesByKey.sql, table);
}

for (const table of expectedPlanningOnlyTables) {
  assert(
    !schemaTables.has(table),
    `planning-only table ${table} should stay documented before runtime schema adoption`
  );
}

for (const table of allowedSchemaOnlyTables) {
  assertTable(sourcesByKey.schema, table);
  assert(
    !dbmlTables.has(table) && !sqlTables.has(table),
    `starter-only runtime table ${table} should not be in canonical DBML/SQL`
  );
}

for (const term of canonicalTerms) {
  for (const source of sources) {
    assertIncludes(source, term, `canonical term ${term}`);
  }
}

for (const term of knownDriftTerms) {
  assertIncludes(
    {
      key: 'dbml',
      path: 'docs/database/schema-drift-readonly-check.md',
      text: readProjectFile('docs/database/schema-drift-readonly-check.md'),
    },
    term,
    `documented drift term ${term}`
  );
}

for (const table of forbiddenRealExecutionTables) {
  for (const source of sources) {
    assertNoTable(source, table);
  }
}

console.log(
  JSON.stringify(
    {
      status: 'pass',
      checkedSources: sources.map((source) => source.path),
      sharedRuntimeTables: sharedRuntimeTables.length,
      canonicalDocTables: canonicalDocTables.length,
      expectedPlanningOnlyTables: expectedPlanningOnlyTables.length,
      allowedSchemaOnlyTables: allowedSchemaOnlyTables.length,
      forbiddenRealExecutionTablesAbsent:
        forbiddenRealExecutionTables.length,
      note:
        'Read-only drift smoke; no DB connection, migration, external API, live order, or fund movement.',
    },
    null,
    2
  )
);

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function assertTable(source: Source, table: string) {
  const found = hasTable(source, table);
  assert(
    found,
    `${source.path} is missing canonical table ${table}`
  );
}

function assertNoTable(source: Source, table: string) {
  const found = hasTable(source, table);
  assert(
    !found,
    `${source.path} must not define real execution table ${table}`
  );
}

function assertIncludes(source: Source, term: string, label: string) {
  assert(source.text.includes(term), `${source.path} is missing ${label}`);
}

function hasTable(source: Source, table: string): boolean {
  if (source.key === 'dbml') {
    return new RegExp(`\\bTable\\s+${escapeRegex(table)}\\s*\\{`).test(
      source.text
    );
  }

  if (source.key === 'sql') {
    return new RegExp(
      `\\bCREATE\\s+TABLE\\s+\`?${escapeRegex(table)}\`?\\s*\\(`,
      'i'
    ).test(source.text);
  }

  return new RegExp(
    `\\bmysqlTable\\(\\s*['"]${escapeRegex(table)}['"]`
  ).test(source.text);
}

function extractTables(source: Source): Set<string> {
  const tablePattern =
    source.key === 'dbml'
      ? /\bTable\s+([a-z0-9_]+)\s*\{/g
      : source.key === 'sql'
        ? /\bCREATE\s+TABLE\s+`?([a-z0-9_]+)`?\s*\(/gi
        : /\bmysqlTable\(\s*['"]([a-z0-9_]+)['"]/g;

  return new Set(
    Array.from(source.text.matchAll(tablePattern), (match) => match[1])
  );
}

function assertSameTableList(
  left: Set<string>,
  right: Set<string>,
  leftLabel: string,
  rightLabel: string
) {
  const leftOnly = [...left].filter((table) => !right.has(table));
  const rightOnly = [...right].filter((table) => !left.has(table));

  assert(
    leftOnly.length === 0 && rightOnly.length === 0,
    `${leftLabel}/${rightLabel} table drift detected: ${leftLabel}-only=${leftOnly.join(
      ','
    )}; ${rightLabel}-only=${rightOnly.join(',')}`
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
