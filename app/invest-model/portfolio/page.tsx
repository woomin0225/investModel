import {
  BriefcaseBusiness,
  Clock3,
  Database,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { NextRequest } from 'next/server';

import { GET as readPortfolioMockSummary } from '@/app/api/portfolio/mock-summary/route';
import {
  investMotionClass,
  MobileShell,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  PortfolioCompactSummaryCard,
  PortfolioHoldingsListCard,
  RiskBadge,
  SectionHeader,
  SeededPriceMiniChartCard,
  SearchAndNotificationActions
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import type { InvestModelPortfolioSummary } from '@/lib/domain/portfolio/portfolio-summary';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type InvestModelPortfolioPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const portfolioCopy = {
  ko: {
    eyebrow: '내 포트폴리오',
    title: '내 포트폴리오',
    alertLabel: '포트폴리오 알림',
    bannerEyebrow: '시뮬레이션 전용',
    bannerTitle: '선택 모델 운용 현황',
    bannerDescription:
      '선택한 투자 모델의 운용 범위 안에서 구성된 포트폴리오 상태를 보여줍니다.',
    mockBalance: '운용금액',
    mockSafety: '시뮬레이션 기준, 실제 계좌와 분리',
    allocationState: '배분 결정',
    preOrderOnly: '주문 전 시뮬레이션 단계입니다',
    policyState: '주문 전 의도',
    noBrokerage: '브로커 계좌나 주문 실행과 연결되지 않습니다',
    selectedModelTitle: '선택한 투자 모델',
    selectedModelDescription:
      '사용자 성향 설정이 아니라 모델이 가진 운용 범위 기준입니다.',
    positionTitle: '구성 비중',
    positionDescription:
      '모든 금액과 비중은 관찰 데이터와 정책 검증 결과로 계산된 시뮬레이션입니다.',
    decisionTitle: '결정 파이프라인',
    decisionDescription:
      '배분 결정과 주문 전 의도는 실제 주문, 체결, 운용 지시가 아닙니다.',
    blockedActionsTitle: '비활성화된 실제 기능',
    timeEmptyTitle: '아직 DB 모의 기간 데이터가 없습니다',
    timeEmptyDescription:
      'MockDeposit과 선택 모델 맥락은 유지되지만 표시할 1D, 1W, 1M seed 스냅샷이 없습니다.',
    positionEmptyTitle: 'MockDeposit 모의 행이 아직 없습니다',
    positionEmptyDescription:
      '이 포트폴리오에는 아직 모의 보유 행이 없습니다. MockDeposit은 실제 입금, 현금 잔고, 계좌, 브로커 연결이 아닙니다.',
    blockedActionsEmptyTitle: '차단된 실제 기능 목록이 비어 있습니다',
    blockedActionsEmptyDescription:
      'TradeIntent는 여전히 읽기 전용 모의 상태이며 실제 주문, 체결, 브로커 지시를 만들지 않습니다.',
    emptyCtaLabel: '모의 모델 보기',
    emptySafetyLine:
      '읽기 전용 빈 상태 / 실제 입금 없음 / 실제 주문 없음 / 브로커 미연결',
    footer:
      '포트폴리오 값, 포지션, 주문 전 의도는 실제 자산, 투자 조언, 주문, 계좌 연결을 의미하지 않습니다.'
  },
  en: {
    eyebrow: 'My portfolio',
    title: 'My Portfolio',
    alertLabel: 'Portfolio alerts',
    bannerEyebrow: 'Simulation only',
    bannerTitle: 'Selected model portfolio',
    bannerDescription:
      'Portfolio state is shown within the mandate of the selected InvestmentModel.',
    mockBalance: 'Operating amount',
    mockSafety: 'Simulation basis, separated from real accounts',
    allocationState: 'AllocationDecision',
    preOrderOnly: 'Pre-order simulation stage only',
    policyState: 'TradeIntent',
    noBrokerage: 'No brokerage account or order execution is connected',
    selectedModelTitle: 'Selected InvestmentModel',
    selectedModelDescription:
      'This is the model-owned PortfolioMandate, not a user preference control.',
    positionTitle: 'Allocation mix',
    positionDescription:
      'All values and weights are simulated from observed data and policy checks.',
    decisionTitle: 'Decision pipeline',
    decisionDescription:
      'AllocationDecision and TradeIntent are not real orders, fills, or operating instructions.',
    blockedActionsTitle: 'Disabled real-world actions',
    timeEmptyTitle: 'No DB mock time windows yet',
    timeEmptyDescription:
      'MockDeposit and selected model context remain available, but no 1D, 1W, or 1M seed snapshots are filled yet.',
    positionEmptyTitle: 'No MockDeposit simulation rows yet',
    positionEmptyDescription:
      'This portfolio has no simulated holdings yet. MockDeposit is not a real deposit, cash balance, account, or brokerage connection.',
    blockedActionsEmptyTitle: 'No blocked real-world action rows yet',
    blockedActionsEmptyDescription:
      'TradeIntent remains read-only and simulated; it does not create real orders, fills, or broker instructions.',
    emptyCtaLabel: 'View mock models',
    emptySafetyLine:
      'Read-only empty state / no real deposit / no real order / no broker',
    footer:
      'Portfolio values, positions, and TradeIntent are not real assets, advice, orders, or account connections.'
  }
} as const;

function parseWeightPercent(weightLabel: string) {
  const parsed = Number.parseInt(weightLabel, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : 0;
}

function toKoreanPortfolioLabel(label: string) {
  const exactLabels: Record<string, string> = {
    'live mock': '모의 운용 중',
    'High risk': '고위험',
    'Not a real deposit or cash balance': '실제 입금이나 현금 잔고가 아닙니다',
    simulated_allocated: '모의 배정됨',
    mock_safe_fallback: '모의 안전 대체 상태',
    'sourceType: mock': '출처: 모의 데이터',
    ready_for_simulation: '시뮬레이션 준비됨',
    'Mock decision engine': '모의 결정 엔진',
    'DB read model': 'DB 기반 조회',
    approved_for_simulation: '시뮬레이션 승인됨',
    'pre-order simulation only': '주문 전 시뮬레이션만 가능',
    'No real P/L': '실제 손익 아님',
    'No return claim': '수익률 주장 아님',
    'No brokerage data': '브로커 데이터 없음',
    'No real deposit': '실제 입금 없음',
    'No live order': '실주문 없음',
    'No brokerage account': '브로커 계좌 없음',
    'simulated position': '모의 포지션',
    'mock market quote': '모의 시장 시세',
    'mock policy buffer': '모의 정책 완충 구간',
    'DB mock position': 'DB 모의 포지션',
    'Mock volatility guard active': '모의 변동성 안전 한도 활성',
    'PortfolioMandate guardrails only': '모델 운용 범위 안전 한도만 적용',
    'DB read model sample window': 'DB 기반 조회 샘플 기간'
  };

  if (exactLabels[label]) {
    return exactLabels[label];
  }

  return label
    .replace(/^ModelVersion\s+(.+?)\s+DB mock$/, '모델 버전 $1 DB 모의')
    .replace(/^ModelVersion\s+(.+?)\s+mock$/, '모델 버전 $1 모의')
    .replace(/^PortfolioMandate:\s*/, '모델 운용 범위: ')
    .replace(/US equities/g, '미국 주식')
    .replace(/leveraged ETF guardrails/g, '레버리지 ETF 안전 한도')
    .replace(/^selected DB mock:/, 'DB 모의 선택:')
    .replace(/^selected mock:/, '모의 선택:')
    .replace(/\bmock checkpoint\b/g, '모의 기준점')
    .replace(/\bDB checkpoint\b/g, 'DB 기준점')
    .replace(/\bsample window\b/g, '샘플 기간')
    .replace(/\bposition snapshot\b/g, '포지션 스냅샷')
    .replace(/\bsimulated units\b/g, '모의 단위')
    .replace(/\bsimulated holding\b/g, '모의 보유 항목')
    .replace(/\bsimulated\b/g, '모의')
    .replace(/\bmock cash\b/g, '모의 현금')
    .replace(/\btarget\b/g, '목표')
    .replace(/\bguardrail\b/g, '안전 한도')
    .replace(/(\d+) observed SignalEvents/g, '관찰 신호 $1개')
    .replace(/(\d+) simulated PortfolioPositions/g, '모의 포지션 $1개')
    .replace(/Current selected model status is live mock; inactive models cannot create simulated TradeIntent records\./g, '현재 선택 모델은 모의 운용 중이며 비활성 모델은 모의 주문 전 의도를 만들 수 없습니다.')
    .replace(/Current selected model status comes from DB read model; it cannot create real orders or account activity\./g, '현재 선택 모델 상태는 DB 기반 조회에서 왔으며 실제 주문이나 계좌 활동을 만들 수 없습니다.')
    .replace(/Mock market and news observations created pre-order simulation TradeIntent records after policy checks\./g, '모의 시장과 뉴스 관찰값이 정책 검증 뒤 주문 전 시뮬레이션 기록을 만들었습니다.')
    .replace(/No DB AllocationDecision row yet; showing mock-safe fallback state only\./g, 'DB 배분 결정 행이 없어 모의 안전 대체 상태만 표시합니다.')
    .replace(/\bAllocationDecision\b/g, '배분 결정')
    .replace(/\bTradeIntent\b/g, '주문 전 의도')
    .replace(/\bMockDeposit\b/g, '모의 입금')
    .replace(/\bPortfolioMandate\b/g, '모델 운용 범위')
    .replace(/\bDB read model\b/g, 'DB 기반 조회')
    .replace(/\bmock-safe fallback\b/g, '모의 안전 대체')
    .replace(/\bfallback\b/g, '대체 상태');
}

function portfolioSafetyMetaLine(
  locale: 'ko' | 'en',
  safetyMeta: InvestModelPortfolioSummary['safetyMeta']
) {
  const flagLine = [
    `mockOnly=${String(safetyMeta.mockOnly)}`,
    `realDeposit=${String(safetyMeta.realDeposit)}`,
    `realBalance=${String(safetyMeta.realBalance)}`,
    `realOrder=${String(safetyMeta.realOrder)}`,
    `brokerageConnection=${String(safetyMeta.brokerageConnection)}`,
    `financialAdvice=${String(safetyMeta.financialAdvice)}`
  ].join(' / ');

  if (locale === 'ko') {
    return `${flagLine} / 모의 안전 대체 상태`;
  }

  return `${flagLine} / ${safetyMeta.fallbackLabel}`;
}

function toPortfolioDisplaySummary(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
): InvestModelPortfolioSummary {
  if (locale === 'en') {
    return portfolio;
  }

  return {
    ...portfolio,
    isMockOnly: true,
    selectedModel: {
      ...portfolio.selectedModel,
      versionLabel: toKoreanPortfolioLabel(
        portfolio.selectedModel.versionLabel
      ),
      mandateLabel: toKoreanPortfolioLabel(
        portfolio.selectedModel.mandateLabel
      ),
      statusLabel: toKoreanPortfolioLabel(portfolio.selectedModel.statusLabel),
      riskLabel: toKoreanPortfolioLabel(portfolio.selectedModel.riskLabel),
      selectedAtLabel: toKoreanPortfolioLabel(
        portfolio.selectedModel.selectedAtLabel
      ),
      statusDescription: toKoreanPortfolioLabel(
        portfolio.selectedModel.statusDescription
      )
    },
    mockDeposit: {
      ...portfolio.mockDeposit,
      displayLabel: toKoreanPortfolioLabel(portfolio.mockDeposit.displayLabel),
      statusLabel: toKoreanPortfolioLabel(portfolio.mockDeposit.statusLabel),
      sourceLabel: toKoreanPortfolioLabel(portfolio.mockDeposit.sourceLabel),
      safetyLabel: toKoreanPortfolioLabel(portfolio.mockDeposit.safetyLabel)
    },
    allocationDecision: {
      ...portfolio.allocationDecision,
      statusLabel: toKoreanPortfolioLabel(
        portfolio.allocationDecision.statusLabel
      ),
      sourceLabel: toKoreanPortfolioLabel(
        portfolio.allocationDecision.sourceLabel
      ),
      rationale: toKoreanPortfolioLabel(portfolio.allocationDecision.rationale)
    },
    timeSnapshots: portfolio.timeSnapshots.map((snapshot) => ({
      ...snapshot,
      valueLabel: toKoreanPortfolioLabel(snapshot.valueLabel),
      checkpointLabel: toKoreanPortfolioLabel(snapshot.checkpointLabel),
      signalLabel: toKoreanPortfolioLabel(snapshot.signalLabel),
      safetyLabel: toKoreanPortfolioLabel(snapshot.safetyLabel)
    })),
    positions: portfolio.positions.map((position) => ({
      ...position,
      name: toKoreanPortfolioLabel(position.name),
      quantityLabel: toKoreanPortfolioLabel(position.quantityLabel),
      weightLabel: toKoreanPortfolioLabel(position.weightLabel),
      valueLabel: toKoreanPortfolioLabel(position.valueLabel),
      stateLabel: toKoreanPortfolioLabel(position.stateLabel),
      sourceLabel: toKoreanPortfolioLabel(position.sourceLabel)
    })),
    tradeIntent: {
      ...portfolio.tradeIntent,
      statusLabel: toKoreanPortfolioLabel(portfolio.tradeIntent.statusLabel),
      boundaryLabel: toKoreanPortfolioLabel(
        portfolio.tradeIntent.boundaryLabel
      ),
      blockedActions: portfolio.tradeIntent.blockedActions.map((action) =>
        toKoreanPortfolioLabel(action)
      )
    }
  };
}

function portfolioSelectedModelAccessibleLabel(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return `선택된 투자 모델: ${portfolio.selectedModel.name}. ${portfolio.selectedModel.statusLabel}. ${portfolio.selectedModel.mandateLabel}. 모델 버전 ${portfolio.selectedModel.versionLabel}. DB 기반 모의 요약이며 사용자 투자성향 설정, 실제 계좌, 주문, 브로커 동작, 투자 조언이 아닙니다.`;
  }

  return `Selected InvestmentModel: ${portfolio.selectedModel.name}. ${portfolio.selectedModel.statusLabel}. ${portfolio.selectedModel.mandateLabel}. ModelVersion ${portfolio.selectedModel.versionLabel}. DB-backed mock summary; not a user preference setting, real account, order, brokerage action, or investment advice.`;
}

function portfolioPositionAccessibleLabel(
  locale: 'ko' | 'en',
  position: InvestModelPortfolioSummary['positions'][number]
) {
  if (locale === 'ko') {
    return `${position.symbol} 포지션. ${position.name}. ${position.quantityLabel}, ${position.weightLabel}, ${position.valueLabel}. ${position.stateLabel}. ${position.sourceLabel}. 시뮬레이션 구성 비중이며 실제 보유 종목, 실잔고, 주문 지시, 투자 조언이 아닙니다.`;
  }

  return `${position.symbol} position. ${position.name}. ${position.quantityLabel}, ${position.weightLabel}, ${position.valueLabel}. ${position.stateLabel}. ${position.sourceLabel}. Simulated allocation mix; not a real holding, real balance, order instruction, or investment advice.`;
}

function portfolioDecisionAccessibleLabel(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return `배분 결정: ${portfolio.allocationDecision.statusLabel}. ${portfolio.allocationDecision.sourceLabel}. ${portfolio.allocationDecision.generatedAtLabel}. ${portfolio.allocationDecision.rationale}. 시뮬레이션 전용 결정 파이프라인이며 실제 주문, 체결, 브로커 동작, 투자 조언이 아닙니다.`;
  }

  return `AllocationDecision: ${portfolio.allocationDecision.statusLabel}. ${portfolio.allocationDecision.sourceLabel}. ${portfolio.allocationDecision.generatedAtLabel}. ${portfolio.allocationDecision.rationale}. Simulation-only decision pipeline; not a real order, fill, brokerage action, or investment advice.`;
}

function portfolioBlockedActionsAccessibleLabel(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return `주문 전 의도 차단 상태. ${portfolio.tradeIntent.boundaryLabel}. ${portfolio.tradeIntent.blockedActions.length}개 실제 기능 비활성화. 실제 입금, 실계좌 연결, 주문 실행, 브로커 동작, 투자 조언이 연결되지 않았습니다.`;
  }

  return `TradeIntent blocked state. ${portfolio.tradeIntent.boundaryLabel}. ${portfolio.tradeIntent.blockedActions.length} real-world actions disabled. No real deposit, account connection, order execution, brokerage action, or investment advice is connected.`;
}

