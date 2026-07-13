import { Bell, Search } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  ModelCard,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';

export default function InvestModelPreviewPage() {
  return (
    <MobileShell
      activeTab="home"
      eyebrow="Mobile preview"
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
          eyebrow="Prototype"
          title="Mobile shell is ready"
          description="This preview uses mock-only mobile layout tokens. It does not move real money or place orders."
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label="Mock balance"
            value="$24.8K"
            description="Simulated only"
            trend="+2.4%"
            tone="positive"
          />
          <MetricCard
            label="Risk state"
            value="Review"
            description="No live trading"
            trend="blocked"
            tone="risk"
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title="Active model"
            description="Model-defined mandate, not user preference."
            actionLabel="View"
          />
          <ModelCard
            name="US Momentum AI"
            summary="Tracks US large-cap momentum and pauses when the simulated policy check blocks leverage exposure."
            market="US equities"
            riskLabel="High risk"
            riskTone="high"
            performanceLabel="Backtest"
            mandateLabel="Model mandate"
          />
        </div>
      </section>
    </MobileShell>
  );
}
