import Link from 'next/link';
import { Filter, Scale, Search } from 'lucide-react';
import {
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  getInvestmentModelStatusDisplay,
  investModelDiscoveryFilterIds,
  isPublicDiscoverableInvestmentModel,
  investModelCopy,
  matchesInvestModelDiscoveryFilter,
  resolveInvestModelDiscoveryFilter,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';

const riskToneByModel = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

const compareCtaCopy = {
  ko: {
    label: '모델 비교',
    description: '성과, 위험, 변동성, 손실 구간을 함께 비교합니다.'
  },
  en: {
    label: 'Compare models',
    description: 'Compare returns, risk, volatility, and drawdown together.'
  }
} as const;

function getDiscoveryFilterHref(
  filterId: string,
  locale: 'ko' | 'en'
) {
  const basePath = withInvestModelLocale('/invest-model/models', locale);

  if (filterId === 'all') {
    return basePath;
  }

  return `${basePath}${locale === 'en' ? '&' : '?'}filter=${filterId}`;
}

type InvestModelDiscoveryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestModelDiscoveryPage({
  searchParams
}: InvestModelDiscoveryPageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const selectedFilter = resolveInvestModelDiscoveryFilter(
    resolvedSearchParams?.filter
  );
  const copy = investModelCopy[locale];
  const modelsCopy = copy.models;
  const discoverableInvestmentModels = modelsCopy.models.filter(
    isPublicDiscoverableInvestmentModel
  );
  const filteredInvestmentModels = discoverableInvestmentModels.filter((model) =>
    matchesInvestModelDiscoveryFilter(model, selectedFilter)
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

          <Link
            href={withInvestModelLocale('/invest-model/models/compare', locale)}
            className="flex min-h-invest-touch-target items-center gap-3 rounded-invest-card border border-invest-border bg-invest-surface p-3 text-invest-text shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
              <Scale aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-5">
                {compareCtaCopy[locale].label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-invest-text-muted">
                {compareCtaCopy[locale].description}
              </span>
            </span>
          </Link>

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {investModelDiscoveryFilterIds.map((filterId, index) => {
                const isSelected = selectedFilter === filterId;

                return (
                  <Link
                    key={filterId}
                    href={getDiscoveryFilterHref(filterId, locale)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={[
                      'inline-flex min-h-invest-touch-target items-center rounded-invest-control border px-3 text-sm font-semibold shadow-invest-card',
                      isSelected
                        ? 'border-invest-primary bg-invest-primary text-white'
                        : 'border-invest-border bg-invest-surface text-invest-text'
                    ].join(' ')}
                  >
                    {modelsCopy.filters[index]}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-invest-card-gap">
            {filteredInvestmentModels.map((model) => {
              const statusDisplay = getInvestmentModelStatusDisplay(
                model.status,
                locale
              );
              const modelCard = (
                <ModelCard
                  name={model.name}
                  summary={model.summary}
                  market={model.market}
                  riskLabel={model.riskLabel}
                  riskTone={riskToneByModel[model.riskTone]}
                  statusLabel={statusDisplay.label}
                  statusTone={statusDisplay.tone}
                  performanceLabel={model.performanceLabel}
                  mandateLabel={model.mandateLabel}
                  constraintLabels={model.tags}
                  isSelectionDisabled={statusDisplay.isSelectionDisabled}
                />
              );

              return (
                <div key={model.id} className="space-y-2">
                  {statusDisplay.isSelectionDisabled ? (
                    modelCard
                  ) : (
                    <Link
                      href={withInvestModelLocale(
                        `/invest-model/models/${model.id}`,
                        locale
                      )}
                      className="block rounded-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg"
                    >
                      {modelCard}
                    </Link>
                  )}
                  <div className="flex flex-wrap gap-2 px-1">
                    <RiskBadge>{model.reviewLabel}</RiskBadge>
                    <RiskBadge tone="low">{model.simulatedAumLabel}</RiskBadge>
                  </div>
                </div>
              );
            })}
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