function portfolioBlockedActionAccessibleLabel(
  locale: 'ko' | 'en',
  action: string
) {
  if (locale === 'ko') {
    return `차단된 실제 기능: ${action}. 포트폴리오 모의 요약에서는 실행되지 않습니다.`;
  }

  return `Blocked real-world action: ${action}. It is not executed in the Portfolio mock summary.`;
}

function portfolioEmptyStateAccessibleLabel(
  locale: 'ko' | 'en',
  title: string,
  description: string
) {
  if (locale === 'ko') {
    return `${title}. ${description} DB seed/mock 기준 빈 상태이며 실제 입금, 계좌 연결, 주문, 체결, 브로커 동작, 투자 조언이 아닙니다.`;
  }

  return `${title}. ${description} DB seed/mock empty state; not a real deposit, account connection, order, fill, brokerage action, or investment advice.`;
}

function PortfolioEmptyStateCard({
  ariaLabel,
  ctaLabel,
  description,
  safetyLine,
  title
}: {
  ariaLabel: string;
  ctaLabel: string;
  description: string;
  safetyLine: string;
  title: string;
}) {
  return (
    <article
      aria-label={ariaLabel}
      title={ariaLabel}
      className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-4 shadow-invest-card"
    >
      <div className="grid gap-3 min-[360px]:grid-cols-[minmax(0,1fr)_auto] min-[360px]:items-center">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-5 text-invest-text">{title}</p>
          <p className="mt-1 text-[13px] leading-5 text-invest-text-muted">
            {description}
          </p>
        </div>
        <Link
          href="/invest-model/models"
          className="inline-flex min-h-invest-touch-target items-center justify-center rounded-invest-control bg-invest-primary-soft px-3 py-2 text-center text-[13px] font-bold leading-5 text-invest-primary transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/75 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invest-primary focus-visible:ring-offset-2 focus-visible:ring-offset-invest-surface motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {ctaLabel}
        </Link>
      </div>
      <p className="mt-3 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
        {safetyLine}
      </p>
    </article>
  );
}

