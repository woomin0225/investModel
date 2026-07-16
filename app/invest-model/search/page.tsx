import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Database,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { NextRequest } from 'next/server';

import {
  investMotionClass,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model';
import { GET as readSearchResults } from '@/app/api/search/route';
import { GET as readSearchSuggestions } from '@/app/api/search/suggestions/route';
import type { FeedPostDto } from '@/lib/domain/feed/feed-post';
import type { SignalEventDto } from '@/lib/domain/signals/signal-event';
import {
  getInvestmentModelStatusDisplay,
  investModelCopy,
  type InvestmentModelPublicationStatus,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type InvestModelSearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SearchableInvestmentModel = {
  modelId: string;
  modelPublicId?: string;
  modelVersionPublicId?: string;
  name: string;
  summary: string;
  market: string;
  riskLabel: string;
  performanceLabel: string;
  status: InvestmentModelPublicationStatus;
  tags: readonly string[];
  href: string;
};

type InvestModelSearchResults = {
  investmentModels: SearchableInvestmentModel[];
  feedPosts: Array<FeedPostDto & { href: string }>;
  signalEvents: Array<SignalEventDto & { href: string }>;
};

type SearchResultKind = 'InvestmentModel' | 'FeedPost' | 'SignalEvent';

type SearchSuggestionTone = 'neutral' | 'attention' | 'risk';

type SearchSuggestionChip = {
  suggestionPublicId: string;
  kind: 'topic' | 'model' | 'signal';
  label: string;
  query: string;
  helper: string;
  tone: SearchSuggestionTone;
  safetyLabel: string;
  href: string;
};

type SearchNoResultCategory = 'model' | 'feed' | 'signal';

type SearchNoResultGroup = {
  groupPublicId: string;
  category: SearchNoResultCategory;
  title: string;
  emptyMessage: string;
  suggestedKeywords: string[];
  suggestedSearches: {
    query: string;
    href: string;
  }[];
  helper: string;
  tone: SearchSuggestionTone;
  safetyLabel: string;
  sourceMeta?: {
    localReadModelOnly?: boolean;
    emptyStateOnly?: boolean;
    realtimeExternalData?: boolean;
    externalSearchProvider?: boolean;
    liveQuoteLookup?: boolean;
    externalPaidApi?: boolean;
    financialAdvice?: boolean;
    tradeIntentCreated?: boolean;
    realOrder?: boolean;
    realDeposit?: boolean;
    brokerageConnection?: boolean;
    accountData?: boolean;
  };
};

type InvestModelSearchSuggestions = {
  suggestions: SearchSuggestionChip[];
  recentMockTerms: string[];
  noResultGroups: SearchNoResultGroup[];
  groupedEmptyState: {
    query: string;
    groups: SearchNoResultGroup[];
    safetyMeta: {
      emptyStateOnly?: boolean;
      localReadModelOnly?: boolean;
      externalSearchProvider?: boolean;
      liveQuoteLookup?: boolean;
      externalPaidApi?: boolean;
      financialAdvice?: boolean;
      tradeIntentCreated?: boolean;
      realOrder?: boolean;
      realDeposit?: boolean;
      brokerageConnection?: boolean;
      accountData?: boolean;
    };
  } | null;
  emptyState: {
    title: string;
    message: string;
    groupedSuggestionCount?: number;
    safeFallbackKeywords?: string[];
    safetyLabel?: string;
  } | null;
  safetySummary: string;
  readState: 'loaded' | 'empty' | 'error_fallback';
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFeedDetailHref(postPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/feed/${postPublicId}`, locale);
}

function buildSignalDetailHref(signalPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/signals/${signalPublicId}`, locale);
}

function searchKindDisplayLabel(
  locale: 'ko' | 'en',
  kind: SearchResultKind
) {
  if (locale === 'en') {
    return kind;
  }

  if (kind === 'InvestmentModel') {
    return '투자 모델';
  }

  if (kind === 'FeedPost') {
    return '피드 글';
  }

  return '관찰 신호';
}

function searchDbKindDisplayLabel(
  locale: 'ko' | 'en',
  kind: SearchResultKind
) {
  return locale === 'ko'
    ? `DB ${searchKindDisplayLabel(locale, kind)}`
    : `DB ${kind}`;
}

function searchFormAccessibleLabel(
  locale: 'ko' | 'en',
  query: string,
  resultLabel: string
) {
  const queryLabel =
    query.length > 0
      ? locale === 'ko'
        ? `${query} 검색`
        : `Search for ${query}`
      : locale === 'ko'
        ? '최근 DB 기반 검색 결과'
        : 'Recent DB-backed search results';

  return locale === 'ko'
    ? `${queryLabel}. ${resultLabel}. 투자 모델, DB 기반 피드 글, 관찰 신호만 검색합니다. 추천, 주문, 브로커 계좌, 실시간 외부 데이터, 실잔고 검색이 아닙니다.`
    : `${queryLabel}. ${resultLabel}. Searches only InvestmentModels, DB-backed FeedPosts, and SignalEvents. This is not recommendation, order, brokerage account, realtime external data, or real balance search.`;
}

function searchResultAccessibleLabel(
  locale: 'ko' | 'en',
  kind: SearchResultKind,
  title: string,
  detail: string
) {
  return locale === 'ko'
    ? `${searchKindDisplayLabel(locale, kind)} 결과: ${title}. ${detail}. DB 기반 조회 결과이며 추천, 주문, 브로커 동작 또는 실시간 외부 데이터가 아닙니다.`
    : `${kind} result: ${title}. ${detail}. DB-backed read model result, not a recommendation, order, brokerage action, or realtime external data.`;
}

function searchResultVisibleBoundaries(
  locale: 'ko' | 'en',
  kind: SearchResultKind
) {
  if (locale === 'ko') {
    if (kind === 'InvestmentModel') {
      return ['DB 투자 모델 탐색', '추천 아님', '실주문 없음'];
    }

    if (kind === 'FeedPost') {
      return ['DB 피드 글', '정보 전용', '브로커 미연결'];
    }

    return ['DB 관찰 신호', '관찰 입력', '실시간 외부연동 없음'];
  }

  if (kind === 'InvestmentModel') {
    return ['DB model discovery', 'not advice', 'no orders'];
  }

  if (kind === 'FeedPost') {
    return ['DB FeedPost', 'informational only', 'no brokerage'];
  }

  return ['DB SignalEvent', 'observed input', 'no realtime external data'];
}

function suggestionKindLabel(locale: 'ko' | 'en', kind: SearchSuggestionChip['kind']) {
  if (locale === 'en') {
    return kind === 'topic' ? 'Topic' : kind === 'model' ? 'Model' : 'Signal';
  }

  if (kind === 'topic') {
    return 'Seed topic';
  }

  if (kind === 'model') {
    return 'Seed model';
  }

  return 'Seed signal';
}

function suggestionToneClass(tone: SearchSuggestionTone) {
  if (tone === 'attention') {
    return 'border-invest-primary/40 bg-invest-primary-soft text-invest-primary';
  }

  if (tone === 'risk') {
    return 'border-invest-danger/35 bg-invest-danger-soft text-invest-danger';
  }

  return 'border-invest-border bg-invest-surface text-invest-text';
}

function noResultCategoryLabel(
  locale: 'ko' | 'en',
  category: SearchNoResultCategory
) {
  if (locale === 'en') {
    return category === 'model'
      ? 'InvestmentModel'
      : category === 'feed'
        ? 'FeedPost'
        : 'SignalEvent';
  }

  if (category === 'model') {
    return 'InvestmentModel';
  }

  if (category === 'feed') {
    return 'FeedPost';
  }

  return 'SignalEvent';
}

function suggestionAccessibleLabel(
  locale: 'ko' | 'en',
  suggestion: SearchSuggestionChip
) {
  return locale === 'ko'
    ? `${suggestion.label}. ${suggestionKindLabel(locale, suggestion.kind)}. ${suggestion.helper}. Seed/mock suggestion chip only; live quote lookup, external search, advice, order, TradeIntent, or brokerage action is not connected.`
    : `${suggestion.label}. ${suggestionKindLabel(locale, suggestion.kind)}. ${suggestion.helper}. Seed/mock suggestion chip only; no live quote lookup, external search, advice, order, TradeIntent, or brokerage action.`;
}

function noResultGroupAccessibleLabel(
  locale: 'ko' | 'en',
  group: SearchNoResultGroup
) {
  return locale === 'ko'
    ? `${group.title}. ${noResultCategoryLabel(locale, group.category)} empty-state group. ${group.emptyMessage}. Local seed/read-model only; no live quote lookup, external search provider, paid API, advice, order, TradeIntent, deposit action, account data, or brokerage action.`
    : `${group.title}. ${noResultCategoryLabel(locale, group.category)} empty-state group. ${group.emptyMessage}. Local seed/read-model only; no live quote lookup, external search provider, paid API, advice, order, TradeIntent, deposit action, account data, or brokerage action.`;
}

function GroupedSearchEmptyState({
  locale,
  groups,
  emptyState
}: {
  locale: 'ko' | 'en';
  groups: SearchNoResultGroup[];
  emptyState: InvestModelSearchSuggestions['emptyState'];
}) {
  if (groups.length === 0) {
    return null;
  }

  const label =
    locale === 'ko'
      ? '검색 빈 상태 로컬 제안 그룹. seed/read-model 기반이며 live quote lookup, external search, advice, order, TradeIntent, brokerage, account data, deposit action, paid API는 연결하지 않습니다.'
      : 'Search empty-state local suggestion groups. Seed/read-model based only; no live quote lookup, external search, advice, order, TradeIntent, brokerage, account data, deposit action, or paid API.';

  return (
    <section
      aria-label={label}
      title={label}
      data-search-no-result-groups="local-seed-read-model-only"
      className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
    >
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title={
            locale === 'ko'
              ? '빈 검색 로컬 제안'
              : 'Local suggestions for empty search'
          }
          description={
            emptyState?.safetyLabel ??
            'Grouped empty-state suggestions come from local seed/read-model rows only; no live quote lookup, external search provider, paid API, advice, order, deposit, or brokerage action is connected.'
          }
        />
        <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
          <Search aria-hidden className="size-5" />
        </div>
      </div>

      <div
        role="list"
        aria-label="Grouped empty-state suggestion cards"
        className="mt-4 grid grid-cols-1 gap-2.5"
      >
        {groups.map((group) => {
          const groupLabel = noResultGroupAccessibleLabel(locale, group);

          return (
            <article
              key={group.groupPublicId}
              role="listitem"
              aria-label={groupLabel}
              title={groupLabel}
              className="rounded-invest-card border border-invest-border bg-invest-bg-soft p-3 min-[390px]:p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-invest-control bg-invest-surface text-invest-primary">
                  {group.category === 'signal' ? (
                    <Activity aria-hidden className="size-4" />
                  ) : (
                    <Database aria-hidden className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <RiskBadge tone="neutral">
                      {noResultCategoryLabel(locale, group.category)}
                    </RiskBadge>
                    <RiskBadge tone={group.tone === 'risk' ? 'high' : 'medium'}>
                      {locale === 'ko' ? 'Local seed' : 'Local seed'}
                    </RiskBadge>
                  </div>
                  <h2 className="mt-2 text-[15px] font-bold leading-6 text-invest-text [overflow-wrap:anywhere]">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-invest-text-muted [overflow-wrap:anywhere]">
                    {group.emptyMessage}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.suggestedSearches.map((searchItem) => {
                  const href = withInvestModelLocale(searchItem.href, locale);
                  const searchLabel =
                    locale === 'ko'
                      ? `${searchItem.query} 로컬 seed 검색. live quote lookup, external search, advice, order, TradeIntent, brokerage action 없음.`
                      : `${searchItem.query} local seed search. No live quote lookup, external search, advice, order, TradeIntent, or brokerage action.`;

                  return (
                    <Link
                      key={`${group.groupPublicId}-${searchItem.query}`}
                      href={href}
                      aria-label={searchLabel}
                      title={searchLabel}
                      className={cn(
                        'inline-flex min-h-invest-touch-target min-w-0 flex-1 basis-full items-center justify-between gap-2 rounded-invest-control border border-invest-border bg-invest-surface px-3 py-2 text-left text-[13px] font-bold leading-5 text-invest-text outline-none focus-visible:ring-2 focus-visible:ring-invest-primary focus-visible:ring-offset-2 focus-visible:ring-offset-invest-bg active:scale-[0.98] min-[390px]:basis-[calc(50%-4px)]',
                        investMotionClass.interactiveControl
                      )}
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {searchItem.query}
                      </span>
                      <ArrowRight aria-hidden className="size-4 shrink-0" />
                    </Link>
                  );
                })}
              </div>

              <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-3 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                {group.helper} {group.safetyLabel} Local read model only / no
                live quote lookup / no external search / no advice / no orders /
                no brokerage / no deposit action / no account data / no paid
                API.
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EmptySearchResultCard({
  locale,
  kind,
  message
}: {
  locale: 'ko' | 'en';
  kind: SearchResultKind;
  message: string;
}) {
  const emptyAccessibleLabel =
    locale === 'ko'
      ? `${searchKindDisplayLabel(locale, kind)} 빈 검색 결과. ${message} DB 기반 범위 검색의 빈 상태이며 추천, 주문, 브로커 동작, 실시간 외부 데이터, 실잔고 검색이 아닙니다.`
      : `${kind} empty search result. ${message} Empty state for DB-backed scoped search, not a recommendation, order, brokerage action, realtime external data, or real balance search.`;

  return (
    <div
      aria-label={emptyAccessibleLabel}
      title={emptyAccessibleLabel}
      data-search-empty-kind={kind}
      className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-4 text-sm font-semibold leading-6 text-invest-text-muted min-[390px]:p-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
          {kind === 'SignalEvent' ? (
            <Activity aria-hidden className="size-5" />
          ) : (
            <Database aria-hidden className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
            {searchKindDisplayLabel(locale, kind)}
          </p>
          <p className="mt-1 text-sm leading-6 text-invest-text-muted [overflow-wrap:anywhere]">
            {message}
          </p>
          <p className="mt-2 text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
            {locale === 'ko'
              ? '濡쒖뺄 DB留??뺤씤?⑸땲?? ?몃? 寃?? ?ㅼ떆媛??몃옒?? 異붿쿨, 二쇰Ц, ?낃툑, 釉뚮줈而??곌껐, 湲덉쑖 議곗뼵???꾨떃?덈떎.'
              : 'Local DB only. No external search, realtime traffic, recommendations, orders, deposits, broker connections, or financial advice.'}
          </p>
        </div>
      </div>
      <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-3 py-2 text-xs font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
        {searchResultVisibleBoundaries(locale, kind).join(' / ')}
      </p>
    </div>
  );
}

async function readInvestModelSearchResults(
  query: string
): Promise<InvestModelSearchResults> {
  const search = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await readSearchResults(
    new NextRequest(`http://localhost/api/search${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    return {
      investmentModels: [],
      feedPosts: [],
      signalEvents: []
    };
  }

  const payload = (await response.json()) as { data?: InvestModelSearchResults };

  return {
    investmentModels: payload.data?.investmentModels ?? [],
    feedPosts: payload.data?.feedPosts ?? [],
    signalEvents: payload.data?.signalEvents ?? []
  };
}

async function readInvestModelSearchSuggestions(
  query: string
): Promise<InvestModelSearchSuggestions> {
  const search = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await readSearchSuggestions(
    new NextRequest(`http://localhost/api/search/suggestions${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    return {
      suggestions: [],
      recentMockTerms: [],
      noResultGroups: [],
      groupedEmptyState: null,
      emptyState: {
        title: 'Search suggestion error state',
        message:
          'Seed suggestion chips could not be read. This fallback does not connect live quotes, external search, orders, or brokerage actions.'
      },
      safetySummary:
        'Search suggestion error state. Seed/mock chips only; no live quote lookup, advice, orders, TradeIntent, or brokerage.',
      readState: 'error_fallback'
    };
  }

  const payload = (await response.json()) as {
    data?: Omit<InvestModelSearchSuggestions, 'readState'>;
  };
  const suggestions = payload.data?.suggestions ?? [];
  const noResultGroups =
    payload.data?.groupedEmptyState?.groups ??
    payload.data?.noResultGroups ??
    [];

  return {
    suggestions,
    recentMockTerms: payload.data?.recentMockTerms ?? [],
    noResultGroups,
    groupedEmptyState: payload.data?.groupedEmptyState ?? null,
    emptyState:
      payload.data?.emptyState ??
      (suggestions.length === 0
        ? {
            title: 'Search suggestion empty state',
            message:
              'No seed suggestion chips matched. Live quote lookup and external search providers remain disconnected.'
          }
        : null),
    safetySummary:
      payload.data?.safetySummary ??
      'Seed suggestion chips are read-only discovery shortcuts.',
    readState: suggestions.length > 0 ? 'loaded' : 'empty'
  };
}

export default async function InvestModelSearchPage({
  searchParams
}: InvestModelSearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelCopy[locale];
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const rawQuery = firstSearchParam(resolvedSearchParams.q) ?? '';
  const query = rawQuery.trim();
  const [searchResults, searchSuggestions] = await Promise.all([
    readInvestModelSearchResults(query),
    readInvestModelSearchSuggestions(query)
  ]);
  const filteredModels = searchResults.investmentModels;
  const filteredFeedPosts = searchResults.feedPosts;
  const filteredSignals = searchResults.signalEvents;
  const resultLabel =
    locale === 'ko'
      ? query.length > 0
        ? `투자 모델 ${filteredModels.length}개 | 피드 글 ${filteredFeedPosts.length}개 | 관찰 신호 ${filteredSignals.length}개`
        : `탐색 가능 투자 모델 ${filteredModels.length}개 | 최근 피드 글 ${filteredFeedPosts.length}개 | 최근 관찰 신호 ${filteredSignals.length}개`
      : query.length > 0
        ? `${filteredModels.length} InvestmentModels | ${filteredFeedPosts.length} FeedPosts | ${filteredSignals.length} SignalEvents`
        : `${filteredModels.length} discoverable InvestmentModels | ${filteredFeedPosts.length} recent FeedPosts | ${filteredSignals.length} recent SignalEvents`;
  const searchAccessibleLabel = searchFormAccessibleLabel(
    locale,
    query,
    resultLabel
  );

  return (
    <MobileShell
      activeTab="home"
      eyebrow={locale === 'ko' ? '통합 검색' : 'Search'}
      title={locale === 'ko' ? '검색' : 'Search'}
      locale={locale}
      currentPath="/invest-model/search"
      trailing={
        <NotificationAction
          locale={locale}
          label={copy.actions.notifications}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <form
          action="/invest-model/search"
          aria-label={searchAccessibleLabel}
          title={searchAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
        >
          <input type="hidden" name="lang" value={locale} />
          <label
            htmlFor="invest-model-search-query"
            className="flex items-center gap-2 text-[13px] font-bold leading-5 text-invest-text"
          >
            <Search aria-hidden className="size-4 text-invest-primary" />
            {locale === 'ko'
              ? '모델, 피드 글, 관찰 신호 검색'
              : 'Search models, FeedPosts, and SignalEvents'}
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="invest-model-search-query"
              name="q"
              defaultValue={query}
              aria-label={searchAccessibleLabel}
              title={searchAccessibleLabel}
              placeholder={
                locale === 'ko'
                  ? '모델, 시장, 위험도, 제목'
                  : 'Model, market, risk, or headline'
              }
              className={cn(
                'min-h-invest-touch-target min-w-0 flex-1 rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 text-sm font-semibold text-invest-text outline-none placeholder:text-invest-text-muted/70 focus:border-invest-primary focus:bg-invest-surface',
                investMotionClass.interactiveControl
              )}
            />
            <button
              type="submit"
              aria-label={searchAccessibleLabel}
              title={searchAccessibleLabel}
              className={cn(
                'inline-flex min-h-invest-touch-target shrink-0 items-center justify-center rounded-invest-control bg-invest-primary px-4 text-sm font-bold text-white shadow-invest-card',
                investMotionClass.interactiveControl
              )}
            >
              {locale === 'ko' ? '검색' : 'Search'}
            </button>
          </div>
          <p className="mt-3 text-[12px] font-semibold leading-5 text-invest-text-muted">
            {locale === 'ko'
              ? '검색은 탐색 가능한 투자 모델과 DB 기반 피드 글, 관찰 신호만 읽습니다. 브로커 계좌, 주문, 실시간 외부 피드, 실잔고는 검색하지 않습니다.'
              : 'Search reads discoverable InvestmentModels plus DB-backed FeedPosts and SignalEvents. It does not search broker accounts, orders, realtime external feeds, or real balances.'}
          </p>
        </form>

        <section
          aria-label={
            locale === 'ko'
              ? 'Search suggestion chips. Seed/mock shortcuts only; no live quote lookup, external search, advice, order, TradeIntent, or brokerage action.'
              : 'Search suggestion chips. Seed/mock shortcuts only; no live quote lookup, external search, advice, order, TradeIntent, or brokerage action.'
          }
          title={
            locale === 'ko'
              ? 'Search suggestion chips. Seed/mock shortcuts only; no live quote lookup, external search, advice, order, TradeIntent, or brokerage action.'
              : 'Search suggestion chips. Seed/mock shortcuts only; no live quote lookup, external search, advice, order, TradeIntent, or brokerage action.'
          }
          className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
        >
          <div className="flex items-start justify-between gap-3">
            <SectionHeader
              title={
                locale === 'ko'
                  ? 'Seed suggestion chips'
                  : 'Seed suggestion chips'
              }
              description={
                locale === 'ko'
                  ? 'BK-531 read-only API loaded. Search suggestion chips wrap on 390px and only open local seed/mock search context.'
                  : 'BK-531 read-only API loaded. Search suggestion chips wrap on 390px and only open local seed/mock search context.'
              }
            />
            <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
              <Sparkles aria-hidden className="size-5" />
            </div>
          </div>

          {searchSuggestions.readState === 'loaded' ? (
            <div
              aria-label="Search suggestion chips loaded state"
              className="mt-4 flex flex-wrap gap-2"
            >
              {searchSuggestions.suggestions.map((suggestion) => {
                const href = withInvestModelLocale(suggestion.href, locale);
                const label = suggestionAccessibleLabel(locale, suggestion);

                return (
                  <Link
                    key={suggestion.suggestionPublicId}
                    href={href}
                    aria-label={label}
                    title={label}
                    className={cn(
                      'inline-flex min-h-invest-touch-target basis-full items-center justify-between gap-2 rounded-invest-control border px-3 py-2 text-left text-sm font-bold leading-5 outline-none focus-visible:ring-2 focus-visible:ring-invest-primary focus-visible:ring-offset-2 focus-visible:ring-offset-invest-bg active:scale-[0.98] min-[360px]:basis-[calc(50%-4px)]',
                      suggestionToneClass(suggestion.tone),
                      investMotionClass.interactiveControl
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{suggestion.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold opacity-75">
                        {suggestionKindLabel(locale, suggestion.kind)}
                      </span>
                    </span>
                    <ArrowRight aria-hidden className="size-4 shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-invest-card border border-dashed border-invest-border bg-invest-bg-soft p-4">
              <p className="text-[13px] font-bold leading-5 text-invest-text">
                {searchSuggestions.emptyState?.title ??
                  'Search suggestion empty state'}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-invest-text-muted">
                {searchSuggestions.emptyState?.message ??
                  'Seed suggestion chips are empty. This is not a live search provider, quote lookup, order, or brokerage action.'}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
            <p>
              {searchSuggestions.safetySummary} No live quote lookup / no
              external search / no advice / no orders / no brokerage.
            </p>
            <p className="mt-1">
              Recent mock terms:{' '}
              {searchSuggestions.recentMockTerms.length > 0
                ? searchSuggestions.recentMockTerms.join(' · ')
                : 'Search suggestion empty state'}
            </p>
          </div>
        </section>

        <GroupedSearchEmptyState
          locale={locale}
          groups={searchSuggestions.noResultGroups}
          emptyState={searchSuggestions.emptyState}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? '투자 모델' : 'InvestmentModels'}
            description={
              locale === 'ko'
                ? query.length > 0
                  ? `DB 기반 조회 결과 ${filteredModels.length}개`
                  : `DB 기반 탐색 가능 투자 모델 ${filteredModels.length}개`
                : query.length > 0
                  ? `${filteredModels.length} DB 기반 조회 결과`
                  : `${filteredModels.length} DB-backed discoverable models`
            }
          />
          <div
            role="list"
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => {
                const statusDisplay = getInvestmentModelStatusDisplay(
                  model.status,
                  locale
                );

                return (
                  <Link
                    key={model.modelId}
                    href={withInvestModelLocale(model.href, locale)}
                    role="listitem"
                    aria-label={searchResultAccessibleLabel(
                      locale,
                      'InvestmentModel',
                      model.name,
                      `${statusDisplay.label}. ${model.riskLabel}. ${model.market}. ${model.performanceLabel}`
                    )}
                    title={searchResultAccessibleLabel(
                      locale,
                      'InvestmentModel',
                      model.name,
                      `${statusDisplay.label}. ${model.riskLabel}. ${model.market}. ${model.performanceLabel}`
                    )}
                    className={cn(
                      'group block rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                      investMotionClass.interactiveCard
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                        <Database aria-hidden className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <RiskBadge tone="neutral">
                            {searchKindDisplayLabel(locale, 'InvestmentModel')}
                          </RiskBadge>
                          <RiskBadge tone={statusDisplay.tone}>
                            {statusDisplay.label}
                          </RiskBadge>
                          <RiskBadge tone="medium">
                            {model.riskLabel}
                          </RiskBadge>
                        </div>
                        <h2 className="mt-2 line-clamp-2 text-[16px] font-bold leading-6 text-invest-text">
                          {model.name}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-invest-text-muted">
                          {model.summary}
                        </p>
                        <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-bg-soft px-3 py-2 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                          <span className="min-w-0 truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                            {model.market}
                          </span>
                          <span className="text-[12px] font-bold leading-4 text-invest-primary">
                            {model.performanceLabel}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-[12px] font-semibold leading-4 text-invest-text-muted">
                          <span className="min-w-0 truncate">
                            {locale === 'ko' ? 'DB 기반 조회' : 'DB read model'}
                          </span>
                          <ArrowRight
                            aria-hidden
                            className="size-4 shrink-0 text-invest-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                          />
                        </div>
                        <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-2 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                          {searchResultVisibleBoundaries(
                            locale,
                            'InvestmentModel'
                          ).join(' / ')}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptySearchResultCard
                locale={locale}
                kind="InvestmentModel"
                message={
                  locale === 'ko'
                    ? '이 검색어와 일치하는 투자 모델이 없습니다.'
                    : 'No InvestmentModel matched this search.'
                }
              />
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? '피드 글 결과' : 'Results'}
            description={resultLabel}
          />
          <div
            role="list"
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {filteredFeedPosts.length > 0 ? (
              filteredFeedPosts.map((post) => (
                <Link
                  key={post.postPublicId}
                  href={buildFeedDetailHref(post.postPublicId, locale)}
                  role="listitem"
                  aria-label={searchResultAccessibleLabel(
                    locale,
                    'FeedPost',
                    post.title,
                    post.linkedModelName ??
                      (locale === 'ko'
                        ? '연결된 모델 없음'
                        : 'Unlinked FeedPost')
                  )}
                  title={searchResultAccessibleLabel(
                    locale,
                    'FeedPost',
                    post.title,
                    post.linkedModelName ??
                      (locale === 'ko'
                        ? '연결된 모델 없음'
                        : 'Unlinked FeedPost')
                  )}
                  className={cn(
                    'group block rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                      <Database aria-hidden className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge tone="neutral">{post.postType}</RiskBadge>
                        <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                          {searchDbKindDisplayLabel(locale, 'FeedPost')}
                        </span>
                      </div>
                      <h2 className="mt-2 line-clamp-2 text-[16px] font-bold leading-6 text-invest-text">
                        {post.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-invest-text-muted">
                        {post.body}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2">
                        <span className="min-w-0 truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                          {post.linkedModelName ??
                            (locale === 'ko'
                              ? '연결된 모델 없음'
                              : 'Unlinked FeedPost')}
                        </span>
                        <ArrowRight
                          aria-hidden
                          className="size-4 shrink-0 text-invest-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                        />
                      </div>
                      <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-2 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                        {searchResultVisibleBoundaries(
                          locale,
                          'FeedPost'
                        ).join(' / ')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptySearchResultCard
                locale={locale}
                kind="FeedPost"
                message={
                  locale === 'ko'
                    ? '이 검색어와 일치하는 DB 기반 피드 글이 없습니다.'
                    : 'No DB-backed FeedPost matched this search.'
                }
              />
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? '관찰 신호' : 'SignalEvents'}
            description={
              locale === 'ko'
                ? query.length > 0
                  ? `DB 기반 관찰 신호 결과 ${filteredSignals.length}개`
                  : `최근 DB 기반 관찰 신호 ${filteredSignals.length}개`
                : query.length > 0
                  ? `${filteredSignals.length} DB-backed SignalEvent results`
                  : `${filteredSignals.length} recent DB-backed SignalEvents`
            }
          />
          <div
            role="list"
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {filteredSignals.length > 0 ? (
              filteredSignals.map((signal) => (
                <Link
                  key={signal.signalPublicId}
                  href={buildSignalDetailHref(signal.signalPublicId, locale)}
                  role="listitem"
                  aria-label={searchResultAccessibleLabel(
                    locale,
                    'SignalEvent',
                    signal.title,
                    `${signal.signalType}. ${signal.linkedModelName}. ${signal.scoreDisplay}`
                  )}
                  title={searchResultAccessibleLabel(
                    locale,
                    'SignalEvent',
                    signal.title,
                    `${signal.signalType}. ${signal.linkedModelName}. ${signal.scoreDisplay}`
                  )}
                  className={cn(
                    'group block rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                      <Activity aria-hidden className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge tone="neutral">
                          {signal.signalType}
                        </RiskBadge>
                        <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                          {searchDbKindDisplayLabel(locale, 'SignalEvent')}
                        </span>
                      </div>
                      <h2 className="mt-2 line-clamp-2 text-[16px] font-bold leading-6 text-invest-text">
                        {signal.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-invest-text-muted">
                        {signal.summary}
                      </p>
                      <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-bg-soft px-3 py-2 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                        <span className="min-w-0 truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                          {signal.linkedModelName}
                        </span>
                        <span className="text-[12px] font-bold leading-4 text-invest-primary">
                          {signal.scoreDisplay}
                        </span>
                      </div>
                      <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-2 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                        {searchResultVisibleBoundaries(
                          locale,
                          'SignalEvent'
                        ).join(' / ')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptySearchResultCard
                locale={locale}
                kind="SignalEvent"
                message={
                  locale === 'ko'
                    ? '이 검색어와 일치하는 DB 기반 관찰 신호가 없습니다.'
                    : 'No DB-backed SignalEvent matched this search.'
                }
              />
            )}
          </div>
        </div>

        <div
          aria-label={
            locale === 'ko'
              ? '검색 안전 경계. 결과는 모델 탐색, 정보성 피드 글, 관찰 신호이며 추천, 주문, 수익률 보장, 브로커 동작, 실시간 외부 데이터, 계좌 데이터가 아닙니다.'
              : 'Search safety boundary. Results are model discovery, informational FeedPost, and observed SignalEvent records, not recommendations, orders, return claims, brokerage actions, realtime external data, or account data.'
          }
          title={
            locale === 'ko'
              ? '검색 안전 경계. 결과는 모델 탐색, 정보성 피드 글, 관찰 신호이며 추천, 주문, 수익률 보장, 브로커 동작, 실시간 외부 데이터, 계좌 데이터가 아닙니다.'
              : 'Search safety boundary. Results are model discovery, informational FeedPost, and observed SignalEvent records, not recommendations, orders, return claims, brokerage actions, realtime external data, or account data.'
          }
          className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-primary"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-5 text-invest-text-muted">
                {locale === 'ko' ? '추천 아님 / 주문 없음' : 'No advice / No orders'}
              </p>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? '검색 결과는 로컬 DB 기반 조회 결과의 모델 탐색 기록, 정보성 피드 글 기록, 관찰 신호 행입니다. 추천, 모델 선택, 수익률 주장, 브로커 동작, 실시간 외부 데이터, 계좌 데이터가 아닙니다.'
                  : 'Search results are model discovery records, informational FeedPost records, and observed SignalEvent rows from the local DB-backed read model. They are not recommendations, model selections, return claims, broker actions, realtime external data, or account data.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
