/**
 * Verifies BK-518 Feed topic chips and cluster rail source structure.
 * This is a 390px-oriented source smoke; it does not require live feeds,
 * paid APIs, advice, orders, brokerage accounts, or browser screenshots.
 */

import { readFileSync } from 'fs';
import path from 'path';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readProjectFile(relativePath: string) {
  return readFileSync(path.resolve(relativePath), 'utf8');
}

const feedPageSource = readProjectFile('app/invest-model/feed/page.tsx');
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const packageJson = readProjectFile('package.json');
const topicClusterSection = feedPageSource.slice(
  feedPageSource.indexOf('Feed topic clusters'),
  feedPageSource.indexOf('aria-label={safetyAccessibleLabel}')
);
const topicClusterRail = feedPageSource.slice(
  feedPageSource.indexOf('aria-label="Feed topic cluster rail"'),
  feedPageSource.indexOf('aria-label="Topic cluster safety labels"')
);
const topicClusterChips = feedPageSource.slice(
  feedPageSource.indexOf('ariaLabel="Feed topic chips"'),
  feedPageSource.indexOf('aria-label="Feed topic cluster rail"')
);

assertCondition(
  topicClusterSection.length > 0 &&
    topicClusterRail.length > 0 &&
    topicClusterChips.length > 0,
  'Feed topic cluster source blocks must be discoverable for scoped smoke checks'
);

assertCondition(
  feedPageSource.includes('readFeedTopicClusters') &&
    feedPageSource.includes('@/app/api/feed/topic-clusters/route') &&
    feedPageSource.includes('FeedTopicClusterReadModel') &&
    feedPageSource.includes('readInvestModelFeedTopicClusters'),
  'Feed page reads the BK-517 topic cluster API contract'
);

assertCondition(
  feedPageSource.includes('Topic cluster API loaded') &&
    feedPageSource.includes('Topic cluster empty state') &&
    feedPageSource.includes('Topic cluster error state') &&
    feedPageSource.includes('function feedTopicClusterEmptyAccessibleLabel') &&
    feedPageSource.includes('function feedTopicClusterErrorAccessibleLabel') &&
    topicClusterSection.includes('feedTopicClusterEmptyAccessibleLabel') &&
    topicClusterSection.includes('feedTopicClusterErrorAccessibleLabel') &&
    topicClusterSection.includes('aria-label={') &&
    topicClusterSection.includes('title={') &&
    topicClusterSection.includes('border-dashed border-invest-border') &&
    topicClusterSection.includes('bg-invest-bg-soft') &&
    topicClusterSection.includes('No mock topic clusters are available yet.') &&
    topicClusterSection.includes(
      'Topic clusters could not be read from the read-only API.'
    ),
  'Feed page exposes loaded, empty, and error states for topic clusters'
);

assertCondition(
  topicClusterSection.includes('Feed topic clusters') &&
    topicClusterSection.includes('Feed topic chips') &&
    topicClusterSection.includes('Feed topic cluster rail') &&
    topicClusterSection.includes('Read-only chips group seeded FeedPosts') &&
    topicClusterSection.includes('not trading instructions') &&
    topicClusterSection.includes('Topic cluster safety labels'),
  'Feed page includes visible mock/read-only topic cluster safety copy'
);

assertCondition(
  topicClusterSection.includes('role="list"') &&
    topicClusterRail.includes('aria-label="Feed topic cluster rail"') &&
    topicClusterRail.includes('mt-3 grid gap-2 min-[390px]:grid-cols-2') &&
    topicClusterRail.includes('min-h-[132px]') &&
    topicClusterRail.includes('min-w-0') &&
    topicClusterRail.includes('line-clamp-2') &&
    topicClusterRail.includes('line-clamp-3') &&
    topicClusterRail.includes('break-words') &&
    topicClusterRail.includes('grid grid-cols-2') &&
    topicClusterRail.includes('truncate') &&
    topicClusterRail.includes('focus-visible:outline-none') &&
    topicClusterRail.includes('focus-visible:ring-2') &&
    topicClusterRail.includes('focus-visible:ring-invest-primary') &&
    topicClusterRail.includes('focus-visible:ring-offset-invest-surface') &&
    topicClusterRail.includes('active:bg-invest-primary-soft/60') &&
    topicClusterRail.includes('investMotionClass.interactiveCard') &&
    topicClusterChips.includes('MobileFilterRail') &&
    topicClusterChips.includes('min-h-invest-touch-target') &&
    topicClusterChips.includes('investMotionClass.interactiveControl') &&
    feedPageSource.includes('<MobileShell') &&
    feedPageSource.includes('activeTab="feed"') &&
    feedPageSource.includes('currentPath="/invest-model/feed"'),
  'Feed topic cluster rail preserves 390px layout, touch, text-fit, focus, active, and MobileShell structure'
);

