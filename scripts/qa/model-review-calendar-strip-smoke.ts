/**
 * Focused source smoke for BK-523/BK-524.
 * Guards the model detail review calendar strip wiring, loaded/empty/error
 * read states, 390px layout shape, bottom-tab clearance, and read-only safety
 * language without opening a DB or broker/external service.
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
    /(<button|<Link|role="button"|href=|onClick|formAction|actionLabel|ctaLabel)[\s\S]{0,260}(Deposit now|Connect brokerage|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading)/i;

  assertCondition(
    !unsafePattern.test(source),
    `${label}: unsafe real-finance CTA appears near an interactive affordance`
  );
}

function assertNegatedSafetyOnly(label: string, source: string) {
  const allowedNegatedPattern =
    /\b(no real|not real|not a real|not advice|no rebalance execution|was created|without real)\b/i;
  const phrases = [
    'rebalance execution',
    'order',
    'TradeIntent',
    'brokerage',
    'legal judgment'
  ];
  const lines = source.split(/\r?\n/);
  const matches = lines.flatMap((line, index) => {
    const context = `${lines[index - 1] ?? ''} ${line}`;

    return phrases
      .filter((phrase) => new RegExp(`\\b${phrase}\\b`).test(line))
      .filter(() => !allowedNegatedPattern.test(context))
      .map((phrase) => `${phrase} at line ${index + 1}`);
  });

  assertCondition(
    matches.length === 0,
    `${label}: real-finance/legal implication is not clearly negated: ${matches.join(', ')}`
  );
}

const modelDetailPageSource = readProjectFile(
  'app/invest-model/models/[modelId]/page.tsx'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageSource = readProjectFile('package.json');
const readModelSource = readProjectFile('lib/db/model-review-calendar-read-model.ts');
const listApiSource = readProjectFile('app/api/models/review-calendar/route.ts');
const detailApiSource = readProjectFile(
  'app/api/models/review-calendar/[reviewPublicId]/route.ts'
);
const stripSource = modelDetailPageSource.slice(
  modelDetailPageSource.indexOf('function ModelReviewScheduleStrip'),
  modelDetailPageSource.indexOf('async function modelDetailReviewScheduleItems')
);

assertCondition(
  stripSource.length > 0,
  'Model detail review strip source range must be discoverable'
);

[
  'readModelReviewCalendar',
  'ModelReviewCalendarItem',
  'modelDetailReviewScheduleItems',
  'ModelReviewScheduleReadState',
  "readState: 'api_loaded'",
  "readState: 'empty'",
  "readState: 'error_fallback'",
  'Review calendar API loaded',
  'Review calendar empty state',
  'Review calendar error state',
  'readState === \'api_loaded\'',
  'readState === \'empty\'',
  "'x-invest-model-role': 'user'",
  'payload.data?.all',
  'model.modelPublicId',
  'apiItems.length === 0',
  'matchingItems.length > 0 ? matchingItems : apiItems.slice(0, 3)',
  'visibleItems.slice(0, 3).map',
  'No model review calendar metadata is available.',
  'No rebalance execution, order, TradeIntent, brokerage, or legal judgment was created.'
].forEach((needle) =>
  assertIncludes(modelDetailPageSource, needle, 'Model detail review strip API wiring')
);

[
  'aria-label={copy.title}',
  'SectionHeader title={copy.title} description={copy.description}',
  '{readStateLabel} / {copy.safetyLabel}',
  'grid-cols-[4.75rem_minmax(0,1fr)]',
  'min-h-invest-touch-target',
  'min-w-0',
  'truncate',
  'flex min-w-0 flex-wrap',
  'text-xs leading-5 text-invest-text-muted',
  'rounded-invest-control',
  'gap-3',
  'p-2.5',
  'SectionHeader',
  'CalendarCheck',
  'role="list"',
  'role="listitem"'
].forEach((needle) =>
  assertIncludes(modelDetailPageSource, needle, 'Model detail review strip 390px layout')
);

[
  'review_due',
  'reviewed',
  'paused',
  'mock_schedule_seed',
  'Mock review schedule only',
  'Reviewed placeholder metadata only',
  'Paused metadata only',
  'no legal judgment',
  'rebalance execution',
  'TradeIntent',
  'brokerage connection',
  'paid external API',
  'reviewMetadataOnly: true',
  'rebalanceExecution: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'brokerageConnection: false',
  'externalPaidApi: false'
].forEach((needle) =>
  assertIncludes(readModelSource, needle, 'Review calendar seed/read-model safety')
);

[
  'Only signed-in user or admin roles can read model review calendar metadata.',
  "contract: 'ModelReviewCalendarDto'",
  "persistence: 'read_only_seed_projection'",
  'mockOnly: true',
  'reviewMetadataOnly: true',
  'legalJudgment: false',
  'rebalanceExecution: false',
  'allocationChanged: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'brokerageConnection: false',
  'externalPaidApi: false',
  'financialAdvice: false',
  'emptyState',
  'statusCounts'
].forEach((needle) =>
  assertIncludes(listApiSource, needle, 'Review calendar list API safety')
);

[
  'Only signed-in user or admin roles can read model review calendar metadata.',
  "contract: 'ModelReviewCalendarDto'",
  'Model review calendar public id is required.',
  'No live review system, rebalance, order, or brokerage action was queried.',
  'rebalanceExecution: false',
  'tradeIntentCreated: false',
  'realOrder: false',
  'brokerageConnection: false'
].forEach((needle) =>
  assertIncludes(detailApiSource, needle, 'Review calendar detail API safety')
);

assertCondition(
  !/\b(?:fixed|sticky|w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
    stripSource
  ),
  'Model detail review strip must not introduce fixed/sticky or horizontal-scroll layout'
);

[
  ['Model detail page focus state', ['focus:outline-none', 'focus:ring-2', 'focus-visible:ring-2', 'focus-within:bg-invest-primary-soft/60']],
  ['Model detail page active state', ['active:scale-[0.99]', 'active:scale-95']],
  ['Model detail page motion affordance', ['investMotionClass.interactiveCard', 'investMotionClass.interactiveControl']]
].forEach(([label, needles]) =>
  assertAnyIncludes(modelDetailPageSource, needles as string[], label as string)
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
  'active:scale-95',
  'focus-visible:ring-offset-invest-surface'
].forEach((needle) =>
  assertIncludes(mobileShellSource, needle, 'MobileShell safe-area/bottom-tab')
);

assertIncludes(
  packageSource,
  '"test:model-review-calendar-strip": "npx tsx scripts/qa/model-review-calendar-strip-smoke.ts"',
  'Package script'
);

assertNoUnsafeInteractiveCta('Model review strip', stripSource);
assertNegatedSafetyOnly('Model review strip', stripSource);

[
  'Deposit now',
  'Connect brokerage',
  'Connect broker',
  'Place order',
  'Execute trade',
  'Execute rebalance',
  'Buy now',
  'Sell now',
  'Submit order',
  'Open account',
  'Link account',
  'Invest now',
  'Start trading',
  'Trade now',
  'Legal approval',
  'Legally approved',
  'rebalanceExecutionId',
  'brokerageAccountId',
  'brokerOrder',
  'accountNumber',
  'realBalance',
  'externalApiKey'
].forEach((needle) => {
  [stripSource, listApiSource, detailApiSource].forEach((source, index) =>
    assertCondition(
      !source.includes(needle),
      `${['strip', 'list API', 'detail API'][index]} avoids unsafe term ${needle}`
    )
  );
});

console.log('PASS model review calendar strip smoke');
