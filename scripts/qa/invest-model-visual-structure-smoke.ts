/**
 * This smoke test checks the Figma-seeded mobile screens for repeatable layout and safety structure.
 * It does not capture pixels; it verifies the code and mock data invariants that prevent common mobile overlap and misleading investment copy.
 */

import { readFileSync } from 'fs';
import path from 'path';
import {
  investModelNavItems,
  type InvestModelTabKey
} from '../../components/invest-model/mobile-shell';
import { investMotionClass } from '../../components/invest-model/ui';
import { investModelHomeMock } from '../../lib/mock/invest-model-home';
import {
  discoverableInvestmentModels,
  investModelDiscoveryMock
} from '../../lib/mock/invest-model-discovery';
import { investModelSignalsMock } from '../../lib/mock/invest-model-signals';
import { investModelDetailCopy } from '../../lib/mock/invest-model-model-detail';
import { investModelFeedMock } from '../../lib/mock/invest-model-feed';
import { investModelPortfolioMock } from '../../lib/mock/invest-model-portfolio';
import { pendingAdminReviewModels } from '../../lib/mock/invest-model-admin-review';
import { investModelCopy } from '../../lib/i18n/invest-model';

type ScreenCheck = {
  name: string;
  route: string;
  pageFile: string;
  activeTab: InvestModelTabKey;
  requiredCopy: string[];
  forbiddenCopy?: string[];
};

const projectRoot = process.cwd();

