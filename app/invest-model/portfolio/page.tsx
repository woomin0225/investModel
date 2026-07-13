import { Bell, BriefcaseBusiness, Database, ShieldAlert, WalletCards } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { resolveInvestModelLocale } from '@/lib/i18n/invest-model';
import { investModelPortfolioMock } from '@/lib/mock/invest-model-portfolio';

type InvestModelPortfolioPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const portfolioCopy = {
  ko: {
    eyebrow: 'Mock 포트폴리오',
    title: '내 포트폴리오',
    alertLabel: '포트폴리오 알림',
    bannerEyebrow: '시뮬레이션 전용',
    bannerTitle: 'MockDeposit 기반 포트폴리오',
    bannerDescription:
      '이 화면은 사용자가 선택한 InvestmentModel, MockDeposit, simulated positions, TradeIntent 상태를 모바일 UI 검증용으로만 보여줍니다.',
    mockBalance: 'MockDeposit',
    mockSafety: '실제 입금/현금 잔고가 아닙니다',
    allocationState: 'AllocationDecision',
    preOrderOnly: '주문 전 시뮬레이션 단계입니다',
    policyState: 'TradeIntent',
    noBrokerage: '브로커 계좌나 주문 실행과 연결되지 않습니다',
    selectedModelTitle: '선택한 InvestmentModel',
    selectedModelDescription:
      '사용자 성향 설정이 아니라 모델이 가진 PortfolioMandate 기준입니다.',
    positionTitle: 'Simulated positions',
    positionDescription:
      '모든 금액과 비중은 mock quote와 정책 검증 결과로 만든 UI 샘플입니다.',
    decisionTitle: '결정 파이프라인',
    decisionDescription:
      'AllocationDecision과 TradeIntent는 실제 주문, 체결, 운용 지시가 아닙니다.',
    blockedActionsTitle: '비활성화된 실제 기능',
    footer:
      '포트폴리오 값, 포지션, TradeIntent는 MVP 화면 개발용 mock 상태입니다. 실제 자산, 투자 조언, 주문, 계좌 연결을 의미하지 않습니다.'
  },
  en: {
    eyebrow: 'Mock portfolio',
    title: 'My Portfolio',
    alertLabel: 'Portfolio alerts',
    bannerEyebrow: 'Simulation only',
    bannerTitle: 'Portfolio from MockDeposit',
    bannerDescription:
      'This screen shows the selected InvestmentModel, MockDeposit, simulated positions, and TradeIntent state for mobile UI validation only.',
    mockBalance: 'MockDeposit',
    mockSafety: 'Not a real deposit or cash balance',
    allocationState: 'AllocationDecision',
    preOrderOnly: 'Pre-order simulation stage only',
    policyState: 'TradeIntent',
    noBrokerage: 'No brokerage account or order execution is connected',
    selectedModelTitle: 'Selected InvestmentModel',
    selectedModelDescription:
      'This is the model-owned PortfolioMandate, not a user preference control.',
    positionTitle: 'Simulated positions',
    positionDescription:
      'All values and weights are UI samples from mock quotes and policy checks.',
    decisionTitle: 'Decision pipeline',
    decisionDescription:
      'AllocationDecision and TradeIntent are not real orders, fills, or operating instructions.',
    blockedActionsTitle: 'Disabled real-world actions',
    footer:
      'Portfolio values, positions, and TradeIntent are mock states for MVP screen development. They are not real assets, advice, orders, or account connections.'
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
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
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
            trend="mock"
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
          <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
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
                className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
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
                  <RiskBadge tone="medium">mock quote</RiskBadge>
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
          <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
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

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
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
