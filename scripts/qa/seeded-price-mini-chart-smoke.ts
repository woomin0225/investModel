/**
 * Focused mobile/source smoke for the seeded price mini chart shell.
 * It verifies 390px/768px-safe structure, fallback copy, and mock-only
 * market-data boundaries without opening a browser or using external services.
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
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|emptyCtaLabel|label)[\s\S]{0,260}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now|Order now)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe real-finance CTA appears near an interactive affordance`
  );
}

function assertNoViewportOverflow(label: string, source: string) {
  assertCondition(
    !/\b(?:w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
      source
    ),
    `${label}: viewport-width or horizontal-scroll layout class found`
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

function assertViewportSourceCoverage(
  label: string,
  source: string,
  viewport: '390px' | '768px',
  requiredNeedles: string[]
) {
  requiredNeedles.forEach((needle) =>
    assertIncludes(source, needle, `${label} ${viewport} source coverage`)
  );
}

const miniChartSource = readProjectFile(
  'components/invest-model/seeded-price-mini-chart-card.tsx'
);
const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const priceHistoryRouteSource = readProjectFile(
  'app/api/price-history/route.ts'
);
const routeInventorySource = readProjectFile('docs/api/route-inventory.md');
const packageJsonSource = readProjectFile('package.json');

[
  "'use client'",
  '/api/price-history?symbol=SAMPLE_AI_BASKET&limit=6',
  'x-invest-model-role',
  "status: 'loading'",
  "status: 'empty'",
  "status: 'error'",
  "status: 'loaded'",
  'SeededPriceMiniChartLoading',
  'aria-busy="true"',
  'data-price-history-mini-chart-loading="mock-only"',
  'data-price-history-mini-chart="SAMPLE_AI_BASKET"',
  'data-price-history-bar=',
  'role="img"',
  'SAMPLE_AI_BASKET',
  'sample_backtest_window',
  'mock_seed',
  'simulated seed fixture only',
  'no live market data',
  'no real-time quotes',
  'no external paid API',
  'no orders',
  'not advice',
  'mockOnly=',
  'simulated=',
  'sampleBacktestWindow=',
  'liveMarketData=',
  'realTimeQuotes=',
  'externalPaidApi=',
  'brokerageConnection=',
  'tradeInstruction=',
  'tradeIntentCreated=',
  'realOrder=',
  'financialAdvice='
].forEach((needle) =>
  assertIncludes(miniChartSource, needle, 'Seeded price mini chart')
);

assertViewportSourceCoverage('Seeded price mini chart', miniChartSource, '390px', [
  'min-w-0',
  'break-words',
  '[overflow-wrap:anywhere]',
  'grid h-24 grid-cols-6',
  'grid h-20 grid-cols-6',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_auto]',
  'flex flex-wrap gap-2',
  'line-clamp-2'
]);

assertViewportSourceCoverage('Seeded price mini chart', miniChartSource, '768px', [
  'space-y-invest-card-gap',
  'rounded-invest-card border border-invest-border bg-invest-surface p-3',
  'grid gap-3',
  'grid h-24 grid-cols-6',
  'rounded-invest-control bg-invest-bg-soft',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]',
  'min-[390px]:justify-end',
  'maxPrice',
  'minPrice',
  'heightPercent'
]);

[
  'Seeded price history could not be read',
  'A failed read does not try live quotes, orders, brokerage connections, or advice.',
  'No seeded price history yet',
  'The mini chart shell renders only when bounded mock_seed data is available.',
  'simulated seed fixture only',
  'sample_backtest_window',
  'mock_seed',
  'no live quotes',
  'read-only fixture'
].forEach((needle) =>
  assertIncludes(miniChartSource, needle, 'Seeded price fallback/safety labels')
);

assertCondition(
  (miniChartSource.match(/data-price-history-bar=/g) ?? []).length === 1 &&
    miniChartSource.includes('chartMetrics.bars.map') &&
    miniChartSource.includes('style={{ height: `${point.heightPercent}%` }}'),
  'Seeded price mini chart must render nonblank bars from computed point heights'
);

assertNoViewportOverflow('Seeded price mini chart', miniChartSource);
assertNoUnsafeInteractiveCta('Seeded price mini chart', miniChartSource);

assertIncludes(
  portfolioPageSource,
  'SeededPriceMiniChartCard',
  'Portfolio page wiring'
);
assertCondition(
  portfolioPageSource.indexOf('<SeededPriceMiniChartCard locale={locale} />') >
    portfolioPageSource.indexOf('<PortfolioCompactSummaryCard locale={locale} />'),
  'Seeded price mini chart should render after the compact PortfolioSummary card'
);
assertCondition(
  portfolioPageSource.indexOf('<SeededPriceMiniChartCard locale={locale} />') <
    portfolioPageSource.indexOf("'Mock time dashboard'"),
  'Seeded price mini chart should render before the existing mock time dashboard'
);

[
  'PriceHistoryMiniChartDto',
  'readOnly: true',
  'mockOnly: true',
  'simulated: true',
  'sampleBacktestWindow: true',
  'liveMarketData: false',
  'realTimeQuotes: false',
  'externalPaidApi: false',
  'brokerageConnection: false',
  'tradeInstruction: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'financialAdvice: false',
  "role === 'user' || role === 'admin'"
].forEach((needle) =>
  assertIncludes(priceHistoryRouteSource, needle, 'Price history API route')
);

[
  'GET /api/price-history',
  'PriceHistoryMiniChartDto',
  'sampleBacktestWindow',
  'liveMarketData=false',
  'realTimeQuotes=false',
  'financialAdvice=false'
].forEach((needle) =>
  assertIncludes(routeInventorySource, needle, 'Route inventory')
);

assertIncludes(
  packageJsonSource,
  '"test:price-mini-chart": "npx tsx scripts/qa/seeded-price-mini-chart-smoke.ts"',
  'package script'
);

assertNoLongUnbrokenText('Seeded price mini chart copy', [
  'simulated seed fixture only / no live market data / no real-time quotes / no external paid API / no orders / not advice',
  'Seeded price history could not be read',
  'The mini chart shell renders only when bounded mock_seed data is available.',
  'A failed read does not try live quotes, orders, brokerage connections, or advice.',
  'Accessible seeded mini chart for SAMPLE_AI_BASKET'
]);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Seeded price mini chart focused smoke',
      viewportAssumption: '390px and 768px source-layout coverage with safe area and bottom tabs',
      checked: [
        'component states',
        '390px source layout',
        '768px source layout',
        'fallback text',
        'simulated/sample labels',
        'nonblank chart bar structure',
        'Portfolio page placement',
        'PriceHistoryMiniChartDto safety meta',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
