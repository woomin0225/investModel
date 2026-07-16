/**
 * Verifies the documented IS-006 prototype auth boundary stays explicit.
 *
 * This smoke is intentionally static: it does not authenticate, mutate DB
 * rows, or bless x-invest-model-role as a production authorization source.
 */

import fs from 'node:fs';
import path from 'node:path';

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

const userScopeHelper = readText('lib/server/invest-model-user-scope.ts');
const portfolioRoute = readText('app/api/portfolio/mock-summary/route.ts');
const rbacMatrix = readText('docs/security/rbac-matrix.md');
const routeInventory = readText('docs/api/route-inventory.md');
const clientScopeSmoke = readText(
  'scripts/qa/invest-model-client-user-scope-smoke.ts'
);
const portfolioSmoke = readText(
  'scripts/smoke/portfolio-mock-summary-api-smoke.ts'
);

[
  'x-invest-model-role',
  'readInvestModelSessionRole',
  'resolveInvestModelUserScope',
  'user_demo_001',
  "return 'public'"
].forEach((needle) => {
  assertIncludes(userScopeHelper, needle, `user scope helper keeps ${needle}`);
});

assertIncludes(
  portfolioRoute,
  'const role = readInvestModelRole(request)',
  'portfolio route keeps the current explicit prototype header guard'
);
assertCondition(
  !portfolioRoute.includes('readInvestModelSessionRole'),
  'portfolio route session fallback has not silently changed without updating this boundary smoke'
);

[
  'prototype harness input',
  'not a production authorization source',
  'Portfolio mock summary currently keeps the stricter header-only prototype guard',
  'client `userPublicId` ignored',
  '`IS-006` remains in monitoring'
].forEach((needle) => {
  assertIncludes(rbacMatrix, needle, `RBAC matrix documents ${needle}`);
});

[
  'Client-provided `userPublicId` is ignored',
  'server resolves the current prototype scope',
  '/api/portfolio/mock-summary'
].forEach((needle) => {
  assertIncludes(routeInventory, needle, `route inventory documents ${needle}`);
});

assertIncludes(
  clientScopeSmoke,
  'clientUserPublicIdForwarding: false',
  'client user scope smoke reports userPublicId forwarding is blocked'
);
assertIncludes(
  portfolioSmoke,
  'client userPublicId does not switch or leak another portfolio scope',
  'portfolio smoke blocks client userPublicId scope switching'
);

console.log(
  'auth-user-scope-boundary smoke passed: IS-006 prototype role header and userPublicId boundaries are documented and guarded.'
);
