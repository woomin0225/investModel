import Link from 'next/link';
import { Filter, Search } from 'lucide-react';
import {
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';

const riskToneByModel = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

type InvestModelDiscoveryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestModelDiscoveryPage({
  searchParams
}: InvestModelDiscoveryPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = investModelCopy[locale];
  const modelsCopy = copy.models;
  const discoverableInvestmentModels = modelsCopy.models.filter((model) =>
    ['approved', 'live'].includes(model.status)
  );

  return (
    <MobileShell
      activeTab="models"
      eyebrow={modelsCopy.eyebrow}
      title={modelsCopy.title}
      locale={locale}
      currentPath="/invest-model/models"
      trailing={
        <button
          type="button"
          aria-label={copy.actions.searchApprovedModels}
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
        >
          <Search aria-hidden className="size-5" />
        </button>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={modelsCopy.bannerEyebrow}
          title={modelsCopy.notice.title}
          description={modelsCopy.notice.description}
          icon={Filter}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={modelsCopy.sectionTitle}
            description={
              locale === 'ko'
                ? `${discoverableInvestmentModels.length}${modelsCopy.liveApprovedCount}`
                : `${discoverableInvestmentModels.length} ${modelsCopy.liveApprovedCount}`
            }
          />

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {modelsCopy.filters.map((filter) => (
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
                <Link
                  href={withInvestModelLocale(
                    `/invest-model/models/${model.id}`,
                    locale
                  )}
                  className="block rounded-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg"
                >
                  <ModelCard
                    name={model.name}
                    summary={model.summary}
                    market={model.market}
                    riskLabel={model.riskLabel}
                    riskTone={riskToneByModel[model.riskTone]}
                    performanceLabel={model.performanceLabel}
                    mandateLabel={model.mandateLabel}
                  />
                </Link>
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
            <RiskBadge tone="blocked">
              {modelsCopy.footerBadges.noLiveTrading}
            </RiskBadge>
            <RiskBadge>{modelsCopy.footerBadges.approvedOnly}</RiskBadge>
            <RiskBadge tone="medium">
              {modelsCopy.footerBadges.backtestMock}
            </RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {modelsCopy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
