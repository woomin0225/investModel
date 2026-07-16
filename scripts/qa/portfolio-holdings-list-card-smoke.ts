/**
 * Focused mobile/source smoke for the Portfolio holdings list card.
 * It guards 390px row structure and mock-only holding safety copy without
 * opening a browser, touching a DB, or calling external services.
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

const holdingsCardSource = readProjectFile(
  'components/invest-model/portfolio-holdings-list-card.tsx'
);
const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const holdingsApiRouteSource = readProjectFile(
  'app/api/portfolio/holdings/route.ts'
);
const holdingsReadModelSource = readProjectFile(
  'lib/db/portfolio-holdings-read-model.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageJsonSource = readProjectFile('package.json');

[
  "'use client'",
  '/api/portfolio/holdings',
  'x-invest-model-role',
  "status: 'loading'",
  "status: 'empty'",
  "status: 'error'",
  "status: 'loaded'",
  'PortfolioHoldingsLoading',
  'aria-busy="true"',
  'data-portfolio-holdings-loading-skeleton="mock-only"',
  'data-portfolio-holdings-list="mock-safe"',
  'Simulated holdings',
  'PortfolioPositions',
  'Mock allocation',
  'displayHints.listTitle',
  'displayHints.allocationTitle',
  'summaryAlignment.sourceSummaryValueLabel',
  'summaryAlignment.positionCountLabel',
  'summaryAlignment.allocationBasisLabel',
  'summaryAlignment.mockCashBufferLabel',
  'not broker-confirmed',
  'no real holding',
  'no order execution',
  'no account linking',
  'not advice',
  'mockOnly=',
  'simulated=',
  'realDeposit=',
  'realBalance=',
  'realOrder=',
  'brokerageConnection=',
  'brokerConfirmedHoldings=',
  'realHolding=',
  'orderExecution=',
  'tradeFill=',
  'settlement=',
  'accountLinking=',
  'externalPaidApi=',
  'financialAdvice=',
  'tradeIntentCreated='
].forEach((needle) =>
  assertIncludes(holdingsCardSource, needle, 'Portfolio holdings list card')
);

[
  'min-w-0',
  'break-words',
  '[overflow-wrap:anywhere]',
  'line-clamp-2',
  'grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_auto]',
  'min-[390px]:justify-end',
  'investCardClass.listRail',
  'investMotionClass.interactiveCard',
  'group-active:scale-95',
  'focus-within:border-invest-primary/40'
].forEach((needle) =>
  assertIncludes(holdingsCardSource, needle, 'Portfolio holdings 390px layout')
);

assertNoViewportOverflow('Portfolio holdings list card', holdingsCardSource);
assertNoUnsafeInteractiveCta('Portfolio holdings list card', holdingsCardSource);

assertIncludes(
  portfolioPageSource,
  'PortfolioHoldingsListCard',
  'Portfolio page wiring'
);
assertCondition(
  portfolioPageSource.indexOf('<PortfolioHoldingsListCard locale={locale} />') >
    portfolioPageSource.indexOf('<PortfolioCompactSummaryCard locale={locale} />'),
  'Portfolio holdings list should render after compact PortfolioSummary card'
);
assertCondition(
  portfolioPageSource.indexOf('<PortfolioHoldingsListCard locale={locale} />') <
    portfolioPageSource.indexOf('<SeededPriceMiniChartCard locale={locale} />'),
  'Portfolio holdings list should render before seeded mini chart'
);

[
  'PortfolioHoldingsDto',
  'readOnly: true',
  'simulated: true',
  'brokerConfirmedHoldings: false',
  'realHolding: false',
  'orderExecution: false',
  'tradeFill: false',
  'settlement: false',
  'accountLinking: false',
  'externalPaidApi: false',
  'tradeIntentCreated: false',
  'portfolioMockSafetyMeta',
  "role === 'user' || role === 'admin'"
].forEach((needle) =>
  assertIncludes(holdingsApiRouteSource, needle, 'Portfolio holdings API route')
);

[
  'InvestModelPortfolioHoldings',
  'holdings:',
  'summaryAlignment',
  'sourceSummaryValueLabel',
  'allocationBasisLabel',
  'not broker-confirmed',
  'PortfolioPositions are simulated read-model rows only'
].forEach((needle) =>
  assertIncludes(holdingsReadModelSource, needle, 'Portfolio holdings read model')
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

assertIncludes(
  packageJsonSource,
  '"test:portfolio-holdings-card": "npx tsx scripts/qa/portfolio-holdings-list-card-smoke.ts"',
  'package script'
);

assertNoLongUnbrokenText('Portfolio holdings copy', [
  'simulated holdings only / not broker-confirmed / no real holding / no order execution / no account linking / not advice',
  'A failed read does not try broker accounts, real holdings, orders, fills, or advice.',
  'The holdings list stays empty until mock-safe seed rows are available.'
]);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Portfolio holdings list focused smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'component states',
        '390px row layout',
        'safe-area bottom navigation',
        'PortfolioHoldingsDto API safety meta',
        'not broker-confirmed safety copy',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
