/**
 * Focused source smoke for BK-527.
 * Guards the shared Interest/save mobile state rail wiring, 390px layout shape,
 * bottom-tab clearance, and read-only safety language without opening DB,
 * broker, push, deposit, order, or external service paths.
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
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|ctaLabel)[\s\S]{0,280}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Subscribe alerts|Enable push)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe real-finance or push CTA appears near an interactive affordance`
  );
}

const railSource = readProjectFile(
  'components/invest-model/interest-save-state-rail.tsx'
);
const serverLookupSource = readProjectFile('lib/server/interest-save-state.ts');
const signalsPageSource = readProjectFile('app/invest-model/signals/page.tsx');
const feedPageSource = readProjectFile('app/invest-model/feed/page.tsx');
const modelsPageSource = readProjectFile('app/invest-model/models/page.tsx');
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageSource = readProjectFile('package.json');

[
  'InterestSaveStateRail',
  'data-interest-save-state-rail',
  'data-item-public-id',
  'data-state',
  'saved',
  'unsaved',
  'pending',
  'error',
  'read_only',
  'Private mock interest state',
  '개인 mock 관심 상태',
  'not model selection, buying, deposits, alert subscription, or brokerage connection',
  '모델 선택, 매수, 입금, 알림 구독, 브로커 연결이 아닙니다',
  'grid min-w-0 gap-2',
  'rounded-invest-control',
  'break-words',
  '[overflow-wrap:anywhere]',
  'RiskBadge'
].forEach((needle) =>
  assertIncludes(railSource, needle, 'Interest/save state rail component')
);

assertCondition(
  !/(<button|<Link|href=|onClick|fetch\(|axios)/.test(railSource),
  'Interest/save state rail is presentational and has no interactive mutation or network path'
);

[
  'readInterestSaveStateLookup',
  'GET as readInterestSaves',
  'new URLSearchParams',
  'itemType',
  "limit: '6'",
  "'x-invest-model-role': 'user'",
  'payload.meta?.readOnly !== true',
  'payload.meta.mockUserScoped !== true',
  'payload.meta.privateShortcutOnly !== true',
  'payload.meta.modelSelectionSignal !== false',
  'payload.meta.realDeposit !== false',
  'payload.meta.realOrder !== false',
  'payload.meta.tradeIntentCreated !== false',
  'payload.meta.brokerageConnection !== false',
  'payload.meta.pushDelivery !== false',
  'payload.meta.financialAdvice !== false'
].forEach((needle) =>
  assertIncludes(serverLookupSource, needle, 'Interest/save server lookup guard')
);

[
  [signalsPageSource, 'signal_event', 'signal.id'],
  [feedPageSource, 'feed_post', 'post.id'],
  [modelsPageSource, 'investment_model', 'model.modelPublicId']
].forEach(([source, itemType, publicId], index) => {
  const label = ['Signals page', 'Feed page', 'Models page'][index];

  assertIncludes(source, `readInterestSaveStateLookup('${itemType}')`, label);
  assertIncludes(source, 'InterestSaveStateRail', label);
  assertIncludes(source, `itemType="${itemType}"`, label);
  assertIncludes(source, `itemPublicId={${publicId}}`, label);
  assertIncludes(source, `interestSaveStateLookup[${publicId}]?.state`, label);
  assertIncludes(source, `interestSaveStateLookup[${publicId}]?.safetyLabel`, label);
});

assertIncludes(
  modelsPageSource,
  'modelPublicId: card.modelPublicId',
  'Models page maps DB model public id for save state'
);
assertIncludes(
  modelsPageSource,
  '`/invest-model/models/${model.id}`',
  'Models page keeps slug-based detail navigation separate'
);

[
  'env(safe-area-inset-bottom)',
  'pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)]',
  'BottomNav',
  'fixed inset-x-0 bottom-0 z-30 overflow-x-clip',
  'grid-cols-5',
  'data-touch-target="44px"'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area/bottom-tab')
);

assertIncludes(
  packageSource,
  '"test:interest-save-state-rail": "npx tsx scripts/qa/interest-save-state-rail-smoke.ts"',
  'Package script'
);

[railSource, serverLookupSource, signalsPageSource, feedPageSource, modelsPageSource].forEach(
  (source, index) =>
    assertNoUnsafeInteractiveCta(
      ['rail', 'server lookup', 'signals page', 'feed page', 'models page'][index],
      source
    )
);

[
  'user_model_selections',
  'mock_deposits',
  'allocation_decisions',
  'trade_intents',
  'broker_order',
  'brokerage_account',
  'externalApiKey',
  'realBalance',
  'guaranteed',
  'risk free'
].forEach((needle) => {
  [railSource, serverLookupSource, signalsPageSource, feedPageSource, modelsPageSource].forEach(
    (source, index) =>
      assertCondition(
        !source.includes(needle),
        `${['rail', 'server lookup', 'signals page', 'feed page', 'models page'][index]} avoids unsafe term ${needle}`
      )
  );
});

console.log('PASS interest-save state rail smoke');
