/**
 * This smoke test checks the five Figma-seeded mobile screens for repeatable layout and safety structure.
 * It does not capture pixels; it verifies the code and mock data invariants that prevent common mobile overlap and misleading investment copy.
 */

import { readFileSync } from 'fs';
import path from 'path';
import {
  investModelNavItems,
  type InvestModelTabKey
} from '../../components/invest-model/mobile-shell';
import { investModelHomeMock } from '../../lib/mock/invest-model-home';
import {
  discoverableInvestmentModels,
  investModelDiscoveryMock
} from '../../lib/mock/invest-model-discovery';
import { investModelSignalsMock } from '../../lib/mock/invest-model-signals';
import { investModelDetailCopy } from '../../lib/mock/invest-model-model-detail';
import { investModelFeedMock } from '../../lib/mock/invest-model-feed';

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
    name: 'Model Detail',
    route: '/invest-model/models/quant-us-leverage-alpha',
    pageFile: 'app/invest-model/models/[modelId]/page.tsx',
    activeTab: 'models',
    requiredCopy: [
      investModelDetailCopy.en.performanceGroupTitle,
      investModelDetailCopy.en.selectionReviewTitle,
      investModelDetailCopy.en.noLiveTradingLabel
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
    investModelFeedMock.summary.description,
    ...investModelFeedMock.posts.flatMap((post) => [
      post.title,
      post.excerpt,
      ...post.tags
    ])
  ];
}

const mobileShellSource = readProjectFile(
  'components/invest-model/mobile-shell.tsx'
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
  investModelNavItems.length === 5,
  `BottomNav expected 5 tabs, found ${investModelNavItems.length}`
);
assertCondition(
  new Set(investModelNavItems.map((item) => item.key)).size === 5,
  'BottomNav tab keys are not unique'
);

const screenResults = screens.map((screen) => {
  const source = readProjectFile(screen.pageFile);

  assertCondition(
    source.includes('<MobileShell'),
    `${screen.name}: page does not use MobileShell`
  );
  assertCondition(
    source.includes(`activeTab="${screen.activeTab}"`),
    `${screen.name}: page does not set activeTab=${screen.activeTab}`
  );
  assertCondition(
    source.includes(`currentPath="${screen.route}"`) ||
      source.includes(`const currentPath = \`${screen.route.split('/').slice(0, -1).join('/')}`) ||
      source.includes('currentPath={currentPath}'),
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

assertNoLongUnbrokenText('All five Figma-seeded screens', collectScreenTextValues());

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