assertCondition(
  mobileShellSource.includes(
    'pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)]'
  ) &&
    mobileShellSource.includes('fixed inset-x-0 bottom-0 z-30') &&
    mobileShellSource.includes(
      'h-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom))]'
    ) &&
    mobileShellSource.includes('pb-[env(safe-area-inset-bottom)]') &&
    mobileShellSource.includes('env(safe-area-inset-bottom)') &&
    mobileShellSource.includes('grid-cols-5'),
  'MobileShell reserves bottom safe-area space so the topic cluster rail does not overlap the fixed tab bar'
);

assertCondition(
  !topicClusterRail.includes('sticky') && !topicClusterRail.includes('fixed'),
  'Feed topic cluster rail itself must stay in normal flow under MobileShell padding'
);

assertCondition(
  feedPageSource.includes('DB seed projection') &&
    feedPageSource.includes('Deterministic fixture') &&
    feedPageSource.includes("cluster.generatedFrom === 'db_seed_projection'"),
  'Feed topic cluster source labels stay limited to DB seed projection or deterministic fixture'
);

[
  'Read-only topic cluster',
  'mock/seed source',
  'no live feed',
  'no paid API',
  'no advice',
  'no order',
  'no brokerage'
].forEach((boundary) => {
  assertCondition(
    feedPageSource.includes(boundary) &&
      topicClusterSection.includes('topicClusterBoundaries'),
    `Feed topic cluster rail includes ${boundary}`
  );
});

const unsafeInteractivePatterns = [
  /<(Link|button)[\s\S]{0,360}(Deposit now|Connect broker(age)?|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now)/i,
  /(href|onClick|formAction|aria-label|title)=["'{][\s\S]{0,180}(Deposit now|Connect broker(age)?|Place order|Execute trade|Buy now|Sell now|Submit order|Open account|Link account|Invest now|Start trading|Trade now)/i,
  /<(Link|button)[\s\S]{0,360}(매수|매도|주문하기|입금|계좌\s*연결|실거래)/,
  /(href|onClick|formAction|aria-label|title)=["'{][\s\S]{0,180}(매수|매도|주문하기|입금|계좌\s*연결|실거래)/
];

unsafeInteractivePatterns.forEach((pattern) => {
  assertCondition(
    !pattern.test(topicClusterSection),
    `Feed topic cluster section avoids unsafe interactive CTA ${pattern}`
  );
});

[
  'Deposit now',
  'Connect brokerage',
  'Connect broker',
  'Place order',
  'Execute trade',
  'Buy now',
  'Sell now',
  'Submit order',
  'Open account',
  'Link account',
  'Invest now',
  'Start trading',
  'Trade now',
  'liveNewsProvider',
  'externalApiKey',
  'orderId',
  'tradeIntentId',
  'brokerageAccountId',
  'brokerOrder',
  'buySignal',
  'sellSignal',
  'holdRecommendation',
  'realBalance'
].forEach((needle) => {
  assertCondition(
    !feedPageSource.includes(needle),
    `Feed topic cluster rail avoids unsafe term ${needle}`
  );
});

assertCondition(
  packageJson.includes(
    '"test:feed-topic-cluster-rail": "npx tsx scripts/qa/feed-topic-cluster-rail-smoke.ts"'
  ),
  'package script exposes Feed topic cluster rail smoke'
);
