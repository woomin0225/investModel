/**
 * Focused source smoke for BK-543 Signal detail mobile screen.
 * It keeps observed DB context ahead of score surfaces and verifies the detail
 * page remains locale-aware, 390px-safe, mock-safe, and non-order-capable.
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
const packageJsonSource = readProjectFile('package.json');

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
  'Seed/mock only until IS-004 is resolved'
].forEach((needle) =>
  assertIncludes(signalDetailPageSource, needle, 'Signal detail mobile screen')
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

assertIncludes(
  packageJsonSource,
  '"test:signal-detail-mobile-screen": "npx tsx scripts/qa/signal-detail-mobile-screen-smoke.ts"',
  'package script'
);

assertNoViewportOverflow('Signal detail mobile screen', signalDetailPageSource);
assertNoViewportOverflow('Mobile shell bottom tab', mobileShellSource);
assertNoUnsafeInteractiveCta('Signal detail mobile screen', signalDetailPageSource);
assertNoOrderCapableIdentifiers(
  'Signal detail mobile screen',
  signalDetailPageSource
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'BK-543 Signal detail mobile screen',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'observed context appears before score MetricCards',
        'observed driver breakdown appears before score snapshot rank',
        'locale-aware back and related search links',
        '390px-safe wrapping classes for long DB/source text',
        'bottom tab safe-area reservation in MobileShell',
        'mock/seed and IS-004 external data boundary copy',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
