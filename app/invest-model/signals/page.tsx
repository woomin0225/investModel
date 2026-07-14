import Link from 'next/link';
import { Activity, Radio, ShieldAlert } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SectionHeader,
  SoftBanner,
  investMotionClass
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { readSignalEventDtos } from '@/lib/db/signal-read-model';
import {
  parseSignalEventType,
  type SignalEventDto,
  type SignalEventType
} from '@/lib/domain/signals/signal-event';
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

type SignalFilterId = 'all' | 'news_traffic' | 'price_trend' | 'risk_alert';
type SignalLocale = 'ko' | 'en';
type SignalTone = keyof typeof signalToneClass;

const signalFilterIds = [
  'all',
  'news_traffic',
  'price_trend',
  'risk_alert'
] as const satisfies readonly SignalFilterId[];

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveSignalFilterId(
  rawFilter: string | string[] | undefined
): SignalFilterId {
  const filter = firstSearchParam(rawFilter);

  return signalFilterIds.includes(filter as SignalFilterId)
    ? (filter as SignalFilterId)
    : 'all';
}

function signalFilterHref(locale: 'ko' | 'en', filterId: SignalFilterId) {
  const params = new URLSearchParams({ lang: locale });

  if (filterId !== 'all') {
    params.set('signalType', filterId);
  }

  return `/invest-model/signals?${params.toString()}`;
}

function signalDetailHref(locale: 'ko' | 'en', signalPublicId: string) {
  const params = new URLSearchParams({ lang: locale });

  return `/invest-model/signals/${signalPublicId}?${params.toString()}`;
}

function signalTypeFromFilter(
  filterId: SignalFilterId
): SignalEventType | null {
  return filterId === 'all' ? null : parseSignalEventType(filterId);
}

function signalToneFromScore(score: number): SignalTone {
  if (score >= 80) {
    return 'high';
  }

  if (score >= 65) {
    return 'medium';
  }

  return 'low';
}

function signalTypeLabel(locale: SignalLocale, signalType: SignalEventType) {
  const labels = {
    ko: {
      news_traffic: '뉴스 트래픽',
      price_trend: '가격 추세',
      macro: '시장 맥락',
      risk: '위험 알림'
    },
    en: {
      news_traffic: 'News traffic',
      price_trend: 'Price trend',
      macro: 'Market context',
      risk: 'Risk alert'
    }
  } as const;

  return labels[locale][signalType];
}

function formatCapturedAt(value: string, locale: SignalLocale) {
  const capturedAt = new Date(value);

  if (Number.isNaN(capturedAt.getTime())) {
    return locale === 'ko' ? '시점 확인 중' : 'Time pending';
  }

  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(capturedAt);
}

function signalStatusLabel(locale: SignalLocale, signal: SignalEventDto) {
  if (signal.signalType === 'risk') {
    return locale === 'ko'
      ? '위험 관찰 입력값입니다. 매수·매도·주문 신호로 사용하지 않습니다.'
      : 'Risk observation input only. It is not a buy, sell, or order signal.';
  }

  return locale === 'ko'
    ? '모델이 참고한 관찰 입력값입니다. 투자 조언이나 주문 생성이 아닙니다.'
    : 'Observed input for model context only. It is not advice or order creation.';
}

function toDbSignalCard(
  signal: SignalEventDto,
  index: number,
  locale: SignalLocale
) {
  const scoreTone = signalToneFromScore(signal.score);

  return {
    id: signal.signalPublicId,
    rank: `#${index + 1}`,
    title: signal.title,
    sourceLabel: signalTypeLabel(locale, signal.signalType),
    marketLabel: signal.sourceLabel,
    scoreLabel: signal.scoreDisplay,
    scoreTone,
    description: signal.summary,
    linkedModelName: signal.linkedModelName,
    freshnessLabel: formatCapturedAt(signal.capturedAt, locale),
    statusLabel: signalStatusLabel(locale, signal),
    detailHref: signalDetailHref(locale, signal.signalPublicId)
  };
}

