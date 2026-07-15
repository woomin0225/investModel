import Link from 'next/link';
import { NextRequest } from 'next/server';
import { ArrowRight, Scale, Search } from 'lucide-react';
import { GET as readModels } from '@/app/api/models/route';
import {
  investMotionClass,
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  TopIconBar
} from '@/components/invest-model';
import {
  getInvestmentModelStatusDisplay,
  investModelDiscoveryFilterIds,
  investModelCopy,
  matchesInvestModelDiscoveryFilter,
  resolveInvestModelDiscoveryFilter,
  resolveInvestModelLocale,
  type InvestmentModelPublicationStatus,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import type { ModelCardDto } from '@/lib/domain/models/model-read-model';
import { cn } from '@/lib/utils';

type DiscoveryRiskTone = 'low' | 'medium' | 'high';

type DiscoverableInvestmentModelView = {
  id: string;
  name: string;
  summary: string;
  market: string;
  riskLabel: string;
  riskTone: DiscoveryRiskTone;
  status: Extract<InvestmentModelPublicationStatus, 'approved' | 'live'>;
  performanceLabel: string;
  mandateLabel: string;
  tags: string[];
  reviewLabel: string;
  simulatedAumLabel: string;
};

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

const modelReadStateCopy = {
  ko: {
    dbLabel: 'DB 읽기 모델',
    unavailableTitle: 'DB 읽기 모델 사용 불가',
    unavailableDescription:
      'InvestmentModel 목록을 읽지 못했습니다. 추천, 주문, 브로커 연결은 생성되지 않았습니다.',
    emptyTitle: 'DB 기반 공개 InvestmentModel 없음',
    emptyDescription:
      '현재 필터에 표시할 공개 투자 모델 데이터가 없습니다. 실제 주문이나 모델 선택은 생성되지 않았습니다.',
    marketplaceFallback: '마켓플레이스 모델',
    mandateFallback: '모델 운용 범위',
    backtestSuffix: '백테스트'
  },
  en: {
    dbLabel: 'DB read model',
    unavailableTitle: 'DB read model unavailable',
    unavailableDescription:
      'InvestmentModel rows could not be read. No recommendation, order, or brokerage action was created.',
    emptyTitle: 'No DB-backed InvestmentModels',
    emptyDescription:
      'There are no public InvestmentModel DTOs for this filter. No order or model selection was created.',
    marketplaceFallback: 'Marketplace model',
    mandateFallback: 'Model mandate',
    backtestSuffix: 'backtest'
  }
} as const;

function modelDiscoveryVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? [
        '승인/공개 모델',
        'ModelVersion 맥락',
        'ModelRiskProfile',
        '백테스트 대체 지표',
        '추천 아님',
        '주문 아님',
        '브로커 미연결'
      ]
    : [
        'approved/public model',
        'ModelVersion context',
        'ModelRiskProfile',
        'backtest placeholder',
        'not advice',
        'not an order',
        'no brokerage'
      ];
}

function getDiscoveryFilterHref(
  filterId: string,
  locale: 'ko' | 'en',
  searchQuery?: string
) {
  const basePath = withInvestModelLocale('/invest-model/models', locale);
  const params = new URLSearchParams();

  if (filterId !== 'all') {
    params.set('filter', filterId);
  }

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  const query = params.toString();

  if (!query) {
    return basePath;
  }

  return `${basePath}${locale === 'en' ? '&' : '?'}${query}`;
}

function modelRiskTone(card: ModelCardDto): DiscoveryRiskTone {
  if (card.risk.tone === 'low' || card.risk.tone === 'medium') {
    return card.risk.tone;
  }

  return 'high';
}

function compactLabels(labels: string[]) {
  return labels.filter(Boolean).slice(0, 4);
}

