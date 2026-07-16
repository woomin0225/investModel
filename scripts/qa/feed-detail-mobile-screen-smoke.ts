/**
 * Verifies BK-547 Feed detail mobile screen structure.
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

const feedDetailSource = readProjectFile(
  'app/invest-model/feed/[postId]/page.tsx'
);
const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const feedCommentActionSource = readProjectFile(
  'components/invest-model/feed-comment-action.tsx'
);
const packageJson = readProjectFile('package.json');

const mediaCardBlock = feedDetailSource.slice(
  feedDetailSource.indexOf('feedDetailMediaAccessibleLabel(post)'),
  feedDetailSource.indexOf('post.linkedModelName')
);
const safeActionLineBlock = feedDetailSource.slice(
  feedDetailSource.indexOf('Feed detail safe action line'),
  feedDetailSource.indexOf('recentLikeRanking')
);
const commentsSectionBlock = feedDetailSource.slice(
  feedDetailSource.indexOf('Feed detail comments section'),
  feedDetailSource.indexOf('<FeedCommentAction')
);

assertCondition(
  mediaCardBlock.length > 0 &&
    safeActionLineBlock.length > 0 &&
    commentsSectionBlock.length > 0,
  'Feed detail source blocks must be discoverable for scoped smoke checks'
);

assertCondition(
  feedDetailSource.includes('readFeedPostDetail') &&
    feedDetailSource.includes('@/app/api/feed/[postId]/route') &&
    feedDetailSource.includes('FeedPostDetailDto') &&
    feedDetailSource.includes('readInvestModelFeedPostDetail'),
  'Feed detail screen reads the BK-546 detail API contract'
);

assertCondition(
  feedDetailSource.includes('safeActionContracts') &&
    feedDetailSource.includes('safeActionContractCodes') &&
    feedDetailSource.includes('safeActionContractLabels') &&
    safeActionLineBlock.includes('safeActionContractLabels.map') &&
    safeActionLineBlock.includes('Safe FeedPost action contract') &&
    safeActionLineBlock.includes('safeActionContractCodes[index]') &&
    safeActionLineBlock.includes('Feed detail safe action line') &&
    feedDetailSource.includes('DB user state') &&
    feedDetailSource.includes('not advice') &&
    feedDetailSource.includes('no orders') &&
    feedDetailSource.includes('no brokerage') &&
    safeActionLineBlock.includes('No advice, order, brokerage action, or realtime external data.'),
  'Feed detail screen surfaces safe action contract chips and safety copy'
);

assertCondition(
  mediaCardBlock.includes('Informational media card') &&
    mediaCardBlock.includes('DB-backed') &&
    mediaCardBlock.includes('min-h-[132px]') &&
    mediaCardBlock.includes('line-clamp-2') &&
    mediaCardBlock.includes('line-clamp-3') &&
    mediaCardBlock.includes('break-words') &&
    mediaCardBlock.includes('sourceAttribution.sourceLabel') &&
    mediaCardBlock.includes('sourceAttribution.reviewState') &&
    mediaCardBlock.includes('Mock-safe feed insight only') &&
    mediaCardBlock.includes('No live feed') &&
    mediaCardBlock.includes('paid API') &&
    mediaCardBlock.includes('advice') &&
    mediaCardBlock.includes('order') &&
    mediaCardBlock.includes('brokerage action'),
  'Feed detail media card preserves 390px text-fit and mock-safe source framing'
);

assertCondition(
  feedDetailSource.includes('<MobileShell') &&
    feedDetailSource.includes('activeTab="feed"') &&
    feedDetailSource.includes('currentPath={currentPath}') &&
    feedDetailSource.includes('DetailBackLink') &&
    feedDetailSource.includes('FeedReadAction') &&
    feedDetailSource.includes('FeedLikeAction') &&
    feedDetailSource.includes('FeedSaveAction') &&
    feedDetailSource.includes('FeedCommentAction') &&
    feedDetailSource.includes('grid grid-cols-2 gap-invest-card-gap') &&
    feedDetailSource.includes('scroll-mt-4') &&
    commentsSectionBlock.includes('Discussion only') &&
    commentsSectionBlock.includes('not advice') &&
    commentsSectionBlock.includes('orders') &&
    commentsSectionBlock.includes('brokerage') &&
    commentsSectionBlock.includes('approval'),
  'Feed detail screen keeps mobile action grid, comment section, and safe discussion framing'
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
    mobileShellSource.includes('grid-cols-5'),
  'MobileShell reserves bottom safe-area space so Feed detail does not overlap the fixed tab bar'
);

assertCondition(
  feedCommentActionSource.includes('min-h-invest-touch-target') &&
    feedCommentActionSource.includes('focus-visible:ring-2') &&
    feedCommentActionSource.includes('active:bg-invest-primary/85') &&
    feedCommentActionSource.includes('Informational discussion only') &&
    feedCommentActionSource.includes('No advice, order, or approval is created.'),
  'Feed comment controls preserve touch, focus, pressed, and safe discussion states'
);

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
    !feedDetailSource.includes(needle),
    `Feed detail mobile screen avoids unsafe term ${needle}`
  );
});

assertCondition(
    packageJson.includes(
      '"test:feed-detail-mobile-screen": "npx tsx scripts/qa/feed-detail-mobile-screen-smoke.ts"'
    ),
  'package script exposes Feed detail mobile screen smoke'
);