const screens: ScreenCheck[] = [
  {
    name: 'Home',
    route: '/invest-model',
    pageFile: 'app/invest-model/page.tsx',
    activeTab: 'home',
    requiredCopy: [
      investModelHomeMock.account.balanceDescription,
      investModelHomeMock.account.policyDescription,
      investModelHomeMock.signal.status,
      ...investModelHomeMock.timeline.flatMap((item) => [
        item.sourceLabel,
        item.statusLabel
      ])
    ]
  },
  {
    name: 'Notifications',
    route: '/invest-model/notifications',
    pageFile: 'app/invest-model/notifications/page.tsx',
    activeTab: 'home',
    requiredCopy: [
      'DB-backed notification center',
      'Latest notification candidates',
      'No real push'
    ]
  },
  {
    name: 'My Page',
    route: '/invest-model/my',
    pageFile: 'app/invest-model/my/page.tsx',
    activeTab: 'home',
    requiredCopy: [
      'My Page',
      'No real account',
      'No real orders',
      'DB read model',
      'Session member scope',
      'Prototype fallback scope',
      'API userScopeSource',
      'API dataContext',
      'Recent FeedPost activity',
      'Saved/comment activity is an informational reading shortcut only',
      '/invest-model/feed',
      '/invest-model/notifications'
    ],
    forbiddenCopy: [
      'user 1 in-app',
      'User 1 app activity',
      'for user 1',
      'User 1 saved',
      'demo member',
      'demo user',
      'demo scope',
      'user_demo_001',
      'userPublicId=',
      'demoUserPublicId',
      'Demo member',
      'Demo user',
      'Demo scope',
      'Prototype demo fallback',
      'user 1의',
      '회원 1의',
      '사용자 1의'
    ]
  },
  {
    name: 'Search',
    route: '/invest-model/search',
    pageFile: 'app/invest-model/search/page.tsx',
    activeTab: 'home',
    requiredCopy: [
      'Search',
      'InvestmentModels',
      'Mock discovery model',
      'SignalEvents',
      'DB SignalEvent',
      'No advice'
    ]
  },
  {
    name: 'Discover Models',
    route: '/invest-model/models',
    pageFile: 'app/invest-model/models/page.tsx',
    activeTab: 'models',
    requiredCopy: [
      investModelCopy.en.models.sectionTitle,
      investModelCopy.en.models.footerBadges.noLiveTrading,
      investModelCopy.en.models.footerBadges.backtestMock,
      discoverableInvestmentModels[0]?.name ?? ''
    ]
  },
  {
    name: 'Realtime Signals',
    route: '/invest-model/signals',
    pageFile: 'app/invest-model/signals/page.tsx',
    activeTab: 'signals',
    requiredCopy: [
      investModelCopy.en.signals.sectionTitle,
      investModelCopy.en.signals.footerBadges.noRecommendation,
      investModelCopy.en.signals.footerBadges.mockData,
      investModelSignalsMock.summary.blockedLabel
    ]
  },
  {
    name: 'Signal Detail',
    route: '/invest-model/signals/sig_mock_news_traffic_001',
    pageFile: 'app/invest-model/signals/[signalId]/page.tsx',
    activeTab: 'signals',
    requiredCopy: [
      'Signal Detail',
      'No recommendation',
      'No order',
      'Related Feed search',
      'Realtime search volume',
      'DB-backed detail evidence',
      'Related news context',
      'Price trend context',
      'Traffic evidence',
      'Score movement history'
    ]
  },
  {
    name: 'Model Detail',
    route: '/invest-model/models/quant-us-leverage-alpha',
    pageFile: 'app/invest-model/models/[modelId]/page.tsx',
    activeTab: 'models',
    requiredCopy: [
      investModelDetailCopy.en.performanceGroupTitle,
      investModelDetailCopy.en.selectionReviewTitle,
      investModelDetailCopy.en.highRiskNotice,
      investModelDetailCopy.en.highRiskConfirmLabel,
      investModelDetailCopy.en.noLiveTradingLabel,
      'Approved/public model',
      'No recommendation',
      'No live order',
      'No brokerage'
    ]
  },
  {
    name: 'Admin Review Queue',
    route: '/invest-model/admin/reviews',
    pageFile: 'app/invest-model/admin/reviews/page.tsx',
    activeTab: 'models',
    requiredCopy: [
      pendingAdminReviewModels[0]?.modelName ?? '',
      pendingAdminReviewModels[0]?.creatorName ?? '',
      pendingAdminReviewModels[0]?.blockedActionLabel ?? '',
      pendingAdminReviewModels[0]?.disclosureStatusLabel ?? ''
    ]
  },
  {
    name: 'Admin Review Detail',
    route: '/invest-model/admin/reviews/review-quant-us-leverage-alpha-v2',
    pageFile: 'app/invest-model/admin/reviews/[reviewId]/page.tsx',
    activeTab: 'models',
    requiredCopy: [
      pendingAdminReviewModels[0]?.strategySummary ?? '',
      pendingAdminReviewModels[0]?.mandateSummary ?? '',
      pendingAdminReviewModels[0]?.performanceSourceLabel ?? '',
      pendingAdminReviewModels[0]?.requiredReviewItems[0] ?? ''
    ]
  },
  {
    name: 'Feed Insights',
    route: '/invest-model/feed',
    pageFile: 'app/invest-model/feed/page.tsx',
    activeTab: 'feed',
    requiredCopy: [
      investModelFeedMock.summary.title,
      investModelFeedMock.summary.description,
      investModelFeedMock.summary.reviewLabel
    ]
  },
  {
    name: 'Feed Detail',
    route: '/invest-model/feed/feed_mock_001',
    pageFile: 'app/invest-model/feed/[postId]/page.tsx',
    activeTab: 'feed',
    requiredCopy: [
      'Feed Detail',
      'Related SignalEvents',
      'No advice',
      'Read-only'
    ]
  },
  {
    name: 'Mock Portfolio',
    route: '/invest-model/portfolio',
    pageFile: 'app/invest-model/portfolio/page.tsx',
    activeTab: 'portfolio',
    requiredCopy: [
      investModelPortfolioMock.selectedModel.name,
      investModelPortfolioMock.selectedModel.selectionPublicId,
      investModelPortfolioMock.selectedModel.modelPublicId,
      investModelPortfolioMock.selectedModel.modelVersionPublicId,
      investModelPortfolioMock.selectedModel.versionLabel,
      investModelPortfolioMock.selectedModel.statusLabel,
      investModelPortfolioMock.selectedModel.mandateLabel,
      investModelPortfolioMock.mockDeposit.safetyLabel,
      'Mock time dashboard',
      'Read-model trace',
      'mock time windows from DB-backed',
      investModelPortfolioMock.timeSnapshots[0]?.safetyLabel ?? '',
      investModelPortfolioMock.allocationDecision.sourceLabel,
      investModelPortfolioMock.tradeIntent.boundaryLabel
    ]
  }
];

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function assertNoLongUnbrokenText(label: string, values: string[]) {
  const maxUnbrokenLength = 42;
  const longTokens = values
    .flatMap((value) => value.split(/\s+/))
    .filter((token) => token.length > maxUnbrokenLength);

  assertCondition(
    longTokens.length === 0,
    `${label}: found long unbroken text tokens that can overflow mobile cards: ${longTokens.join(', ')}`
  );
}

