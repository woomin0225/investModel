/**
 * Verifies BK-548 Feed detail 390px mobile smoke coverage.
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

function assertNoHorizontalOverflow(source: string, label: string) {
  [
    'w-screen',
    'min-w-screen',
    'max-w-screen',
    'overflow-x-auto',
    'overflow-x-scroll',
    '100vw'
  ].forEach((needle) => {
    assertCondition(
      !source.includes(needle),
      `${label} avoids horizontal overflow class or viewport width ${needle}`
    );
  });
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
const feedReadActionSource = readProjectFile(
  'components/invest-model/feed-read-action.tsx'
);
const feedLikeActionSource = readProjectFile(
  'components/invest-model/feed-like-action.tsx'
);
const feedSaveActionSource = readProjectFile(
  'components/invest-model/feed-save-action.tsx'
);
const packageJson = readProjectFile('package.json');

[
  [feedDetailSource, 'Feed detail page'],
  [mobileShellSource, 'Mobile shell'],
  [feedCommentActionSource, 'Feed comments'],
  [feedReadActionSource, 'Feed read action'],
  [feedLikeActionSource, 'Feed like action'],
  [feedSaveActionSource, 'Feed save action']
].forEach(([source, label]) => {
  assertNoHorizontalOverflow(source, label);
});

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
  feedDetailSource.includes('grid grid-cols-2 gap-invest-card-gap') &&
    feedDetailSource.includes('<FeedReadAction') &&
    feedDetailSource.includes('<FeedLikeAction') &&
    feedDetailSource.includes('<FeedSaveAction') &&
    feedDetailSource.includes('scroll-mt-4') &&
    feedDetailSource.includes('rounded-invest-card border border-invest-border') &&
    feedDetailSource.includes('min-w-0 flex-1') &&
    feedDetailSource.includes('max-w-full') &&
    feedDetailSource.includes('break-words'),
  'Feed detail 390px structure keeps action tiles, comments anchor, and wrapping-safe content containers'
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
    feedCommentActionSource.includes('w-full') &&
    feedCommentActionSource.includes('focus-visible:ring-2') &&
    feedCommentActionSource.includes('active:bg-invest-primary/85') &&
    feedCommentActionSource.includes('maxLength={maxCommentLength + 20}') &&
    feedCommentActionSource.includes('remainingCount') &&
    feedCommentActionSource.includes('replyRemainingCount') &&
    feedCommentActionSource.includes('aria-expanded={isReplyOpen}') &&
    feedCommentActionSource.includes('aria-describedby={commentDescriptionIds}') &&
    feedCommentActionSource.includes('aria-describedby={replyDescriptionIds}') &&
    feedCommentActionSource.includes('role="status"') &&
    feedCommentActionSource.includes('role="alert"') &&
    feedCommentActionSource.includes('Informational discussion only') &&
    feedCommentActionSource.includes('Open informational reply form. Replies are discussion-only and do not create advice, orders, or approvals.') &&
    feedCommentActionSource.includes('Close informational reply form. No advice, order, or approval is created.') &&
    feedCommentActionSource.includes('Informational reply only. This does not create advice, orders, brokerage actions, or approvals.') &&
    feedCommentActionSource.includes('Post informational reply. No order, brokerage action, advice, or approval is created.') &&
    feedCommentActionSource.includes('Post informational comment. No order, brokerage action, advice, or approval is created.') &&
    feedCommentActionSource.includes('Informational discussion only. This does not create advice, orders, brokerage actions, or approvals.') &&
    feedCommentActionSource.includes('No advice, order, or approval is created.') &&
    feedCommentActionSource.includes('No order, brokerage action, investment advice, or approval is created.') &&
    feedCommentActionSource.includes('No order, brokerage action, investment advice, or approval was created.'),
  'Feed comment controls preserve touch, focus, pressed, length, pending/error, and safe discussion states'
);

assertCondition(
  feedReadActionSource.includes('/reads') &&
    feedReadActionSource.includes('aria-live="polite"') &&
    feedReadActionSource.includes('role="status"') &&
    feedReadActionSource.includes('role="alert"') &&
    feedReadActionSource.includes('privateReadingStateOnly') &&
    feedReadActionSource.includes('recommendationSignal?: boolean') &&
    feedReadActionSource.includes('orderIntentSignal?: boolean') &&
    feedReadActionSource.includes('realOrder?: boolean') &&
    feedReadActionSource.includes('brokerageConnection?: boolean') &&
    feedReadActionSource.includes('financialAdvice?: boolean') &&
    feedReadActionSource.includes('complianceApproval?: boolean') &&
    feedReadActionSource.includes('Saving read state only') &&
    feedReadActionSource.includes('No recommendation, order, approval, or investment advice is created.') &&
    feedReadActionSource.includes('Private reading history, not advice, order, or approval signal.'),
  'Feed read tile stays private reading history only and cannot imply advice, approval, or order intent'
);

assertCondition(
  feedLikeActionSource.includes('/likes') &&
    feedLikeActionSource.includes('aria-live="polite"') &&
    feedLikeActionSource.includes('role="status"') &&
    feedLikeActionSource.includes('role="alert"') &&
    feedLikeActionSource.includes('aria-pressed={reactionState.liked}') &&
    feedLikeActionSource.includes('min-h-invest-touch-target') &&
    feedLikeActionSource.includes('w-full') &&
    feedLikeActionSource.includes('focus-visible:ring-2') &&
    feedLikeActionSource.includes('active:bg-invest-primary-soft/55') &&
    feedLikeActionSource.includes('disabled:cursor-wait disabled:opacity-80') &&
    feedLikeActionSource.includes('Saving like state only') &&
    feedLikeActionSource.includes('not advice, return, or order signal') &&
    feedLikeActionSource.includes('No real order, brokerage action, or investment advice is created.') &&
    feedLikeActionSource.includes('No real order, brokerage action, or investment advice was created.'),
  'Feed like tile keeps pressed/focus/touch states and engagement-only safety copy'
);

assertCondition(
  feedSaveActionSource.includes('/saves') &&
    feedSaveActionSource.includes('aria-live="polite"') &&
    feedSaveActionSource.includes('role="status"') &&
    feedSaveActionSource.includes('role="alert"') &&
    feedSaveActionSource.includes('aria-pressed={reactionState.saved}') &&
    feedSaveActionSource.includes('min-h-invest-touch-target') &&
    feedSaveActionSource.includes('w-full') &&
    feedSaveActionSource.includes('focus-visible:ring-2') &&
    feedSaveActionSource.includes('active:bg-invest-primary-soft/55') &&
    feedSaveActionSource.includes('disabled:cursor-wait disabled:opacity-80') &&
    feedSaveActionSource.includes('Saving a private reading shortcut only') &&
    feedSaveActionSource.includes('not model selection, allocation, or order intent') &&
    feedSaveActionSource.includes('No model selection, allocation, or order intent is created.') &&
    feedSaveActionSource.includes('No model selection, allocation, or real order was created.'),
  'Feed save tile keeps pressed/focus/touch states and private-reading-only safety copy'
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

[
  feedCommentActionSource,
  feedReadActionSource,
  feedLikeActionSource,
  feedSaveActionSource
].forEach((source, index) => {
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
    'brokerOrder',
    'buySignal',
    'sellSignal',
    'holdRecommendation',
    'realBalance'
  ].forEach((needle) => {
    assertCondition(
      !source.includes(needle),
      `Feed action component ${index} avoids unsafe term ${needle}`
    );
  });
});

assertCondition(
  packageJson.includes(
    '"test:feed-detail-mobile-screen": "npx tsx scripts/qa/feed-detail-mobile-screen-smoke.ts"'
  ),
  'package script exposes Feed detail mobile screen smoke'
);
