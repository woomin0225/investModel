import { Clock3, Database, Radio, ShieldCheck } from 'lucide-react';
import { NextRequest } from 'next/server';
import { GET as readPortfolioMockSummary } from '@/app/api/portfolio/mock-summary/route';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelCard,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  SectionHeader,
  SearchAndNotificationActions
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import type { InvestModelPortfolioSummary } from '@/lib/domain/portfolio/portfolio-summary';
import { investModelHomeMock } from '@/lib/mock/invest-model-home';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type InvestModelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const activityAccentClass = [
  'bg-invest-primary',
  'bg-invest-warning',
  'bg-invest-positive'
] as const;

const homeMetricSummaryCopy = {
  ko: {
    balanceLabel: '기준',
    balanceValue: '모의잔고',
    balanceNote: '실계좌 아님',
    moveLabel: '변동',
    moveNote: '백테스트',
    policyLabel: '상태',
    policyNote: '실주문 없음'
  },
  en: {
    balanceLabel: 'Base',
    balanceValue: 'Sim funds',
    balanceNote: 'No account',
    moveLabel: 'Move',
    moveNote: 'Backtest',
    policyLabel: 'Status',
    policyNote: 'No orders'
  }
} as const;

const homeTopSummaryCopy = {
  ko: {
    ariaLabel: '선택 모델과 모의 운용 요약',
    modelLabel: '선택 모델',
    fundsLabel: '모의 금액',
    statusLabel: '안전 상태',
    statusValue: '실제 주문 없음',
    caption:
      'DB 기반 선택 모델과 MockDeposit 모의 금액만 보여주며 실제 계좌, 입금, 주문, 브로커 연결이 아닙니다.'
  },
  en: {
    ariaLabel: 'Selected model and simulation summary',
    modelLabel: 'Selected model',
    fundsLabel: 'Sim funds',
    statusLabel: 'Safety state',
    statusValue: 'No live orders',
    caption:
      'Shows only the DB-backed selected model and MockDeposit simulation amount; not a real account, deposit, order, or brokerage connection.'
  }
} as const;

function homeSafetyBoundaryCopy(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? '이 홈 화면은 DB와 모의 데이터를 기반으로 선택 모델 맥락과 모의 자금을 읽어 보여주는 시뮬레이션 화면입니다. 실계좌, 주문, 브로커 연결, 투자조언으로 동작하지 않습니다.'
    : 'This home screen reads DB/mock read models, selected model context, and MockDeposit funds for simulation only. It is not a real account, order, brokerage connection, or financial advice.';
}

