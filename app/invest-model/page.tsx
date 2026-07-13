import { Bell, Radio, Search } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { investModelHomeMock } from '@/lib/mock/invest-model-home';

export default function InvestModelPreviewPage() {
  const { account, activeModel, signal, timeline } = investModelHomeMock;

  return (
    <MobileShell
      activeTab="home"
      eyebrow="Mock home"
      title="My AI Investment"
      trailing={
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search models"
            className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
          >
            <Search aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
          >
            <Bell aria-hidden className="size-5" />
          </button>
        </div>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow="Simulation"
          title={signal.title}
          description={signal.description}
          icon={Radio}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label="Mock balance"
            value={account.mockBalanceLabel}
            description={account.balanceDescription}
            trend="mock"
          />
          <MetricCard
            label="Backtest move"
            value={account.backtestReturnLabel}
            description={account.returnDescription}
            trend="sample"
            tone="positive"
          />
        </div>

        <MetricCard
          label="Policy status"
          value={account.policyStatusLabel}
          description={account.policyDescription}
          trend="blocked"
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title="Active model"
            description="Model-defined mandate, not user preference."
            actionLabel="View"
          />
          <ModelCard
            name={activeModel.name}
            summary={activeModel.summary}
            market={activeModel.market}
            riskLabel={activeModel.riskLabel}
            riskTone="high"
            performanceLabel={activeModel.performanceLabel}
            mandateLabel={activeModel.mandateLabel}
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title="Latest activity"
            description="Mock signal and policy events."
          />
          <div className="space-y-3">
            {timeline.map((item) => (
              <article
                key={`${item.time}-${item.title}`}
                className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
              >
                <div className="flex items-start gap-3">
                  <RiskBadge>{item.time}</RiskBadge>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-6 text-invest-text">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex flex-wrap gap-2">
            <RiskBadge tone="blocked">No live orders</RiskBadge>
            <RiskBadge>{signal.source}</RiskBadge>
            <RiskBadge tone="medium">{signal.status}</RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            This home screen is a mobile MVP mock. Deposits, portfolio values,
            returns, signals, and TradeIntent states are placeholders for UI
            development only.
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