function collectScreenTextValues() {
  return [
    investModelHomeMock.account.balanceDescription,
    investModelHomeMock.account.returnDescription,
    investModelHomeMock.account.policyDescription,
    investModelHomeMock.activeModel.summary,
    investModelHomeMock.signal.description,
    ...investModelHomeMock.timeline.flatMap((item) => [
      item.time,
      item.sourceLabel,
      item.statusLabel,
      item.description
    ]),
    investModelCopy.en.models.footer,
    investModelCopy.en.models.footerBadges.noLiveTrading,
    investModelCopy.en.models.footerBadges.backtestMock,
    ...investModelDiscoveryMock.filters,
    ...investModelDiscoveryMock.models.flatMap((model) => [
      model.name,
      model.summary,
      model.performanceLabel,
      model.reviewLabel,
      model.simulatedAumLabel,
      ...model.tags
    ]),
    investModelCopy.en.signals.footer,
    investModelCopy.en.signals.footerBadges.noRecommendation,
    investModelCopy.en.signals.footerBadges.mockData,
    ...investModelSignalsMock.signals.flatMap((signal) => [
      signal.title,
      signal.description,
      signal.statusLabel
    ]),
    ...investModelDetailCopy.en.models.flatMap((model) => [
      model.name,
      model.summary,
      model.disclosureDescription,
      ...model.metrics.flatMap((metric) => [
        metric.label,
        metric.value,
        metric.description
      ]),
      ...model.mandateItems,
      ...model.riskItems,
      ...model.limitationItems
    ]),
    ...pendingAdminReviewModels.flatMap((model) => [
      model.modelName,
      model.creatorName,
      model.submittedAtLabel,
      model.versionLabel,
      model.marketLabel,
      model.riskLabel,
      model.leverageLabel,
      model.assetScopeLabel,
      model.mandateSummary,
      model.disclosureStatusLabel,
      model.blockedActionLabel,
      model.strategySummary,
      model.performanceSourceLabel,
      ...model.requiredReviewItems,
      ...model.dataInputs,
      ...model.forbiddenAssets,
      ...model.reviewNotes
    ]),
    investModelFeedMock.summary.description,
    ...investModelFeedMock.posts.flatMap((post) => [
      post.title,
      post.excerpt,
      ...post.tags
    ]),
    investModelPortfolioMock.selectedModel.mandateLabel,
    investModelPortfolioMock.selectedModel.modelVersionPublicId,
    investModelPortfolioMock.selectedModel.statusDescription,
    investModelPortfolioMock.selectedModel.selectedAtLabel,
    investModelPortfolioMock.mockDeposit.displayLabel,
    investModelPortfolioMock.mockDeposit.safetyLabel,
    ...investModelPortfolioMock.timeSnapshots.flatMap((snapshot) => [
      snapshot.rangeLabel,
      snapshot.valueLabel,
      snapshot.checkpointLabel,
      snapshot.signalLabel,
      snapshot.safetyLabel
    ]),
    investModelPortfolioMock.allocationDecision.rationale,
    ...investModelPortfolioMock.positions.flatMap((position) => [
      position.symbol,
      position.name,
      position.quantityLabel,
      position.valueLabel,
      position.stateLabel,
      position.sourceLabel
    ]),
    ...investModelPortfolioMock.tradeIntent.blockedActions
  ];
}

