import { Bell, Clock3, Database, Radio, Search, ShieldCheck } from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { investModelHomeMock } from '@/lib/mock/invest-model-home';
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

export default async function InvestModelPreviewPage({
  searchParams
}: InvestModelPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = investModelCopy[locale];
  const homeCopy = copy.home;
  const { account } = investModelHomeMock;
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={copy.actions.searchModels}
            className={cn(
              'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/25',
              investMotionClass.interactiveControl
            )}
          >
            <span
              aria-hidden
              className="absolute inset-1 rounded-[10px] border border-transparent transition-colors duration-200 ease-out group-hover:border-invest-primary/15 group-active:border-invest-primary/30 motion-reduce:transition-none"
            />
            <Search
              aria-hidden
              className="size-5 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
            />
            <span
              aria-hidden
              className="absolute inset-x-3 bottom-1 h-0.5 origin-center scale-x-50 rounded-full bg-invest-text-muted/40 opacity-80 transition-[background-color,transform] duration-200 ease-out group-hover:scale-x-100 group-hover:bg-invest-primary/70 group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-hover:scale-x-50 motion-reduce:group-active:scale-x-50"
            />
          </button>
          <button
            type="button"
            aria-label={copy.actions.notifications}
            className={cn(
              'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-primary/25 bg-invest-primary-soft text-invest-primary shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/30',
              investMotionClass.interactiveControl
            )}
          >
            <Bell
              aria-hidden
              className="size-5 transition-transform duration-200 ease-out group-hover:-rotate-6 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100"
            />
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-invest-risk px-1 text-[10px] font-bold leading-none text-white ring-2 ring-invest-primary-soft"
            >
              2
            </span>
            <span
              aria-hidden
              className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-invest-primary opacity-70 transition-[opacity,transform] duration-200 ease-out group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-active:scale-x-100"
            />
          </button>
        </div>
      }
    >
      <section className="space-y-invest-section-gap">
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
            name={homeCopy.activeModel.name}
            summary={homeCopy.activeModel.summary}
            market={homeCopy.activeModel.market}
            riskLabel={homeCopy.activeModel.riskLabel}
            riskTone="high"
            performanceLabel={homeCopy.activeModel.performanceLabel}
            mandateLabel={homeCopy.activeModel.mandateLabel}
          />
        </div>

        <SoftBanner
          eyebrow={homeCopy.bannerEyebrow}
          title={homeCopy.signal.title}
          description={homeCopy.signal.description}
          icon={Radio}
        />

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
                            <RiskBadge tone="medium" className="mt-2">
                              <ShieldCheck aria-hidden className="mr-1 inline size-3" />
                              {metadata.statusLabel}
                            </RiskBadge>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                        {item.description}
                      </p>
                      {metadata ? (
                        <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-surface-muted p-2 transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                          <RiskBadge className="justify-center text-center">
                            <Database aria-hidden className="mr-1 inline size-3" />
                            {metadata.sourceLabel}
                          </RiskBadge>
                          <span className="inline-flex min-h-7 items-center justify-center rounded-full bg-invest-surface px-2.5 text-center text-[11px] font-semibold leading-4 text-invest-text-muted">
                            {metadata.statusLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex flex-wrap gap-2">
            <RiskBadge tone="blocked">
              {homeCopy.footerBadges.noLiveOrders}
            </RiskBadge>
            <RiskBadge>{homeCopy.signal.source}</RiskBadge>
            <RiskBadge tone="medium">{homeCopy.signal.status}</RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {homeCopy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
