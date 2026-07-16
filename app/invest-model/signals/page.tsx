import Link from 'next/link';
import { NextRequest } from 'next/server';
import { ShieldAlert } from 'lucide-react';
import { GET as readSignals } from '@/app/api/signals/route';
import {
  MetricCard,
  EmptyStateCta,
  MobileShell,
  MobileFilterRail,
  InterestSaveStateRail,
  RiskBadge,
  SectionHeader,
  SearchAndNotificationActions,
  SignalRefreshAction,
  investMotionClass
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { readInterestSaveStateLookup } from '@/lib/server/interest-save-state';
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

type SignalFilterId =
  | 'all'
  | 'news_traffic'
  | 'price_trend'
  | 'macro'
  | 'risk_alert';
type SignalLocale = 'ko' | 'en';
type SignalTone = keyof typeof signalToneClass;
type SignalClusterId = Exclude<SignalFilterId, 'all'>;

type SignalClusterSource = {
  id: string;
  title: string;
  sourceLabel: string;
  marketLabel: string;
  scoreLabel: string;
  scoreTone: SignalTone;
  description: string;
  linkedModelName: string;
  rankSnapshot?: {
    scoreLabel: string;
    contextLabel: string;
  } | null;
};

type SignalClusterRanking = {
  id: SignalClusterId;
  label: string;
  title: string;
  description: string;
  countLabel: string;
  metaLabel: string;
  href: string;
  tone: SignalTone;
};

type SignalReadMeta = {
  routeStatus: 'db_backed';
  signalType: SignalEventType | 'all';
  observedInputsOnly: boolean;
  realtimeExternalData: false;
  financialAdvice: false;
  tradeIntentCreated: false;
  realOrder: false;
  brokerageConnection: false;
};

const signalFilterIds = [
  'all',
  'news_traffic',
  'price_trend',
  'macro',
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
  if (filterId === 'all') {
    return null;
  }

  if (filterId === 'risk_alert') {
    return 'risk';
  }

  return parseSignalEventType(filterId);
}

function signalFilterLabel(
  locale: SignalLocale,
  filterId: SignalFilterId,
  filters: readonly string[]
) {
  if (filterId === 'all') {
    return filters[0];
  }

  if (filterId === 'news_traffic') {
    return filters[1];
  }

  if (filterId === 'price_trend') {
    return filters[2];
  }

  if (filterId === 'macro') {
    return locale === 'ko' ? '매크로 관찰' : 'Macro context';
  }

  return filters[3];
}

function signalFilterTitle(
  locale: SignalLocale,
  label: string,
  isSelected: boolean
) {
  const safeBoundary =
    locale === 'ko'
      ? 'DB 모의 관찰값만 필터링합니다. 추천, 주문, 주문 전 의도 또는 실시간 외부 데이터 연결이 아닙니다.'
      : 'Filters DB sample/mock observations only. This is not a recommendation, order, TradeIntent, or realtime external data connection.';
  const stateLabel =
    locale === 'ko'
      ? isSelected
        ? '선택됨'
        : '선택 가능'
      : isSelected
        ? 'selected'
        : 'available';

  return `${label} ${stateLabel}. ${safeBoundary}`;
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

function latestScoreSnapshotLabel(
  locale: SignalLocale,
  signals: SignalEventDto[],
  readState: 'db' | 'empty' | 'fallback'
) {
  if (readState === 'fallback') {
    return locale === 'ko'
      ? 'DB 신호 샘플 재시도 가능'
      : 'DB Signals sample retry available';
  }

  const latestSnapshotTime = signals
    .map((signal) => signal.scoreSnapshot?.capturedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  if (!latestSnapshotTime) {
    return locale === 'ko'
      ? 'DB 점수 스냅샷 없음'
      : 'No DB score snapshot yet';
  }

  return locale === 'ko'
    ? `최신 DB 스냅샷 ${formatCapturedAt(latestSnapshotTime.toISOString(), locale)}`
    : `Latest DB snapshot ${formatCapturedAt(latestSnapshotTime.toISOString(), locale)}`;
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

function signalRankSnapshotLabel(locale: SignalLocale, signal: SignalEventDto) {
  const snapshot = signal.scoreSnapshot;

  if (!snapshot) {
    return null;
  }

  return {
    rankLabel: snapshot.rankLabel,
    scoreLabel: snapshot.totalScoreDisplay,
    deltaLabel: snapshot.rankDeltaDisplay,
    capturedAtLabel: formatCapturedAt(snapshot.capturedAt, locale),
    contextLabel:
      snapshot.calculationContext === 'mock_seed'
        ? 'mock seed rank'
        : snapshot.calculationContext
  };
}

function toDbSignalCard(
  signal: SignalEventDto,
  index: number,
  locale: SignalLocale
) {
  const scoreTone = signalToneFromScore(signal.score);
  const rankSnapshot = signalRankSnapshotLabel(locale, signal);

  return {
    id: signal.signalPublicId,
    rank: rankSnapshot?.rankLabel ?? `#${index + 1}`,
    title: signal.title,
    sourceLabel: signalTypeLabel(locale, signal.signalType),
    marketLabel: signal.sourceLabel,
    scoreLabel: signal.scoreDisplay,
    scoreTone,
    description: signal.summary,
    linkedModelName: signal.linkedModelName,
    freshnessLabel: formatCapturedAt(signal.capturedAt, locale),
    statusLabel: signalStatusLabel(locale, signal),
    rankSnapshot,
    detailHref: signalDetailHref(locale, signal.signalPublicId)
  };
}

const signalClusterRankingCopy = {
  ko: {
    eyebrow: 'Seed/mock model themes',
    title: 'Theme and signal clusters',
    description:
      'DB seed/mock SignalEvent observations are grouped into model themes for exploration only.',
    safety: 'DB seed/mock observations only / exploration only / not advice / not orders',
    clusterRank: 'Cluster rank',
    observedInputsOnly: 'Observed inputs only',
    observationUnit: 'observations',
    emptyDetail: 'No matching seed/mock observation in the current filter.',
    definitions: {
      news_traffic: {
        label: 'News/traffic theme',
        title: 'Attention and narrative cluster'
      },
      price_trend: {
        label: 'Price trend theme',
        title: 'Momentum and spread cluster'
      },
      macro: {
        label: 'Macro theme',
        title: 'Macro and rate context cluster'
      },
      risk_alert: {
        label: 'Risk theme',
        title: 'Drawdown and volatility cluster'
      }
    }
  },
  en: {
    eyebrow: 'Seed/mock model themes',
    title: 'Theme and signal clusters',
    description:
      'DB seed/mock SignalEvent observations are grouped into model themes for exploration only.',
    safety: 'DB seed/mock observations only / exploration only / not advice / not orders',
    clusterRank: 'Cluster rank',
    observedInputsOnly: 'Observed inputs only',
    observationUnit: 'observations',
    emptyDetail: 'No matching seed/mock observation in the current filter.',
    definitions: {
      news_traffic: {
        label: 'News/traffic theme',
        title: 'Attention and narrative cluster'
      },
      price_trend: {
        label: 'Price trend theme',
        title: 'Momentum and spread cluster'
      },
      macro: {
        label: 'Macro theme',
        title: 'Macro and rate context cluster'
      },
      risk_alert: {
        label: 'Risk theme',
        title: 'Drawdown and volatility cluster'
      }
    }
  }
} as const;

const signalClusterIds = [
  'news_traffic',
  'price_trend',
  'macro',
  'risk_alert'
] as const satisfies readonly SignalClusterId[];

function signalClusterMatches(
  signal: SignalClusterSource,
  clusterId: SignalClusterId
) {
  const haystack = [
    signal.title,
    signal.sourceLabel,
    signal.marketLabel,
    signal.description,
    signal.linkedModelName
  ]
    .join(' ')
    .toLowerCase();

  if (clusterId === 'news_traffic') {
    return /news|traffic|attention|earnings|search|narrative|feed/.test(
      haystack
    );
  }

  if (clusterId === 'price_trend') {
    return /price|trend|momentum|yield|spread|rate|curve/.test(haystack);
  }

  if (clusterId === 'macro') {
    return /macro|rate|yield|curve|inflation|policy|dollar|liquidity/.test(
      haystack
    );
  }

  return /risk|drawdown|volatility|vol|stress|liquidity|alert/.test(haystack);
}

function buildSignalClusterRankings(
  signals: readonly SignalClusterSource[],
  locale: SignalLocale
): SignalClusterRanking[] {
  const copy = signalClusterRankingCopy[locale];

  return signalClusterIds
    .map<SignalClusterRanking | null>((clusterId) => {
      const matches = signals.filter((signal) =>
        signalClusterMatches(signal, clusterId)
      );
      const leadSignal = matches[0];

      if (!leadSignal) {
        return null;
      }

      const definition = copy.definitions[clusterId];
      const snapshotMeta = leadSignal.rankSnapshot
        ? `${leadSignal.rankSnapshot.scoreLabel} / ${leadSignal.rankSnapshot.contextLabel}`
        : leadSignal.scoreLabel;

      return {
        id: clusterId,
        label: definition.label,
        title: definition.title,
        description: leadSignal.description || copy.emptyDetail,
        countLabel: `${matches.length} ${copy.observationUnit}`,
        metaLabel: [
          leadSignal.linkedModelName,
          snapshotMeta,
          copy.observedInputsOnly
        ].join(' / '),
        href: signalFilterHref(locale, clusterId),
        tone: leadSignal.scoreTone
      };
    })
    .filter((cluster): cluster is SignalClusterRanking => cluster !== null);
}

function SignalThemeClusterRankingSection({
  locale,
  clusters
}: {
  locale: SignalLocale;
  clusters: SignalClusterRanking[];
}) {
  const copy = signalClusterRankingCopy[locale];

  if (clusters.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="signal-theme-cluster-title"
      className="space-y-3 rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-invest-primary">
            {copy.eyebrow}
          </p>
          <h2
            id="signal-theme-cluster-title"
            className="min-w-0 break-words text-[17px] font-bold leading-6 text-invest-text [overflow-wrap:anywhere]"
          >
            {copy.title}
          </h2>
          <p className="text-sm leading-5 text-invest-text-muted">
            {copy.description}
          </p>
        </div>
        <RiskBadge tone="low">{copy.observedInputsOnly}</RiskBadge>
      </div>

      <div className="grid gap-2 min-[390px]:grid-cols-2">
        {clusters.map((cluster, index) => (
          <Link
            key={cluster.id}
            href={cluster.href}
            aria-label={`${copy.clusterRank} ${index + 1}. ${cluster.title}. ${copy.safety}`}
            title={`${copy.clusterRank} ${index + 1}. ${cluster.title}. ${copy.safety}`}
            className={cn(
              'group min-h-invest-touch-target min-w-0 rounded-invest-control border border-invest-border bg-invest-bg-soft p-3 text-left focus-visible:ring-2 focus-visible:ring-invest-primary/30',
              investMotionClass.interactiveCard
            )}
          >
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <span className="shrink-0 text-[12px] font-bold text-invest-primary">
                #{index + 1}
              </span>
              <RiskBadge tone={badgeToneByScore[cluster.tone]}>
                {cluster.label}
              </RiskBadge>
            </div>
            <h3 className="min-w-0 break-words text-sm font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
              {cluster.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-invest-text-muted">
              {cluster.description}
            </p>
            <p className="mt-2 min-w-0 break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
              {[cluster.countLabel, cluster.metaLabel].join(' / ')}
            </p>
          </Link>
        ))}
      </div>

      <p className="rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
        {copy.safety}
      </p>
    </section>
  );
}

async function readSignalsRoute({
  signalType,
  limit
}: {
  signalType: SignalEventType | null;
  limit: number;
}): Promise<{ data: SignalEventDto[]; meta: SignalReadMeta }> {
  const params = new URLSearchParams({ limit: String(limit) });

  if (signalType) {
    params.set('signalType', signalType);
  }

  const response = await readSignals(
    new NextRequest(`http://localhost/api/signals?${params.toString()}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    throw new Error('Signals route read failed.');
  }

  const payload = (await response.json()) as {
    data?: SignalEventDto[];
    meta?: SignalReadMeta;
  };

  if (!Array.isArray(payload.data)) {
    throw new Error('Signals route returned no data array.');
  }

  if (!payload.meta) {
    throw new Error('Signals route returned no meta object.');
  }

  return {
    data: payload.data,
    meta: payload.meta
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
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const interestSaveStateLookup =
    await readInterestSaveStateLookup('signal_event');
  const signalsCopy = copy.signals;
  const signalsFooterSafetyLines = [
    signalsCopy.footerBadges.noRecommendation,
    signalsCopy.footerBadges.mockData
  ];
  const { summary, filters, signals: fallbackSignals } = signalsCopy;
  const filterOptions = signalFilterIds.map((filterId) => ({
    id: filterId,
    label: signalFilterLabel(locale, filterId, filters)
  }));
  const selectedFilter =
    filterOptions.find((filter) => filter.id === selectedFilterId) ??
    filterOptions[0];
  const selectedSignalType = signalTypeFromFilter(selectedFilterId);
  let signalReadState: 'db' | 'empty' | 'fallback' = 'db';
  let dbSignals: SignalEventDto[] = [];
  let signalReadMeta: SignalReadMeta | null = null;

  try {
    const signalReadResult = await readSignalsRoute({
      signalType: selectedSignalType,
      limit: 20
    });
    dbSignals = signalReadResult.data;
    signalReadMeta = signalReadResult.meta;

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

              if (selectedFilterId === 'macro') {
                return false;
              }

              return signal.sourceLabel === filters[3];
            })
        : [];
  const visibleSignalCountLabel =
    locale === 'ko'
      ? `${visibleSignals.length}개 표시`
      : `${visibleSignals.length} shown`;
  const signalClusterRankings = buildSignalClusterRankings(
    visibleSignals,
    locale
  );
  const signalListLabel =
    locale === 'ko' ? '표시 중인 신호 목록' : 'Shown signal list';
  const canonicalSignalTypeLabel =
    signalReadMeta?.signalType ?? selectedSignalType ?? 'all';
  const signalQueryAlignmentLabel =
    locale === 'ko'
      ? `URL signalType=${selectedFilterId} / DB query=${canonicalSignalTypeLabel} / observed only`
      : `URL signalType=${selectedFilterId} / DB query=${canonicalSignalTypeLabel} / observed only`;

  const signalDataStateLabel =
    signalReadState === 'db'
      ? locale === 'ko'
        ? 'DB 샘플 관찰값'
        : 'DB sample observations'
      : signalReadState === 'empty'
        ? locale === 'ko'
          ? 'DB 샘플 신호 없음'
          : 'No DB sample signals'
        : locale === 'ko'
          ? '샘플 대체 표시'
          : 'Sample fallback shown';

  return (
    <MobileShell
      activeTab="signals"
      eyebrow={signalsCopy.eyebrow}
      title={signalsCopy.title}
      locale={locale}
      currentPath="/invest-model/signals"
      trailing={
        <SearchAndNotificationActions
          locale={locale}
          searchLabel={copy.actions.searchModels}
          notificationLabel={copy.actions.signalAlerts}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={signalsCopy.metrics.activeFeed}
            value={visibleSignalCountLabel}
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

          <SignalRefreshAction
            locale={locale}
            lastUpdatedLabel={latestScoreSnapshotLabel(
              locale,
              dbSignals,
              signalReadState
            )}
            autoRefreshDisabled={signalReadState === 'fallback'}
          />
          {signalReadState === 'fallback' ? (
            <Link
              href={signalFilterHref(locale, selectedFilterId)}
              aria-label={
                locale === 'ko'
                  ? 'DB 신호 샘플 다시 읽기. 로컬 샘플 관찰값만 재시도하며 실제 계좌, 브로커, 주문, 외부 실시간 데이터 연결은 만들지 않습니다.'
                  : 'Retry DB signal sample read. Retries local sample observations only and does not connect a real account, brokerage, orders, or realtime external data.'
              }
              title={
                locale === 'ko'
                  ? 'DB 신호 샘플 다시 읽기. 로컬 샘플 관찰값만 재시도하며 실제 계좌, 브로커, 주문, 외부 실시간 데이터 연결은 만들지 않습니다.'
                  : 'Retry DB signal sample read. Retries local sample observations only and does not connect a real account, brokerage, orders, or realtime external data.'
              }
              className={cn(
                'inline-flex min-h-invest-touch-target w-full items-center justify-center rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 text-center text-sm font-bold text-invest-primary focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                investMotionClass.interactiveControl
              )}
            >
              {locale === 'ko'
                ? 'DB 신호 샘플 다시 읽기'
                : 'Retry DB signal sample'}
            </Link>
          ) : null}

          <MobileFilterRail
            ariaLabel={locale === 'ko' ? '신호 필터' : 'Signal filters'}
          >
            {filterOptions.map((filter) => {
              const isSelected = filter.id === selectedFilterId;

              return (
                <Link
                  key={filter.id}
                  href={signalFilterHref(locale, filter.id)}
                  aria-pressed={isSelected}
                  aria-current={isSelected ? 'page' : undefined}
                  title={signalFilterTitle(locale, filter.label, isSelected)}
                  className={cn(
                    'group relative inline-flex min-h-invest-touch-target w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-invest-control border px-3 text-center text-sm font-semibold shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/30 min-[520px]:w-auto',
                    isSelected
                      ? 'border-invest-primary bg-invest-primary text-white'
                      : 'border-invest-border bg-invest-surface text-invest-text hover:border-invest-primary/30 hover:bg-invest-primary-soft/50',
                    investMotionClass.interactiveControl
                  )}
                >
                  {isSelected ? (
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-white transition-transform duration-200 ease-out group-active:scale-75 motion-reduce:transition-none motion-reduce:group-active:scale-100"
                    />
                  ) : null}
                  <span className="relative z-10 min-w-0 truncate">
                    {filter.label}
                  </span>
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
          </MobileFilterRail>

          <div className="rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-4 text-invest-text-muted">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-invest-text">
                {selectedFilter.label}
              </span>
              <span className="shrink-0">{visibleSignalCountLabel}</span>
            </div>
            <p className="mt-1 min-w-0 break-words [overflow-wrap:anywhere]">
              {signalQueryAlignmentLabel}
            </p>
          </div>

          <SignalThemeClusterRankingSection
            locale={locale}
            clusters={signalClusterRankings}
          />

          <div
            role="list"
            aria-label={signalListLabel}
            className="space-y-2.5 rounded-invest-control bg-invest-bg-soft p-1.5"
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
                          <p className="mt-2 text-xs font-semibold leading-5 text-invest-text-muted">
                            {[signal.sourceLabel, signal.marketLabel].join(
                              ' / '
                            )}
                          </p>
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
                      <p className="mt-3 text-xs font-semibold leading-5 text-invest-text-muted transition-colors duration-200 ease-out group-hover:text-invest-text motion-reduce:transition-none">
                        {[signal.linkedModelName, signal.freshnessLabel].join(
                          ' / '
                        )}
                      </p>
                      {'rankSnapshot' in signal && signal.rankSnapshot ? (
                        <div className="mt-2.5 space-y-1 text-xs font-semibold leading-5 text-invest-text-muted">
                          <p>
                            {[
                              signal.rankSnapshot.scoreLabel,
                              signal.rankSnapshot.deltaLabel,
                              signal.rankSnapshot.contextLabel
                            ].join(' / ')}
                          </p>
                          <p>
                            {locale === 'ko'
                              ? 'DB 점수 스냅샷 순위일 뿐 조언이나 주문이 아닙니다'
                              : 'DB sample score snapshot rank only, not advice or order'}
                            {' · '}
                            {signal.rankSnapshot.capturedAtLabel}
                          </p>
                        </div>
                      ) : null}
                      <p className="mt-2.5 text-sm font-semibold leading-5 text-invest-text-muted transition-colors duration-200 ease-out group-hover:text-invest-text motion-reduce:transition-none">
                        {signal.statusLabel}
                      </p>
                      <InterestSaveStateRail
                        className="mt-3"
                        locale={locale}
                        itemType="signal_event"
                        itemPublicId={signal.id}
                        displayState={interestSaveStateLookup[signal.id]?.state}
                        sourceSurface={
                          interestSaveStateLookup[signal.id]?.sourceSurface
                        }
                        safetyLabel={
                          interestSaveStateLookup[signal.id]?.safetyLabel
                        }
                      />
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
                  ? '이 필터와 일치하는 관찰 SignalEvent 행이 없습니다. 이 상태는 관찰 전용 no-signal 상태입니다.'
                  : 'No observed SignalEvent rows match this filter. This is an observation-only no-signal state.'}
                <p className="mt-2 min-w-0 break-words text-[12px] leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                  {signalQueryAlignmentLabel}
                </p>
                <EmptyStateCta
                  href={signalFilterHref(locale, 'all')}
                  label={locale === 'ko' ? '전체 신호 보기' : 'View all signals'}
                  description={
                    locale === 'ko'
                      ? '필터를 해제하고 DB 샘플 관찰 신호 목록으로 돌아갑니다.'
                      : 'Clear the filter and return to DB sample observation signals.'
                  }
                  ariaLabel={
                    locale === 'ko'
                      ? '전체 신호 보기. 필터를 해제하고 DB 샘플 관찰 신호 목록으로 돌아갑니다. 추천, 주문, TradeIntent, 실시간 외부 데이터가 아닙니다.'
                      : 'View all signals. Clears the filter and returns to DB sample observation signals. Not advice, an order, TradeIntent, or realtime external data.'
                  }
                />
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
              <p className="text-xs font-semibold uppercase leading-5 text-invest-text-muted">
                {signalsFooterSafetyLines.join(' / ')}
              </p>
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