const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
);
const topIconBarSource = readProjectFile(
  'components/invest-model/top-icon-bar.tsx'
);
const investModelUiSource = readProjectFile('components/invest-model/ui.tsx');
const homePageSource = readProjectFile('app/invest-model/page.tsx');
const myPageSource = readProjectFile('app/invest-model/my/page.tsx');
const signalsPageSource = readProjectFile('app/invest-model/signals/page.tsx');
const signalRefreshActionSource = readProjectFile(
  'components/invest-model/signal-refresh-action.tsx'
);
const signalDetailPageSource = readProjectFile(
  'app/invest-model/signals/[signalId]/page.tsx'
);
const modelsPageSource = readProjectFile('app/invest-model/models/page.tsx');
const modelComparePageSource = readProjectFile(
  'app/invest-model/models/compare/page.tsx'
);
const feedPageSource = readProjectFile('app/invest-model/feed/page.tsx');
const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const feedDetailPageSource = readProjectFile(
  'app/invest-model/feed/[postId]/page.tsx'
);

assertCondition(
  mobileShellSource.includes('max-w-[var(--invest-mobile-frame-width)]'),
  'MobileShell does not constrain the mobile frame width'
);
assertCondition(
  mobileShellSource.includes('env(safe-area-inset-bottom)'),
  'MobileShell or BottomNav does not reserve bottom safe-area space'
);
assertCondition(
  mobileShellSource.includes('aria-label="investModel mobile navigation"'),
  'BottomNav is missing a navigation aria-label'
);
assertCondition(
  mobileShellSource.includes("aria-current={isActive ? 'page' : undefined}"),
  'BottomNav is missing aria-current for the active tab'
);
assertCondition(
  mobileShellSource.includes('focus:ring-2') &&
    mobileShellSource.includes('focus:ring-invest-primary'),
  'MobileShell links are missing visible keyboard focus styles'
);
assertCondition(
  investModelNavItems.length === 5,
  `BottomNav expected 5 tabs, found ${investModelNavItems.length}`
);
assertCondition(
  topIconBarSource.includes("key: 'my-page'") &&
    topIconBarSource.includes("href: '/invest-model/my'") &&
    topIconBarSource.includes('UserRound'),
  'My Page must remain reachable from a header profile action without adding a sixth bottom tab'
);
assertCondition(
  new Set(investModelNavItems.map((item) => item.key)).size === 5,
  'BottomNav tab keys are not unique'
);
assertCondition(
  investModelUiSource.includes('investMotionClass'),
  'Shared UI motion utility is missing from investModel UI components'
);
assertCondition(
  investMotionClass.interactiveCard.includes('duration-200') &&
    investMotionClass.interactiveCard.includes('hover:-translate-y-0.5') &&
    investMotionClass.interactiveCard.includes('active:scale-[0.99]') &&
    investMotionClass.interactiveCard.includes('motion-reduce:transition-none'),
  'Shared card motion must keep subtle 200ms lift, pressed, and reduced-motion behavior'
);
assertCondition(
  investMotionClass.interactiveControl.includes('duration-200') &&
    investMotionClass.interactiveControl.includes('active:scale-95') &&
    investMotionClass.interactiveControl.includes('focus:ring-2') &&
    investMotionClass.interactiveControl.includes('motion-reduce:transition-none'),
  'Shared control motion must keep 200ms pressed, focus, and reduced-motion behavior'
);
assertCondition(
  signalsPageSource.includes('investMotionClass.interactiveCard') &&
    signalsPageSource.includes('investMotionClass.interactiveControl'),
  'Realtime Signals must reuse shared motion classes for cards and filter controls'
);
assertCondition(
  signalsPageSource.includes('detailHref: signalDetailHref') &&
    signalsPageSource.includes("href={'detailHref' in signal ? signal.detailHref : '#'}"),
  'Realtime Signals list must link DB-backed SignalEvent rows to Signal Detail routes'
);
assertCondition(
  signalsPageSource.includes('rankSnapshot') &&
    signalsPageSource.includes('DB score snapshot rank only') &&
    signalDetailPageSource.includes('scoreSnapshotRows') &&
    signalDetailPageSource.includes('Rank movement'),
  'Signals list/detail must surface DB-backed score snapshot rank movement without advice or order language'
);
assertCondition(
  signalsPageSource.includes('<SignalRefreshAction') &&
    signalsPageSource.includes('latestScoreSnapshotLabel') &&
    signalRefreshActionSource.includes('router.refresh()') &&
    signalRefreshActionSource.includes('Auto refresh 60s') &&
    signalRefreshActionSource.includes('No external realtime data, advice, or order'),
  'Realtime Signals must expose manual/60s DB snapshot refresh UX with safety boundary copy'
);
assertCondition(
  !signalsPageSource.includes('<SoftBanner') &&
    !signalDetailPageSource.includes('<SoftBanner') &&
    signalsPageSource.includes('signalsFooterSafetyLines.join') &&
    signalsPageSource.includes('[signal.sourceLabel, signal.marketLabel].join') &&
    signalsPageSource.includes('[signal.linkedModelName, signal.freshnessLabel].join') &&
    signalsPageSource.includes('signal.rankSnapshot.contextLabel') &&
    signalsPageSource.includes("].join(' / ')") &&
    signalsPageSource.includes('signalsCopy.footerBadges.noRecommendation') &&
    signalsPageSource.includes('signalsCopy.footerBadges.mockData') &&
    !signalsPageSource.includes('{signalsCopy.footerBadges.noRecommendation}\n                </RiskBadge>') &&
    !signalsPageSource.includes('{signalsCopy.footerBadges.mockData}\n                </RiskBadge>') &&
    !signalsPageSource.includes('Activity') &&
    !signalsPageSource.includes('{signal.linkedModelName}\n                        </RiskBadge>') &&
    !signalsPageSource.includes('tone=\"neutral\"') &&
    signalsPageSource.includes('signalsCopy.metrics.noTradeIntent') &&
    signalDetailPageSource.includes('safetyAccessibleLabel') &&
    signalDetailPageSource.includes('No recommendation') &&
    signalDetailPageSource.includes('No order') &&
    signalDetailPageSource.includes('no realtime external data'),
  'Signals list/detail must not start with the top blue SoftBanner and must preserve observation/no-order safety context'
);
assertCondition(
  modelsPageSource.includes('name="q"') &&
    modelsPageSource.includes('searchQuery') &&
    modelsPageSource.includes("params.set('q', searchQuery)") &&
    modelsPageSource.includes('getDiscoveryFilterHref('),
  'Discover Models must wire search input to the DB-backed /api/models q filter and preserve it across filters'
);
assertCondition(
  feedPageSource.includes('<FeedCardSaveAction') &&
    feedPageSource.includes('feedDetailSectionHref') &&
    feedPageSource.includes("'comments'"),
  'Feed cards must wire Save and Comment actions to DB-backed save state and the comment section'
);
assertCondition(
  feedPageSource.includes('parseFeedPostType') &&
    feedPageSource.includes('selectedPostType') &&
    feedPageSource.includes('filterHref(locale, filter.postType)') &&
    feedPageSource.includes("params.set('postType', postType)") &&
    feedPageSource.includes('readInvestModelFeedPosts(selectedPostType)') &&
    feedPageSource.includes('visiblePostCountLabel'),
  'Feed filters must use URL postType state, DB-backed /api/feed filtering, active link state, and visible result counts'
);
assertCondition(
  feedDetailPageSource.includes('id="comments"') &&
    feedDetailPageSource.includes('<FeedCommentAction'),
  'Feed detail must expose a comments anchor for Feed card comment actions'
);
assertCondition(
  !feedPageSource.includes('Simulated list action state'),
  'Feed card actions must not describe DB-backed interactions as simulated list state'
);
assertCondition(
  !homePageSource.includes('<SoftBanner') &&
    !homePageSource.includes('homeVisibleBoundaries(locale).map') &&
    homePageSource.includes('homeSafetyBoundaryCopy') &&
    !homePageSource.includes('RiskBadge') &&
    homePageSource.includes('ModelSelectionReadStatus') &&
    homePageSource.includes('homeCopy.footerBadges.noLiveOrders') &&
    homePageSource.includes('financial advice'),
  'Home must not start with the top blue SoftBanner or hashtag safety chip group and must preserve mock/no-order safety context'
);
assertCondition(
  myPageSource.includes('No real account / No real orders / DB read model') &&
    !myPageSource.includes('<ShieldCheck') &&
    !myPageSource.includes("{locale === 'ko' ? '실계좌 없음' : 'No real account'}\n            </RiskBadge>"),
  'My Page footer safety boundary must use prose instead of hashtag safety chip groups'
);
assertCondition(
  !modelsPageSource.includes('<SoftBanner') &&
    modelsPageSource.includes('modelDiscoveryVisibleBoundaries') &&
    modelsPageSource.includes("visibleBoundaries.join(' / ')") &&
    modelsPageSource.includes('modelsFooterSafetyLines.join') &&
    modelsPageSource.includes('modelsCopy.footerBadges.noLiveTrading') &&
    modelsPageSource.includes('modelsCopy.footerBadges.backtestMock') &&
    !modelsPageSource.includes('{modelsCopy.footerBadges.noLiveTrading}\n            </RiskBadge>') &&
    !modelsPageSource.includes('{modelsCopy.footerBadges.backtestMock}\n            </RiskBadge>') &&
    !modelsPageSource.includes('{readStateCopy.dbLabel}\n                  </RiskBadge>') &&
    !modelsPageSource.includes('{modelsCopy.footerBadges.backtestMock}\n                  </RiskBadge>') &&
    !modelsPageSource.includes('visibleBoundaries.map((boundary) => (') &&
    modelsPageSource.includes('riskLabel={model.riskLabel}') &&
    modelsPageSource.includes('performanceLabel={model.performanceLabel}') &&
    modelsPageSource.includes('footerBadges={['),
  'Discover Models must not start with the top blue SoftBanner or safety chip groups and must preserve no-order/simulated safety context'
);
assertCondition(
  modelComparePageSource.includes("visibleBoundaries.join(' / ')") &&
    !modelComparePageSource.includes('visibleBoundaries.map((boundary) => (') &&
    !modelComparePageSource.includes('<RiskBadge tone="blocked">No live orders</RiskBadge>') &&
    modelComparePageSource.includes(
      'No live orders / Approved mock only / Backtest placeholder'
    ),
  'Model Compare must present safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  !portfolioPageSource.includes('<SoftBanner') &&
    !portfolioPageSource.includes('<MetricCard') &&
    portfolioPageSource.includes('portfolio.mockDeposit.amountLabel') &&
    portfolioPageSource.includes('portfolio.allocationDecision.statusLabel') &&
    portfolioPageSource.includes('portfolio.tradeIntent.statusLabel') &&
    portfolioPageSource.includes('Portfolio time dashboard read-model trace') &&
    portfolioPageSource.includes('portfolio.timeSnapshots.length') &&
    portfolioPageSource.includes('position.quantityLabel'),
  'Portfolio must start with the DB-backed time dashboard summary instead of top simulation banner/metric cards'
);

