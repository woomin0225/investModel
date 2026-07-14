import Link from 'next/link';
import { ArrowRight, Filter, Scale, Search } from 'lucide-react';
import {
  investMotionClass,
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
import { cn } from '@/lib/utils';

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

const discoverySummaryCopy = {
  ko: {
    shownLabel: '표시 모델',
    shownNote: '선택한 필터',
    reviewLabel: '검토 상태',
    reviewValue: '운영 검토',
    reviewNote: '공개 모델 기준',
    compareLabel: '비교 준비',
    compareValue: '비교 가능',
    compareNote: '수익·위험 함께 보기',
    shownSuffix: '개'
  },
  en: {
    shownLabel: 'Shown',
    shownNote: 'Selected filter',
    reviewLabel: 'Review',
    reviewValue: 'Reviewed',
    reviewNote: 'Public list',
    compareLabel: 'Compare',
    compareValue: 'Ready',
    compareNote: 'Return and risk',
    shownSuffix: ''
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
  const selectedFilterIndex =
    investModelDiscoveryFilterIds.indexOf(selectedFilter);
  const selectedFilterLabel =
    modelsCopy.filters[selectedFilterIndex] ?? modelsCopy.filters[0];
  const summaryCopy = discoverySummaryCopy[locale];
  const modelListLabel =
    locale === 'ko' ? '표시 중인 투자 모델 목록' : 'Shown investment models';
  const discoverySummaryItems = [
    {
      label: summaryCopy.shownLabel,
      value:
        locale === 'ko'
          ? `${filteredInvestmentModels.length}${summaryCopy.shownSuffix}`
          : `${filteredInvestmentModels.length} shown`,
      note: summaryCopy.shownNote
    },
    {
      label: summaryCopy.reviewLabel,
      value: summaryCopy.reviewValue,
      note: summaryCopy.reviewNote
    },
    {
      label: summaryCopy.compareLabel,
      value: summaryCopy.compareValue,
      note: summaryCopy.compareNote
    }
  ];

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
          className={cn(
            'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/25',
            investMotionClass.interactiveControl
          )}
        >
          <span className="absolute inset-1 rounded-[10px] border border-transparent transition-colors duration-200 ease-out group-hover:border-invest-primary/15 group-active:border-invest-primary/30 motion-reduce:transition-none" />
          <Search
            aria-hidden
            className="size-5 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
          />
          <span className="absolute inset-x-3 bottom-1 h-0.5 origin-center scale-x-50 rounded-full bg-invest-text-muted/40 opacity-80 transition-[background-color,transform] duration-200 ease-out group-hover:scale-x-100 group-hover:bg-invest-primary/70 group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-hover:scale-x-50 motion-reduce:group-active:scale-x-50" />
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
            className={cn(
              'flex min-h-invest-touch-target items-center gap-3 rounded-invest-card border border-invest-border bg-invest-surface p-3 text-invest-text shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
              investMotionClass.interactiveCard
            )}
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
            <span className="hidden shrink-0 rounded-full bg-invest-primary-soft px-2 py-1 text-[11px] font-bold leading-4 text-invest-primary min-[360px]:inline-flex">
              {locale === 'ko' ? '정보 비교' : 'Compare'}
            </span>
            <ArrowRight
              aria-hidden
              className="size-4 shrink-0 text-invest-text-muted"
            />
          </Link>

          <div className="space-y-2">
            <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
              <div className="flex w-max gap-2 pr-invest-screen-x">
                {investModelDiscoveryFilterIds.map((filterId, index) => {
                  const isSelected = selectedFilter === filterId;

                  return (
                    <Link
                      key={filterId}
                      href={getDiscoveryFilterHref(filterId, locale)}
                      aria-current={isSelected ? 'true' : undefined}
                      aria-pressed={isSelected}
                      className={cn(
                        'inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control border px-3 text-sm font-semibold shadow-invest-card',
                        investMotionClass.interactiveControl,
                        isSelected
                          ? 'border-invest-primary bg-invest-primary text-white shadow-invest-card-strong'
                          : 'border-invest-border bg-invest-surface text-invest-text hover:border-invest-primary/30 hover:bg-invest-primary-soft hover:text-invest-primary'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'size-1.5 rounded-full',
                          isSelected ? 'bg-white' : 'bg-invest-border'
                        )}
                      />
                      {modelsCopy.filters[index]}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-invest-text-muted">
                <span>{selectedFilterLabel}</span>
                <span className="shrink-0">
                  {filteredInvestmentModels.length}
                  {locale === 'ko' ? '개 표시' : ' shown'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {discoverySummaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-invest-control bg-invest-surface px-2.5 py-2 shadow-invest-card"
                  >
                    <p className="truncate text-[11px] font-semibold leading-4 text-invest-text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-[13px] font-bold leading-5 text-invest-text">
                      {item.value}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold leading-4 text-invest-text-subtle">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            role="list"
            aria-label={modelListLabel}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
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
                  footerBadges={[
                    { label: model.reviewLabel },
                    { label: model.simulatedAumLabel, tone: 'low' }
                  ]}
                  actionLabel={
                    statusDisplay.isSelectionDisabled
                      ? locale === 'ko'
                        ? '검토 대기'
                        : 'Review pending'
                      : locale === 'ko'
                        ? '상세 보기'
                        : 'View detail'
                  }
                  actionTone={
                    statusDisplay.isSelectionDisabled ? 'disabled' : 'active'
                  }
                  isSelectionDisabled={statusDisplay.isSelectionDisabled}
                />
              );

              return (
                <div key={model.id} role="listitem" className="min-w-0">
                  {statusDisplay.isSelectionDisabled ? (
                    modelCard
                  ) : (
                    <Link
                      href={withInvestModelLocale(
                        `/invest-model/models/${model.id}`,
                        locale
                      )}
                      aria-label={`${model.name} ${model.performanceLabel} ${model.riskLabel}`}
                      className="block rounded-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg"
                    >
                      {modelCard}
                    </Link>
                  )}
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
