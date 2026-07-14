import { Activity, Bell, Radio, ShieldAlert } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner,
  investMotionClass
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

const signalToneClass = {
  low: 'bg-invest-positive-soft text-invest-positive',
  medium: 'bg-invest-warning-soft text-[#966300]',
  high: 'bg-invest-risk-soft text-invest-risk'
} as const;

const signalStrengthClass = {
  low: 'bg-invest-positive',
  medium: 'bg-invest-warning',
  high: 'bg-invest-risk'
} as const;

const signalStrengthWidth = {
  low: '46%',
  medium: '68%',
  high: '88%'
} as const;

const badgeToneByScore = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

type InvestModelSignalsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestModelSignalsPage({
  searchParams
}: InvestModelSignalsPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = investModelCopy[locale];
  const signalsCopy = copy.signals;
  const { summary, filters, signals } = signalsCopy;

  return (
    <MobileShell
      activeTab="signals"
      eyebrow={signalsCopy.eyebrow}
      title={signalsCopy.title}
      locale={locale}
      currentPath="/invest-model/signals"
      trailing={
        <button
          type="button"
          aria-label={copy.actions.signalAlerts}
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
          eyebrow={signalsCopy.bannerEyebrow}
          title={summary.title}
          description={summary.description}
          icon={Radio}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={signalsCopy.metrics.activeFeed}
            value={summary.activeCountLabel}
            description={signalsCopy.metrics.observedMockInputs}
            trend={signalsCopy.metrics.sample}
          />
          <MetricCard
            label={signalsCopy.metrics.latency}
            value={summary.latencyLabel}
            description={signalsCopy.metrics.notLiveMarketFeed}
            trend={signalsCopy.metrics.mock}
          />
        </div>

        <MetricCard
          label={signalsCopy.metrics.executionStatus}
          value={summary.blockedLabel}
          description={signalsCopy.metrics.noTradeIntent}
          trend={signalsCopy.metrics.blocked}
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={signalsCopy.sectionTitle}
            description={signalsCopy.sectionDescription}
          />

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={cn(
                    'min-h-invest-touch-target rounded-invest-control border border-invest-border bg-invest-surface px-3 text-sm font-semibold text-invest-text shadow-invest-card',
                    investMotionClass.interactiveControl
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-invest-card-gap">
            {signals.map((signal) => (
              <article
                key={signal.id}
                aria-label={`${signal.title} ${signal.scoreLabel}`}
                className={cn(
                  'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card focus-within:border-invest-primary/40',
                  investMotionClass.interactiveCard
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-invest-control text-[15px] font-bold ${signalToneClass[signal.scoreTone]}`}
                  >
                    {signal.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="min-w-0 text-[17px] font-semibold leading-6 text-invest-text">
                          {signal.title}
                        </h3>
                        <div className="mt-2 grid gap-1.5 min-[360px]:grid-cols-2">
                          <RiskBadge className="justify-center text-center">
                            {signal.sourceLabel}
                          </RiskBadge>
                          <RiskBadge className="justify-center text-center">
                            {signal.marketLabel}
                          </RiskBadge>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <RiskBadge tone={badgeToneByScore[signal.scoreTone]}>
                          {signal.scoreLabel}
                        </RiskBadge>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-invest-surface-muted">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          signalStrengthClass[signal.scoreTone]
                        )}
                        style={{
                          width: signalStrengthWidth[signal.scoreTone]
                        }}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                      {signal.description}
                    </p>
                    <div className="mt-3 grid gap-2 border-t border-invest-border pt-3 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                      <RiskBadge tone="neutral" className="justify-center text-center">
                        {signal.linkedModelName}
                      </RiskBadge>
                      <span className="inline-flex min-h-7 items-center justify-center rounded-full bg-invest-surface-muted px-2.5 text-center text-[11px] font-semibold leading-4 text-invest-text-muted">
                        {signal.freshnessLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex items-start gap-2.5 rounded-invest-control border border-invest-border/70 bg-invest-surface-muted p-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-invest-surface text-invest-primary shadow-invest-card">
                        <Activity aria-hidden className="size-4" />
                      </span>
                      <p className="pt-0.5 text-sm font-semibold leading-5 text-invest-text-muted">
                        {signal.statusLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex items-start gap-3">
            <ShieldAlert
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-risk"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="blocked">
                  {signalsCopy.footerBadges.noRecommendation}
                </RiskBadge>
                <RiskBadge tone="medium">
                  {signalsCopy.footerBadges.mockData}
                </RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {signalsCopy.footer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
