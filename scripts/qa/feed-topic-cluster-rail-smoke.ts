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
const packageJson = readProjectFile('package.json');

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
    feedPageSource.includes('No mock topic clusters are available yet.') &&
    feedPageSource.includes(
      'Topic clusters could not be read from the read-only API.'
    ),
  'Feed page exposes loaded, empty, and error states for topic clusters'
);

assertCondition(
  feedPageSource.includes('Feed topic clusters') &&
    feedPageSource.includes('Feed topic chips') &&
    feedPageSource.includes('Feed topic cluster rail') &&
    feedPageSource.includes('Read-only chips group seeded FeedPosts') &&
    feedPageSource.includes('not trading instructions') &&
    feedPageSource.includes('Topic cluster safety labels'),
  'Feed page includes visible mock/read-only topic cluster safety copy'
);

assertCondition(
  feedPageSource.includes('min-[390px]:grid-cols-2') &&
    feedPageSource.includes('min-h-[132px]') &&
    feedPageSource.includes('focus-visible:ring-2') &&
    feedPageSource.includes('active:bg-invest-primary-soft/60') &&
    feedPageSource.includes('investMotionClass.interactiveCard') &&
    feedPageSource.includes('MobileShell') &&
    feedPageSource.includes('activeTab="feed"'),
  'Feed topic cluster rail preserves 390px layout, focus, active, and MobileShell structure'
);

[
  'no live feed',
  'no paid API',
  'no advice',
  'no order',
  'no brokerage'
].forEach((boundary) => {
  assertCondition(
    feedPageSource.includes(boundary),
    `Feed topic cluster rail includes ${boundary}`
  );
});

[
  'Deposit now',
  'Connect brokerage',
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
