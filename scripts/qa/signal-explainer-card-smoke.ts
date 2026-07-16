/**
 * Focused source smoke for BK-515 Signal detail why-it-moved explainer card.
 * It verifies the mobile detail screen reads the read-only explainer API and
 * keeps the card 390px-safe, bottom-tab-safe, mock-safe, and non-order-capable.
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
const explainerApiRouteSource = readProjectFile(
  'app/api/signals/[signalId]/explainer/route.ts'
);
const explainerApiSmokeSource = readProjectFile(
  'scripts/smoke/signal-explainer-api-smoke.ts'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageJsonSource = readProjectFile('package.json');

[
  '<MobileShell',
  'activeTab="signals"',
  'currentPath={currentPath}',
  "import { GET as readSignalExplainer }",
  'readSignalExplainerRoute',
  '/api/signals/${signalPublicId}/explainer',
  'x-invest-model-role',
  'SignalExplainerReadModel',
  'Why it moved',
  'explainer.explanationTitle',
  'explainer.explanationSummary',
  'explainer.drivers.map',
  'driver.evidenceLabel',
  'driver.contributionLabel',
  'notFound();',
  'signalExplainerBoundaryLine',
  'No advice',
  'No order',
  'No live external data',
  'break-words',
  '[overflow-wrap:anywhere]',
  'mockOnly=',
  'observedInputsOnly=',
  'externalPaidApi=',
  'financialAdvice=',
  'grid gap-3 rounded-invest-control',
  'min-[360px]:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)]',
  'style={{\n                        width: scoreWidth(driver.normalizedScore)'
].forEach((needle) =>
  assertIncludes(signalDetailPageSource, needle, 'Signal explainer card')
);

[
  "routeStatus: 'fixture_or_db_seed_projection'",
  "persistence: 'read_only_seed_projection'",
  'signal_score_inputs',
  'observedInputsOnly: true',
  'realtimeExternalData: false',
  'externalPaidApi: false',
  'financialAdvice: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'brokerageConnection: false'
].forEach((needle) =>
  assertIncludes(explainerApiRouteSource, needle, 'Signal explainer API route')
);

[
  'MobileShell defines the 390px-first mobile app frame',
  'fixed inset-x-0 bottom-0',
  'var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px',
  'h-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom))]',
  'pb-[env(safe-area-inset-bottom)]',
  'investModel bottom mobile tab navigation',
  'investModelNavItems',
  "key: 'signals'",
  'min-h-invest-touch-target',
  'active:scale-95',
  'focus-visible:ring-2'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'Mobile shell bottom nav safe area')
);

[
  'public role is forbidden',
  'explainer exposes public seed context and score-input drivers only',
  'explainer does not expose internal ids or order-capable fields',
  'explainerJson.data?.safetyMeta?.mockOnly === true',
  'explainerJson.data?.safetyMeta?.financialAdvice === false',
  'explainer API keeps read-only mock-safe meta'
].forEach((needle) =>
  assertIncludes(explainerApiSmokeSource, needle, 'Signal explainer API smoke')
);

assertIncludes(
  packageJsonSource,
  '"test:signal-explainer-card": "npx tsx scripts/qa/signal-explainer-card-smoke.ts"',
  'package script'
);

assertCondition(
  signalDetailPageSource.indexOf('if (!signal)') <
    signalDetailPageSource.indexOf('readSignalExplainerRoute(resolvedParams.signalId)'),
  'Signal detail must confirm the SignalEvent exists before reading fixture-fallback explainer data'
);
assertCondition(
  !signalDetailPageSource.includes('Number(resolvedParams.signalId)'),
  'Signal explainer card must use the public signal id without numeric coercion'
);
assertNoViewportOverflow('Signal explainer card', signalDetailPageSource);
assertNoViewportOverflow('Mobile shell bottom nav', mobileShellSource);
assertNoUnsafeInteractiveCta('Signal explainer card', signalDetailPageSource);
assertNoOrderCapableIdentifiers('Signal explainer card', signalDetailPageSource);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'BK-515 Signal explainer 390px smoke',
      viewportAssumption: '390px mobile frame with safe area and bottom tabs',
      checked: [
        'detail page reads read-only explainer API',
        'driver evidence chips and contribution labels',
        '390px-safe grid/wrapping classes',
        'bottom tab safe-area reservation in MobileShell',
        'mockOnly/observedInputsOnly/externalPaidApi/financialAdvice flags',
        'no advice/order/live data boundary',
        'unsafe CTA proximity scan'
      ]
    },
    null,
    2
  )
);
