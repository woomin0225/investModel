/**
 * Focused source smoke for BK-571.
 * Verifies the Search empty-state groups stay 390px/mobile safe, navigate
 * through local seed links only, and avoid live/external finance affordances.
 */

import { readFileSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source: string, needle: string, label: string) {
  assertCondition(source.includes(needle), `${label}: missing ${needle}`);
}

function assertNotIncludes(source: string, needle: string, label: string) {
  assertCondition(!source.includes(needle), `${label}: unsafe ${needle}`);
}

function assertSourceRange(
  source: string,
  startNeedle: string,
  endNeedle: string,
  label: string
) {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);

  assertCondition(
    start >= 0 && end > start,
    `${label}: source range must be discoverable`
  );

  return source.slice(start, end);
}

function assertNoUnsafeInteractiveCta(label: string, source: string) {
  const unsafePattern =
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|ctaLabel)[\s\S]{0,360}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now|Live quote|External search)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe live-search or real-finance CTA appears near an interactive affordance`
  );
}

const searchPageSource = readProjectFile('app/invest-model/search/page.tsx');
const suggestionRouteSource = readProjectFile(
  'app/api/search/suggestions/route.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageSource = readProjectFile('package.json');

const groupedEmptySection = assertSourceRange(
  searchPageSource,
  'data-search-no-result-groups="local-seed-read-model-only"',
  'function EmptySearchResultCard',
  'Search grouped empty state'
);

[
  'GroupedSearchEmptyState',
  'SearchNoResultGroup',
  'SearchNoResultCategory',
  'noResultGroupAccessibleLabel',
  'searchSuggestions.noResultGroups',
  'payload.data?.groupedEmptyState?.groups',
  'payload.data?.noResultGroups',
  'Grouped empty-state suggestion cards',
  'suggestedSearches.map',
  'withInvestModelLocale(searchItem.href, locale)',
  'data-search-no-result-groups="local-seed-read-model-only"'
].forEach((needle) =>
  assertIncludes(searchPageSource, needle, 'Search empty-state wiring')
);

[
  'role="list"',
  'role="listitem"',
  'grid grid-cols-1 gap-2.5',
  'rounded-invest-card border border-invest-border bg-invest-bg-soft p-3 min-[390px]:p-4',
  'flex flex-wrap gap-2',
  'inline-flex min-h-invest-touch-target',
  'basis-full',
  'min-[390px]:basis-[calc(50%-4px)]',
  'min-w-0',
  '[overflow-wrap:anywhere]',
  'focus-visible:ring-2',
  'focus-visible:ring-invest-primary',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-invest-bg',
  'active:scale-[0.98]',
  'investMotionClass.interactiveControl'
].forEach((needle) =>
  assertIncludes(groupedEmptySection, needle, '390px grouped empty-state layout')
);

[
  'Local read model only / no',
  'no live quote lookup',
  'external search provider',
  'paid API',
  'advice',
  'order',
  'TradeIntent',
  'deposit action',
  'account data',
  'brokerage action',
  'no brokerage / no deposit action / no account data / no paid'
].forEach((needle) =>
  assertIncludes(groupedEmptySection, needle, 'Grouped empty-state safety copy')
);

[
  'readSearchNoResultSeedFixture',
  'toNoResultGroupDto',
  'suggestedSearches: group.suggestedKeywords.map',
  'groupedEmptyState',
  'groupedEmptyStateOnly: suggestions.length === 0',
  'localReadModelOnly: true',
  'realtimeExternalData: false',
  'externalSearchProvider: false',
  'liveQuoteLookup: false',
  'externalPaidApi: false',
  'financialAdvice: false',
  'modelSelectionCreated: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'realDeposit: false',
  'brokerageConnection: false',
  'accountData: false'
].forEach((needle) =>
  assertIncludes(suggestionRouteSource, needle, 'Search suggestion API safety meta')
);

[
  'env(safe-area-inset-bottom)',
  'pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)]',
  'fixed inset-x-0 bottom-0 z-30 overflow-x-clip',
  'grid-cols-5',
  'data-touch-target="44px"',
  'min-h-invest-touch-target',
  "aria-current={isActive ? 'page' : undefined}",
  'active:scale-95',
  'focus-visible:ring-offset-invest-surface'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area bottom tab')
);

assertCondition(
  !/\b(?:fixed|sticky|w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
    groupedEmptySection
  ),
  'Grouped empty-state suggestions must avoid horizontal-scroll or viewport-width layout'
);

assertNoUnsafeInteractiveCta('Grouped empty-state suggestions', groupedEmptySection);

[
  'Deposit now',
  'Connect brokerage',
  'Connect broker',
  'Place order',
  'Execute trade',
  'Buy now',
  'Sell now',
  'Submit order',
  'Open account',
  'Link account',
  'Invest now',
  'Start trading',
  'Trade now',
  'External search',
  'externalApiKey',
  'brokerageAccountId',
  'brokerOrder',
  'realBalance',
  'guaranteed return',
  'risk free'
].forEach((needle) =>
  assertNotIncludes(searchPageSource, needle, 'Search page forbidden wording')
);

assertIncludes(
  packageSource,
  '"test:search-empty-state-mobile": "npx tsx scripts/qa/search-empty-state-mobile-smoke.ts"',
  'Package script'
);

console.log('PASS search empty-state mobile smoke');
