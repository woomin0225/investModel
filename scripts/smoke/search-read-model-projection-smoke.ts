/**
 * Verifies the BK-307 grouped search read-model projection contract.
 * This smoke is static and never opens a DB connection or calls external APIs.
 */

import fs from 'fs';
import path from 'path';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function assertIncludes(text: string, needle: string, message: string) {
  assertCondition(text.includes(needle), message);
}

const projection = readText('docs/database/search-read-model-projection.md');
const seedReadme = readText('docs/database/seeds/README.md');
const route = readText('app/api/search/route.ts');
const apiSmoke = readText('scripts/smoke/search-api-smoke.ts');
const dbml = readText('docs/database/invest-model.dbml');
const mysqlPlan = readText('docs/database/invest-model.mysql.sql');
const dtoContract = readText('docs/api/dto-contract.md');
const routeInventory = readText('docs/api/route-inventory.md');

[
  'investment_model',
  'signal_event',
  'feed_post',
  'investment_models',
  'model_signal_events',
  'feed_posts',
  'entity type',
  'public id',
  'Title',
  'Snippet',
  'Tags',
  'Permission Filter',
  'Allowed roles: `user`, `admin`',
  'Blocked roles: `public`, `creator`, `system`',
  'search_documents',
  'Representative Seed Verification',
  'No recommendation or suitability judgement',
  'No `TradeIntent` creation',
  'No external paid API',
  'readOnly: true',
  'realtimeExternalData: false',
  'brokerageConnection: false'
].forEach((needle) => {
  assertIncludes(projection, needle, `projection documents ${needle}`);
});

assertIncludes(
  seedReadme,
  'search-read-model-projection.md',
  'seed README links the grouped search projection contract'
);

[
  'readFeedPostDtos',
  'readModelCardDtos',
  'readSignalEventDtos',
  "role === 'user' || role === 'admin'",
  'Only signed-in user or admin roles can read grouped investModel search results.',
  'investmentModels',
  'feedPosts',
  'signalEvents',
  'sourceTables',
  'realtimeExternalData: false',
  'financialAdvice: false',
  'modelSelectionCreated: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'brokerageConnection: false'
].forEach((needle) => {
  assertIncludes(route, needle, `search route keeps ${needle}`);
});

[
  'public role is forbidden',
  'creator role is forbidden',
  'long q returns validation error',
  'search returns grouped result arrays',
  'public model identifiers only',
  'search keeps mock-safe API meta'
].forEach((needle) => {
  assertIncludes(apiSmoke, needle, `search API smoke covers ${needle}`);
});

[
  'Table search_query_logs',
  'Table investment_models',
  'Table model_signal_events',
  'Table feed_posts'
].forEach((needle) => {
  assertIncludes(dbml, needle, `DBML contains ${needle}`);
});

[
  'CREATE TABLE search_query_logs',
  'CREATE TABLE investment_models',
  'CREATE TABLE model_signal_events',
  'CREATE TABLE feed_posts'
].forEach((needle) => {
  assertIncludes(mysqlPlan, needle, `MySQL plan contains ${needle}`);
});

assertIncludes(
  dtoContract,
  '## `SearchResultDto`',
  'DTO contract documents SearchResultDto'
);
assertIncludes(
  routeInventory,
  '### `GET /api/search`',
  'route inventory documents GET /api/search'
);
