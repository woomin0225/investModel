import { Bell, BriefcaseBusiness, Database, ShieldAlert, WalletCards } from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
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
        <button
          type="button"
          aria-label={copy.alertLabel}
          className={cn(
            'grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card',
            investMotionClass.interactiveControl
          )}
        >
          <Bell aria-hidden className="size-5" />
        </button>
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
            title={copy.selectedModelTitle}
            description={copy.selectedModelDescription}
          />
          <article
            className={cn(
              'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
              investMotionClass.interactiveCard
            )}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
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
                  <div className="grid gap-1">
                    <dt className="font-semibold text-invest-text">
                      ModelVersion
                    </dt>
                    <dd>{portfolio.selectedModel.versionLabel}</dd>
                    <dd>{portfolio.selectedModel.modelVersionPublicId}</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="font-semibold text-invest-text">
                      Selected model state
                    </dt>
                    <dd>{portfolio.selectedModel.statusLabel}</dd>
                    <dd>{portfolio.selectedModel.statusDescription}</dd>
                  </div>
                  <div className="grid gap-1">
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
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.positionTitle}
            description={copy.positionDescription}
          />
          <div className="space-y-3">
            {portfolio.positions.map((position) => (
              <article
                key={position.symbol}
                className={cn(
                  'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
                  investMotionClass.interactiveCard
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[17px] font-semibold leading-6 text-invest-text">
                        {position.symbol}
                      </h3>
                      <RiskBadge tone="neutral">{position.stateLabel}</RiskBadge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                      {position.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-bold leading-5 text-invest-text">
                      {position.weightLabel}
                    </p>
                    <p className="mt-1 text-xs leading-4 text-invest-text-muted">
                      {position.valueLabel}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RiskBadge>{position.sourceLabel}</RiskBadge>
                  <RiskBadge tone="medium">
                    {locale === 'ko' ? '관찰 데이터' : 'observed data'}
                  </RiskBadge>
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
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
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
                <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                  {portfolio.allocationDecision.rationale}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div
          className={cn(
            'rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding',
            investMotionClass.interactiveCard
          )}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-risk"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-invest-text">
                {copy.blockedActionsTitle}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {portfolio.tradeIntent.blockedActions.map((action) => (
                  <RiskBadge key={action} tone="blocked">
                    {action}
                  </RiskBadge>
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
