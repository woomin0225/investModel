import {
  BriefcaseBusiness,
  Clock3,
  Database,
  ShieldAlert,
  WalletCards
} from 'lucide-react';
import { NextRequest } from 'next/server';

import { GET as readPortfolioMockSummary } from '@/app/api/portfolio/mock-summary/route';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  RiskBadge,
  SectionHeader,
  SearchAndNotificationActions,
  SoftBanner
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
      '선택한 InvestmentModel의 운용 범위 안에서 구성된 포트폴리오 상태를 보여줍니다.',
    mockBalance: '운용금액',
    mockSafety: '시뮬레이션 기준, 실제 계좌와 분리',
    allocationState: 'AllocationDecision',
    preOrderOnly: '주문 전 시뮬레이션 단계입니다',
    policyState: 'TradeIntent',
    noBrokerage: '브로커 계좌나 주문 실행과 연결되지 않습니다',
    selectedModelTitle: '선택한 InvestmentModel',
    selectedModelDescription:
      '사용자 성향 설정이 아니라 모델이 가진 PortfolioMandate 기준입니다.',
    positionTitle: '구성 비중',
    positionDescription:
      '모든 금액과 비중은 관찰 데이터와 정책 검증 결과로 계산된 시뮬레이션입니다.',
    decisionTitle: '결정 파이프라인',
    decisionDescription:
      'AllocationDecision과 TradeIntent는 실제 주문, 체결, 운용 지시가 아닙니다.',
    blockedActionsTitle: '비활성화된 실제 기능',
    footer:
      '포트폴리오 값, 포지션, TradeIntent는 실제 자산, 투자 조언, 주문, 계좌 연결을 의미하지 않습니다.'
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
    footer:
      'Portfolio values, positions, and TradeIntent are not real assets, advice, orders, or account connections.'
  }
} as const;

function parseWeightPercent(weightLabel: string) {
  const parsed = Number.parseInt(weightLabel, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : 0;
}

function portfolioSelectedModelAccessibleLabel(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return `선택된 InvestmentModel: ${portfolio.selectedModel.name}. ${portfolio.selectedModel.statusLabel}. ${portfolio.selectedModel.mandateLabel}. ModelVersion ${portfolio.selectedModel.versionLabel}. DB-backed mock summary이며 사용자 투자성향 설정, 실제 계좌, 주문, 브로커 동작, 투자 조언이 아닙니다.`;
  }

  return `Selected InvestmentModel: ${portfolio.selectedModel.name}. ${portfolio.selectedModel.statusLabel}. ${portfolio.selectedModel.mandateLabel}. ModelVersion ${portfolio.selectedModel.versionLabel}. DB-backed mock summary; not a user preference setting, real account, order, brokerage action, or investment advice.`;
}

function portfolioPositionAccessibleLabel(
  locale: 'ko' | 'en',
  position: InvestModelPortfolioSummary['positions'][number]
) {
  if (locale === 'ko') {
    return `${position.symbol} 포지션. ${position.name}. ${position.weightLabel}, ${position.valueLabel}. ${position.stateLabel}. ${position.sourceLabel}. 시뮬레이션 allocation mix이며 실제 보유 종목, 실잔고, 주문 지시, 투자 조언이 아닙니다.`;
  }

  return `${position.symbol} position. ${position.name}. ${position.weightLabel}, ${position.valueLabel}. ${position.stateLabel}. ${position.sourceLabel}. Simulated allocation mix; not a real holding, real balance, order instruction, or investment advice.`;
}

function portfolioDecisionAccessibleLabel(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return `AllocationDecision: ${portfolio.allocationDecision.statusLabel}. ${portfolio.allocationDecision.sourceLabel}. ${portfolio.allocationDecision.generatedAtLabel}. ${portfolio.allocationDecision.rationale}. simulation-only 결정 파이프라인이며 실제 주문, 체결, 브로커 동작, 투자 조언이 아닙니다.`;
  }

  return `AllocationDecision: ${portfolio.allocationDecision.statusLabel}. ${portfolio.allocationDecision.sourceLabel}. ${portfolio.allocationDecision.generatedAtLabel}. ${portfolio.allocationDecision.rationale}. Simulation-only decision pipeline; not a real order, fill, brokerage action, or investment advice.`;
}

