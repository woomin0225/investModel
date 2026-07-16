/**
 * Focused mobile/source smoke for BK-440 Portfolio market context tiles.
 * It verifies the UI is fed by seeded allocation split data and does not imply
 * live market data, external paid APIs, real holdings, orders, or advice.
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

const marketContextSource = readProjectFile(
  'components/invest-model/portfolio-market-context-tiles.tsx'
);
const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const allocationApiRouteSource = readProjectFile(
  'app/api/portfolio/allocation-split/route.ts'
);
const allocationReadModelSource = readProjectFile(
  'lib/db/portfolio-allocation-split-read-model.ts'
);
const packageJsonSource = readProjectFile('package.json');

[
  "'use client'",
  '/api/portfolio/allocation-split',
  'x-invest-model-role',
  "status: 'loading'",
  "status: 'empty'",
  "status: 'error'",
  "status: 'loaded'",
  'PortfolioMarketContextLoading',
  'aria-busy="true"',
  'data-portfolio-market-context-loading="mock-only"',
  'data-portfolio-market-context-tiles="mock-safe"',
  'Simulated market context',
  'Sector cluster',
  'Asset-class cluster',
  'seeded allocation context only',
  'no live market data',
  'no external paid API',
  'no real holding',
  'no order execution',
  'not advice',
  'mockOnly=',
  'simulated=',
  'realDeposit=',
  'realBalance=',
  'realOrder=',
  'brokerageConnection=',
  'brokerConfirmed=',
  'brokerConfirmedHoldings=',
  'realHolding=',
  'userRiskSettingAccepted=',
  'userAllocationOverrideAccepted=',
  'orderExecution=',
  'tradeFill=',
  'settlement=',
  'accountLinking=',
  'externalPaidApi=',
  'financialAdvice=',
  'tradeIntentCreated='
].forEach((needle) =>
  assertIncludes(marketContextSource, needle, 'Portfolio market context tiles')
);

[
  'min-w-0',
  'break-words',
  '[overflow-wrap:anywhere]',
  'grid gap-2 min-[390px]:grid-cols-2',
  'min-[390px]:grid-cols-[minmax(0,1fr)_auto]',
  'investMotionClass.interactiveCard',
  'group-active:scale-95',
  'focus-within:border-invest-primary/40',
  'style={{ width: `${parseWeightLabel(bucket.weightLabel)}%` }}'
].forEach((needle) =>
  assertIncludes(marketContextSource, needle, 'Portfolio market context 390px layout')
);

assertNoViewportOverflow('Portfolio market context tiles', marketContextSource);
assertNoUnsafeInteractiveCta(
  'Portfolio market context tiles',
  marketContextSource
);

assertIncludes(
  portfolioPageSource,
  'PortfolioMarketContextTiles',
  'Portfolio page wiring'
);
assertCondition(
  portfolioPageSource.indexOf('<PortfolioMarketContextTiles locale={locale} />') >
    portfolioPageSource.indexOf('<PortfolioHoldingsListCard locale={locale} />'),
  'Portfolio market context should render after holdings list'
);
assertCondition(
  portfolioPageSource.indexOf('<PortfolioMarketContextTiles locale={locale} />') <
    portfolioPageSource.indexOf('<SeededPriceMiniChartCard locale={locale} />'),
  'Portfolio market context should render before seeded mini chart'
);

[
  'PortfolioAllocationSplitDto',
  'readOnly: true',
  'simulated: true',
  'brokerConfirmed: false',
  'brokerConfirmedHoldings: false',
  'realHolding: false',
  'userRiskSettingAccepted: false',
  'userAllocationOverrideAccepted: false',
  'orderExecution: false',
  'tradeFill: false',
  'settlement: false',
  'accountLinking: false',
  'externalPaidApi: false',
  'tradeIntentCreated: false',
  "role === 'user' || role === 'admin'"
].forEach((needle) =>
  assertIncludes(
    allocationApiRouteSource,
    needle,
    'Portfolio allocation split API route'
  )
);

[
  'InvestModelPortfolioAllocationSplit',
  'sectorBuckets',
  'assetClassBuckets',
  'seed_005_portfolio_positions_006_allocation_split',
  'simulated allocation bucket',
  'Allocation buckets are simulated seed/read-model rows only'
].forEach((needle) =>
  assertIncludes(
    allocationReadModelSource,
    needle,
    'Portfolio allocation split read model'
  )
);

assertIncludes(
  packageJsonSource,
  '"test:portfolio-market-context": "npx tsx scripts/qa/portfolio-market-context-tiles-smoke.ts"',
  'package script'
);

assertNoLongUnbrokenText('Portfolio market context copy', [
  'seeded allocation context only / no live market data / no external paid API / no real holding / no order execution / not advice',
  'A failed read does not try live market data, external paid APIs, broker accounts, orders, or advice.',
  'Market context tiles stay empty until mock-safe allocation buckets are available.'
]);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'BK-440 Portfolio market context tiles focused smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'component states',
        '390px tile grid layout',
        'allocation split API safety meta',
        'seed/read-model source labels',
        'no live market/external paid API/order/advice copy',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
