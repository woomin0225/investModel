/**
 * Focused source smoke for BK-532/BK-533.
 * Guards Search suggestion chips wiring, 390px mobile wrapping, touch/focus/pressed
 * states, bottom-tab clearance, and seed/mock safety language without calling
 * live quote, external search, advice, order, TradeIntent, or brokerage paths.
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

function assertNoUnsafeInteractiveCta(label: string, source: string) {
  const unsafePattern =
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|ctaLabel)[\s\S]{0,320}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now|Live quote|External search)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe live-search or real-finance CTA appears near an interactive affordance`
  );
}

const searchPageSource = readProjectFile('app/invest-model/search/page.tsx');
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageSource = readProjectFile('package.json');
const suggestionSectionStart = searchPageSource.indexOf(
  'Search suggestion chips. Seed/mock shortcuts only'
);
const suggestionSectionEnd = searchPageSource.indexOf(
  '<div className="space-y-invest-card-gap">'
);
const suggestionSection = searchPageSource.slice(
  suggestionSectionStart,
  suggestionSectionEnd
);

assertCondition(
  suggestionSectionStart >= 0 &&
    suggestionSectionEnd > suggestionSectionStart &&
    suggestionSection.length > 0,
  'Search suggestion chips source range must be discoverable'
);

[
  'readSearchSuggestions',
  '@/app/api/search/suggestions/route',
  'readInvestModelSearchSuggestions',
  'InvestModelSearchSuggestions',
  'SearchSuggestionChip',
  "'x-invest-model-role': 'user'",
  'payload.data?.suggestions',
  "readState: 'loaded'",
  "suggestions.length > 0 ? 'loaded' : 'empty'",
  "readState: 'error_fallback'",
  'Search suggestion empty state',
  'Search suggestion error state'
].forEach((needle) =>
  assertIncludes(searchPageSource, needle, 'Search suggestion API/read-state wiring')
);

[
  'Seed suggestion chips',
  'read-only API loaded',
  'Search suggestion chips loaded state',
  'searchSuggestions.suggestions.map',
  'searchSuggestions.recentMockTerms',
  'searchSuggestions.safetySummary',
  'No live quote lookup / no',
  'external search / no advice / no orders / no brokerage',
  'Recent mock terms',
  'TradeIntent',
  'brokerage action'
].forEach((needle) =>
  assertIncludes(suggestionSection, needle, 'Search suggestion visible safety copy')
);

[
  'suggestionAccessibleLabel',
  'Seed/mock suggestion chip only',
  'no live quote lookup, external search, advice, order, TradeIntent, or brokerage action'
].forEach((needle) =>
  assertIncludes(searchPageSource, needle, 'Search suggestion accessibility safety copy')
);

[
  'flex flex-wrap gap-2',
  'min-h-invest-touch-target',
  'basis-full',
  'min-[360px]:basis-[calc(50%-4px)]',
  'focus-visible:ring-2',
  'focus-visible:ring-invest-primary',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-invest-bg',
  'active:scale-[0.98]',
  'truncate',
  'min-w-0',
  'inline-flex',
  'investMotionClass.interactiveControl',
  'withInvestModelLocale(suggestion.href, locale)'
].forEach((needle) =>
  assertIncludes(suggestionSection, needle, 'Search suggestion 390px/touch states')
);

[
  'env(safe-area-inset-bottom)',
  'pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)]',
  'BottomNav',
  'fixed inset-x-0 bottom-0 z-30 overflow-x-clip',
  'grid-cols-5',
  'data-touch-target="44px"',
  'min-h-invest-touch-target',
  "aria-current={isActive ? 'page' : undefined}",
  'active:scale-95',
  'focus-visible:ring-offset-invest-surface'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area/bottom-tab')
);

assertCondition(
  !/\b(?:fixed|sticky|w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
    suggestionSection
  ),
  'Search suggestion chips must stay in normal flow and avoid horizontal-scroll layout'
);

assertNoUnsafeInteractiveCta('Search suggestion chips', suggestionSection);

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
  'liveQuoteLookup',
  'externalSearchProvider',
  'externalApiKey',
  'brokerageAccountId',
  'brokerOrder',
  'realBalance',
  'guaranteed return',
  'risk free'
].forEach((needle) => {
  assertCondition(
    !searchPageSource.includes(needle),
    `Search suggestion page avoids unsafe term ${needle}`
  );
});

assertIncludes(
  packageSource,
  '"test:search-suggestion-chips": "npx tsx scripts/qa/search-suggestion-chips-smoke.ts"',
  'Package script'
);

console.log('PASS search suggestion chips smoke');
