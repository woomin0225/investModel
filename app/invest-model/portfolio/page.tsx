import {
  BriefcaseBusiness,
  Clock3,
  Database,
  ShieldAlert,
  WalletCards
} from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  NotificationAction,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { resolveInvestModelLocale } from '@/lib/i18n/invest-model';
import { investModelPortfolioMock } from '@/lib/mock/invest-model-portfolio';
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
  const portfolio = investModelPortfolioMock;

  return (
    <MobileShell
      activeTab="portfolio"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/portfolio"
      trailing={
        <NotificationAction locale={locale} label={copy.alertLabel} />
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
          <div
            role="list"
            aria-label="Mock time dashboard"
            className="grid grid-cols-3 gap-2 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {portfolio.timeSnapshots.map((snapshot) => (
              <article
                key={snapshot.rangeLabel}
                role="listitem"
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
                <div className="mt-2">
                  <RiskBadge tone="blocked">{snapshot.safetyLabel}</RiskBadge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.selectedModelTitle}
            description={copy.selectedModelDescription}
          />
          <article
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
            {portfolio.positions.map((position, index) => (
              <article
                key={position.symbol}
                role="listitem"
                aria-label={`${position.symbol} ${position.weightLabel} ${position.valueLabel}`}
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
            ))}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.decisionTitle}
            description={copy.decisionDescription}
          />
          <article
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
                aria-label={copy.blockedActionsTitle}
                className="mt-3 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-risk-soft/40 p-2"
              >
                {portfolio.tradeIntent.blockedActions.map((action) => (
                  <span key={action} role="listitem">
                    <RiskBadge tone="blocked">{action}</RiskBadge>
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
