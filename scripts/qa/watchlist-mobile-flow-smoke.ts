/**
 * Focused mobile/source smoke for the Home watchlist seed flow.
 * It guards 390px layout, loading/empty/error/loaded states, safe-area
 * bottom-tab coexistence, and mock-only safety copy without opening a browser.
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

function assertNoViewportOverflow(label: string, source: string) {
  assertCondition(
    !/\b(?:w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
      source
    ),
    `${label}: viewport-width or horizontal-scroll layout class found`
  );
}

function assertNoUnsafeInteractiveCta(label: string, source: string) {
  const unsafePattern =
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|label)[\s\S]{0,260}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now|Order now)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe real-finance CTA appears near an interactive affordance`
  );
}

function assertNoLongUnbrokenText(label: string, values: string[]) {
  const maxUnbrokenLength = 42;
  const longTokens = values
    .flatMap((value) => value.split(/\s+/))
    .map((token) => token.replace(/[.,;:()"'`]/g, ''))
    .filter((token) => token.length > maxUnbrokenLength);

  assertCondition(
    longTokens.length === 0,
    `${label}: long unbroken mobile text token found: ${longTokens.join(', ')}`
  );
}

const watchlistPanelSource = readProjectFile(
  'components/invest-model/watchlist-seed-panel.tsx'
);
const homePageSource = readProjectFile('app/invest-model/page.tsx');
const homeLoadingSource = readProjectFile('app/invest-model/loading.tsx');
const watchlistApiRouteSource = readProjectFile(
  'app/api/watchlist/mock-summary/route.ts'
);
const watchlistReadModelSource = readProjectFile(
  'lib/db/watchlist-read-model.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const visualSmokeSource = readProjectFile(
  'scripts/qa/invest-model-visual-structure-smoke.ts'
);
const packageJsonSource = readProjectFile('package.json');

[
  "'use client'",
  '/api/watchlist/mock-summary?limit=3',
  'x-invest-model-role',
  "status: 'loading'",
  "status: 'empty'",
  "status: 'error'",
  "status: 'loaded'",
  'WatchlistLoadingRows',
  'role="status"',
  'role="list"',
  'role="listitem"',
  'EmptyStateCta',
  'AlertCircle',
  'ShieldCheck',
  'sectionAccessibleLabel',
  'safetySummary',
  'Observation watchlist',
  'Loading seed/mock watchlist observations',
  'Watchlist could not be read',
  'Browse mock observations',
  'seed/read-model',
  'simulation only',
  'no live trading',
  'no brokerage',
  'not advice',
  'No live market data, advice, real deposit, live order, or brokerage connection is connected'
].forEach((needle) =>
  assertIncludes(watchlistPanelSource, needle, 'Watchlist seed panel')
);

[
  'grid-cols-[2rem_minmax(0,1fr)]',
  'min-[390px]:grid-cols-[2rem_minmax(0,1fr)_auto]',
  'col-span-2 flex min-w-0 flex-wrap',
  'min-[390px]:col-span-1 min-[390px]:block min-[390px]:text-right',
  'line-clamp-2',
  'break-words',
  '[overflow-wrap:anywhere]',
  'investCardClass.listRail',
  'investMotionClass.interactiveCard'
].forEach((needle) =>
  assertIncludes(watchlistPanelSource, needle, 'Watchlist 390px row layout')
);

assertNoViewportOverflow('Watchlist seed panel', watchlistPanelSource);
assertNoUnsafeInteractiveCta('Watchlist seed panel', watchlistPanelSource);

assertIncludes(homePageSource, 'WatchlistSeedPanel', 'Home page wiring');
assertCondition(
  homePageSource.indexOf('<WatchlistSeedPanel locale={locale} />') >
    homePageSource.indexOf('metricSummaryItems.map'),
  'Watchlist should render after the Home summary metric rail'
);
assertCondition(
  homePageSource.indexOf('<WatchlistSeedPanel locale={locale} />') <
    homePageSource.indexOf('<ModelCard'),
  'Watchlist should render before the active model card stack'
);

[
  'Loading mock seed watchlist read model',
  'No live market data, advice, real deposit, order, or brokerage connection is loading',
  'grid-cols-[2rem_minmax(0,1fr)]',
  'min-[390px]:grid-cols-[2rem_minmax(0,1fr)_auto]',
  'motion-safe:animate-pulse'
].forEach((needle) =>
  assertIncludes(homeLoadingSource, needle, 'Home watchlist loading skeleton')
);

[
  'readInvestModelWatchlistSeedFixture',
  'canReadWatchlist',
  "role === 'user' || role === 'admin'",
  'parseWatchlistLimit',
  'mockOnly',
  'simulated',
  'readOnly',
  'realDeposit',
  'realOrder',
  'brokerageConnection',
  'financialAdvice',
  'TradeIntent',
  'orders',
  'deposits',
  'brokerage actions'
].forEach((needle) =>
  assertIncludes(watchlistApiRouteSource, needle, 'Watchlist API route safety')
);

[
  'InvestModelWatchlistReadModel',
  'investModelWatchlistSeedFixture',
  'generatedFrom',
  'SignalEvent',
  'modelVersionPublicId',
  'linkedModelName',
  'mockOnly: true',
  'simulated: true',
  'liveMarketData: false',
  'externalPaidApi: false',
  'realDeposit: false',
  'brokerageConnection: false',
  'financialAdvice: false'
].forEach((needle) =>
  assertIncludes(watchlistReadModelSource, needle, 'Watchlist read model')
);

[
  'env(safe-area-inset-bottom)',
  'pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)]',
  'BottomNav',
  'fixed inset-x-0 bottom-0 z-30 overflow-x-clip',
  'data-touch-target="44px"',
  'min-h-invest-touch-target',
  'focus-visible:ring-offset-invest-surface'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area/bottom-tab')
);

[
  'watchlistSeedPanelSource',
  '/api/watchlist/mock-summary?limit=3',
  'No live market data, advice, real deposit, live order, or brokerage connection is connected',
  'Deposit now',
  'Connect brokerage',
  'Place order'
].forEach((needle) =>
  assertIncludes(visualSmokeSource, needle, 'Global visual structure watchlist guard')
);

assertIncludes(
  packageJsonSource,
  '"test:watchlist-mobile-flow": "npx tsx scripts/qa/watchlist-mobile-flow-smoke.ts"',
  'package script'
);

assertNoLongUnbrokenText('Watchlist English mobile copy', [
  'Observation watchlist',
  'Shows selected model and SignalEvent seed rows in a scan-friendly home order.',
  'Loading seed/mock watchlist observations',
  'Watchlist could not be read',
  'Home does not try live market data, real deposits, orders, or brokerage connections when this read fails.',
  'Shows only mock seed and DB read-model observations.',
  'No live market data, advice, real deposit, live order, or brokerage connection is connected.'
]);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Home watchlist focused mobile flow smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'watchlist loading/empty/error/loaded states',
        '390px row grid and wrapping',
        'home page placement',
        'home loading skeleton',
        'safe-area bottom navigation',
        'read-only API and seed safety meta',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