const screenResults = screens.map((screen) => {
  const source = readProjectFile(screen.pageFile);

  assertCondition(
    source.includes('<MobileShell'),
    `${screen.name}: page does not use MobileShell`
  );
  assertCondition(
    !source.includes('aria-label=""'),
    `${screen.name}: page contains an empty aria-label`
  );
  assertCondition(
    source.includes(`activeTab="${screen.activeTab}"`),
    `${screen.name}: page does not set activeTab=${screen.activeTab}`
  );
  assertCondition(
    source.includes(`currentPath="${screen.route}"`) ||
      source.includes(`const currentPath = \`${screen.route.split('/').slice(0, -1).join('/')}`) ||
      source.includes('currentPath={currentPath}') ||
      source.includes('currentPath={`/invest-model/admin/reviews/${model.id}`}'),
    `${screen.name}: page does not preserve currentPath for language toggle`
  );
  assertCondition(
    screen.requiredCopy.every(Boolean),
    `${screen.name}: required mock copy is missing`
  );
  assertCondition(
    !screen.forbiddenCopy?.some((copy) => source.includes(copy)),
    `${screen.name}: forbidden member-scope copy is still present`
  );
  assertNoLongUnbrokenText(screen.name, screen.requiredCopy);

  return {
    name: screen.name,
    route: screen.route,
    activeTab: screen.activeTab,
    status: 'pass'
  };
});

