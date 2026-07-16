/**
 * Focused source smoke for BK-544 Signal detail 390px QA.
 * It keeps observed DB context ahead of score surfaces and verifies the detail
 * page remains locale-aware, 390px-safe, touch/focus-safe, mock-safe, and
 * non-order-capable without opening a broker/order path.
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
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|label)[\s\S]{0,260}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now|Order now|Buy|Sell|Hold)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe advice/order/broker CTA appears near an interactive affordance`
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

function sourceSlice(source: string, startNeedle: string, endNeedle: string) {
  const startIndex = source.indexOf(startNeedle);
  const endIndex = source.indexOf(endNeedle, startIndex + startNeedle.length);

  assertCondition(startIndex >= 0, `${startNeedle}: section start missing`);
  assertCondition(endIndex > startIndex, `${endNeedle}: section end missing`);

  return source.slice(startIndex, endIndex);
}

function sourceSliceAfter(
  source: string,
  afterNeedle: string,
  startNeedle: string,
  endNeedle: string
) {
  const afterIndex = source.indexOf(afterNeedle);
  assertCondition(afterIndex >= 0, `${afterNeedle}: slice anchor missing`);

  const startIndex = source.indexOf(startNeedle, afterIndex);
  const endIndex = source.indexOf(endNeedle, startIndex + startNeedle.length);

  assertCondition(startIndex >= 0, `${startNeedle}: section start missing`);
  assertCondition(endIndex > startIndex, `${endNeedle}: section end missing`);

  return source.slice(startIndex, endIndex);
}

function assertNoForbiddenVisibleTradingWords(label: string, source: string) {
  const scannerSource = source
    .replace(/function assertNoUnsafeInteractiveCta[\s\S]*?function sourceSlice/, '')
    .replace(/function assertNoOrderCapableIdentifiers[\s\S]*?const signalDetailPageSource/, '');
  const forbidden = /\b(?:buy|sell|hold|broker|brokerage)\b/i;

  assertCondition(
    !forbidden.test(scannerSource),
    `${label}: forbidden buy/sell/hold/broker wording found outside the smoke denylist`
  );
}

function assertNoUnqualifiedOrderCopy(label: string, source: string) {
  const allowedOrderBoundary =
    /\b(no order|not an order|order instruction|order creation|not evidence for an order|not order evidence|order-capable|order path|does not create advice, orders|orders, or brokerage|no .*order|not .*order)\b/i;
  const orderLines = source
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index: index + 1 }))
    .filter(({ line }) => /\border\b/i.test(line))
    .filter(({ line }) => !allowedOrderBoundary.test(line))
    .filter(({ line }) => !/assert|forbidden|denylist|orderId|submitOrder|placeOrder|executeTrade|Signal detail API smoke/.test(line));

  assertCondition(
    orderLines.length === 0,
    `${label}: unqualified order wording found at lines ${orderLines
      .map(({ index }) => index)
      .join(', ')}`
  );
}

function assertNoOrderCapableIdentifiers(label: string, source: string) {
  [
    'placeOrder',
    'executeTrade',
    'submitOrder',
    'orderId',
    'tradeIntentId',
    'brokerageAccountId',
    'connectBrokerage',
    'brokerageConnection={true}'
  ].forEach((needle) => {
    assertCondition(!source.includes(needle), `${label}: found ${needle}`);
  });
}

const signalDetailPageSource = readProjectFile(
  'app/invest-model/signals/[signalId]/page.tsx'
);
const signalDetailApiSmokeSource = readProjectFile(
  'scripts/smoke/signal-detail-api-smoke.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const uiComponentsSource = readProjectFile('components/invest-model/ui.tsx');
const packageJsonSource = readProjectFile('package.json');
const observedContextSection = sourceSliceAfter(
  signalDetailPageSource,
  '<DetailBackLink',
  '<div className="grid gap-3 rounded-invest-card',
  '<div className="grid grid-cols-2 gap-invest-card-gap">'
);
const observedDriverSection = sourceSliceAfter(
  signalDetailPageSource,
  '<article',
  '<section className="mt-3 grid gap-2 rounded-invest-control',
  'Score snapshot rank'
);
const relatedSearchSection = sourceSlice(
  signalDetailPageSource,
  '<Link',
  '<div className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">'
);

[
  '<MobileShell',
  'activeTab="signals"',
  'currentPath={currentPath}',
  'const backHref = `/invest-model/signals?lang=${locale}`;',
  'relatedFeedSearchHref(locale, signal)',
  'Observed context first',
  'signalObservedContextVisibleBoundaries',
  'before score ranking',
  'DB observed input',
  'signal.observedDrivers ?? []',
  'Observed driver breakdown',
  'signalObservedDriverVisibleBoundaries',
  'seed/mock score inputs',
  'weighted mock points',
  'driver.contributionDisplay',
  'driver.evidenceLabel',
  'driver.evidenceContext',
  'scoreWidth(driver.normalizedScore)',
  'break-words',
  '[overflow-wrap:anywhere]',
  'No recommendation',
  'No order',
  'trade-direction signal or order instruction',
  'Seed/mock only until IS-004 is resolved'
].forEach((needle) =>
  assertIncludes(signalDetailPageSource, needle, 'Signal detail mobile screen')
);

[
  'grid gap-3 rounded-invest-card',
  'Observed context first',
  'flex flex-wrap items-start justify-between gap-3',
  'min-w-0',
  'break-words',
  '[overflow-wrap:anywhere]',
  'min-[360px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]',
  'signalObservedContextVisibleBoundaries(locale).join'
].forEach((needle) =>
  assertIncludes(observedContextSection, needle, 'Observed context 390px block')
);

[
  'grid min-w-0 gap-2',
  'Observed driver breakdown',
  'flex flex-wrap items-center justify-between gap-2',
  'rounded-full bg-invest-bg-soft',
  'break-words',
  '[overflow-wrap:anywhere]',
  'min-[360px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]',
  'scoreWidth(driver.normalizedScore)'
].forEach((needle) =>
  assertIncludes(observedDriverSection, needle, 'Observed driver 390px block')
);

[
  'aria-label={relatedSearchAccessibleLabel}',
  'title={relatedSearchAccessibleLabel}',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-invest-primary',
  'investMotionClass.interactiveCard',
  'min-w-0 flex-1',
  'signalRelatedVisibleBoundaries(locale).join'
].forEach((needle) =>
  assertIncludes(relatedSearchSection, needle, 'Related search touch/focus link')
);

assertCondition(
  signalDetailPageSource.indexOf('Observed context first') <
    signalDetailPageSource.indexOf('<MetricCard'),
  'Signal detail must render observed context before score MetricCards'
);
assertCondition(
  signalDetailPageSource.indexOf('Observed driver breakdown') <
    signalDetailPageSource.indexOf('Score snapshot rank'),
  'Signal detail must render observed driver breakdown before score snapshot rank'
);

[
  'Array.isArray(detailJson.data?.observedDrivers)',
  'detailJson.data.observedDrivers.length >= 3',
  'driver.normalizedScore >= 0',
  'driver.normalizedScore <= 100',
  "driver.contributionDisplay.includes('weighted mock points')",
  "driver.evidenceContext === 'mock'",
  'signal detail exposes public id, observed fields, score snapshot, and observed driver breakdown'
].forEach((needle) =>
  assertIncludes(signalDetailApiSmokeSource, needle, 'Signal detail API smoke')
);

[
  'max-w-[var(--invest-mobile-frame-width)]',
  'fixed inset-x-0 bottom-0',
  'var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px',
  'h-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom))]',
  'pb-[env(safe-area-inset-bottom)]',
  'min-h-invest-touch-target',
  'active:scale-95',
  'focus-visible:ring-2'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'Mobile shell bottom tab safe area')
);

[
  'export function DetailBackLink',
  'size-invest-touch-target',
  'min-h-invest-touch-target',
  'data-navigation-affordance="detail-back"',
  'focus:ring-2',
  'active:scale-95',
  'investMotionClass.interactiveControl'
].forEach((needle) =>
  assertIncludes(uiComponentsSource, needle, 'Detail back touch/focus affordance')
);

assertIncludes(
  packageJsonSource,
  '"test:signal-detail-mobile-screen": "npx tsx scripts/qa/signal-detail-mobile-screen-smoke.ts"',
  'package script'
);

assertNoViewportOverflow('Signal detail mobile screen', signalDetailPageSource);
assertNoViewportOverflow('Mobile shell bottom tab', mobileShellSource);
assertNoUnsafeInteractiveCta('Signal detail mobile screen', signalDetailPageSource);
assertNoForbiddenVisibleTradingWords(
  'Signal detail mobile screen',
  signalDetailPageSource
);
assertNoUnqualifiedOrderCopy('Signal detail mobile screen', signalDetailPageSource);
assertNoOrderCapableIdentifiers(
  'Signal detail mobile screen',
  signalDetailPageSource
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'BK-544 Signal detail 390px smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'observed context appears before score MetricCards',
        'observed driver breakdown appears before score snapshot rank',
        'observed context and driver 390px wrapping classes',
        'locale-aware back and related search links',
        'touch/focus affordances for back and related links',
        'bottom tab safe-area reservation in MobileShell',
        'mock/seed and IS-004 external data boundary copy',
        'buy/sell/hold/broker forbidden wording scan',
        'unqualified order wording scan',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
