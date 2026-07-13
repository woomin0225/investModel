import { Filter, Search } from 'lucide-react';
import {
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  discoverableInvestmentModels,
  investModelDiscoveryMock
} from '@/lib/mock/invest-model-discovery';

const riskToneByModel = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

export default function InvestModelDiscoveryPage() {
  return (
    <MobileShell
      activeTab="models"
      eyebrow="Discover"
      title="AI Models"
      trailing={
        <button
          type="button"
          aria-label="Search approved models"
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
        >
          <Search aria-hidden className="size-5" />
        </button>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow="Model marketplace"
          title={investModelDiscoveryMock.notice.title}
          description={investModelDiscoveryMock.notice.description}
          icon={Filter}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title="Explore models"
            description={`${discoverableInvestmentModels.length} live or approved mock models`}
          />

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {investModelDiscoveryMock.filters.map((filter) => (
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
            {discoverableInvestmentModels.map((model) => (
              <div key={model.id} className="space-y-2">
                <ModelCard
                  name={model.name}
                  summary={model.summary}
                  market={model.market}
                  riskLabel={model.riskLabel}
                  riskTone={riskToneByModel[model.riskTone]}
                  performanceLabel={model.performanceLabel}
                  mandateLabel={model.mandateLabel}
                />
                <div className="flex flex-wrap gap-2 px-1">
                  <RiskBadge>{model.reviewLabel}</RiskBadge>
                  <RiskBadge tone="low">{model.simulatedAumLabel}</RiskBadge>
                  {model.tags.map((tag) => (
                    <RiskBadge key={`${model.id}-${tag}`} tone="neutral">
                      {tag}
                    </RiskBadge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex flex-wrap gap-2">
            <RiskBadge tone="blocked">No live trading</RiskBadge>
            <RiskBadge>Approved only</RiskBadge>
            <RiskBadge tone="medium">Backtest mock</RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            Hidden review models remain in mock data but are filtered out of
            this public discovery screen. Users cannot change investment
            preferences here; each model carries its own mandate.
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
