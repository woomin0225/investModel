import { Activity, Bell, Radio, ShieldAlert } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { investModelSignalsMock } from '@/lib/mock/invest-model-signals';

const signalToneClass = {
  low: 'bg-invest-positive-soft text-invest-positive',
  medium: 'bg-invest-warning-soft text-[#966300]',
  high: 'bg-invest-risk-soft text-invest-risk'
} as const;

const badgeToneByScore = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

export default function InvestModelSignalsPage() {
  const { summary, filters, signals } = investModelSignalsMock;

  return (
    <MobileShell
      activeTab="signals"
      eyebrow="Realtime"
      title="Signals"
      trailing={
        <button
          type="button"
          aria-label="Signal alerts"
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
        >
          <Bell aria-hidden className="size-5" />
        </button>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow="Mock monitor"
          title={summary.title}
          description={summary.description}
          icon={Radio}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label="Active feed"
            value={summary.activeCountLabel}
            description="Observed mock inputs"
            trend="sample"
          />
          <MetricCard
            label="Latency"
            value={summary.latencyLabel}
            description="Not a live market feed"
            trend="mock"
          />
        </div>

        <MetricCard
          label="Execution status"
          value={summary.blockedLabel}
          description="Signals do not execute orders or create live TradeIntent records in this MVP."
          trend="blocked"
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title="Signal ranking"
            description="News, trend, and risk inputs for approved mock models."
          />

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="min-h-invest-touch-target rounded-invest-control border border-invest-border bg-invest-surface px-3 text-sm font-semibold text-invest-text shadow-invest-card"
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
                className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-invest-control text-[15px] font-bold ${signalToneClass[signal.scoreTone]}`}
                  >
                    {signal.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 text-[17px] font-semibold leading-6 text-invest-text">
                        {signal.title}
                      </h3>
                      <RiskBadge tone={badgeToneByScore[signal.scoreTone]}>
                        {signal.scoreLabel}
                      </RiskBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                      {signal.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RiskBadge>{signal.sourceLabel}</RiskBadge>
                      <RiskBadge>{signal.marketLabel}</RiskBadge>
                      <RiskBadge tone="medium">{signal.freshnessLabel}</RiskBadge>
                      <RiskBadge tone="neutral">
                        {signal.linkedModelName}
                      </RiskBadge>
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-invest-control bg-invest-surface-muted p-3">
                      <Activity
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-invest-primary"
                      />
                      <p className="text-sm leading-5 text-invest-text-muted">
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
                <RiskBadge tone="blocked">No recommendation</RiskBadge>
                <RiskBadge tone="medium">Mock data</RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                Signal rankings are prototype observations for screen
                development. They are not investment advice, model performance
                claims, or instructions to buy or sell securities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