assertCondition(
  discoverableInvestmentModels.every((model) =>
    ['approved', 'live'].includes(model.status)
  ),
  'Discover Models contains non-public model status'
);
assertCondition(
  investModelDetailCopy.en.models.every((model) =>
    model.metrics.some((metric) => metric.label.toLowerCase().includes('drawdown'))
  ),
  'Model Detail is missing drawdown context for at least one model'
);
assertCondition(
  investModelDetailCopy.en.models.every((model) =>
    model.metrics.some((metric) =>
      metric.label.toLowerCase().includes('volatility')
    )
  ),
  'Model Detail is missing volatility context for at least one model'
);
assertCondition(
  investModelDetailCopy.en.models
    .filter((model) => model.riskTone === 'high')
    .every(
      (model) =>
        model.leverageLabel.toLowerCase().includes('leveraged') &&
        investModelDetailCopy.en.highRiskNotice
          .toLowerCase()
          .includes('concentration') &&
        investModelDetailCopy.en.highRiskConfirmDescription
          .toLowerCase()
          .includes('not real investment consent')
    ),
  'Model Detail high-risk models must require mock confirmation for leverage, concentration, and large loss context'
);
assertCondition(
  pendingAdminReviewModels.every((model) =>
    model.blockedActionLabel.toLowerCase().includes('read-only')
  ),
  'Admin Review screens must keep pending_review actions read-only'
);
assertCondition(
  pendingAdminReviewModels.every((model) =>
    model.strategySummary.toLowerCase().includes('tradeintent') ||
    model.forbiddenAssets.some((asset) => {
      const normalizedAsset = asset.toLowerCase();
      return (
        normalizedAsset.includes('order') ||
        normalizedAsset.includes('deposit') ||
        normalizedAsset.includes('withdrawal')
      );
    })
  ),
  'Admin Review detail lacks no-real-order/deposit boundary language'
);
assertCondition(
  pendingAdminReviewModels.every((model) =>
    model.disclosureStatusLabel.toLowerCase().includes('review') ||
    model.disclosureStatusLabel.toLowerCase().includes('placeholder')
  ),
  'Admin Review models must keep disclosure wording in review or placeholder state'
);
assertCondition(
  investModelFeedMock.posts.some((post) =>
    post.excerpt.toLowerCase().includes('not advice')
  ) ||
    investModelFeedMock.summary.description.toLowerCase().includes(
      'without recommending trades'
    ),
  'Feed Insights lacks non-advice language'
);
assertCondition(
  investModelSignalsMock.summary.description.includes('do not create TradeIntent'),
  'Realtime Signals lacks no-TradeIntent boundary language'
);
assertCondition(
  investModelPortfolioMock.isMockOnly === true,
  'Mock Portfolio must be explicitly mock-only'
);
assertCondition(
  investModelPortfolioMock.mockDeposit.safetyLabel
    .toLowerCase()
    .includes('not a real deposit'),
  'Mock Portfolio lacks no-real-deposit boundary language'
);
assertCondition(
  investModelPortfolioMock.selectedModel.modelVersionPublicId.startsWith(
    'model_version_'
  ) &&
    investModelPortfolioMock.selectedModel.versionLabel
      .toLowerCase()
      .includes('modelversion'),
  'Mock Portfolio lacks explicit selected model version identity'
);
assertCondition(
  investModelPortfolioMock.selectedModel.statusLabel
    .toLowerCase()
    .includes('live mock') &&
    investModelPortfolioMock.selectedModel.statusDescription
      .toLowerCase()
      .includes('current selected model status'),
  'Mock Portfolio lacks explicit selected model status context'
);
assertCondition(
  investModelPortfolioMock.tradeIntent.boundaryLabel
    .toLowerCase()
    .includes('pre-order simulation'),
  'Mock Portfolio lacks TradeIntent pre-order simulation boundary language'
);
assertCondition(
  investModelPortfolioMock.tradeIntent.blockedActions.some((action) =>
    action.toLowerCase().includes('no live order')
  ),
  'Mock Portfolio lacks no-live-order boundary language'
);

assertNoLongUnbrokenText('All investModel mobile screens', collectScreenTextValues());

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Figma-seeded mobile visual structure smoke test',
      viewportAssumption: '390px mobile frame with fixed bottom navigation',
      screenshotAutomation: 'not_installed',
      screens: screenResults
    },
    null,
    2
  )
);
