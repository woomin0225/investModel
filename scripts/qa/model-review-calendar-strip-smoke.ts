/**
 * Focused source smoke for BK-523.
 * Guards the model detail review calendar strip wiring, 390px layout shape,
 * bottom-tab clearance, and read-only safety language without opening a DB or
 * broker/external service.
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
  "'x-invest-model-role': 'user'",
  'payload.data?.all',
  'model.modelPublicId',
  'No model review calendar metadata is available.',
  'No rebalance execution, order, TradeIntent, brokerage, or legal judgment was created.'
].forEach((needle) =>
  assertIncludes(modelDetailPageSource, needle, 'Model detail review strip API wiring')
);

[
  'grid-cols-[4.75rem_minmax(0,1fr)]',
  'min-h-invest-touch-target',
  'min-w-0',
  'truncate',
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

assertCondition(
  !/\b(?:fixed|sticky|w-screen|min-w-screen|max-w-screen|overflow-x-auto|overflow-x-scroll)\b|100vw/.test(
    stripSource
  ),
  'Model detail review strip must not introduce fixed/sticky or horizontal-scroll layout'
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

console.log('PASS model review calendar strip smoke');
