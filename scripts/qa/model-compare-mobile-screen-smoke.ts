/**
 * Verifies the BK-552 model compare mobile screen.
 * The screen must stay 390px-safe, read-only, and backed by the compare read model.
 */

import { readFileSync } from 'fs';
import path from 'path';

import { readModelCompareSeedFixture } from '../../lib/db/model-compare-read-model';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return readFileSync(path.resolve(filePath), 'utf8');
}

function assertIncludes(text: string, needle: string, message: string) {
  assertCondition(text.includes(needle), message);
}

function assertNotIncludes(text: string, needle: string, message: string) {
  assertCondition(!text.includes(needle), message);
}

function assertNoForbiddenPattern(
  label: string,
  source: string,
  patterns: RegExp[]
) {
  const matches = patterns.flatMap((pattern) => {
    pattern.lastIndex = 0;
    return [...source.matchAll(pattern)].map((match) => match[0]);
  });

  assertCondition(
    matches.length === 0,
    `${label}: forbidden copy or layout pattern regressed: ${matches.join(', ')}`
  );
}

async function main() {
  const pageSource = readText('app/invest-model/models/compare/page.tsx');
  const routeSource = readText('app/api/models/compare/route.ts');
  const readModelSource = readText('lib/db/model-compare-read-model.ts');
  const mobileShellSource = readText('components/invest-model/mobile-shell.tsx');
  const packageJson = readText('package.json');
  const compareItems = await readModelCompareSeedFixture();

  [
    '<MobileShell',
    'activeTab="models"',
    'currentPath="/invest-model/models/compare"',
    'readModelCompareSeedFixture',
    'defaultComparePublicIds',
    'model.backtestContext.cumulativeReturn.display',
    'model.backtestContext.volatility.display',
    'model.backtestContext.maxDrawdown.display',
    'model.risk.summary',
    'model.mandate.allowedMarkets',
    'model.mandate.allowedAssetClasses',
    'model.disclosures.map',
    'model.safetyLabel',
    'ModelRiskProfile',
    'PortfolioMandate',
    'ModelDisclosure',
    'ModelPerformanceSnapshot',
    'Backtest placeholder',
    'Not advice',
    'No model selection created',
    'No order',
    'No brokerage',
    'grid-cols-[6.5rem_minmax(0,1fr)]',
    '[overflow-wrap:anywhere]',
    'min-w-0',
    'break-words',
    'group-active:scale-[0.99]',
    'hover:bg-invest-primary-soft/60'
  ].forEach((needle) => {
    assertIncludes(pageSource, needle, `model compare page includes ${needle}`);
  });

  [
    '<table',
    'overflow-x-auto',
    'overflow-x-scroll',
    'w-screen',
    'min-w-screen',
    'w-max',
    'min-w-[720px]',
    '100vw'
  ].forEach((needle) => {
    assertNotIncludes(pageSource, needle, `model compare page avoids ${needle}`);
  });

  assertCondition(
    pageSource.indexOf('model.backtestContext.cumulativeReturn.display') <
      pageSource.indexOf('model.backtestContext.maxDrawdown.display') &&
      pageSource.indexOf('model.backtestContext.maxDrawdown.display') <
        pageSource.indexOf('model.backtestContext.volatility.display'),
    'model compare keeps return, drawdown, and volatility together'
  );

  assertCondition(
    compareItems.length === 3 &&
      compareItems.every(
        (item) =>
          (item.status === 'approved' || item.status === 'live') &&
          item.risk.leverageAllowed === false &&
          item.risk.derivativeAllowed === false &&
          item.risk.shortSellingAllowed === false &&
          item.mandate.userOverrideAllowed === false &&
          item.disclosures.length >= 3 &&
          item.disclosures.every(
            (disclosure) => disclosure.requiresLegalReview === true
          ) &&
          item.backtestContext.isBacktest === true &&
          item.sourceMeta.mockOnly === true &&
          item.sourceMeta.informationalOnly === true &&
          item.sourceMeta.externalPaidApi === false
      ),
    'model compare data remains visible, mock-only, disclosure-reviewed, and read-only'
  );

  [
    'model_risk_profiles',
    'portfolio_mandates',
    'model_disclosures',
    'model_performance_snapshots',
    'reviewSafeDisclosuresOnly',
    'backtestMetricsOnly',
    'financialAdvice: false',
    'modelSelectionCreated: false',
    'tradeIntentCreated: false',
    'realOrder: false',
    'brokerageConnection: false'
  ].forEach((needle) => {
    assertIncludes(routeSource, needle, `compare API route includes ${needle}`);
  });

  [
    'sourceTables',
    'mockOnly: true',
    'informationalOnly: true',
    'backtestOnly: true',
    'externalPaidApi: false'
  ].forEach((needle) => {
    assertIncludes(readModelSource, needle, `compare read model includes ${needle}`);
  });

  [
    'env(safe-area-inset-top)',
    'env(safe-area-inset-bottom)',
    'var(--invest-bottom-nav-height)',
    'overflow-x-clip',
    'min-h-invest-touch-target'
  ].forEach((needle) => {
    assertIncludes(mobileShellSource, needle, `MobileShell includes ${needle}`);
  });

  assertNoForbiddenPattern('model compare page', pageSource, [
    /\bbest model\b/gi,
    /\brecommended\b/gi,
    /\brecommendation\b/gi,
    /\bbuy\b/gi,
    /\bsell\b/gi,
    /\bhold\b/gi,
    /\bguaranteed return\b/gi,
    /\brisk free\b/gi,
    /\bsuitability approved\b/gi,
    /\blegal approved\b/gi,
    /\bplace order\b/gi,
    /\bexecute trade\b/gi,
    /\bconnect brokerage\b/gi,
    /\bdeposit now\b/gi
  ]);

  [
    'accountNumber',
    'bankAccount',
    'routingNumber',
    'brokerOrder',
    'orderExecution',
    'tradeFill',
    'liveQuoteProvider',
    'externalApiKey',
    'realBalance',
    'buySignal',
    'sellSignal',
    'holdRecommendation',
    'suitabilityProfile'
  ].forEach((needle) => {
    assertNotIncludes(pageSource, needle, `model compare page avoids ${needle}`);
    assertNotIncludes(routeSource, needle, `model compare route avoids ${needle}`);
    assertNotIncludes(readModelSource, needle, `model compare read model avoids ${needle}`);
  });

  assertIncludes(
    packageJson,
    '"test:model-compare-mobile-screen": "npx tsx scripts/qa/model-compare-mobile-screen-smoke.ts"',
    'package script exposes model compare mobile smoke'
  );

  console.log(
    JSON.stringify(
      {
        status: 'pass',
        scope: 'BK-552 model compare mobile screen',
        viewportAssumption: '390px mobile frame with fixed bottom navigation',
        dataSource: 'model compare read-model seed/DB projection',
        returnedModels: compareItems.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
