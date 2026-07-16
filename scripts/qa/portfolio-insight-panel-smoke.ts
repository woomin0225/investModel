/**
 * Focused mobile/source smoke for the Portfolio insight panel.
 * It checks 390px-safe layout, API-backed states, and mock-only safety copy
 * without opening a browser, touching a DB, or calling external services.
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
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|emptyCtaLabel|label)[\s\S]{0,260}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|recommend|rebalance now)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe real-finance CTA appears near an interactive affordance`
  );
}

function assertNoForbiddenStandaloneImplication(label: string, source: string) {
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
    'broker order',
    'legal approved',
    'suitability approved'
  ];
  const allowedNegatedPattern =
    /\b(no real|not a real|not real|does not|never|without|blocked|pre-order simulation|read-only|mock)\b/i;
  const lines = source.split(/\r?\n/);
  const matches = lines.flatMap((line, index) =>
    forbiddenPhrases
      .filter((phrase) => line.toLowerCase().includes(phrase))
      .filter(() => !allowedNegatedPattern.test(line))
      .map((phrase) => `${phrase} at line ${index + 1}`)
  );

  assertCondition(
    matches.length === 0,
    `${label}: forbidden implication found: ${matches.join(', ')}`
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

const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const insightPanelSource = readProjectFile(
  'components/invest-model/portfolio-insight-panel.tsx'
);
const indexSource = readProjectFile('components/invest-model/index.ts');
const insightApiRouteSource = readProjectFile(
  'app/api/portfolio/insight/route.ts'
);
const insightReadModelSource = readProjectFile(
  'lib/db/portfolio-insight-read-model.ts'
);
const portfolioSummaryDomainSource = readProjectFile(
  'lib/domain/portfolio/portfolio-summary.ts'
);
const visualStructureSmokeSource = readProjectFile(
  'scripts/qa/invest-model-visual-structure-smoke.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);

[
  "'use client'",
  '/api/portfolio/insight',
  'x-invest-model-role',
  "status: 'loading'",
  "status: 'empty'",
  "status: 'error'",
  "status: 'loaded'",
  'PortfolioInsightLoading',
  'aria-busy="true"',
  'data-portfolio-insight-loading-skeleton="mock-only"',
  'data-portfolio-insight-panel="mock-safe"',
  'Mock portfolio insights',
  'Allocation rationale',
  'Status timeline',
  'mock rationale only',
  'read-only timeline',
  'pre-order simulation only',
  'no real deposit',
  'no real balance',
  'no real order',
  'no broker',
  'not advice',
  'mockOnly=',
  'simulated=',
  'realDeposit=',
  'realBalance=',
  'realOrder=',
  'brokerageConnection=',
  'accountLinking=',
  'externalPaidApi=',
  'brokerConfirmed=',
  'brokerConfirmedHoldings=',
  'realHolding=',
  'realAllocation=',
  'orderExecution=',
  'tradeFill=',
  'settlement=',
  'financialAdvice=',
  'tradeIntentCreated=',
  'allocationCommandCreated=',
  'legalJudgment='
].forEach((needle) =>
  assertIncludes(insightPanelSource, needle, 'Portfolio insight panel')
);

[
  'readPortfolioInsight()',
  "setState({ status: 'error' })",
  "status: 'empty'",
  "status: 'loaded'",
  'payload.data?.allocationRationales.length',
  'payload.data?.statusTimeline.length',
  'return () => {',
  'isMounted = false',
  'role="status"',
  'role="list"',
  'role="listitem"',
  'aria-label={sectionAccessibleLabel}',
  'title={`${rationale.label}. ${rationale.safetyLabel}.`}',
  'item.previousStatus} -&gt; {item.nextStatus}',
  'item.actorRole',
  'item.reasonCode',
  'item.occurredAtLabel'
].forEach((needle) =>
  assertIncludes(insightPanelSource, needle, 'Portfolio insight state coverage')
);

[
  'min-w-0',
  'break-words',
  '[overflow-wrap:anywhere]',
  'line-clamp-2',
  'line-clamp-3',
  'min-h-invest-touch-target',
  'min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]',
  'min-[390px]:grid-cols-[minmax(0,1fr)_auto]',
  'min-[390px]:grid-cols-2',
  'investCardClass.listRail',
  'investMotionClass.interactiveCard',
  'SectionHeader'
].forEach((needle) =>
  assertIncludes(insightPanelSource, needle, 'Portfolio insight 390px layout')
);

[
  'group-hover:scale-[1.03]',
  'group-active:scale-95',
  'motion-reduce:transition-none',
  'motion-reduce:group-active:scale-100',
  'focus-within:border-invest-primary/40'
].forEach((needle) =>
  assertIncludes(insightPanelSource, needle, 'Portfolio insight pressed/focus states')
);

assertCondition(
  !/\b(?:w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
    insightPanelSource
  ),
  'Portfolio insight panel must not use viewport-width or horizontal-scroll layout classes'
);
assertCondition(
  !/(<button|<Link|href=|onClick|formAction|actionLabel|emptyCtaLabel)/.test(
    insightPanelSource
  ),
  'Portfolio insight panel must remain read-only with no button/link/action affordance'
);

assertIncludes(
  indexSource,
  "export { PortfolioInsightPanel } from './portfolio-insight-panel';",
  'Portfolio insight export'
);
assertIncludes(
  portfolioPageSource,
  '<PortfolioInsightPanel locale={locale} />',
  'Portfolio page wiring'
);
assertCondition(
  portfolioPageSource.indexOf('<PortfolioCompactSummaryCard locale={locale} />') <
    portfolioPageSource.indexOf('<PortfolioInsightPanel locale={locale} />') &&
    portfolioPageSource.indexOf('<PortfolioInsightPanel locale={locale} />') <
      portfolioPageSource.indexOf('<PortfolioHoldingsListCard locale={locale} />'),
  'Portfolio insight panel must render after compact summary and before holdings'
);

[
  'GET(request: NextRequest)',
  'PortfolioInsightDto',
  'routeStatus',
  'persisted_or_mock_safe_fallback',
  'readInvestModelRole(request)',
  'resolveInvestModelUserScope(request)',
  'readOnly: true',
  'simulated: true',
  'accountLinking: false',
  'externalPaidApi: false',
  'brokerConfirmed: false',
  'realHolding: false',
  'realAllocation: false',
  'orderExecution: false',
  'tradeFill: false',
  'settlement: false',
  'tradeIntentCreated: false',
  'allocationCommandCreated: false',
  'legalJudgment: false',
  'portfolioMockSafetyMeta',
  "role === 'user' || role === 'admin'",
  'No deposit, balance, order, broker action, or advice was created.'
].forEach((needle) =>
  assertIncludes(insightApiRouteSource, needle, 'Portfolio insight API route')
);

[
  'portfolioMockSafetyMeta',
  'mockOnly: true',
  'realDeposit: false',
  'realBalance: false',
  'realOrder: false',
  'brokerageConnection: false',
  'financialAdvice: false',
  'no real deposit, balance, order, brokerage connection, or financial advice'
].forEach((needle) =>
  assertIncludes(portfolioSummaryDomainSource, needle, 'Portfolio safety meta')
);

[
  'seed_008_portfolio_insight_read_model',
  'allocationRationales',
  'statusTimeline',
  'portfolio_analysis_snapshots',
  'portfolioInsightSeedFixture',
  'AllocationDecision rationale',
  'TradeIntent remains blocked',
  'Execution boundary blocked',
  'mock rationale only',
  'read-only timeline',
  'not advice',
  'no real deposit, real balance, order execution, broker connection, or financial advice'
].forEach((needle) =>
  assertIncludes(insightReadModelSource, needle, 'Portfolio insight read model')
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
  'focus-visible:ring-offset-invest-surface',
  'motion-reduce:active:scale-100'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area/bottom-tab')
);

[
  'portfolioInsightPanelSource',
  'PortfolioInsightPanel',
  '/api/portfolio/insight',
  'data-portfolio-insight-loading-skeleton="mock-only"',
  'data-portfolio-insight-panel="mock-safe"',
  'allocationCommandCreated=',
  'legalJudgment='
].forEach((needle) =>
  assertIncludes(
    visualStructureSmokeSource,
    needle,
    'invest-model visual structure smoke coverage'
  )
);

[
  ['Portfolio insight panel', insightPanelSource],
  ['Portfolio page', portfolioPageSource],
  ['Portfolio insight API route', insightApiRouteSource],
  ['Portfolio insight read model', insightReadModelSource]
].forEach(([label, source]) => {
  assertNoUnsafeInteractiveCta(label, source);
  assertNoForbiddenStandaloneImplication(label, source);
});

assertNoLongUnbrokenText('Portfolio insight visible copy', [
  'DB seed/read-model rationale and status timeline only. No real deposit, order, broker connection, legal judgment, or advice.',
  'A failed read does not create a real deposit, order, broker action, allocation command, legal judgment, or advice.',
  'The panel stays empty until seed/read-model rationale or timeline rows are available.',
  'mock rationale only / read-only timeline / pre-order simulation only / no real deposit / no real balance / no real order / no broker / not advice'
]);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Portfolio insight panel focused smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'component states',
        '390px source layout',
        'pressed/focus/reduced-motion states',
        'safe-area bottom navigation',
        'page ordering',
        'API safety meta',
        'read-model fixture anchors',
        'read-only no-action affordance',
        'unsafe CTA proximity scan',
        'mobile text overflow scan'
      ]
    },
    null,
    2
  )
);