function portfolioTradeIntentDetailRows(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return [
      {
        label: 'TradeIntent 상태',
        value: portfolio.tradeIntent.statusLabel,
        detail: portfolio.tradeIntent.boundaryLabel,
        tone: 'low' as const
      },
      {
        label: '읽기 전용 정책 검사',
        value: '모의 상세만 표시',
        detail: '주문 실행, 체결, 브로커 지시 없음',
        tone: 'medium' as const
      },
      {
        label: '브로커 연결',
        value: '차단됨',
        detail: '브로커 계좌/API 미연결',
        tone: 'blocked' as const
      },
      {
        label: '비활성 기능',
        value: `${portfolio.tradeIntent.blockedActions.length}개 차단`,
        detail: portfolio.tradeIntent.blockedActions.join(' / '),
        tone: 'blocked' as const
      }
    ];
  }

  return [
    {
      label: 'TradeIntent state',
      value: portfolio.tradeIntent.statusLabel,
      detail: portfolio.tradeIntent.boundaryLabel,
      tone: 'low' as const
    },
    {
      label: 'Read-only policy check',
      value: 'simulated detail only',
      detail: 'No order execution, fill, or broker instruction',
      tone: 'medium' as const
    },
    {
      label: 'Brokerage connection',
      value: 'blocked',
      detail: 'No brokerage account or broker API is connected',
      tone: 'blocked' as const
    },
    {
      label: 'Disabled actions',
      value: `${portfolio.tradeIntent.blockedActions.length} blocked`,
      detail: portfolio.tradeIntent.blockedActions.join(' / '),
      tone: 'blocked' as const
    }
  ];
}