function portfolioBlockedActionsAccessibleLabel(
  locale: 'ko' | 'en',
  portfolio: InvestModelPortfolioSummary
) {
  if (locale === 'ko') {
    return `TradeIntent 차단 상태. ${portfolio.tradeIntent.boundaryLabel}. ${portfolio.tradeIntent.blockedActions.length}개 실제 기능 비활성화. 실제 입금, 실계좌 연결, 주문 실행, 브로커 동작, 투자 조언이 연결되지 않았습니다.`;
  }

  return `TradeIntent blocked state. ${portfolio.tradeIntent.boundaryLabel}. ${portfolio.tradeIntent.blockedActions.length} real-world actions disabled. No real deposit, account connection, order execution, brokerage action, or investment advice is connected.`;
}

function portfolioBlockedActionAccessibleLabel(
  locale: 'ko' | 'en',
  action: string
) {
  if (locale === 'ko') {
    return `차단된 실제 기능: ${action}. Portfolio mock summary에서는 실행되지 않습니다.`;
  }

  return `Blocked real-world action: ${action}. It is not executed in the Portfolio mock summary.`;
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
      'DB mock summary',
      'time-window snapshot',
      'sample/backtest 지표',
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
  const selectedModelAccessibleLabel = portfolioSelectedModelAccessibleLabel(
    locale,
    portfolio
  );
  const decisionAccessibleLabel = portfolioDecisionAccessibleLabel(
    locale,
    portfolio
  );
  const blockedActionsAccessibleLabel = portfolioBlockedActionsAccessibleLabel(
    locale,
    portfolio
  );
  const blockedVisibleBoundaries = portfolioBlockedVisibleBoundaries(locale);
  const timeDashboardVisibleBoundaries =
    portfolioTimeDashboardVisibleBoundaries(locale);

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
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={WalletCards}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={copy.mockBalance}
            value={portfolio.mockDeposit.amountLabel}
            description={copy.mockSafety}
            trend={portfolio.mockDeposit.statusLabel}
          />
          <MetricCard
            label={copy.allocationState}
            value={portfolio.allocationDecision.statusLabel}
            description={copy.preOrderOnly}
            trend={locale === 'ko' ? '시뮬레이션' : 'simulation'}
            tone="positive"
          />
        </div>

        <MetricCard
          label={copy.policyState}
          value={portfolio.tradeIntent.statusLabel}
          description={copy.noBrokerage}
          trend={portfolio.tradeIntent.boundaryLabel}
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={
              locale === 'ko' ? 'Mock time dashboard' : 'Mock time dashboard'
            }
            description={
              locale === 'ko'
                ? '1D, 1W, 1M 상태는 시뮬레이션 checkpoint이며 실제 수익률이나 계좌 성과가 아닙니다.'
                : '1D, 1W, and 1M states are simulated checkpoints, not real returns or account performance.'
            }
          />
          <div className="flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-3 py-2">
            {timeDashboardVisibleBoundaries.map((boundary) => (
              <RiskBadge key={boundary} tone="neutral">
                {boundary}
              </RiskBadge>
            ))}
          </div>
          <div
            role="list"
            aria-label="Mock time dashboard"
            className="grid grid-cols-3 gap-2 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {portfolio.timeSnapshots.map((snapshot) => {
              const snapshotStateLabel = `${snapshot.rangeLabel} ${snapshot.valueLabel}. ${snapshot.checkpointLabel}. ${snapshot.signalLabel}. ${snapshot.safetyLabel}. Mock-only checkpoint; not a real return, real balance, order, or brokerage data.`;

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
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <RiskBadge tone="neutral">DB snapshot</RiskBadge>
                    <RiskBadge>mock-only checkpoint</RiskBadge>
                    <RiskBadge tone="blocked">{snapshot.safetyLabel}</RiskBadge>
                  </div>
                </article>
              );
            })}
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
                    {portfolio.selectedModel.name}
                  </h2>
                  <RiskBadge tone="low">
                    {portfolio.selectedModel.statusLabel}
                  </RiskBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                  {portfolio.selectedModel.mandateLabel}
                </p>
                <dl className="mt-3 grid gap-2 text-xs leading-5 text-invest-text-muted">
                  <div className="grid gap-1 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
                    <dt className="font-semibold text-invest-text">
                      ModelVersion
                    </dt>
                    <dd>{portfolio.selectedModel.versionLabel}</dd>
                    <dd>{portfolio.selectedModel.modelVersionPublicId}</dd>
                  </div>
                  <div className="grid gap-1 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
                    <dt className="font-semibold text-invest-text">
                      Selected model state
                    </dt>
                    <dd>{portfolio.selectedModel.statusLabel}</dd>
                    <dd>{portfolio.selectedModel.statusDescription}</dd>
                  </div>
                  <div className="grid gap-1 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
                    <dt className="font-semibold text-invest-text">
                      Selection reference
                    </dt>
                    <dd>{portfolio.selectedModel.selectionPublicId}</dd>
                    <dd>{portfolio.selectedModel.modelPublicId}</dd>
                    <dd>{portfolio.selectedModel.selectedAtLabel}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RiskBadge>{portfolio.selectedModel.versionLabel}</RiskBadge>
                  <RiskBadge tone="high">
                    {portfolio.selectedModel.riskLabel}
                  </RiskBadge>
                  <RiskBadge>{portfolio.mockDeposit.sourceLabel}</RiskBadge>
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
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {portfolio.positions.map((position, index) => {
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
                      <RiskBadge>{position.sourceLabel}</RiskBadge>
                      <RiskBadge tone="medium">
                        {locale === 'ko' ? '관찰 데이터' : 'observed data'}
                      </RiskBadge>
                    </div>
                  </div>
                </article>
              );
            })}
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
                    {portfolio.allocationDecision.statusLabel}
                  </RiskBadge>
                  <RiskBadge>
                    {portfolio.allocationDecision.sourceLabel}
                  </RiskBadge>
                  <RiskBadge tone="medium">
                    {portfolio.allocationDecision.generatedAtLabel}
                  </RiskBadge>
                </div>
                <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-3 py-2.5 text-sm leading-6 text-invest-text-muted">
                  {portfolio.allocationDecision.rationale}
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
                  {portfolio.tradeIntent.boundaryLabel}
                </span>
              </p>
              <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-bg-soft p-2 min-[360px]:grid-cols-2">
                <div className="rounded-invest-control border border-invest-risk/10 bg-invest-risk-soft/55 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-invest-text-muted">
                    {locale === 'ko' ? '차단 상태' : 'Blocked'}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                    {portfolio.tradeIntent.blockedActions.length}
                    {locale === 'ko' ? '개 기능' : ' actions'}
                  </p>
                </div>
                <div className="rounded-invest-control border border-invest-primary/10 bg-invest-primary-soft/50 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-invest-text-muted">
                    {locale === 'ko' ? '연결 상태' : 'Connection'}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-5 text-invest-text">
                    {portfolio.tradeIntent.boundaryLabel}
                  </p>
                </div>
              </div>
              <div
                role="list"
                aria-label={blockedActionsAccessibleLabel}
                title={blockedActionsAccessibleLabel}
                className="mt-3 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-risk-soft/40 p-2"
              >
                {portfolio.tradeIntent.blockedActions.map((action) => (
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
                    <RiskBadge tone="blocked">{action}</RiskBadge>
                  </span>
                ))}
              </div>
              <div
                role="list"
                aria-label={
                  locale === 'ko'
                    ? 'Portfolio mock summary 안전 경계'
                    : 'Portfolio mock summary safety boundaries'
                }
                className="mt-3 flex flex-wrap gap-1.5 rounded-invest-control border border-invest-risk/10 bg-invest-surface px-2 py-2"
              >
                {blockedVisibleBoundaries.map((boundary) => (
                  <span key={boundary} role="listitem">
                    <RiskBadge tone="neutral">{boundary}</RiskBadge>
                  </span>
                ))}
              </div>
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
