/**
 * Focused mobile/source smoke for the Portfolio compact summary card.
 * It guards 390px layout structure and mock-only finance safety copy without
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

function assertNoUnsafeInteractiveCta(label: string, source: string) {
  const unsafePattern =
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|emptyCtaLabel|label)[\s\S]{0,260}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|매수하기|매도하기|주문하기|브로커 연결하기|계좌 연결하기|입금하기|입금 시작|계좌 개설하기|거래 시작하기)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe real-finance CTA appears near an interactive affordance`
  );
}

function assertNoForbiddenImplication(label: string, source: string) {
  const allowedNegatedPattern =
    /\b(no real|not a real|not real|does not try|does not connect|never|without real|no brokerage|not advice|not created|pre-order simulation)\b/i;
  const forbiddenPhrases = [
    'deposit now',
    'connect brokerage',
    'place order',
    'execute trade',
    'buy now',
    'sell now',
    'submit order',
    'open account',
    'link account',
    'invest now',
    'start trading',
    'guaranteed return',
    'risk free',
    'no loss',
    'cash available',
    'settled cash',
    'order executed',
    'broker order'
  ];

  const lines = source.split(/\r?\n/);
  const matches = lines.flatMap((line, index) => {
    const lowerLine = line.toLowerCase();
    const context = `${lines[index - 1] ?? ''} ${line}`;
    return forbiddenPhrases
      .filter((phrase) => lowerLine.includes(phrase))
      .filter(() => !allowedNegatedPattern.test(context))
      .map((phrase) => `${phrase} at line ${index + 1}`);
  });

  assertCondition(
    matches.length === 0,
    `${label}: forbidden real-finance implication found: ${matches.join(', ')}`
  );
}

const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const compactCardSource = readProjectFile(
  'components/invest-model/portfolio-compact-summary-card.tsx'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const compactApiRouteSource = readProjectFile(
  'app/api/portfolio/compact-summary/route.ts'
);
const compactReadModelSource = readProjectFile(
  'lib/db/portfolio-compact-read-model.ts'
);
const visualStructureSmokeSource = readProjectFile(
  'scripts/qa/invest-model-visual-structure-smoke.ts'
);

[
  "'use client'",
  '/api/portfolio/compact-summary',
  'x-invest-model-role',
  "status: 'loading'",
  "status: 'empty'",
  "status: 'error'",
  "status: 'loaded'",
  'PortfolioCompactLoadingRows',
  'aria-busy="true"',
  'data-portfolio-compact-loading-skeleton="mock-only"',
  'PortfolioSummary',
  'MockDeposit',
  'Simulated portfolio value',
  'MockDeposit context',
  'no real deposit',
  'no real balance',
  'no real order',
  'no brokerage',
  'not advice',
  'pre-order simulation only',
  'TradeIntent not created',
  'mockOnly=',
  'realDeposit=',
  'realOrder=',
  'brokerageConnection=',
  'financialAdvice=',
  'accountLinking=',
  'tradeIntentCreated='
].forEach((needle) =>
  assertIncludes(compactCardSource, needle, 'Portfolio compact card')
);

[
  'min-w-0',
  'break-words',
  '[overflow-wrap:anywhere]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_auto]',
  'investCardClass.listRail',
  'investMotionClass.interactiveCard',
  'SectionHeader'
].forEach((needle) =>
  assertIncludes(compactCardSource, needle, 'Portfolio compact 390px layout')
);

assertCondition(
  !/\b(?:w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
    compactCardSource
  ),
  'Portfolio compact card must not use viewport-width or horizontal-scroll layout classes'
);

assertIncludes(
  portfolioPageSource,
  'PortfolioCompactSummaryCard',
  'Portfolio page wiring'
);
assertCondition(
  portfolioPageSource.indexOf('<PortfolioCompactSummaryCard locale={locale} />') <
    portfolioPageSource.indexOf("locale === 'ko' ? '모의 기간 대시보드'"),
  'Portfolio compact card must render before the existing mock time dashboard'
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
  'focus-visible:ring-offset-invest-surface'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area/bottom-tab')
);

[
  'routeStatus',
  'PortfolioCompactSummaryDto',
  'readOnly: true',
  'simulated: true',
  'accountLinking: false',
  'externalPaidApi: false',
  'tradeIntentCreated: false',
  'portfolioMockSafetyMeta',
  'canReadPortfolioCompactSummary',
  "role === 'user' || role === 'admin'"
].forEach((needle) =>
  assertIncludes(compactApiRouteSource, needle, 'Portfolio compact API route')
);

[
  'latestSnapshot?.valueLabel',
  'No PortfolioSummary rows yet',
  'DB read-model compact fallback',
  'PortfolioSummary is mock/simulated only',
  'no real deposit, real balance, real order, brokerage connection, or financial advice'
].forEach((needle) =>
  assertIncludes(compactReadModelSource, needle, 'Portfolio compact read model')
);

[
  'portfolioCompactSummaryCardSource',
  'PortfolioCompactSummaryCard',
  '/api/portfolio/compact-summary',
  'data-portfolio-compact-loading-skeleton="mock-only"',
  'No PortfolioSummary rows yet',
  'TradeIntent not created',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]'
].forEach((needle) =>
  assertIncludes(
    visualStructureSmokeSource,
    needle,
    'invest-model visual structure smoke coverage'
  )
);

[
  ['Portfolio compact card', compactCardSource],
  ['Portfolio page', portfolioPageSource],
  ['Portfolio compact API route', compactApiRouteSource],
  ['Portfolio compact read model', compactReadModelSource]
].forEach(([label, source]) => {
  assertNoUnsafeInteractiveCta(label, source);
  assertNoForbiddenImplication(label, source);
});

assertNoLongUnbrokenText('Portfolio compact copy', [
  'MockDeposit / PortfolioSummary are simulated read-model values. no real deposit / no real order / no brokerage / not advice.',
  'pre-order simulation only / no real balance / no account linking / TradeIntent not created',
  'No PortfolioSummary rows yet; browse mock models only.',
  'PortfolioSummary could not be read',
  'A failed read does not try real deposits, real orders, brokerage connections, or advice.'
]);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Portfolio compact summary card focused smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'component states',
        '390px source layout',
        'safe-area bottom navigation',
        'MockDeposit and PortfolioSummary copy',
        'API safety meta',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