export default async function InvestModelSignalsPage({
  searchParams
}: InvestModelSignalsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const selectedFilterId = resolveSignalFilterId(
    resolvedSearchParams.signalType
  );
  const copy = investModelCopy[locale];
  const signalsCopy = copy.signals;
  const { summary, filters, signals: fallbackSignals } = signalsCopy;
  const filterOptions = signalFilterIds.map((filterId, index) => ({
    id: filterId,
    label: filters[index]
  }));
  const selectedFilter =
    filterOptions.find((filter) => filter.id === selectedFilterId) ??
    filterOptions[0];
  const selectedSignalType = signalTypeFromFilter(selectedFilterId);
  let signalReadState: 'db' | 'empty' | 'fallback' = 'db';
  let dbSignals: SignalEventDto[] = [];

  try {
    dbSignals = await readSignalEventDtos({
      signalType: selectedSignalType,
      limit: 20
    });

    if (dbSignals.length === 0) {
      signalReadState = 'empty';
    }
  } catch {
    signalReadState = 'fallback';
  }

  const visibleSignals =
    signalReadState === 'db'
      ? dbSignals.map((signal, index) => toDbSignalCard(signal, index, locale))
      : signalReadState === 'fallback'
        ? selectedFilterId === 'all'
          ? fallbackSignals
          : fallbackSignals.filter((signal) => {
              if (selectedFilterId === 'news_traffic') {
                return signal.sourceLabel === filters[1];
              }

              if (selectedFilterId === 'price_trend') {
                return signal.sourceLabel === filters[2];
              }

              return signal.sourceLabel === filters[3];
            })
        : [];
  const visibleSignalCountLabel =
    locale === 'ko'
      ? `${visibleSignals.length}개 표시`
      : `${visibleSignals.length} shown`;
  const signalListLabel =
    locale === 'ko' ? '표시 중인 신호 목록' : 'Shown signal list';

  const signalDataStateLabel =
    signalReadState === 'db'
      ? locale === 'ko'
        ? 'DB 기반 관찰값'
        : 'DB-backed observations'
      : signalReadState === 'empty'
        ? locale === 'ko'
          ? 'DB 신호 없음'
          : 'No DB signals'
        : locale === 'ko'
          ? '샘플 fallback 표시'
          : 'Sample fallback shown';

  return (
    <MobileShell
      activeTab="signals"
      eyebrow={signalsCopy.eyebrow}
      title={signalsCopy.title}
      locale={locale}
      currentPath="/invest-model/signals"
      trailing={
        <NotificationAction locale={locale} label={copy.actions.signalAlerts} />
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
            description={signalDataStateLabel}
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
              {filterOptions.map((filter) => {
                const isSelected = filter.id === selectedFilterId;

                return (
                  <Link
                    key={filter.id}
                    href={signalFilterHref(locale, filter.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative inline-flex min-h-invest-touch-target items-center gap-2 overflow-hidden rounded-invest-control border px-3 text-sm font-semibold shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/30',
                      isSelected
                        ? 'border-invest-primary bg-invest-primary text-white'
                        : 'border-invest-border bg-invest-surface text-invest-text hover:border-invest-primary/30 hover:bg-invest-primary-soft/50',
                      investMotionClass.interactiveControl
                    )}
                  >
                    {isSelected ? (
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-white transition-transform duration-200 ease-out group-active:scale-75 motion-reduce:transition-none motion-reduce:group-active:scale-100"
                      />
                    ) : null}
                    <span className="relative z-10">{filter.label}</span>
                    <span
                      aria-hidden
                      className={cn(
                        'absolute inset-x-3 bottom-1 h-0.5 rounded-full transition-[opacity,transform] duration-200 ease-out group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-active:scale-x-100',
                        isSelected
                          ? 'bg-white/80 opacity-90'
                          : 'bg-invest-primary opacity-0 group-hover:opacity-45'
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-4 text-invest-text-muted">
            <span className="min-w-0 truncate text-invest-text">
              {selectedFilter.label}
            </span>
            <span className="shrink-0">{visibleSignalCountLabel}</span>
          </div>

          <div
            role="list"
            aria-label={signalListLabel}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {visibleSignals.length > 0 ? (
              visibleSignals.map((signal) => (
                <Link
                  key={signal.id}
                  href={'detailHref' in signal ? signal.detailHref : '#'}
                  role="listitem"
                  aria-label={`${signal.title} ${signal.scoreLabel}`}
                  aria-disabled={!('detailHref' in signal)}
                  tabIndex={'detailHref' in signal ? undefined : -1}
                  className={cn(
                    'group block rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/30',
                    !('detailHref' in signal) && 'pointer-events-none',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-invest-control text-[15px] font-bold transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100',
                        signalToneClass[signal.scoreTone]
                      )}
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
                            'h-full origin-left rounded-full transition-transform duration-200 ease-out group-hover:scale-y-110 group-active:scale-y-95 motion-reduce:transition-none motion-reduce:group-hover:scale-y-100 motion-reduce:group-active:scale-y-100',
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
                      <div
                        className={cn(
                          'mt-3 grid gap-2 rounded-invest-control bg-invest-surface-muted p-2 transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft/35 group-active:scale-[0.995] group-focus-within:bg-invest-primary-soft/45 min-[360px]:grid-cols-[minmax(0,1fr)_auto]',
                          'motion-reduce:transition-none motion-reduce:group-active:scale-100'
                        )}
                      >
                        <RiskBadge
                          tone="neutral"
                          className="justify-center text-center transition-transform duration-200 ease-out group-hover:scale-[1.01] group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                        >
                          {signal.linkedModelName}
                        </RiskBadge>
                        <span className="inline-flex min-h-7 items-center justify-center rounded-full bg-invest-surface px-2.5 text-center text-[11px] font-semibold leading-4 text-invest-text-muted transition-[color,transform] duration-200 ease-out group-hover:scale-[1.01] group-hover:text-invest-text group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                          {signal.freshnessLabel}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-start gap-2.5 rounded-invest-control border border-invest-border/70 bg-invest-bg-soft p-2.5 transition-[background-color,border-color,transform] duration-200 ease-out group-hover:border-invest-primary/25 group-hover:bg-invest-surface group-active:scale-[0.995] group-focus-within:border-invest-primary/35 motion-reduce:transition-none motion-reduce:group-active:scale-100">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-invest-surface text-invest-primary shadow-invest-card transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                          <Activity
                            aria-hidden
                            className="size-4 transition-transform duration-200 ease-out group-hover:rotate-6 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
                          />
                        </span>
                        <p className="pt-0.5 text-sm font-semibold leading-5 text-invest-text-muted transition-colors duration-200 ease-out group-hover:text-invest-text motion-reduce:transition-none">
                          {signal.statusLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div
                role="listitem"
                className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-invest-card-padding text-sm font-semibold leading-6 text-invest-text-muted"
              >
                {locale === 'ko'
                  ? '선택한 필터에 표시할 DB 신호가 없습니다. 신호는 seed/mock 관찰값 기준으로만 표시됩니다.'
                  : 'No DB signals are available for this filter. Signals remain seed/mock observations only.'}
              </div>
            )}
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
