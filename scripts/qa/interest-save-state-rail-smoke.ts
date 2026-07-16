/**
 * Focused source smoke for BK-527/BK-528.
 * Guards the shared Interest/save mobile state rail wiring, all visible save
 * states, 390px layout shape, focus/active host affordances, bottom-tab
 * clearance, and read-only safety language without opening DB, broker, push,
 * deposit, order, or external service paths.
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

function assertAnyIncludes(source: string, needles: string[], label: string) {
  assertCondition(
    needles.some((needle) => source.includes(needle)),
    `${label}: missing one of ${needles.join(', ')}`
  );
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
const readModelSource = readProjectFile('lib/db/interest-save-read-model.ts');
const interestSaveApiSource = readProjectFile(
  'app/api/my/interest-saves/route.ts'
);
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
  'RiskBadge',
  'BookmarkCheck',
  'Bookmark,',
  'CircleDashed',
  'XCircle',
  'ShieldCheck',
  'const stateTone',
  'const stateIcon',
  "saved: BookmarkCheck",
  "unsaved: Bookmark",
  "pending: CircleDashed",
  "error: XCircle",
  "read_only: ShieldCheck",
  "saved: 'low'",
  "unsaved: 'neutral'",
  "pending: 'medium'",
  "error: 'high'",
  "read_only: 'neutral'",
  "const visibleState = displayState ?? 'read_only'",
  'const safeLabel = safetyLabel ?? copy.readOnlySafety',
  'const ariaLabel = `${copy.privateState}. ${copy.label}. ${safeLabel}`',
  'aria-label={ariaLabel}',
  'title={ariaLabel}',
  'group/interest-save',
  'investMotionClass.interactiveCard'
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
  'select models, deliver push, create orders',
  'connect brokers, or create deposit/TradeIntent records',
  'return {};'
].forEach((needle) =>
  assertIncludes(serverLookupSource, needle, 'Interest/save read-only fallback')
);

[
  'mock user-scoped reading/interest shortcut only',
  'user_demo_001',
  "state: 'saved'",
  "state: 'unsaved'",
  "state: 'pending'",
  'Private mock reading shortcut only',
  'private mock user-scoped state',
  'Interest/save state is mock user-scoped UI state only',
  'sourceTables',
  'mockUserScoped: true',
  'privateShortcutOnly: true',
  'allocationSignal: false',
  'externalPaidApi: false'
].forEach((needle) =>
  assertIncludes(readModelSource, needle, 'Interest/save read model fixture')
);

[
  'Only signed-in user or admin roles can read private mock interest/save state.',
  'resolveInvestModelUserScope',
  'userPublicId: userScope.userPublicId',
  "dataContext: 'mock'",
  'readOnly: true',
  'mockUserScoped: true',
  'privateShortcutOnly: true',
  'depositSignal: false',
  'orderIntentSignal: false',
  'tradeIntentSignal: false',
  'sendsRealPush: false',
  'deliveryAttempted: false'
].forEach((needle) =>
  assertIncludes(interestSaveApiSource, needle, 'Interest/save API user-scope guard')
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

[
  [
    signalsPageSource,
    'Signals page host card',
    ['focus-visible:ring-2'],
    ['group-active:scale-95']
  ],
  [
    feedPageSource,
    'Feed page host card',
    ['focus-within:border-invest-primary/40', 'focus-visible:outline-none'],
    ['active:scale-[0.98]', 'group-active:scale-95']
  ],
  [
    modelsPageSource,
    'Models page host card',
    ['focus:outline-none focus:ring-2 focus:ring-invest-primary'],
    ['active:scale-[0.98]', 'group-active:scale-95']
  ]
].forEach(([source, label, focusNeedles, activeNeedles]) => {
  assertAnyIncludes(source as string, focusNeedles as string[], `${label} focus state`);
  assertAnyIncludes(source as string, activeNeedles as string[], `${label} active state`);
  assertIncludes(source as string, 'min-h-invest-touch-target', `${label} touch target`);
  assertIncludes(source as string, 'InterestSaveStateRail', `${label} rail presence`);
});

[
  [signalsPageSource, 'Signals page mobile rail container', 'rounded-invest-control bg-invest-bg-soft p-1.5'],
  [feedPageSource, 'Feed page 390px rail container', 'min-[390px]:grid-cols-[64px_minmax(0,1fr)]'],
  [feedPageSource, 'Feed page rail before bottom actions', 'mt-3 grid grid-cols-[repeat(3,minmax(0,1fr))]'],
  [modelsPageSource, 'Models page rail list spacing', 'className="block space-y-2 rounded-invest-control'],
  [modelsPageSource, 'Models page disabled rail spacing', 'className="space-y-2"']
].forEach(([source, label, needle]) =>
  assertIncludes(source as string, needle as string, label as string)
);

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
  [railSource, serverLookupSource, readModelSource, interestSaveApiSource, signalsPageSource, feedPageSource, modelsPageSource].forEach(
    (source, index) =>
      assertCondition(
        !source.includes(needle),
        `${['rail', 'server lookup', 'read model', 'interest save API', 'signals page', 'feed page', 'models page'][index]} avoids unsafe term ${needle}`
      )
  );
});

console.log('PASS interest-save state rail smoke');
