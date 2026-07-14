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

type ScreenCheck = {
  name: string;
  route: string;
  pageFile: string;
  activeTab: InvestModelTabKey;
  requiredCopy: string[];
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
      investModelHomeMock.timeline[0]?.sourceLabel ?? '',
      investModelHomeMock.timeline[0]?.statusLabel ?? ''
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
    name: 'Discover Models',
    route: '/invest-model/models',
    pageFile: 'app/invest-model/models/page.tsx',
    activeTab: 'models',
    requiredCopy: [
      investModelDiscoveryMock.notice.title,
      investModelDiscoveryMock.notice.description,
      discoverableInvestmentModels[0]?.name ?? ''
    ]
  },
  {
    name: 'Realtime Signals',
    route: '/invest-model/signals',
    pageFile: 'app/invest-model/signals/page.tsx',
    activeTab: 'signals',
    requiredCopy: [
      investModelSignalsMock.summary.title,
      investModelSignalsMock.summary.description,
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
      'Realtime search volume'
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
      investModelDetailCopy.en.noLiveTradingLabel
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
    investModelDiscoveryMock.notice.description,
    ...investModelDiscoveryMock.filters,
    ...investModelDiscoveryMock.models.flatMap((model) => [
      model.name,
      model.summary,
      model.performanceLabel,
      model.reviewLabel,
      model.simulatedAumLabel,
      ...model.tags
    ]),
    investModelSignalsMock.summary.description,
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
    investModelPortfolioMock.allocationDecision.rationale,
    ...investModelPortfolioMock.positions.flatMap((position) => [
      position.symbol,
      position.name,
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
const investModelUiSource = readProjectFile('components/invest-model/ui.tsx');
const signalsPageSource = readProjectFile('app/invest-model/signals/page.tsx');

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