async function readHomePortfolioSummaryRoute(): Promise<InvestModelPortfolioSummary> {
  const response = await readPortfolioMockSummary(
    new NextRequest('http://localhost/api/portfolio/mock-summary', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    throw new Error('Home portfolio summary route read failed.');
  }

  const payload = (await response.json()) as {
    data?: InvestModelPortfolioSummary;
  };

  if (!payload.data) {
    throw new Error('Home portfolio summary route returned no data.');
  }

  return payload.data;
}

export default async function InvestModelPreviewPage({
  searchParams
}: InvestModelPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const copy = investModelCopy[locale];
  const homeCopy = copy.home;
  const portfolio = await readHomePortfolioSummaryRoute();
  const account = {
    mockBalanceLabel: portfolio.mockDeposit.amountLabel,
    backtestReturnLabel:
      portfolio.timeSnapshots[0]?.valueLabel ??
      investModelHomeMock.account.backtestReturnLabel
  };
  const topSummaryCopy = homeTopSummaryCopy[locale];
  const topSummaryAccessibleLabel = `${topSummaryCopy.ariaLabel}: ${portfolio.selectedModel.name}, ${topSummaryCopy.fundsLabel} ${account.mockBalanceLabel}, ${topSummaryCopy.statusValue}.`;
  const metricSummaryCopy = homeMetricSummaryCopy[locale];
  const metricSummaryItems = [
    {
      icon: Database,
      iconClassName: 'bg-invest-surface text-invest-primary',
      label: metricSummaryCopy.balanceLabel,
      value: metricSummaryCopy.balanceValue,
      note: metricSummaryCopy.balanceNote,
      valueClassName: 'text-invest-text'
    },
    {
      icon: Radio,
      iconClassName: 'bg-invest-positive-soft text-invest-positive',
      label: metricSummaryCopy.moveLabel,
      value: account.backtestReturnLabel,
      note: metricSummaryCopy.moveNote,
      valueClassName: 'text-invest-positive'
    },
    {
      icon: ShieldCheck,
      iconClassName: 'bg-invest-risk-soft text-invest-risk',
      label: metricSummaryCopy.policyLabel,
      value: homeCopy.metrics.blocked,
      note: metricSummaryCopy.policyNote,
      valueClassName: 'text-invest-risk'
    }
  ];

  return (
    <MobileShell
      activeTab="home"
      eyebrow={homeCopy.eyebrow}
      title={homeCopy.title}
      locale={locale}
      currentPath="/invest-model"
      trailing={
        <SearchAndNotificationActions
          locale={locale}
          searchLabel={copy.actions.searchModels}
          notificationLabel={copy.actions.notifications}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <div
          aria-label={topSummaryAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card"
        >
          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
                {topSummaryCopy.modelLabel}
              </p>
              <h2 className="mt-1 text-[18px] font-bold leading-6 text-invest-text">
                {portfolio.selectedModel.name}
              </h2>
              <p className="mt-1 text-[12px] font-semibold leading-5 text-invest-text-muted">
                {portfolio.selectedModel.statusLabel}
              </p>
            </div>
            <div className="min-w-[104px] rounded-invest-control bg-invest-bg-soft px-3 py-2 text-right">
              <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
                {topSummaryCopy.fundsLabel}
              </p>
              <p className="mt-1 text-[15px] font-bold leading-5 text-invest-text">
                {account.mockBalanceLabel}
              </p>
            </div>
          </div>
          <div className="mt-3 flex min-w-0 items-start gap-2 rounded-invest-control bg-invest-surface-muted px-3 py-2">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-invest-risk"
            />
            <div className="min-w-0">
              <p className="text-[12px] font-bold leading-5 text-invest-risk">
                {topSummaryCopy.statusValue}
              </p>
              <p className="text-[12px] font-medium leading-5 text-invest-text-muted">
                {topSummaryCopy.caption}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={homeCopy.metrics.mockBalance}
            value={account.mockBalanceLabel}
            description={homeCopy.metrics.simulatedBalanceOnly}
            trend={homeCopy.metrics.mock}
          />
          <MetricCard
            label={homeCopy.metrics.backtestMove}
            value={account.backtestReturnLabel}
            description={homeCopy.metrics.sampleBacktestMovement}
            trend={homeCopy.metrics.sample}
            tone="positive"
          />
        </div>

        <div className="grid gap-2 rounded-invest-card border border-invest-border bg-invest-surface-muted p-2.5 min-[360px]:grid-cols-3">
          {metricSummaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="group flex min-w-0 items-center gap-2 rounded-invest-control bg-invest-surface px-2 py-2 shadow-invest-card transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <div
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-invest-control transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100',
                    item.iconClassName
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold leading-4 text-invest-text-muted">
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      'truncate text-[13px] font-bold leading-5 transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                      item.valueClassName
                    )}
                  >
                    {item.value}
                  </p>
                  <p className="truncate text-[10px] font-semibold leading-4 text-invest-text-subtle">
                    {item.note}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-invest-card-gap">
          <MetricCard
            label={homeCopy.metrics.policyStatus}
            value={homeCopy.metrics.review}
            description={homeCopy.metrics.noLiveTrading}
            trend={homeCopy.metrics.blocked}
            tone="risk"
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={homeCopy.activeModelSection.title}
            description={homeCopy.activeModelSection.description}
            actionLabel={copy.actions.view}
          />
          <ModelCard
            name={portfolio.selectedModel.name}
            summary={portfolio.selectedModel.statusDescription}
            market={portfolio.selectedModel.mandateLabel}
            riskLabel={portfolio.selectedModel.riskLabel}
            riskTone="high"
            performanceLabel={portfolio.selectedModel.versionLabel}
            mandateLabel={portfolio.selectedModel.modelVersionPublicId}
          />
          <p className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-3 text-xs font-medium leading-5 text-invest-text-muted shadow-invest-card">
            {homeSafetyBoundaryCopy(locale)}
          </p>
          <ModelSelectionReadStatus copy={modelSelectionReadStatusCopy[locale]} />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={homeCopy.activitySection.title}
            description={homeCopy.activitySection.description}
          />
          <div
            role="list"
            aria-label={homeCopy.activitySection.title}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {homeCopy.timeline.map((item, index) => {
              const metadata = investModelHomeMock.timeline[index];
              const accentClass =
                activityAccentClass[index % activityAccentClass.length];

              return (
                <article
                  key={`${item.time}-${item.title}`}
                  role="listitem"
                  aria-label={`${item.title} ${item.time}`}
                  className={cn(
                    'group rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus-within:border-invest-primary/40',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div
                    className={cn(
                      'mb-3 h-1.5 origin-left rounded-full transition-transform duration-200 ease-out group-hover:scale-x-105 group-active:scale-x-95 motion-reduce:transition-none motion-reduce:group-hover:scale-x-100 motion-reduce:group-active:scale-x-100',
                      accentClass
                    )}
                  />
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary shadow-invest-card transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-primary group-hover:text-white group-active:scale-95 motion-reduce:transition-none motion-reduce:group-active:scale-100">
                      <Clock3
                        aria-hidden
                        className="size-4 transition-transform duration-200 ease-out group-hover:rotate-6 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                            {metadata?.sourceLabel ?? homeCopy.activitySection.title}
                          </p>
                          <h3 className="mt-1 text-[15px] font-semibold leading-6 text-invest-text">
                            {item.title}
                          </h3>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[12px] font-semibold leading-4 text-invest-text-muted">
                            {item.time}
                          </p>
                          {metadata ? (
                            <p className="mt-2 inline-flex items-center text-[11px] font-semibold leading-4 text-invest-text-muted">
                              <ShieldCheck aria-hidden className="mr-1 inline size-3" />
                              {metadata.statusLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                        {item.description}
                      </p>
                      {metadata ? (
                        <p className="mt-3 flex items-center gap-1.5 rounded-invest-control bg-invest-surface-muted px-2.5 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100">
                          <Database aria-hidden className="size-3 shrink-0" />
                          <span>
                            {metadata.sourceLabel}
                            {' · '}
                            {metadata.statusLabel}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <p className="text-sm leading-6 text-invest-text-muted">
            <span className="font-bold text-invest-text">
              {homeCopy.footerBadges.noLiveOrders}
            </span>
            {' · '}
            {homeCopy.signal.source}
            {' · '}
            {homeCopy.signal.status}
          </p>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            {homeCopy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