function toDiscoverableInvestmentModelView(
  card: ModelCardDto,
  locale: 'ko' | 'en'
): DiscoverableInvestmentModelView {
  const readStateCopy = modelReadStateCopy[locale];
  const targetMarkets = card.targetMarkets.join(', ');
  const assetLabels = card.assetClassLabels.join(', ');

  return {
    id: card.slug,
    name: card.name,
    summary: card.shortDescription ?? card.risk.summary ?? '',
    market: targetMarkets || readStateCopy.marketplaceFallback,
    riskLabel: card.risk.label,
    riskTone: modelRiskTone(card),
    status: card.status,
    performanceLabel: `${card.backtestReturn.display} ${readStateCopy.backtestSuffix}`,
    mandateLabel: assetLabels || readStateCopy.mandateFallback,
    tags: compactLabels([
      ...card.targetMarkets,
      ...card.assetClassLabels,
      card.leverageAllowed
        ? locale === 'ko'
          ? '레버리지 허용'
          : 'leverage allowed'
        : locale === 'ko'
          ? '레버리지 없음'
          : 'no leverage flag'
    ]),
    reviewLabel: card.reviewLabel,
    simulatedAumLabel: readStateCopy.dbLabel
  };
}

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeModelSearchQuery(value: string | string[] | undefined) {
  const query = getFirstSearchParam(value)?.trim();
  return query ? query.slice(0, 80) : undefined;
}