function portfolioTradeIntentSafetyBadges(locale: 'ko' | 'en') {
  if (locale === 'ko') {
    return ['모의 거래', '읽기 전용', '브로커 미연결'];
  }

  return ['Simulated trade', 'Read-only', 'No broker'];
}

function portfolioTradeIntentSafetyBadgeLabel(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? 'TradeIntent 모의 읽기 전용 안전 배지'
    : 'TradeIntent simulated read-only safety badges';
}

function portfolioTradeIntentTopSummaryItems(
  _locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  return [
    {
      label: 'TradeIntent summary',
      value: portfolio.tradeIntent.statusLabel,
      detail: 'read-only pre-order intent',
      tone: 'low' as const
    },
    {
      label: 'Risk label',
      value: portfolio.selectedModel.riskLabel,
      detail: portfolio.tradeIntent.boundaryLabel,
      tone: 'blocked' as const
    },
    {
      label: 'Mock source',
      value: portfolio.allocationDecision.sourceLabel,
      detail: 'mock/DB read model basis',
      tone: 'medium' as const
    }
  ];
}

function portfolioBlockedVisibleBoundaries(locale: 'ko' | 'en') {
  if (locale === 'ko') {
    return [
      '실제 입금 없음',
      '실계좌 연결 없음',
      '실주문 없음',
      '브로커 미연결',
      '투자 조언 아님'
    ];
  }

  return [
    'no real deposit',
    'no account link',
    'no real order',
    'no brokerage',
    'no advice'
  ];
}

