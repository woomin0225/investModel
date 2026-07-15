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
      '투자 모델',
      '피드 글',
      '관찰 신호',
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
      'Pre-order simulation stage only',
      'No brokerage account or order execution is connected',
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
const notificationsPageSource = readProjectFile(
  'app/invest-model/notifications/page.tsx'
);
const searchPageSource = readProjectFile('app/invest-model/search/page.tsx');
const signalsPageSource = readProjectFile('app/invest-model/signals/page.tsx');
const signalRefreshActionSource = readProjectFile(
  'components/invest-model/signal-refresh-action.tsx'
);
const modelSelectionReadStatusSource = readProjectFile(
  'components/invest-model/model-selection-read-status.tsx'
);
const modelSelectionReadStatusCopySource = readProjectFile(
  'components/invest-model/model-selection-read-status-copy.ts'
);
const modelSelectionCtaSource = readProjectFile(
  'components/invest-model/model-selection-cta.tsx'
);
const creatorModelDraftFormSource = readProjectFile(
  'components/invest-model/creator-model-draft-form.tsx'
);
const creatorPageSource = readProjectFile('app/invest-model/creator/page.tsx');
const signalDetailPageSource = readProjectFile(
  'app/invest-model/signals/[signalId]/page.tsx'
);
const modelsPageSource = readProjectFile('app/invest-model/models/page.tsx');
const modelComparePageSource = readProjectFile(
  'app/invest-model/models/compare/page.tsx'
);
const modelDetailPageSource = readProjectFile(
  'app/invest-model/models/[modelId]/page.tsx'
);
const feedPageSource = readProjectFile('app/invest-model/feed/page.tsx');
const portfolioPageSource = readProjectFile(
  'app/invest-model/portfolio/page.tsx'
);
const portfolioKoreanLabelMapRequired = [
  '모의 배정됨',
  '출처: 모의 데이터',
  'DB 기반 조회',
  '주문 전 시뮬레이션만 가능',
  '브로커 데이터 없음'
];
const feedDetailPageSource = readProjectFile(
  'app/invest-model/feed/[postId]/page.tsx'
);
const feedCommentActionSource = readProjectFile(
  'components/invest-model/feed-comment-action.tsx'
);
const feedLikeActionSource = readProjectFile(
  'components/invest-model/feed-like-action.tsx'
);
const feedLikeActionNormalizedSource = feedLikeActionSource.replace(/\r\n/g, '\n');
const feedCardSaveActionSource = readProjectFile(
  'components/invest-model/feed-card-save-action.tsx'
);
const feedCardSaveActionNormalizedSource = feedCardSaveActionSource.replace(
  /\r\n/g,
  '\n'
);
const feedSaveActionSource = readProjectFile(
  'components/invest-model/feed-save-action.tsx'
);
const feedSaveActionNormalizedSource = feedSaveActionSource.replace(
  /\r\n/g,
  '\n'
);
const feedReadActionSource = readProjectFile(
  'components/invest-model/feed-read-action.tsx'
);
const feedReadActionNormalizedSource = feedReadActionSource.replace(
  /\r\n/g,
  '\n'
);
const adminReportsPageSource = readProjectFile(
  'app/invest-model/admin/reports/page.tsx'
);
const adminPerformancePageSource = readProjectFile(
  'app/invest-model/admin/performance/page.tsx'
);
const adminReviewsPageSource = readProjectFile(
  'app/invest-model/admin/reviews/page.tsx'
);
const adminReviewDetailPageSource = readProjectFile(
  'app/invest-model/admin/reviews/[reviewId]/page.tsx'
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
  topIconBarSource.includes("unread: '읽지 않은 DB 기반 알림'") &&
    topIconBarSource.includes("unreadDot: '읽지 않은 DB 기반 알림 있음'") &&
    topIconBarSource.includes("none: '새 DB 기반 알림 없음'") &&
    !topIconBarSource.includes("ko: {\n    unread: 'unread DB-backed notifications'") &&
    !topIconBarSource.includes("ko: {\n    unread: 'unread DB-backed notifications',\n    unreadDot: 'unread DB-backed notifications'"),
  'TopIconBar Korean notification accessibility copy must not fall back to English'
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
    signalsPageSource.includes('DB 점수 스냅샷 순위일 뿐 조언이나 주문이 아닙니다') &&
    signalDetailPageSource.includes('scoreSnapshotRows') &&
    signalDetailPageSource.includes('순위 변동') &&
    signalDetailPageSource.includes('스냅샷 점수') &&
    signalDetailPageSource.includes('계산 시각') &&
    signalDetailPageSource.includes('DB 점수 스냅샷 순위일 뿐 조언이나 주문이 아닙니다') &&
    !signalDetailPageSource.includes("label: locale === 'ko' ? 'Score snapshot rank'") &&
    !signalDetailPageSource.includes("locale === 'ko'\n                  ? 'Score snapshot rank'") &&
    !signalDetailPageSource.includes("locale === 'ko' ? 'DB read model' : 'DB read model'") &&
    !signalDetailPageSource.includes("locale === 'ko'\n                  ? 'DB-backed detail evidence'"),
  'Signals list/detail must surface DB-backed score snapshot rank movement without advice or order language'
);
assertCondition(
  signalsPageSource.includes('<SignalRefreshAction') &&
    signalsPageSource.includes('latestScoreSnapshotLabel') &&
    signalsPageSource.includes('DB 신호 새로고침 사용 불가') &&
    signalsPageSource.includes('DB 점수 스냅샷 없음') &&
    signalsPageSource.includes('최신 DB 스냅샷') &&
    signalRefreshActionSource.includes('router.refresh()') &&
    signalRefreshActionSource.includes('Auto refresh 60s') &&
    signalRefreshActionSource.includes('DB 점수 스냅샷만 새로고침합니다. 외부 실시간 데이터, 투자 조언, 주문이 아닙니다.') &&
    signalRefreshActionSource.includes('DB 기반 조회 새로고침') &&
    signalRefreshActionSource.includes("].join(' / ')") &&
    signalRefreshActionSource.includes("'점수 스냅샷 테이블'") &&
    !signalRefreshActionSource.includes('DB 읽기 모델 새로고침') &&
    !signalRefreshActionSource.includes("locale === 'ko'\n      ? 'DB score snapshots only.") &&
    !signalRefreshActionSource.includes("'DB read model refresh',\n    'signal_score_snapshots'") &&
    !signalRefreshActionSource.includes("'DB 읽기 모델 새로고침',\n    'signal_score_snapshots'") &&
    !signalRefreshActionSource.includes('RiskBadge') &&
    !signalRefreshActionSource.includes('<RiskBadge'),
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
  signalDetailPageSource.includes("signalDetailVisibleBoundaries(locale).join(' / ')") &&
    signalDetailPageSource.includes("signalScoreSnapshotVisibleBoundaries(locale).join(' / ')") &&
    signalDetailPageSource.includes("signalEvidenceVisibleBoundaries(locale).join(' / ')") &&
    signalDetailPageSource.includes("signalRelatedVisibleBoundaries(locale).join(' / ')") &&
    signalDetailPageSource.includes('const signalSafetyLine') &&
    signalDetailPageSource.includes('const relatedFeedMetaLine') &&
    signalDetailPageSource.includes("'DB 피드 글',") &&
    signalDetailPageSource.includes("'DB 관찰 신호',") &&
    signalDetailPageSource.includes("'Reference only'") &&
    !signalDetailPageSource.includes('signalDetailVisibleBoundaries(locale).map((boundary) => (') &&
    !signalDetailPageSource.includes('signalScoreSnapshotVisibleBoundaries(locale).map((boundary) => (') &&
    !signalDetailPageSource.includes('signalEvidenceVisibleBoundaries(locale).map((boundary) => (') &&
    !signalDetailPageSource.includes('signalRelatedVisibleBoundaries(locale).map((boundary) => (') &&
    !signalDetailPageSource.includes("? ['DB FeedPost', '참고 읽기', '주문 근거 아님']") &&
    !signalDetailPageSource.includes("'DB SignalEvent',\n        'seed/mock 관찰'") &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{signal\.dataContext === 'mock'[\s\S]{0,180}: signal\.dataContext\}\s*<\/span>/.test(
      signalDetailPageSource
    ) &&
    !/<RiskBadge\b[^>]*tone="neutral"[^>]*>[\s\S]{0,220}\{signal\.dataContext === 'mock'[\s\S]{0,120}<\/RiskBadge>/.test(
      signalDetailPageSource
    ) &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{locale === 'ko' \? 'DB 기반 조회' : 'DB read model'\}\s*<\/span>/.test(
      signalDetailPageSource
    ) &&
    !signalDetailPageSource.includes("locale === 'ko' ? 'DB 읽기 모델' : 'DB read model'") &&
    !/<RiskBadge\b[^>]*tone="neutral"[^>]*>[\s\S]{0,80}DB read model[\s\S]{0,80}<\/RiskBadge>/.test(
      signalDetailPageSource
    ) &&
    !signalDetailPageSource.includes("<RiskBadge tone=\"blocked\">\n                  {locale === 'ko' ? '異붿쿇 ?꾨떂' : 'No recommendation'}\n                </RiskBadge>") &&
    !signalDetailPageSource.includes("<RiskBadge tone=\"medium\">\n                  {locale === 'ko' ? '二쇰Ц ?놁쓬' : 'No order'}\n                </RiskBadge>") &&
    !signalDetailPageSource.includes("'No recommendation'}\n                </RiskBadge>") &&
    !signalDetailPageSource.includes("'No order'}\n                </RiskBadge>") &&
    !signalDetailPageSource.includes('<RiskBadge tone="neutral">DB FeedPost</RiskBadge>') &&
    !signalDetailPageSource.includes("'Reference only'}\n                </RiskBadge>"),
  'Signal detail must present safety boundaries as prose instead of hashtag safety chip groups'
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
    feedPageSource.includes('locale={locale}') &&
    feedPageSource.includes('feedDetailSectionHref') &&
    feedPageSource.includes("'comments'"),
  'Feed cards must wire Save and Comment actions to DB-backed save state, locale-aware copy, and the comment section'
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
  investModelUiSource.includes('export function EmptyStateCta') &&
    investModelUiSource.includes('min-h-invest-touch-target') &&
    investModelUiSource.includes('aria-label={ariaLabel ?? `${label}. ${description}`}') &&
    feedPageSource.includes('<EmptyStateCta') &&
    feedPageSource.includes(": 'View all FeedPosts'}") &&
    feedPageSource.includes('Clear the filter and browse DB-backed FeedPosts again.') &&
    feedPageSource.includes('Not advice, an order, brokerage action, or realtime external data.') &&
    signalsPageSource.includes('<EmptyStateCta') &&
    signalsPageSource.includes(": 'View all signals'}") &&
    signalsPageSource.includes('Clear the filter and return to DB-backed observation signals.') &&
    signalsPageSource.includes('Not advice, an order, TradeIntent, or realtime external data.') &&
    notificationsPageSource.includes('<EmptyStateCta') &&
    notificationsPageSource.includes(": 'View Feed'}") &&
    notificationsPageSource.includes('Browse DB-backed FeedPosts that notification candidates derive from.') &&
    notificationsPageSource.includes('Not real push, email, SMS, orders, brokerage action, or investment advice.') &&
    myPageSource.includes('<EmptyStateCta') &&
    myPageSource.includes(": 'Browse Feed'}") &&
    myPageSource.includes('Read DB-backed FeedPosts without creating saved or comment activity.') &&
    myPageSource.includes('Not advice, orders, real accounts, or notification delivery.') &&
    !feedPageSource.includes('Deposit now') &&
    !feedPageSource.includes('Connect brokerage') &&
    !signalsPageSource.includes('Buy now') &&
    !notificationsPageSource.includes('Sell now') &&
    !myPageSource.includes('guarantee returns'),
  'BK-439 major empty states must provide safe locale-aware read-only CTAs without trading, deposit, brokerage, or return-claim affordances'
);
assertCondition(
  feedDetailPageSource.includes('id="comments"') &&
    feedDetailPageSource.includes('<FeedCommentAction'),
  'Feed detail must expose a comments anchor for Feed card comment actions'
);
assertCondition(
  feedDetailPageSource.includes("feedActionVisibleBoundaries(locale).join(' / ')") &&
    !feedDetailPageSource.includes('feedActionVisibleBoundaries(locale).map((boundary) => (') &&
    !feedDetailPageSource.includes('{feedCopy.footerBadges.noAdvice}\n                </RiskBadge>') &&
    feedDetailPageSource.includes("{feedCopy.footerBadges.noAdvice} /{' '}"),
  'Feed detail must present action/footer safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  feedPageSource.includes("feedEmptyVisibleBoundaries(locale).join(' / ')") &&
    feedPageSource.includes("feedRankingVisibleBoundaries(locale).join(' / ')") &&
    feedPageSource.includes("{feedCopy.footerBadges.noAdvice} /{' '}") &&
    !feedPageSource.includes('feedEmptyVisibleBoundaries(locale).map((boundary) => (') &&
    !feedPageSource.includes('feedRankingVisibleBoundaries(locale).map(') &&
    !feedPageSource.includes('{feedCopy.footerBadges.noAdvice}\n                  </RiskBadge>') &&
    !feedPageSource.includes('{feedCopy.footerBadges.reviewPlaceholder}\n                  </RiskBadge>'),
  'Feed list must present empty/ranking/footer safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  feedCommentActionSource.includes("feedCommentVisibleBoundaries(locale).join(' / ')") &&
    !feedCommentActionSource.includes('feedCommentVisibleBoundaries(locale).map((boundary) => ('),
  'Feed comment action must present safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  creatorModelDraftFormSource.includes('const helperLine') &&
    creatorModelDraftFormSource.includes('const successMetaLine') &&
    creatorModelDraftFormSource.includes('copy.helper.mockOnly') &&
    creatorModelDraftFormSource.includes('copy.helper.noFileUpload') &&
    creatorModelDraftFormSource.includes('copy.result.draftStatus') &&
    creatorModelDraftFormSource.includes('copy.result.privateVisibility') &&
    creatorModelDraftFormSource.includes('copy.result.metadataOnly') &&
    creatorModelDraftFormSource.includes('submitState.modelPublicId') &&
    creatorModelDraftFormSource.includes(".join(' / ')") &&
    !creatorModelDraftFormSource.includes('RiskBadge') &&
    !creatorModelDraftFormSource.includes('<RiskBadge'),
  'CreatorModelDraftForm must present helper and submit status boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  searchPageSource.includes("searchResultVisibleBoundaries(locale, kind).join(' / ')") &&
    searchPageSource.includes(
      "searchResultVisibleBoundaries(\n                            locale,\n                            'InvestmentModel'\n                          ).join(' / ')"
    ) &&
    searchPageSource.includes(
      "searchResultVisibleBoundaries(\n                          locale,\n                          'FeedPost'\n                        ).join(' / ')"
    ) &&
    searchPageSource.includes(
      "searchResultVisibleBoundaries(\n                          locale,\n                          'SignalEvent'\n                        ).join(' / ')"
    ) &&
    !searchPageSource.includes('searchResultVisibleBoundaries(locale, kind).map((boundary) => (') &&
    !searchPageSource.includes("searchResultVisibleBoundaries(\n                            locale,\n                            'InvestmentModel'\n                          ).map((boundary) => (") &&
    !searchPageSource.includes("searchResultVisibleBoundaries(locale, 'FeedPost').map(") &&
    !searchPageSource.includes("searchResultVisibleBoundaries(\n                          locale,\n                          'SignalEvent'\n                        ).map((boundary) => (") &&
    searchPageSource.includes('DB FeedPost') &&
    searchPageSource.includes('DB SignalEvent') &&
    searchPageSource.includes("searchDbKindDisplayLabel(locale, 'FeedPost')") &&
    searchPageSource.includes("searchDbKindDisplayLabel(locale, 'SignalEvent')") &&
    searchPageSource.includes("'DB 피드 글'") &&
    searchPageSource.includes("'DB 관찰 신호'") &&
    /<RiskBadge\b[^>]*>\s*\{post\.postType\}\s*<\/RiskBadge>/.test(searchPageSource) &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{searchDbKindDisplayLabel\(locale, 'FeedPost'\)\}\s*<\/span>/.test(searchPageSource) &&
    !/<RiskBadge\b[^>]*>\s*DB FeedPost\s*<\/RiskBadge>/.test(searchPageSource) &&
    /<RiskBadge\b[^>]*>\s*\{signal\.signalType\}\s*<\/RiskBadge>/.test(searchPageSource) &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{searchDbKindDisplayLabel\(locale, 'SignalEvent'\)\}\s*<\/span>/.test(searchPageSource) &&
    !/<RiskBadge\b[^>]*>\s*DB SignalEvent\s*<\/RiskBadge>/.test(searchPageSource) &&
    !searchPageSource.includes("{locale === 'ko' ? 'No advice' : 'No advice'}\n                </RiskBadge>") &&
    searchPageSource.includes('추천 아님 / 주문 없음') &&
    searchPageSource.includes('No advice / No orders'),
  'Search must present result/empty/footer safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  searchPageSource.includes("eyebrow={locale === 'ko' ? '통합 검색' : 'Search'}") &&
    searchPageSource.includes("title={locale === 'ko' ? '검색' : 'Search'}") &&
    searchPageSource.includes(
      "locale === 'ko'\n              ? '모델, 피드 글, 관찰 신호 검색'"
    ) &&
    searchPageSource.includes("locale === 'ko'\n                  ? '모델, 시장, 위험도, 제목'") &&
    searchPageSource.includes("{locale === 'ko' ? '검색' : 'Search'}") &&
    searchPageSource.includes('추천 아님 / 주문 없음') &&
    searchPageSource.includes('브로커 계좌, 주문, 실시간 외부 피드, 실잔고는 검색하지 않습니다.') &&
    searchPageSource.includes('이 검색어와 일치하는 투자 모델이 없습니다.') &&
    searchPageSource.includes('이 검색어와 일치하는 DB 기반 피드 글이 없습니다.') &&
    searchPageSource.includes('이 검색어와 일치하는 DB 기반 관찰 신호가 없습니다.') &&
    searchPageSource.includes('DB 기반 범위 검색의 빈 상태') &&
    searchPageSource.includes('DB 기반 조회 결과') &&
    searchPageSource.includes('로컬 DB 기반 조회 결과의 모델 탐색 기록') &&
    searchPageSource.includes('투자 모델 ${filteredModels.length}개') &&
    searchPageSource.includes('탐색 가능 투자 모델 ${filteredModels.length}개') &&
    searchPageSource.includes('검색은 탐색 가능한 투자 모델과 DB 기반 피드 글, 관찰 신호만 읽습니다.') &&
    searchPageSource.includes('검색 안전 경계. 결과는 모델 탐색, 정보성 피드 글, 관찰 신호이며') &&
    !searchPageSource.includes('DB-backed scoped search의 빈 상태') &&
    !searchPageSource.includes('DB-backed read model 결과') &&
    !searchPageSource.includes('DB 기반 읽기 결과') &&
    !searchPageSource.includes('DB 읽기 결과') &&
    !searchPageSource.includes('로컬 DB 기반 읽기 결과의 모델 탐색 기록') &&
    !searchPageSource.includes('로컬 DB-backed read model의 모델 탐색 기록') &&
    !searchPageSource.includes('모델, FeedPost, SignalEvent 검색') &&
    !searchPageSource.includes('검색은 탐색 가능한 InvestmentModel과 DB 기반 FeedPost, SignalEvent만 읽습니다.') &&
    !searchPageSource.includes('이 검색어와 일치하는 InvestmentModel이 없습니다.') &&
    !searchPageSource.includes('이 검색어와 일치하는 DB 기반 FeedPost가 없습니다.') &&
    !searchPageSource.includes('이 검색어와 일치하는 DB 기반 SignalEvent가 없습니다.') &&
    !searchPageSource.includes('검색 안전 경계. 결과는 모델 탐색, 정보성 FeedPost, 관찰 SignalEvent이며') &&
    !searchPageSource.includes("locale === 'ko' ? 'Search' : 'Search'") &&
    !searchPageSource.includes(
      "locale === 'ko'\n              ? 'Search models, FeedPosts, and SignalEvents'"
    ) &&
    !searchPageSource.includes("locale === 'ko'\n                  ? 'Model, market, risk, or headline'") &&
    !searchPageSource.includes("{locale === 'ko' ? 'No advice / No orders'"),
  'Search Korean visible form and empty/safety copy must not fall back to English'
);
assertCondition(
  notificationsPageSource.includes("notificationSummaryVisibleBoundaries(locale)\n                ].join(' / ')") &&
    notificationsPageSource.includes("notificationActionVisibleBoundaries(locale).join(' / ')") &&
    notificationsPageSource.includes("notificationItemVisibleBoundaries(locale).join(' / ')") &&
    notificationsPageSource.includes("notificationEmptyVisibleBoundaries(locale).join(' / ')") &&
    notificationsPageSource.includes("eyebrow: '알림'") &&
    notificationsPageSource.includes("summaryTitle: 'DB 기반 알림 센터'") &&
    notificationsPageSource.includes("markAllRead: '모두 읽음 처리'") &&
    notificationsPageSource.includes('DB 기반 알림 빈 상태') &&
    notificationsPageSource.includes('로컬 DB 읽음 상태만 업데이트합니다') &&
    notificationsPageSource.includes('정보성 읽기 모델이며 실제 푸시') &&
    notificationsPageSource.includes('피드 글 읽음 상태에서 알림 행을 파생합니다') &&
    notificationsPageSource.includes('피드 글 행이 추가되거나 읽음 상태가 바뀌면') &&
    notificationsPageSource.includes("sectionDescription: '피드 글 기록과 읽음 상태에서 파생됩니다.'") &&
    notificationsPageSource.includes("locale === 'ko' ? 'DB 피드 글 기반' : 'DB FeedPost'") &&
    notificationsPageSource.includes("item.status === 'unread'\n    ? '새 DB 기반 피드 글'") &&
    notificationsPageSource.includes("    : '읽은 피드 글 업데이트'") &&
    notificationsPageSource.includes('DB 기반 피드 글 알림 후보') &&
    notificationsPageSource.includes('피드 글 알림 후보의 로컬 DB 읽음 상태만 업데이트합니다') &&
    notificationsPageSource.includes("'피드 글 기반'") &&
    notificationsPageSource.includes("locale === 'ko'\n                                ? '연결된 모델 없음'") &&
    !notificationsPageSource.includes('DB-backed notification empty state이며') &&
    !notificationsPageSource.includes('informational-only read model이며') &&
    !notificationsPageSource.includes('local DB read state만 업데이트합니다') &&
    !notificationsPageSource.includes('{item.eventLabel}') &&
    !notificationsPageSource.includes("'연결된 FeedPost 없음'") &&
    !notificationsPageSource.includes('notificationSummaryVisibleBoundaries(locale).map(') &&
    !notificationsPageSource.includes('notificationActionVisibleBoundaries(locale).map(') &&
    !notificationsPageSource.includes('notificationItemVisibleBoundaries(locale).map(') &&
    !notificationsPageSource.includes('notificationEmptyVisibleBoundaries(locale).map(') &&
    !notificationsPageSource.includes('DB 기반 FeedPost 알림 후보') &&
    !notificationsPageSource.includes("'새 DB 기반 FeedPost'") &&
    !notificationsPageSource.includes("'읽은 FeedPost 업데이트'") &&
    !notificationsPageSource.includes("'FeedPost 기반'") &&
    !notificationsPageSource.includes('FeedPost 읽음 상태에서 파생된') &&
    !notificationsPageSource.includes('FeedPost 행이 추가되거나') &&
    !notificationsPageSource.includes("sectionDescription: 'FeedPost 기록과 읽음 상태에서 파생됩니다.'") &&
    !notificationsPageSource.includes('FeedPost 알림 후보의 로컬 DB'),
  'Notifications must present safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  !feedPageSource.includes('Simulated list action state'),
  'Feed card actions must not describe DB-backed interactions as simulated list state'
);
assertCondition(
  feedPageSource.includes('feedCardVisualCopy') &&
    feedPageSource.includes("mediaLabel: '모델 메모'") &&
    feedPageSource.includes("mediaLabel: '시장 맥락'") &&
    feedPageSource.includes("mediaLabel: '위험 메모'") &&
    feedPageSource.includes("mediaLabel: '검토 메모'") &&
    feedPageSource.includes("mediaLabel: 'Model note'") &&
    feedPageSource.includes("mediaLabel: 'Market context'") &&
    feedPageSource.includes("sourceContextLabel: '모델 관찰 메모 출처'") &&
    feedPageSource.includes("sourceContextLabel: '시장 관찰 맥락 출처'") &&
    feedPageSource.includes("reactionContextLabel: '읽음, 저장, 댓글 상태만 기록'") &&
    feedPageSource.includes("reactionContextLabel: '정보성 반응 상태만 기록'") &&
    feedPageSource.includes('h-20 w-16 shrink-0') &&
    feedPageSource.includes('line-clamp-2 text-[10px]') &&
    feedPageSource.includes('min-[390px]:grid-cols-[64px_minmax(0,1fr)]') &&
    feedPageSource.includes('line-clamp-2 break-words text-[17px]') &&
    feedPageSource.includes('grid grid-cols-2 gap-1.5 rounded-invest-control bg-invest-bg-soft p-1.5') &&
    feedPageSource.includes('grid-cols-[repeat(3,minmax(0,1fr))]') &&
    feedPageSource.includes('min-[360px]:grid-cols-2') &&
    feedPageSource.includes('post.sourceContextLabel') &&
    feedPageSource.includes('post.reactionContextLabel') &&
    feedPageSource.includes('<Newspaper') &&
    feedPageSource.includes('<Activity') &&
    feedPageSource.includes('FeedCardSaveAction') &&
    feedCardSaveActionSource.includes('min-h-9 min-w-0') &&
    feedCardSaveActionSource.includes('<span className="min-w-0 truncate">{label}</span>') &&
    feedPageSource.includes('feedDetailSectionHref') &&
    !feedPageSource.includes('real deposit') &&
    !feedPageSource.includes('brokerage CTA') &&
    !feedPageSource.includes('Buy now') &&
    !feedPageSource.includes('Sell now'),
  'BK-438 Feed cards must expose scan-friendly media/source/reaction structure without trading or brokerage affordances'
);
assertCondition(
  feedPageSource.includes("locale === 'ko' ? '연결 모델 없음' : 'No linked model'") &&
    feedPageSource.includes('추적 좋아요 ${ranking.likeCount}개') &&
    feedPageSource.includes("title={locale === 'ko' ? '좋아요 순위' : 'Like ranking'}") &&
    feedPageSource.includes('DB 기반 관심도 맥락일 뿐이며 모델 품질이나 기대 수익이 아닙니다.') &&
    feedPageSource.includes("{locale === 'ko' ? '추천 아님' : 'No advice'}") &&
    feedPageSource.includes('아직 추적된 좋아요 순위 행이 없습니다.') &&
    feedPageSource.includes('${label} 피드 글 필터.') &&
    feedPageSource.includes('DB 기반 피드 조회만 필터링하며 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다.') &&
    feedPageSource.includes('피드 글: ${post.title}.') &&
    feedPageSource.includes('정보성 DB 기반 조회 글이며 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다.') &&
    feedPageSource.includes('피드 상세를 열고 읽음 상태를 기록합니다.') &&
    feedPageSource.includes('목록 또는 상세 댓글 영역의 DB 기반 피드 동작을 실행합니다.') &&
    feedPageSource.includes('피드 좋아요 순위 ${ranking.rank}위') &&
    feedPageSource.includes('DB 기반 추적 좋아요 순위이며 모델 품질, 기대 수익, 추천, 주문 근거가 아닙니다.') &&
    feedPageSource.includes("'DB 기반 관심도 순위'") &&
    feedPageSource.includes('피드 빈 상태입니다. DB 기반 피드 조회 범위만 표시하며 정보성 상태일 뿐 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다.') &&
    feedPageSource.includes("'DB 피드 빈 상태'") &&
    feedPageSource.includes("'실시간 외부 데이터 없음'") &&
    feedPageSource.includes('피드 글과 좋아요 순위는 정보성 DB 기반 조회이며 추천, 주문, 수익률 보장, 브로커 동작, 실시간 외부 데이터 또는 실계좌 데이터가 아닙니다.') &&
    !feedPageSource.includes("locale === 'ko' ? 'No linked model' : 'No linked model'") &&
    !feedPageSource.includes('${ranking.likeCount} tracked likes`\n        : `${ranking.likeCount} tracked likes') &&
    !feedPageSource.includes("title={locale === 'ko' ? 'Like ranking' : 'Like ranking'}") &&
    !feedPageSource.includes("? 'No tracked like ranking rows yet.'\n                    : 'No tracked like ranking rows yet.'") &&
    !feedPageSource.includes('DB-backed FeedPost read model만 필터링') &&
    !feedPageSource.includes('DB 기반 피드 읽기 모델') &&
    !feedPageSource.includes('FeedPost 상세를 열고 읽음 상태를 기록합니다.') &&
    !feedPageSource.includes('정보성 DB 읽기 모델 글이며') &&
    !feedPageSource.includes('피드 글과 좋아요 순위는 정보성 DB 읽기 모델이며') &&
    !feedPageSource.includes('FeedPost와 like ranking은 정보성 DB read model'),
  'Feed Korean like ranking copy must not fall back to English'
);
assertCondition(
  feedDetailPageSource.includes("eyebrow={locale === 'ko' ? '피드 상세' : 'Feed Detail'}") &&
    feedDetailPageSource.includes("locale === 'ko' ? '관련 관찰 신호' : 'Related SignalEvents'") &&
    feedDetailPageSource.includes('피드 상세 액션은 DB 사용자 범위의 읽음, 댓글, 좋아요, 저장 상태만 변경하며 추천, 실주문, 브로커 연결, 투자 조언이 아닙니다.') &&
    feedDetailPageSource.includes('관련 DB 기반 관찰 신호') &&
    feedDetailPageSource.includes('아직 연결된 DB 기반 관찰 신호가 없습니다.') &&
    feedDetailPageSource.includes("locale === 'ko' ? '참여 맥락 전용' : 'Engagement only'") &&
    feedDetailPageSource.includes("locale === 'ko'\n                    ? '최근 좋아요 순위'") &&
    feedDetailPageSource.includes('좋아요 순위는 DB 기반 읽기 신호입니다.') &&
    feedDetailPageSource.includes("locale === 'ko' ? '순위' : 'Rank'") &&
    feedDetailPageSource.includes("locale === 'ko' ? '좋아요' : 'Likes'") &&
    !feedDetailPageSource.includes("eyebrow={locale === 'ko' ? 'Feed Detail' : 'Feed Detail'}") &&
    !feedDetailPageSource.includes('Feed 상세 액션은 DB 사용자 범위') &&
    !feedDetailPageSource.includes("locale === 'ko' ? '관련 SignalEvents' : 'Related SignalEvents'") &&
    !feedDetailPageSource.includes('관련 DB-backed SignalEvent') &&
    !feedDetailPageSource.includes('아직 연결된 DB-backed SignalEvent가 없습니다.') &&
    !feedDetailPageSource.includes("locale === 'ko' ? '관련 SignalEvent' : 'Related SignalEvents'") &&
    !feedDetailPageSource.includes('관련 DB 기반 SignalEvent') &&
    !feedDetailPageSource.includes('아직 연결된 DB 기반 SignalEvent가 없습니다.') &&
    !feedDetailPageSource.includes('좋아요 순위는 DB-backed 읽기 신호입니다.') &&
    !feedDetailPageSource.includes("locale === 'ko'\n                    ? 'Recent like ranking'") &&
    !feedDetailPageSource.includes("locale === 'ko' ? 'Rank' : 'Rank'") &&
    !feedDetailPageSource.includes("locale === 'ko' ? 'Likes' : 'Likes'"),
  'Feed Detail Korean visible copy must not fall back to English'
);
assertCondition(
  feedCommentActionSource.includes("title={isKorean ? '댓글' : 'Comments'}") &&
    feedCommentActionSource.includes('DB 기반 토론 댓글 ${reactionState.commentCount}개') &&
    feedCommentActionSource.includes("{isKorean ? '댓글 추가' : 'Add comment'}") &&
    feedCommentActionSource.includes('정보성 시장 또는 모델 메모를 남겨보세요.') &&
    feedCommentActionSource.includes('정보성 토론 전용입니다. 투자 조언, 주문, 승인을 만들지 않습니다.') &&
    feedCommentActionSource.includes("{isKorean ? '댓글 등록' : 'Post comment'}") &&
    feedCommentActionSource.includes('아직 댓글이 없습니다.') &&
    feedCommentActionSource.includes('정보성 댓글을 추가하지 못했습니다.') &&
    !feedCommentActionSource.includes("title={isKorean ? 'Comments' : 'Comments'}") &&
    !feedCommentActionSource.includes("{isKorean ? 'Add comment' : 'Add comment'}") &&
    !feedCommentActionSource.includes("{isKorean ? 'Post comment' : 'Post comment'}") &&
    !feedCommentActionSource.includes("{isKorean ? 'No comments yet.' : 'There are no comments yet.'}") &&
    !feedCommentActionSource.includes('DB-backed 토론 댓글'),
  'Feed comment top-level Korean copy must not fall back to English'
);
assertCondition(
  feedCommentActionSource.includes('정보성 답글 폼 열기') &&
    feedCommentActionSource.includes('정보성 답글 폼 닫기') &&
    feedCommentActionSource.includes('정보성 답글을 등록하는 중입니다.') &&
    feedCommentActionSource.includes('정보성 답글 등록. 주문, 브로커 동작, 투자 조언, 승인을 만들지 않습니다.') &&
    feedCommentActionSource.includes('600자 이내의 정보성 답글을 입력한 뒤 등록하세요.') &&
    feedCommentActionSource.includes('정보성 답글을 추가하지 못했습니다.') &&
    feedCommentActionSource.includes('답글이 토론에 추가되었습니다.') &&
    feedCommentActionSource.includes('`답글 ${comment.replyCount}`') &&
    feedCommentActionSource.includes("{isKorean ? '답글' : 'Reply'}") &&
    feedCommentActionSource.includes('정보성 답글을 남겨보세요.') &&
    feedCommentActionSource.includes("isKorean ? '정보성 답글 본문' : 'Informational reply body'") &&
    feedCommentActionSource.includes("{isKorean ? '답글 등록' : 'Post reply'}") &&
    !feedCommentActionSource.includes("{isKorean ? 'Reply' : 'Reply'}") &&
    !feedCommentActionSource.includes("{isKorean ? 'Post reply' : 'Post reply'}") &&
    !feedCommentActionSource.includes("isKorean ? 'Informational reply body' : 'Informational reply body'") &&
    !feedCommentActionSource.includes("locale === 'ko'\n              ? `Replies ${comment.replyCount}`"),
  'Feed comment reply Korean copy must not fall back to English'
);
assertCondition(
  feedLikeActionNormalizedSource.includes('내가 누른 좋아요입니다. 인기 맥락일 뿐 투자 조언, 수익, 주문 신호가 아닙니다.') &&
    feedLikeActionNormalizedSource.includes('좋아요를 누르지 않았습니다. 인기 맥락일 뿐 투자 조언, 수익, 주문 신호가 아닙니다.') &&
    feedLikeActionNormalizedSource.includes("isKorean\n      ? '내가 누른 좋아요입니다.") &&
    feedLikeActionNormalizedSource.includes("isKorean\n      ? '좋아요를 누르지 않았습니다.") &&
    !feedLikeActionNormalizedSource.includes("const actionTitle = reactionState.liked\n    ? 'Liked by you."),
  'Feed like action Korean title copy must not fall back to English'
);
assertCondition(
  feedCardSaveActionNormalizedSource.includes("'저장 상태를 업데이트하지 못했습니다.'") &&
    feedCardSaveActionNormalizedSource.includes("'마지막 업데이트에 실패했습니다.'") &&
    feedCardSaveActionNormalizedSource.includes("'비공개 읽기 바로가기로 저장되었습니다. 모델 선택, 배분, 주문 의도가 아닙니다.'") &&
    feedCardSaveActionNormalizedSource.includes('locale:') &&
    feedCardSaveActionNormalizedSource.includes("const isKorean = locale === 'ko';") &&
    !feedCardSaveActionNormalizedSource.includes("setErrorMessage('Could not update saved state.')") &&
    !feedCardSaveActionNormalizedSource.includes('`${ariaLabel} Last update failed.`'),
  'Feed card save action Korean fallback, title, and aria copy must not fall back to English'
);
assertCondition(
  feedSaveActionNormalizedSource.includes("'비공개 읽기 바로가기로 저장되었습니다. 모델 선택, 배분, 주문 의도가 아닙니다.'") &&
    feedSaveActionNormalizedSource.includes("'저장되지 않았습니다. 저장은 비공개 읽기 바로가기만 만들며 모델 선택, 배분, 주문 의도가 아닙니다.'") &&
    feedSaveActionNormalizedSource.includes("'개인 읽기 바로가기이며 모델 선택·배분·주문 신호가 아닙니다.'") &&
    feedSaveActionNormalizedSource.includes('aria-label={actionTitle}') &&
    !feedSaveActionNormalizedSource.includes("const actionTitle = reactionState.saved\n    ? 'Saved as a private reading shortcut.") &&
    !feedSaveActionNormalizedSource.includes('개인 읽기 shortcut'),
  'Feed save action Korean title and visible boundary copy must not fall back to English'
);
assertCondition(
  feedReadActionNormalizedSource.includes("'비공개 읽기 기록으로 표시되었습니다. 조언, 주문, 승인 신호가 아닙니다.'") &&
    feedReadActionNormalizedSource.includes("'비공개 읽기 기록으로 표시하는 중입니다. 조언, 주문, 승인 신호가 아닙니다.'") &&
    feedReadActionNormalizedSource.includes("'읽음 기록이 대기 중입니다. 비공개 읽기 기록일 뿐 조언, 주문, 승인 신호가 아닙니다.'") &&
    feedReadActionNormalizedSource.includes("? '처리 중'") &&
    !feedReadActionNormalizedSource.includes("const readStateLabel = isDone\n    ? 'Read state marked as private reading history."),
  'Feed read action Korean aria and title copy must not fall back to English'
);
assertCondition(
  adminReportsPageSource.includes("t.stateLabels.join(' / ')") &&
    adminReportsPageSource.includes('{t.disabledAction}') &&
    !adminReportsPageSource.includes('t.stateLabels.map((stateLabel) => (') &&
    !adminReportsPageSource.includes('<RiskBadge tone="blocked">{t.disabledAction}</RiskBadge>'),
  'Admin Reports must present read-only state candidates and disabled actions as prose instead of hashtag status chip groups'
);
assertCondition(
  adminPerformancePageSource.includes(
    '{t.exposure}: {submission.exposureLabel}; {t.disabled}'
  ) &&
    !adminPerformancePageSource.includes('<RiskBadge tone="blocked">\n          {t.exposure}: {submission.exposureLabel}\n        </RiskBadge>') &&
    !adminPerformancePageSource.includes('<RiskBadge tone="blocked">{t.disabled}</RiskBadge>'),
  'Admin Performance must present exposure/read-only disabled state as prose instead of hashtag status chip groups'
);
assertCondition(
  adminReviewsPageSource.includes(
    '{copy.blocked}: {model.blockedActionLabel}'
  ) &&
    !adminReviewsPageSource.includes('<RiskBadge tone="blocked">{copy.blocked}</RiskBadge>') &&
    !adminReviewsPageSource.includes('<RiskBadge>{model.blockedActionLabel}</RiskBadge>'),
  'Admin Review Queue must present blocked/read-only action state as prose instead of hashtag status chip groups'
);
assertCondition(
  adminReviewDetailPageSource.includes(
    '<p className="mt-3 text-xs font-medium leading-5 text-invest-danger">'
  ) &&
    adminReviewDetailPageSource.includes('{t.actionsDisabled}') &&
    !adminReviewDetailPageSource.includes('<RiskBadge tone="blocked">{t.actionsDisabled}</RiskBadge>') &&
    !adminReviewDetailPageSource.includes('<RiskBadge tone="blocked">\n              {t.actionsDisabled}\n            </RiskBadge>'),
  'Admin Review Detail must present disabled status transition as prose instead of a hashtag status chip group'
);
assertCondition(
  !homePageSource.includes('<SoftBanner') &&
    !homePageSource.includes('homeVisibleBoundaries(locale).map') &&
    homePageSource.includes('homeTopSummaryCopy') &&
    homePageSource.includes('topSummaryAccessibleLabel') &&
    homePageSource.includes('aria-label={topSummaryAccessibleLabel}') &&
    homePageSource.includes('portfolio.selectedModel.name') &&
    homePageSource.includes('portfolio.selectedModel.statusLabel') &&
    homePageSource.includes('mockBalanceLabel: portfolio.mockDeposit.amountLabel') &&
    homePageSource.includes('account.mockBalanceLabel') &&
    homePageSource.includes('grid grid-cols-[1fr_auto]') &&
    homePageSource.includes('min-w-[104px]') &&
    homePageSource.includes('flex min-w-0 items-start gap-2') &&
    homePageSource.includes('size-4 shrink-0') &&
    homePageSource.includes('MockDeposit simulation amount') &&
    homePageSource.includes('not a real account, deposit, order, or brokerage connection') &&
    !homePageSource.includes('Deposit now') &&
    !homePageSource.includes('Connect brokerage') &&
    homePageSource.includes('homeSafetyBoundaryCopy') &&
    !homePageSource.includes('RiskBadge') &&
    homePageSource.includes('ModelSelectionReadStatus') &&
    modelSelectionReadStatusSource.includes('const boundaryLine') &&
    modelSelectionReadStatusSource.includes('copy.noRealAction') &&
    modelSelectionReadStatusSource.includes(".join(' / ')") &&
    modelSelectionReadStatusCopySource.includes("empty: '아직 DB에 활성 선택 기록이 없습니다.'") &&
    modelSelectionReadStatusCopySource.includes("title: '저장된 선택 기록'") &&
    modelSelectionReadStatusCopySource.includes("signedOut: '로그인 사용자 식별자를 찾지 못했습니다.'") &&
    modelSelectionReadStatusCopySource.includes("modelLabel: '투자 모델 식별자'") &&
    modelSelectionReadStatusCopySource.includes("versionLabel: '모델 버전 식별자'") &&
    modelSelectionReadStatusCopySource.includes("selectionLabel: '선택 기록 식별자'") &&
    !modelSelectionReadStatusCopySource.includes('공개 ID') &&
    !signalsPageSource.includes('초기/모의') &&
    !signalDetailPageSource.includes('초기/모의') &&
    !creatorPageSource.includes('공개 ID') &&
    !modelDetailPageSource.includes('공개 ID') &&
    !modelSelectionReadStatusCopySource.includes("active 선택 기록") &&
    !modelSelectionReadStatusCopySource.includes('사용자 publicId') &&
    !modelSelectionReadStatusSource.includes('RiskBadge') &&
    !modelSelectionReadStatusSource.includes('<RiskBadge') &&
    homePageSource.includes('homeCopy.footerBadges.noLiveOrders') &&
    homePageSource.includes('financial advice'),
  'Home and model selection read status must not start with the top blue SoftBanner or hashtag safety chip group and must preserve mock/no-order safety context'
);
assertCondition(
  myPageSource.includes('실계좌 없음 / 실주문 없음 / DB 기반 조회') &&
    myPageSource.includes('No real account / No real orders / DB read model') &&
    myPageSource.includes('{myPageScopeBadgeLabel(locale, myPageMeta)}') &&
    myPageSource.includes("activitySummary.sourceLabel === 'db_read_model'") &&
    myPageSource.includes("summaryVisibleBoundaries.join(' / ')") &&
    myPageSource.includes("myPageActivityVisibleBoundaries(locale).join(' / ')") &&
    myPageSource.includes("myPageRecentActivityVisibleBoundaries(locale).join(' / ')") &&
    !myPageSource.includes('<ShieldCheck') &&
    !myPageSource.includes('<RiskBadge\n            tone={myPageMeta.userScopeSource') &&
    !myPageSource.includes('<RiskBadge\n                tone={\n                  activitySummary.sourceLabel') &&
    !myPageSource.includes('summaryVisibleBoundaries.map((boundary) => (') &&
    !myPageSource.includes('myPageActivityVisibleBoundaries(locale).map(') &&
    !myPageSource.includes('myPageRecentActivityVisibleBoundaries(locale).map(') &&
    !myPageSource.includes("{locale === 'ko' ? '실계좌 없음' : 'No real account'}\n            </RiskBadge>"),
  'My Page safety boundaries must use prose instead of hashtag safety chip groups'
);
assertCondition(
  myPageSource.includes('내 정보는 API의 사용자 범위 출처를 기준으로 현재 회원 DB 기반 조회 또는 프로토타입 보조 상태를 구분합니다.') &&
    myPageSource.includes('회원 범위는 API의 사용자 범위 출처로 확인하며, 화면 값은 현재 회원 DB 기반 조회 또는 프로토타입 보조 상태만 표시합니다.') &&
    myPageSource.includes('DB 사용자 조회 상태') &&
    myPageSource.includes('로컬 프로필 요약') &&
    myPageSource.includes('활동 조회 상태') &&
    myPageSource.includes('현재 회원의 저장/댓글 바로가기를 DB 기반 조회에서 최신순으로 표시합니다.') &&
    myPageSource.includes('최근 피드 글 활동. 현재 회원의 저장 및 댓글 DB 기반 조회 바로가기입니다.') &&
    myPageSource.includes('저장/댓글 활동은 정보성 읽기 바로가기이며 추천, 주문, 실계좌, 실제 알림 전송과 연결되지 않습니다.') &&
    !myPageSource.includes('My Page DB read model 또는 mock-safe') &&
    !myPageSource.includes('user-scoped DB read model') &&
    !myPageSource.includes('프로토타입 fallback') &&
    !myPageSource.includes('프로토타입 대체 상태') &&
    !myPageSource.includes('활동 읽기 모델') &&
    !myPageSource.includes('DB 사용자 읽기 모델') &&
    !myPageSource.includes('활동 read model') &&
    !myPageSource.includes('사용자 publicId') &&
    !myPageSource.includes('DB 사용자 read model') &&
    !myPageSource.includes('정보성 읽기 shortcut') &&
    !myPageSource.includes('실제 push/email/SMS 아님') &&
    !myPageSource.includes('최근 FeedPost 활동') &&
    !myPageSource.includes('DB FeedPost 활동') &&
    !myPageSource.includes('API dataContext: {routeDataContext}.'),
  'My Page Korean copy must not fall back to English technical wording'
);
assertCondition(
  /<p className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{myPageScopeBadgeLabel\(locale, myPageMeta\)\}\s*<\/p>/.test(myPageSource) &&
    !/<RiskBadge[\s\S]{0,240}myPageScopeBadgeLabel\(locale, myPageMeta\)[\s\S]{0,80}<\/RiskBadge>/.test(myPageSource),
  'My Page summary scope/source must render as prose, not a RiskBadge'
);
assertCondition(
  myPageSource.includes("? 'DB 기반 조회'") &&
    myPageSource.includes(": 'DB read model'") &&
    myPageSource.includes("? '모의 안전 상태'") &&
    myPageSource.includes("trend={locale === 'ko' ? '모의' : 'mock'}") &&
    !/<RiskBadge[\s\S]{0,240}activitySummary\.sourceLabel === 'db_read_model'[\s\S]{0,120}<\/RiskBadge>/.test(myPageSource),
  'My Page Recent FeedPost source label must render as prose, not a RiskBadge'
);
assertCondition(
  myPageSource.includes('<RiskBadge tone="medium">{badge}</RiskBadge>') &&
    myPageSource.includes('const badge =') &&
    myPageSource.includes("index < 2 && activitySummary.sourceLabel === 'db_read_model'"),
  'My Page activity row badges must remain functional metadata'
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
    modelsPageSource.includes('footerBadges={[') &&
    /footerBadges\.map\(\(badge\) => badge\.label\)\.join\(' \/ '\)/.test(
      investModelUiSource
    ) &&
    !/<RiskBadge\b[\s\S]{0,220}\{badge\.label\}[\s\S]{0,80}<\/RiskBadge>/.test(
      investModelUiSource
    ),
  'Discover Models must not start with the top blue SoftBanner or safety chip groups and must preserve no-order/simulated safety context'
);
assertCondition(
  modelsPageSource.includes("locale === 'ko' ? '모델 검색' : 'Search models'") &&
    modelsPageSource.includes("locale === 'ko' ? '검색' : 'Search'") &&
    !modelsPageSource.includes("locale === 'ko' ? 'Search models'") &&
    !modelsPageSource.includes("locale === 'ko' ? 'Search' : 'Search'"),
  'Discover Models Korean search form copy must not fall back to English'
);
assertCondition(
  modelsPageSource.includes("dbLabel: 'DB 기반 조회'") &&
    modelsPageSource.includes("unavailableTitle: 'DB 기반 조회 사용 불가'") &&
    modelsPageSource.includes("emptyTitle: 'DB 기반 공개 투자 모델 없음'") &&
    modelsPageSource.includes(
      "'현재 필터에 표시할 공개 투자 모델 데이터가 없습니다. 실제 주문이나 모델 선택은 생성되지 않았습니다.'"
    ) &&
    modelsPageSource.includes("marketplaceFallback: '마켓플레이스 모델'") &&
    modelsPageSource.includes("mandateFallback: '모델 운용 범위'") &&
    modelsPageSource.includes("backtestSuffix: '백테스트'") &&
    !modelsPageSource.includes("dbLabel: 'DB 읽기 모델'") &&
    !modelsPageSource.includes("unavailableTitle: 'DB 읽기 모델 사용 불가'") &&
    modelsPageSource.includes("'승인/공개 모델'") &&
    modelsPageSource.includes("'백테스트 대체 지표'") &&
    modelsPageSource.includes("? '레버리지 허용'") &&
    modelsPageSource.includes("? '레버리지 없음'") &&
    !modelsPageSource.includes("ko: {\n    dbLabel: 'DB read model'") &&
    !modelsPageSource.includes(
      "ko: {\n    dbLabel: 'DB read model',\n    unavailableTitle: 'DB read model unavailable'"
    ) &&
    !modelsPageSource.includes(
      "emptyTitle: 'No DB-backed InvestmentModels',\n    emptyDescription:\n      '현재 필터"
    ) &&
    !modelsPageSource.includes(
      "ko: {\n    dbLabel: 'DB read model',\n    unavailableTitle: 'DB read model unavailable',\n    unavailableDescription:"
    ) &&
    !modelsPageSource.includes(
      "'현재 필터에 표시할 공개 InvestmentModel DTO가 없습니다."
    ) &&
    !modelsPageSource.includes("'백테스트 placeholder'") &&
    !modelsPageSource.includes("card.leverageAllowed ? 'leverage allowed'") &&
    !modelsPageSource.includes("emptyTitle: 'DB 기반 공개 InvestmentModel 없음'") &&
    !modelsPageSource.includes('InvestmentModel 목록을 읽지 못했습니다'),
  'Discover Models Korean read-model copy must not fall back to English'
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
  modelDetailPageSource.includes("detailVisibleBoundaries.join(' / ')") &&
    modelDetailPageSource.includes("selectionVisibleBoundaries.join(' / ')") &&
    modelDetailPageSource.includes("modelDetailVisibleBoundaries(locale)") &&
    modelDetailPageSource.includes(
      'modelDetailSelectionVisibleBoundaries(locale)'
    ) &&
    !modelDetailPageSource.includes('detailVisibleBoundaries.map((boundary) => (') &&
    !modelDetailPageSource.includes('selectionVisibleBoundaries.map((boundary) => (') &&
    modelDetailPageSource.includes('Model detail visible safety boundaries') &&
    modelDetailPageSource.includes('Model selection visible safety boundaries') &&
    modelDetailPageSource.includes('constraintLabels={[model.reviewLabel]}') &&
    !modelDetailPageSource.includes(
      'constraintLabels={[copy.noLiveTradingLabel, model.reviewLabel]}'
    ) &&
    !/<RiskBadge\b[^>]*tone="blocked"[^>]*>[\s\S]{0,160}\{copy\.noLiveTradingLabel\}[\s\S]{0,80}<\/RiskBadge>/.test(
      modelDetailPageSource
    ) &&
    !/<RiskBadge\b[^>]*>[\s\S]{0,160}\{copy\.noLiveTradingLabel\}[\s\S]{0,80}<\/RiskBadge>/.test(
      modelDetailPageSource
    ) &&
    /<p className="rounded-invest-control bg-invest-surface px-2 py-1 text-center text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{model\.dataContext === 'db_read_model'[\s\S]{0,160}: copy\.reviewPlaceholderLabel\}\s*<\/p>/.test(
      modelDetailPageSource
    ) &&
    !/<RiskBadge\b[^>]*tone="neutral"[^>]*[\s\S]{0,160}\{model\.dataContext === 'db_read_model'[\s\S]{0,120}<\/RiskBadge>/.test(
      modelDetailPageSource
    ) &&
    modelSelectionCtaSource.includes('const successMetaLine') &&
    modelSelectionCtaSource.includes('copy.persistedLabel') &&
    modelSelectionCtaSource.includes('copy.safetyLabel') &&
    modelSelectionCtaSource.includes('submitState.selectionPublicId') &&
    modelSelectionCtaSource.includes(".join(' / ')") &&
    !modelSelectionCtaSource.includes('RiskBadge') &&
    !modelSelectionCtaSource.includes('<RiskBadge'),
  'Model Detail and ModelSelectionCta must present visible safety boundaries as prose instead of hashtag safety chip groups'
);
assertCondition(
  modelDetailPageSource.includes("dbDetailLabel: 'DB 조회 모델 상세'") &&
    modelDetailPageSource.includes("mockFallbackLabel: '모의 상세 대체 데이터'") &&
    modelDetailPageSource.includes("riskTitleFallback: '위험과 제한'") &&
    modelDetailPageSource.includes("limitationTitleFallback: 'MVP 금지 동작'") &&
    modelDetailPageSource.includes("disclosureTitleFallback: '공시'") &&
    modelDetailPageSource.includes("actionLabelFallback: '선택 전 검토'") &&
    modelDetailPageSource.includes(
      "noRealOrder: '실제 주문, 입금, 브로커 연결은 생성되지 않습니다.'"
    ) &&
    modelDetailPageSource.includes(
      "'백테스트와 대체 지표는 미래 성과를 의미하지 않습니다.'"
    ) &&
    modelDetailPageSource.includes("backtestLabel: '백테스트'") &&
    modelDetailPageSource.includes("maxDrawdownLabel: '최대 낙폭'") &&
    modelDetailPageSource.includes("leverageAllowed: '레버리지 허용'") &&
    modelDetailPageSource.includes("derivativeAllowed: '파생상품 허용'") &&
    modelDetailPageSource.includes("shortSellingAllowed: '공매도 허용'") &&
    modelDetailPageSource.includes(
      "emptySectionFallback:\n      'DB 기반 조회 맥락은 있지만 이 섹션에 채워진 행은 아직 없습니다.'"
    ) &&
    !modelDetailPageSource.includes('DB 읽기 모델 맥락') &&
    modelDetailPageSource.includes("'승인/공개 모델'") &&
    modelDetailPageSource.includes("'모델 버전 맥락'") &&
    modelDetailPageSource.includes("'모델 운용 범위 맥락'") &&
    modelDetailPageSource.includes("'위험 프로필 맥락'") &&
    modelDetailPageSource.includes(
      "'추천 아님', '실주문 없음', '브로커 연결 없음', '투자 조언 아님'"
    ) &&
    modelDetailPageSource.includes("dbDetailLabel: 'DB read model detail'") &&
    modelDetailPageSource.includes("backtestLabel: 'Backtest'") &&
    modelDetailPageSource.includes('label: readCopy.backtestLabel') &&
    modelDetailPageSource.includes('label: readCopy.maxDrawdownLabel') &&
    !modelDetailPageSource.includes("mockFallbackLabel: 'Mock 상세 대체 데이터'") &&
    !modelDetailPageSource.includes('공시 행은 DB read-model 맥락일 뿐이며') &&
    !modelDetailPageSource.includes(
      "emptySectionFallback:\n      'DB read-model 맥락은 있지만 이 섹션에 채워진 행은 아직 없습니다.'"
    ) &&
    !modelDetailPageSource.includes('로그인된 사용자 public id를 찾지 못했습니다') &&
    !modelDetailPageSource.includes('샘플 사용자 seed') &&
    !modelDetailPageSource.includes("?? 'Model mandate'") &&
    !modelDetailPageSource.includes("?? 'Risks and limits'") &&
    !modelDetailPageSource.includes("?? 'MVP forbidden actions'") &&
    !modelDetailPageSource.includes("?? 'Disclosure'") &&
    !modelDetailPageSource.includes("?? 'Review before selection'") &&
    !modelDetailPageSource.includes("label: 'Backtest'") &&
    !modelDetailPageSource.includes("label: 'Max drawdown'") &&
    !modelDetailPageSource.includes("'ModelVersion 맥락'") &&
    !modelDetailPageSource.includes("'PortfolioMandate 맥락'") &&
    !modelDetailPageSource.includes("'RiskProfile 맥락'") &&
    !modelDetailPageSource.includes('선택 기록은 ModelVersion 저장용이며') &&
    !/<RiskBadge\b[\s\S]{0,180}No recommendation[\s\S]{0,80}<\/RiskBadge>/.test(
      modelDetailPageSource
    ),
  'Model Detail Korean read-model copy must not fall back to English safety/source labels'
);
assertCondition(
  !portfolioPageSource.includes('<SoftBanner') &&
    !portfolioPageSource.includes('<MetricCard') &&
    portfolioPageSource.includes('const displayPortfolio = toPortfolioDisplaySummary(locale, portfolio)') &&
    portfolioPageSource.includes('displayPortfolio.mockDeposit.amountLabel') &&
    portfolioPageSource.includes('displayPortfolio.allocationDecision.statusLabel') &&
    portfolioPageSource.includes('displayPortfolio.tradeIntent.statusLabel') &&
    portfolioPageSource.includes('Portfolio time dashboard read-model trace') &&
    /locale === 'ko'\s*\?\s*'모의 기간 대시보드'\s*:\s*'Mock time dashboard'/.test(
      portfolioPageSource
    ) &&
    portfolioPageSource.includes('포트폴리오 기간 대시보드 읽기 모델 추적') &&
    /locale === 'ko'\s*\?\s*'읽기 모델 추적'\s*:\s*'Read-model trace'/.test(
      portfolioPageSource
    ) &&
    portfolioPageSource.includes('DB 기반 포트폴리오 모의 기간 상태') &&
    portfolioPageSource.includes('모의 전용 기준점이며 실제 수익률, 실잔고, 주문, 브로커 데이터가 아닙니다.') &&
    /'DB 스냅샷',\s*'모의 전용 기준점',\s*snapshot\.safetyLabel/.test(
      portfolioPageSource
    ) &&
    /locale === 'ko'\s*\?\s*'모델 버전'\s*:\s*'ModelVersion'/.test(
      portfolioPageSource
    ) &&
    portfolioPageSource.includes("locale === 'ko' ? '선택 모델 상태' : 'Selected model state'") &&
    portfolioPageSource.includes("locale === 'ko' ? '선택 참조 정보' : 'Selection reference'") &&
    portfolioPageSource.includes('선택된 투자 모델:') &&
    portfolioPageSource.includes('DB 기반 모의 요약이며 사용자 투자성향 설정') &&
    portfolioPageSource.includes('시뮬레이션 구성 비중이며 실제 보유 종목') &&
    portfolioPageSource.includes('시뮬레이션 전용 결정 파이프라인이며 실제 주문') &&
    portfolioPageSource.includes('주문 전 의도 차단 상태.') &&
    portfolioPageSource.includes('포트폴리오 모의 요약 안전 경계') &&
    portfolioPageSource.includes('const timeDashboardSafetyLine') &&
    portfolioPageSource.includes("displayPortfolio.mockDeposit.safetyLabel,\n    copy.preOrderOnly,\n    copy.noBrokerage") &&
    portfolioPageSource.includes('const snapshotSafetyLine') &&
    portfolioPageSource.includes("'DB snapshot',") &&
    portfolioPageSource.includes("'mock-only checkpoint',") &&
    portfolioPageSource.includes("timeDashboardVisibleBoundaries.join(' / ')") &&
    portfolioPageSource.includes("blockedVisibleBoundaries.join(' / ')") &&
    !portfolioPageSource.includes("locale === 'ko' ? 'Mock time dashboard' : 'Mock time dashboard'") &&
    !portfolioPageSource.includes('aria-label="Portfolio time dashboard read-model trace"') &&
    !portfolioPageSource.includes('>Read-model trace<') &&
    !portfolioPageSource.includes('mock time windows from DB-backed\n                Portfolio state') &&
    !portfolioPageSource.includes('const snapshotStateLabel = `${snapshot.rangeLabel} ${snapshot.valueLabel}. ${snapshot.checkpointLabel}. ${snapshot.signalLabel}. ${snapshot.safetyLabel}. Mock-only checkpoint; not a real return, real balance, order, or brokerage data.`;') &&
    !portfolioPageSource.includes("'DB snapshot',\n                'mock-only checkpoint',\n                snapshot.safetyLabel") &&
    !portfolioPageSource.includes('Selected model state\n                    </dt>') &&
    !portfolioPageSource.includes('Selection reference\n                    </dt>') &&
    !portfolioPageSource.includes('사용자 성향 설정이 아니라 모델이 가진 운용 범위(PortfolioMandate) 기준입니다.') &&
    !portfolioPageSource.includes("locale === 'ko' ? '모델 버전(ModelVersion)'") &&
    !portfolioPageSource.includes('선택된 InvestmentModel:') &&
    !portfolioPageSource.includes('DB-backed mock summary이며') &&
    !portfolioPageSource.includes('시뮬레이션 allocation mix') &&
    !portfolioPageSource.includes('simulation-only 결정 파이프라인') &&
    !portfolioPageSource.includes('주문 전 의도(TradeIntent) 차단 상태') &&
    !portfolioPageSource.includes('TradeIntent 차단 상태.') &&
    !portfolioPageSource.includes('Portfolio mock summary 안전 경계') &&
    !portfolioPageSource.includes('timeDashboardVisibleBoundaries.map((boundary) => (') &&
    !portfolioPageSource.includes('blockedVisibleBoundaries.map((boundary) => (') &&
    !portfolioPageSource.includes('<RiskBadge tone="neutral">\n                {portfolio.mockDeposit.safetyLabel}\n              </RiskBadge>') &&
    !portfolioPageSource.includes('<RiskBadge tone="medium">{copy.preOrderOnly}</RiskBadge>') &&
    !portfolioPageSource.includes('<RiskBadge tone="blocked">{copy.noBrokerage}</RiskBadge>') &&
    !portfolioPageSource.includes('<RiskBadge tone="neutral">DB snapshot</RiskBadge>') &&
    !portfolioPageSource.includes('<RiskBadge>mock-only checkpoint</RiskBadge>') &&
    !portfolioPageSource.includes('<RiskBadge tone="blocked">{snapshot.safetyLabel}</RiskBadge>') &&
    portfolioKoreanLabelMapRequired.every((label) =>
      portfolioPageSource.includes(label)
    ) &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{displayPortfolio\.allocationDecision\.sourceLabel\}\s*<\/span>/.test(
      portfolioPageSource
    ) &&
    !/<RiskBadge\b[^>]*>[\s\S]{0,160}\{displayPortfolio\.allocationDecision\.sourceLabel\}[\s\S]{0,80}<\/RiskBadge>/.test(
      portfolioPageSource
    ) &&
    !/<RiskBadge\b[^>]*>[\s\S]{0,160}\{displayPortfolio\.mockDeposit\.sourceLabel\}[\s\S]{0,80}<\/RiskBadge>/.test(
      portfolioPageSource
    ) &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{position\.sourceLabel\}\s*<\/span>/.test(
      portfolioPageSource
    ) &&
    !/<RiskBadge\b[^>]*>[\s\S]{0,160}\{position\.sourceLabel\}[\s\S]{0,80}<\/RiskBadge>/.test(
      portfolioPageSource
    ) &&
    /<RiskBadge\b[^>]*>[\s\S]{0,160}\{position\.stateLabel\}[\s\S]{0,80}<\/RiskBadge>/.test(
      portfolioPageSource
    ) &&
    /<span className="text-\[12px\] font-semibold leading-5 text-invest-text-muted">\s*\{sourceLabel\}\s*<\/span>/.test(
      investModelUiSource
    ) &&
    !/<RiskBadge\b[^>]*tone="neutral"[^>]*>\s*\{sourceLabel\}\s*<\/RiskBadge>/.test(
      investModelUiSource
    ) &&
    investModelUiSource.includes(
      "<RiskBadge tone={tone === 'risk' ? 'high' : 'low'}>{trend}</RiskBadge>"
    ) &&
    investModelUiSource.includes(
      '<RiskBadge tone={riskTone}>{riskLabel}</RiskBadge>'
    ) &&
    investModelUiSource.includes(
      '<RiskBadge tone={statusTone}>{statusLabel}</RiskBadge>'
    ) &&
    portfolioPageSource.includes('displayPortfolio.tradeIntent.blockedActions.map((action) => (') &&
    portfolioPageSource.includes('role="listitem"') &&
    !/<RiskBadge\b[^>]*tone="blocked"[^>]*>[\s\S]{0,240}\{action\}[\s\S]{0,80}<\/RiskBadge>/.test(
      portfolioPageSource
    ) &&
    portfolioPageSource.includes('displayPortfolio.timeSnapshots.length') &&
    portfolioPageSource.includes('position.quantityLabel'),
  'Portfolio must start with the DB-backed time dashboard summary and present safety boundaries as prose instead of top simulation banner/metric cards or hashtag safety chip groups'
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
assertCondition(
  modelsPageSource.includes('discoverySearchTopicCopy') &&
    modelsPageSource.includes("label: '탐색 주제'") &&
    modelsPageSource.includes("label: 'Explore topics'") &&
    modelsPageSource.includes("id: 'market-us-equity'") &&
    modelsPageSource.includes("id: 'mandate-etf'") &&
    modelsPageSource.includes("id: 'risk-lower'") &&
    modelsPageSource.includes("kind: 'market'") &&
    modelsPageSource.includes("kind: 'mandate'") &&
    modelsPageSource.includes("kind: 'risk'") &&
    modelsPageSource.includes("label: '미국 주식 범위'") &&
    modelsPageSource.includes("label: 'ETF 운용 범위'") &&
    modelsPageSource.includes("label: '낮은 위험 프로필'") &&
    modelsPageSource.includes("label: 'US equity scope'") &&
    modelsPageSource.includes("label: 'ETF mandate scope'") &&
    modelsPageSource.includes("label: 'Lower-risk profile'") &&
    modelsPageSource.includes('모델의 시장, 위험, 운용 범위') &&
    modelsPageSource.includes('model market, risk, and mandate scope') &&
    modelsPageSource.includes('searchTopicCopy.topics.map') &&
    modelsPageSource.includes('key={topic.id}') &&
    modelsPageSource.includes('href={getDiscoveryFilterHref(') &&
    modelsPageSource.includes('flex flex-wrap gap-2') &&
    modelsPageSource.includes('basis-[calc(50%-4px)]') &&
    modelsPageSource.includes('min-w-0 max-w-full') &&
    modelsPageSource.includes('focus:ring-2 focus:ring-invest-primary') &&
    modelsPageSource.includes('hover:border-invest-primary/30') &&
    !modelsPageSource.includes('Buy') &&
    !modelsPageSource.includes('Sell') &&
    !modelsPageSource.includes('매수') &&
    !modelsPageSource.includes('매도'),
  'Discover Models search topic chips must wrap on 390px, keep focus states, and stay limited to model market/risk/mandate exploration'
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