async function readDiscoverableInvestmentModels(
  locale: 'ko' | 'en',
  searchQuery?: string
) {
  try {
    const params = new URLSearchParams({ limit: '30' });

    if (searchQuery) {
      params.set('q', searchQuery);
    }

    const response = await readModels(
      new NextRequest(`http://localhost/api/models?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-invest-model-role': 'public'
        }
      })
    );

    if (!response.ok) {
      throw new Error('Model route read failed.');
    }

    const payload = (await response.json()) as {
      data?: ModelCardDto[];
    };

    if (!Array.isArray(payload.data)) {
      throw new Error('Model route returned no data array.');
    }

    return {
      models: payload.data.map((card) =>
        toDiscoverableInvestmentModelView(card, locale)
      ),
      readFailed: false
    };
  } catch {
    return {
      models: [] as DiscoverableInvestmentModelView[],
      readFailed: true
    };
  }
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
  const searchQuery = normalizeModelSearchQuery(resolvedSearchParams?.q);
  const copy = investModelCopy[locale];
  const modelsCopy = copy.models;
  const modelsFooterSafetyLines = [
    modelsCopy.footerBadges.noLiveTrading,
    modelsCopy.footerBadges.approvedOnly,
    modelsCopy.footerBadges.backtestMock
  ];
  const {
    models: discoverableInvestmentModels,
    readFailed: modelReadFailed
  } = await readDiscoverableInvestmentModels(locale, searchQuery);
  const filteredInvestmentModels = discoverableInvestmentModels.filter(
    (model) => matchesInvestModelDiscoveryFilter(model, selectedFilter)
  );
  const selectedFilterIndex =
    investModelDiscoveryFilterIds.indexOf(selectedFilter);
  const selectedFilterLabel =
    modelsCopy.filters[selectedFilterIndex] ?? modelsCopy.filters[0];
  const summaryCopy = discoverySummaryCopy[locale];
  const readStateCopy = modelReadStateCopy[locale];
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
        <TopIconBar
          locale={locale}
          actions={[
            {
              key: 'search',
              label: copy.actions.searchApprovedModels,
              href: '/invest-model/search',
              icon: Search
            }
          ]}
        />
      }
    >
      <section className="space-y-invest-section-gap">
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
              'group flex min-h-invest-touch-target items-center gap-3 rounded-invest-card border border-invest-border bg-invest-surface p-3 text-invest-text shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
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
            <span className="hidden shrink-0 rounded-full bg-invest-primary-soft px-2 py-1 text-[11px] font-bold leading-4 text-invest-primary transition-[background-color,color,transform] duration-200 ease-out group-hover:bg-invest-primary group-hover:text-white group-active:scale-95 motion-reduce:transition-none motion-reduce:group-active:scale-100 min-[360px]:inline-flex">
              {locale === 'ko' ? '정보 비교' : 'Compare'}
            </span>
            <ArrowRight
              aria-hidden
              className="size-4 shrink-0 text-invest-text-muted transition-[color,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-invest-primary group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:scale-100"
            />
          </Link>

          <div className="space-y-2">
            <form
              action={withInvestModelLocale('/invest-model/models', locale)}
              className="flex min-h-invest-touch-target items-center gap-2 rounded-invest-card border border-invest-border bg-invest-surface px-3 py-2 shadow-invest-card focus-within:border-invest-primary focus-within:ring-2 focus-within:ring-invest-primary/15"
            >
              {locale === 'en' ? (
                <input type="hidden" name="lang" value="en" />
              ) : null}
              {selectedFilter !== 'all' ? (
                <input type="hidden" name="filter" value={selectedFilter} />
              ) : null}
              <Search
                aria-hidden
                className="size-4 shrink-0 text-invest-text-muted"
              />
              <input
                name="q"
                type="search"
                defaultValue={searchQuery ?? ''}
                placeholder={
                  locale === 'ko' ? '모델 검색' : 'Search models'
                }
                aria-label={
                  locale === 'ko' ? '모델 검색' : 'Search models'
                }
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold leading-6 text-invest-text outline-none placeholder:text-invest-text-subtle"
              />
              <button
                type="submit"
                className={cn(
                  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-invest-control bg-invest-primary px-3 text-xs font-bold text-white shadow-invest-card',
                  investMotionClass.interactiveControl
                )}
              >
                {locale === 'ko' ? '검색' : 'Search'}
              </button>
            </form>
            <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
              <div className="flex w-max gap-2 pr-invest-screen-x">
                {investModelDiscoveryFilterIds.map((filterId, index) => {
                  const isSelected = selectedFilter === filterId;

                  return (
                    <Link
                      key={filterId}
                      href={getDiscoveryFilterHref(
                        filterId,
                        locale,
                        searchQuery
                      )}
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
            <div className="group rounded-invest-card border border-invest-border bg-invest-surface-muted p-3 transition-[border-color,background-color] duration-200 ease-out hover:border-invest-primary/20 hover:bg-invest-primary-soft/60 motion-reduce:transition-none">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-invest-text-muted">
                <span>{selectedFilterLabel}</span>
                <span className="shrink-0">
                  {filteredInvestmentModels.length}
                  {locale === 'ko' ? '개 표시' : ' shown'}
                </span>
              </div>
              <div className="mt-2 h-0.5 origin-left scale-x-50 rounded-full bg-invest-primary/30 transition-transform duration-200 ease-out group-hover:scale-x-100 group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-hover:scale-x-50 motion-reduce:group-active:scale-x-50" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {discoverySummaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-invest-control bg-invest-surface px-2.5 py-2 shadow-invest-card transition-[background-color,transform] duration-200 ease-out group-hover:bg-white group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active:scale-100"
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
              const visibleBoundaries = modelDiscoveryVisibleBoundaries(locale);
              const modelCard = (
                <ModelCard
                  name={model.name}
                  summary={model.summary}
                  market={model.market}
                  riskLabel={model.riskLabel}
                  riskTone={model.riskTone}
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
                    <div className="space-y-2">
                      {modelCard}
                      <p className="px-3 text-xs font-semibold leading-5 text-invest-text-muted">
                        {visibleBoundaries.join(' / ')}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href={withInvestModelLocale(
                        `/invest-model/models/${model.id}`,
                        locale
                      )}
                      aria-label={`${model.name} ${model.performanceLabel} ${model.riskLabel}`}
                      className="block space-y-2 rounded-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg"
                    >
                      {modelCard}
                      <p className="px-3 text-xs font-semibold leading-5 text-invest-text-muted">
                        {visibleBoundaries.join(' / ')}
                      </p>
                    </Link>
                  )}
                </div>
              );
            })}
            {filteredInvestmentModels.length === 0 ? (
              <div
                role="listitem"
                className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
              >
                <p
                  className={`text-xs font-semibold leading-5 ${
                    modelReadFailed
                      ? 'text-invest-danger'
                      : 'text-invest-text-muted'
                  }`}
                >
                  {readStateCopy.dbLabel} / {modelsCopy.footerBadges.backtestMock}
                </p>
                <h2 className="mt-3 text-[16px] font-bold leading-6 text-invest-text">
                  {modelReadFailed
                    ? readStateCopy.unavailableTitle
                    : readStateCopy.emptyTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                  {modelReadFailed
                    ? readStateCopy.unavailableDescription
                    : readStateCopy.emptyDescription}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <p className="text-xs font-semibold uppercase leading-5 text-invest-text-muted">
            {modelsFooterSafetyLines.join(' / ')}
          </p>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {modelsCopy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
