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

export default async function InvestModelPreviewPage({
  searchParams
}: InvestModelPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = investModelCopy[locale];
  const homeCopy = copy.home;
  const { account } = investModelHomeMock;

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
              'grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card',
              investMotionClass.interactiveControl
            )}
          >
            <Search aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label={copy.actions.notifications}
            className={cn(
              'grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card',
              investMotionClass.interactiveControl
            )}
          >
            <Bell aria-hidden className="size-5" />
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
          <div className="space-y-3">
            {homeCopy.timeline.map((item, index) => {
              const metadata = investModelHomeMock.timeline[index];
              const accentClass =
                activityAccentClass[index % activityAccentClass.length];

              return (
                <article
                  key={`${item.time}-${item.title}`}
                  aria-label={`${item.title} ${item.time}`}
                  className={cn(
                    'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div className={cn('mb-3 h-1.5 rounded-full', accentClass)} />
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary shadow-invest-card">
                      <Clock3 aria-hidden className="size-4" />
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
                        <div className="mt-3 grid gap-2 border-t border-invest-border pt-3 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                          <RiskBadge className="justify-center text-center">
                            <Database aria-hidden className="mr-1 inline size-3" />
                            {metadata.sourceLabel}
                          </RiskBadge>
                          <span className="inline-flex min-h-7 items-center justify-center rounded-full bg-invest-surface-muted px-2.5 text-center text-[11px] font-semibold leading-4 text-invest-text-muted">
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