function portfolioTimeDashboardVisibleBoundaries(locale: 'ko' | 'en') {
  if (locale === 'ko') {
    return [
      'DB 모의 요약',
      '기간별 스냅샷',
      '샘플·백테스트 지표',
      '실잔고 아님',
      '실주문 없음',
      '브로커 미연결',
      '투자 조언 아님'
    ];
  }

  return [
    'DB mock summary',
    'time-window snapshot',
    'sample/backtest metrics',
    'not real balance',
    'no real order',
    'no brokerage',
    'no advice'
  ];
}

async function readPortfolioSummaryRoute(): Promise<InvestModelPortfolioSummary> {
  const response = await readPortfolioMockSummary(
    new NextRequest('http://localhost/api/portfolio/mock-summary', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    throw new Error('Portfolio mock summary route read failed.');
  }

  const payload = (await response.json()) as {
    data?: InvestModelPortfolioSummary;
  };

  if (!payload.data) {
    throw new Error('Portfolio mock summary route returned no data.');
  }

  return payload.data;
}

const positionAccentClass = [
  'bg-invest-primary',
  'bg-invest-warning',
  'bg-invest-positive'
] as const;

export default async function InvestModelPortfolioPage({
  searchParams
}: InvestModelPortfolioPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = portfolioCopy[locale];
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const portfolio = await readPortfolioSummaryRoute();
  const displayPortfolio = toPortfolioDisplaySummary(locale, portfolio);
  const selectedModelAccessibleLabel = portfolioSelectedModelAccessibleLabel(
    locale,
    displayPortfolio
  );
  const decisionAccessibleLabel = portfolioDecisionAccessibleLabel(
    locale,
    displayPortfolio
  );
  const blockedActionsAccessibleLabel = portfolioBlockedActionsAccessibleLabel(
    locale,
    displayPortfolio
  );
  const tradeIntentDetailRows =
    portfolioTradeIntentDetailRows(locale, displayPortfolio);
  const tradeIntentSafetyBadges =
    portfolioTradeIntentSafetyBadges(locale);
  const tradeIntentSafetyBadgeLabel =
    portfolioTradeIntentSafetyBadgeLabel(locale);
  const tradeIntentTopSummaryItems =
    portfolioTradeIntentTopSummaryItems(locale, displayPortfolio);
  const hasTimeSnapshots = displayPortfolio.timeSnapshots.length > 0;
  const hasPositions = displayPortfolio.positions.length > 0;
  const hasBlockedActions =
    displayPortfolio.tradeIntent.blockedActions.length > 0;
  const timeEmptyAccessibleLabel = portfolioEmptyStateAccessibleLabel(
    locale,
    copy.timeEmptyTitle,
    copy.timeEmptyDescription
  );
  const positionEmptyAccessibleLabel = portfolioEmptyStateAccessibleLabel(
    locale,
    copy.positionEmptyTitle,
    copy.positionEmptyDescription
  );
  const blockedActionsEmptyAccessibleLabel =
    portfolioEmptyStateAccessibleLabel(
      locale,
      copy.blockedActionsEmptyTitle,
      copy.blockedActionsEmptyDescription
    );
  const blockedVisibleBoundaries = portfolioBlockedVisibleBoundaries(locale);
  const timeDashboardVisibleBoundaries =
    portfolioTimeDashboardVisibleBoundaries(locale);
  const safetyMetaLine = portfolioSafetyMetaLine(
    locale,
    displayPortfolio.safetyMeta
  );
  const timeDashboardSafetyLine = [
    displayPortfolio.mockDeposit.safetyLabel,
    copy.preOrderOnly,
    copy.noBrokerage,
    safetyMetaLine
  ].join(' / ');

  return (
    <MobileShell
      activeTab="portfolio"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/portfolio"
      trailing={
        <SearchAndNotificationActions
          locale={locale}
          searchLabel={investModelCopy[locale].actions.searchModels}
          notificationLabel={copy.alertLabel}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <PortfolioCompactSummaryCard locale={locale} />

        <PortfolioHoldingsListCard locale={locale} />

        <SeededPriceMiniChartCard locale={locale} />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={
              locale === 'ko' ? '모의 기간 대시보드' : 'Mock time dashboard'
            }
            description={
              locale === 'ko'
                ? '1D, 1W, 1M 상태는 시뮬레이션 기준점이며 실제 수익률이나 계좌 성과가 아닙니다.'
                : '1D, 1W, and 1M states are simulated checkpoints, not real returns or account performance.'
            }
          />
          <div className="grid gap-2 rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">
            <div className="grid gap-2 min-[360px]:grid-cols-3">
              <div className="rounded-invest-control bg-invest-bg-soft p-2.5">
                <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                  {copy.mockBalance}
                </p>
                <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                  {displayPortfolio.mockDeposit.amountLabel}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-invest-text-muted">
                  {displayPortfolio.mockDeposit.statusLabel}
                </p>
              </div>
              <div className="rounded-invest-control bg-invest-bg-soft p-2.5">
                <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                  {copy.allocationState}
                </p>
                <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                  {displayPortfolio.allocationDecision.statusLabel}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-invest-text-muted">
                  {displayPortfolio.allocationDecision.sourceLabel}
                </p>
              </div>
              <div className="rounded-invest-control bg-invest-risk-soft/55 p-2.5">
                <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                  {copy.policyState}
                </p>
                <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                  {displayPortfolio.tradeIntent.statusLabel}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-invest-risk">
                  {displayPortfolio.tradeIntent.boundaryLabel}
                </p>
              </div>
            </div>
            <div className="rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
              {timeDashboardSafetyLine}
            </div>
          </div>
          <p className="rounded-invest-control bg-invest-surface-muted px-3 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
            {timeDashboardVisibleBoundaries.join(' / ')}
          </p>
          <div
            aria-label={
              locale === 'ko'
                ? '포트폴리오 기간 대시보드 읽기 모델 추적'
                : 'Portfolio time dashboard read-model trace'
            }
            className="grid gap-2 rounded-invest-card border border-invest-primary/10 bg-invest-primary-soft/35 p-3 min-[360px]:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase leading-4 text-invest-text-muted">
                {locale === 'ko' ? '읽기 모델 추적' : 'Read-model trace'}
              </p>
              <p className="mt-1 text-sm font-semibold leading-5 text-invest-text">
                {locale === 'ko'
                  ? `${displayPortfolio.timeSnapshots.length}개 DB 기반 포트폴리오 모의 기간 상태`
                  : `${displayPortfolio.timeSnapshots.length} mock time windows from DB-backed Portfolio state`}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-1.5 min-[360px]:justify-end">
              <RiskBadge tone="medium">
                {displayPortfolio.allocationDecision.generatedAtLabel}
              </RiskBadge>
              <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                {displayPortfolio.allocationDecision.sourceLabel}
              </span>
            </div>
          </div>
          <div
            role="list"
            aria-label={
              locale === 'ko' ? '모의 기간 대시보드' : 'Mock time dashboard'
            }
            className="grid grid-cols-3 gap-2 rounded-invest-control bg-invest-bg-soft p-1.5"
          >
            {hasTimeSnapshots ? (
              displayPortfolio.timeSnapshots.map((snapshot) => {
                const snapshotStateLabel =
                  locale === 'ko'
                    ? `${snapshot.rangeLabel} ${snapshot.valueLabel}. ${snapshot.checkpointLabel}. ${snapshot.signalLabel}. ${snapshot.safetyLabel}. 모의 전용 기준점이며 실제 수익률, 실잔고, 주문, 브로커 데이터가 아닙니다.`
                    : `${snapshot.rangeLabel} ${snapshot.valueLabel}. ${snapshot.checkpointLabel}. ${snapshot.signalLabel}. ${snapshot.safetyLabel}. Mock-only checkpoint; not a real return, real balance, order, or brokerage data.`;
                const snapshotSafetyLine =
                  locale === 'ko'
                    ? ['DB 스냅샷', '모의 전용 기준점', snapshot.safetyLabel].join(
                        ' / '
                      )
                    : [
                        'DB snapshot',
                        'mock-only checkpoint',
                        snapshot.safetyLabel
                      ].join(' / ');

                return (
                  <article
                    key={snapshot.rangeLabel}
                    role="listitem"
                    aria-label={snapshotStateLabel}
                    title={snapshotStateLabel}
                    className={cn(
                      'group min-w-0 rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card',
                      investMotionClass.interactiveCard
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-1.5">
                      <span className="rounded-full bg-invest-primary-soft px-2 py-1 text-[11px] font-bold leading-4 text-invest-primary">
                        {snapshot.rangeLabel}
                      </span>
                      <Clock3
                        aria-hidden
                        className="size-4 shrink-0 text-invest-text-muted transition-transform duration-200 ease-out group-hover:rotate-12 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100"
                      />
                    </div>
                    <p className="text-[15px] font-bold leading-5 text-invest-text">
                      {snapshot.valueLabel}
                    </p>
                    <p className="mt-1 text-[12px] leading-4 text-invest-text-muted">
                      {snapshot.checkpointLabel}
                    </p>
                    <p className="mt-2 text-[12px] font-semibold leading-4 text-invest-primary">
                      {snapshot.signalLabel}
                    </p>
                    <div className="mt-2 rounded-invest-control bg-invest-bg-soft px-2 py-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
                      {snapshotSafetyLine}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-3">
                <PortfolioEmptyStateCard
                  ariaLabel={timeEmptyAccessibleLabel}
                  title={copy.timeEmptyTitle}
                  description={copy.timeEmptyDescription}
                  ctaLabel={copy.emptyCtaLabel}
                  safetyLine={copy.emptySafetyLine}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.selectedModelTitle}
            description={copy.selectedModelDescription}
          />
          <article
            aria-label={selectedModelAccessibleLabel}
            title={selectedModelAccessibleLabel}
            className={cn(
              'group rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
              investMotionClass.interactiveCard
            )}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary transition-[background-color,transform] duration-200 ease-out group-hover:scale-[1.03] group-hover:bg-invest-primary-soft group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                <BriefcaseBusiness aria-hidden className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-2">
                  <h2 className="min-w-0 flex-1 text-[18px] font-bold leading-7 text-invest-text">
                    {displayPortfolio.selectedModel.name}
                  </h2>
                  <RiskBadge tone="low">
                    {displayPortfolio.selectedModel.statusLabel}
                  </RiskBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                  {displayPortfolio.selectedModel.mandateLabel}
                </p>
                <dl className="mt-3 grid gap-2 text-xs leading-5 text-invest-text-muted">
                  <div className="grid gap-1 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
                    <dt className="font-semibold text-invest-text">
                      {locale === 'ko' ? '모델 버전' : 'ModelVersion'}
                    </dt>
                    <dd>{displayPortfolio.selectedModel.versionLabel}</dd>
                    <dd>{displayPortfolio.selectedModel.modelVersionPublicId}</dd>
                  </div>
                  <div className="grid gap-1 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
                    <dt className="font-semibold text-invest-text">
                      {locale === 'ko' ? '선택 모델 상태' : 'Selected model state'}
                    </dt>
                    <dd>{displayPortfolio.selectedModel.statusLabel}</dd>
                    <dd>{displayPortfolio.selectedModel.statusDescription}</dd>
                  </div>
                  <div className="grid gap-1 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
                    <dt className="font-semibold text-invest-text">
                      {locale === 'ko' ? '선택 참조 정보' : 'Selection reference'}
                    </dt>
                    <dd>{displayPortfolio.selectedModel.selectionPublicId}</dd>
                    <dd>{displayPortfolio.selectedModel.modelPublicId}</dd>
                    <dd>{displayPortfolio.selectedModel.selectedAtLabel}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RiskBadge>{displayPortfolio.selectedModel.versionLabel}</RiskBadge>
                  <RiskBadge tone="high">
                    {displayPortfolio.selectedModel.riskLabel}
                  </RiskBadge>
                  <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                    {displayPortfolio.mockDeposit.sourceLabel}
                  </span>
                </div>
                <ModelSelectionReadStatus
                  copy={modelSelectionReadStatusCopy[locale]}
                />
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.positionTitle}
            description={copy.positionDescription}
          />
          <div
            role="list"
            aria-label={copy.positionTitle}
            className="space-y-2.5 rounded-invest-control bg-invest-bg-soft p-1.5"
          >
            {hasPositions ? (
              displayPortfolio.positions.map((position, index) => {
                const positionAccessibleLabel = portfolioPositionAccessibleLabel(
                  locale,
                  position
                );

                return (
                  <article
                    key={position.symbol}
                    role="listitem"
                    aria-label={positionAccessibleLabel}
                    title={positionAccessibleLabel}
                    className={cn(
                      'group rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus-within:border-invest-primary/40',
                      investMotionClass.interactiveCard
                    )}
                  >
                  <div
                    className={cn(
                      'mb-3 h-1.5 rounded-full',
                      positionAccentClass[index % positionAccentClass.length]
                    )}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-[13px] font-bold text-invest-primary shadow-invest-card transition-[background-color,transform] duration-200 ease-out group-hover:scale-[1.03] group-hover:bg-invest-primary-soft group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                        {position.symbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-[17px] font-semibold leading-6 text-invest-text">
                          {position.symbol}
                        </h3>
                        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-invest-text-muted">
                          {position.name}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-invest-control px-2 py-1 text-right transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-bg-soft group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active:scale-100">
                      <p className="text-[15px] font-bold leading-5 text-invest-text transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                        {position.weightLabel}
                      </p>
                      <p className="mt-1 text-xs leading-4 text-invest-text-muted">
                        {position.valueLabel}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold leading-4 text-invest-primary">
                        {position.quantityLabel}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-invest-surface-muted">
                    <div
                      className="h-full origin-left rounded-full bg-invest-primary transition-[transform,width] duration-200 ease-out group-hover:scale-y-110 group-active:scale-y-95 motion-reduce:transition-none motion-reduce:group-active:scale-y-100 motion-reduce:group-hover:scale-y-100"
                      style={{
                        width: `${parseWeightPercent(position.weightLabel)}%`
                      }}
                    />
                  </div>
                  <div className="mt-3 grid gap-2 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                    <RiskBadge
                      tone="neutral"
                      className="justify-center text-center transition-transform duration-200 ease-out group-hover:scale-[1.01] group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                    >
                      {position.stateLabel}
                    </RiskBadge>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                        {position.sourceLabel}
                      </span>
                      <RiskBadge tone="medium">
                        {locale === 'ko' ? '관찰 데이터' : 'observed data'}
                      </RiskBadge>
                    </div>
                  </div>
                  </article>
                );
              })
            ) : (
              <PortfolioEmptyStateCard
                ariaLabel={positionEmptyAccessibleLabel}
                title={copy.positionEmptyTitle}
                description={copy.positionEmptyDescription}
                ctaLabel={copy.emptyCtaLabel}
                safetyLine={copy.emptySafetyLine}
              />
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.decisionTitle}
            description={copy.decisionDescription}
          />
          <article
            aria-label={decisionAccessibleLabel}
            title={decisionAccessibleLabel}
            className={cn(
              'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
              investMotionClass.interactiveCard
            )}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                <Database aria-hidden className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="grid gap-2 rounded-invest-control bg-invest-bg-soft p-2 min-[360px]:grid-cols-3">
                  <RiskBadge tone="low">
                    {displayPortfolio.allocationDecision.statusLabel}
                  </RiskBadge>
                  <span className="rounded-invest-control bg-invest-surface px-2 py-1 text-center text-[12px] font-semibold leading-5 text-invest-text-muted">
                    {displayPortfolio.allocationDecision.sourceLabel}
                  </span>
                  <RiskBadge tone="medium">
                    {displayPortfolio.allocationDecision.generatedAtLabel}
                  </RiskBadge>
                </div>
                <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-3 py-2.5 text-sm leading-6 text-invest-text-muted">
                  {displayPortfolio.allocationDecision.rationale}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div
          aria-label={blockedActionsAccessibleLabel}
          title={blockedActionsAccessibleLabel}
          className={cn(
            'rounded-invest-card border border-invest-risk/15 bg-invest-surface p-invest-card-padding shadow-invest-card',
            investMotionClass.interactiveCard
          )}
        >
          <div className="mb-3 h-1.5 rounded-full bg-invest-risk" />
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-risk-soft text-invest-risk">
              <ShieldAlert aria-hidden className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-3 text-sm font-semibold leading-5 text-invest-text">
                {copy.blockedActionsTitle}
                <span className="shrink-0 rounded-full bg-invest-risk-soft px-2 py-1 text-[11px] font-bold leading-4 text-invest-risk">
                  {displayPortfolio.tradeIntent.boundaryLabel}
                </span>
              </p>
              <div
                aria-label={tradeIntentSafetyBadgeLabel}
                title={tradeIntentSafetyBadgeLabel}
                className="mt-3 flex flex-wrap gap-1.5"
              >
                {tradeIntentSafetyBadges.map((badge) => (
                  <RiskBadge key={badge} tone="blocked">
                    {badge}
                  </RiskBadge>
                ))}
              </div>
              <div
                aria-label="TradeIntent top read-only summary"
                title="TradeIntent top read-only summary"
                className="mt-3 grid gap-2 rounded-invest-control border border-invest-risk/10 bg-invest-bg-soft p-2 min-[370px]:grid-cols-3"
              >
                {tradeIntentTopSummaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-invest-control bg-invest-surface px-2.5 py-2"
                  >
                    <p className="text-[11px] font-bold uppercase leading-4 text-invest-text-muted">
                      {item.label}
                    </p>
                    <RiskBadge
                      tone={item.tone}
                      className="mt-1 max-w-full justify-center text-center"
                    >
                      {item.value}
                    </RiskBadge>
                    <p className="mt-1 text-[12px] font-semibold leading-5 text-invest-text-muted">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-bg-soft p-2 min-[360px]:grid-cols-2">
                <div className="rounded-invest-control border border-invest-risk/10 bg-invest-risk-soft/55 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-invest-text-muted">
                    {locale === 'ko' ? '차단 상태' : 'Blocked'}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                    {displayPortfolio.tradeIntent.blockedActions.length}
                    {locale === 'ko' ? '개 기능' : ' actions'}
                  </p>
                </div>
                <div className="rounded-invest-control border border-invest-primary/10 bg-invest-primary-soft/50 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-invest-text-muted">
                    {locale === 'ko' ? '연결 상태' : 'Connection'}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                    {displayPortfolio.tradeIntent.boundaryLabel}
                  </p>
                </div>
              </div>
              <div
                role="list"
                aria-label="TradeIntent read-only simulated blocked detail"
                title="TradeIntent read-only simulated blocked detail"
                className="mt-3 grid gap-2 rounded-invest-control border border-invest-border bg-invest-surface p-2"
              >
                {tradeIntentDetailRows.map((row) => (
                  <div
                    key={row.label}
                    role="listitem"
                    className="grid min-h-invest-touch-target gap-2 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 min-[360px]:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase leading-4 text-invest-text-muted">
                        {row.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-invest-text">
                        {row.detail}
                      </p>
                    </div>
                    <RiskBadge
                      tone={row.tone}
                      className="justify-center text-center"
                    >
                      {row.value}
                    </RiskBadge>
                  </div>
                ))}
              </div>
              <div
                role="list"
                aria-label={blockedActionsAccessibleLabel}
                title={blockedActionsAccessibleLabel}
                className="mt-3 space-y-1 rounded-invest-control bg-invest-risk-soft/40 p-2 text-[12px] font-semibold leading-5 text-invest-danger"
              >
                {hasBlockedActions ? (
                  displayPortfolio.tradeIntent.blockedActions.map((action) => (
                    <span
                      key={action}
                      role="listitem"
                      aria-label={portfolioBlockedActionAccessibleLabel(
                        locale,
                        action
                      )}
                      title={portfolioBlockedActionAccessibleLabel(
                        locale,
                        action
                      )}
                    >
                      {action}
                    </span>
                  ))
                ) : (
                  <span
                    role="listitem"
                    aria-label={blockedActionsEmptyAccessibleLabel}
                    title={blockedActionsEmptyAccessibleLabel}
                  >
                    {copy.blockedActionsEmptyDescription}
                  </span>
                )}
              </div>
              <p
                aria-label={
                  locale === 'ko'
                    ? '포트폴리오 모의 요약 안전 경계'
                    : 'Portfolio mock summary safety boundaries'
                }
                title={
                  locale === 'ko'
                    ? '포트폴리오 모의 요약 안전 경계'
                    : 'Portfolio mock summary safety boundaries'
                }
                className="mt-3 rounded-invest-control border border-invest-risk/10 bg-invest-surface px-2 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted"
              >
                {[...blockedVisibleBoundaries, safetyMetaLine].join(' / ')}
              </p>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {copy.footer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
