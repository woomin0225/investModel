import Link from 'next/link';
import { Activity, ArrowRight, Database, Search, ShieldCheck } from 'lucide-react';
import { NextRequest } from 'next/server';

import {
  investMotionClass,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model';
import { GET as readSearchResults } from '@/app/api/search/route';
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

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFeedDetailHref(postPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/feed/${postPublicId}`, locale);
}

function buildSignalDetailHref(signalPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/signals/${signalPublicId}`, locale);
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
    ? `${queryLabel}. ${resultLabel}. InvestmentModels, DB-backed FeedPosts, SignalEvents만 검색합니다. 추천, 주문, 브로커 계좌, 실시간 외부 데이터, 실잔고 검색이 아닙니다.`
    : `${queryLabel}. ${resultLabel}. Searches only InvestmentModels, DB-backed FeedPosts, and SignalEvents. This is not recommendation, order, brokerage account, realtime external data, or real balance search.`;
}

function searchResultAccessibleLabel(
  locale: 'ko' | 'en',
  kind: 'InvestmentModel' | 'FeedPost' | 'SignalEvent',
  title: string,
  detail: string
) {
  return locale === 'ko'
    ? `${kind} 결과: ${title}. ${detail}. DB-backed read model 결과이며 추천, 주문, 브로커 동작 또는 실시간 외부 데이터가 아닙니다.`
    : `${kind} result: ${title}. ${detail}. DB-backed read model result, not a recommendation, order, brokerage action, or realtime external data.`;
}

function searchResultVisibleBoundaries(
  locale: 'ko' | 'en',
  kind: 'InvestmentModel' | 'FeedPost' | 'SignalEvent'
) {
  if (locale === 'ko') {
    if (kind === 'InvestmentModel') {
      return ['DB 모델 탐색', '추천 아님', '실주문 없음'];
    }

    if (kind === 'FeedPost') {
      return ['DB FeedPost', '정보 전용', '브로커 미연결'];
    }

    return ['DB SignalEvent', '관찰 입력', '실시간 외부연동 없음'];
  }

  if (kind === 'InvestmentModel') {
    return ['DB model discovery', 'not advice', 'no orders'];
  }

  if (kind === 'FeedPost') {
    return ['DB FeedPost', 'informational only', 'no brokerage'];
  }

  return ['DB SignalEvent', 'observed input', 'no realtime external data'];
}

function EmptySearchResultCard({
  locale,
  kind,
  message
}: {
  locale: 'ko' | 'en';
  kind: 'InvestmentModel' | 'FeedPost' | 'SignalEvent';
  message: string;
}) {
  const emptyAccessibleLabel =
    locale === 'ko'
      ? `${kind} 빈 검색 결과. ${message} DB-backed scoped search의 빈 상태이며 추천, 주문, 브로커 동작, 실시간 외부 데이터, 실잔고 검색이 아닙니다.`
      : `${kind} empty search result. ${message} Empty state for DB-backed scoped search, not a recommendation, order, brokerage action, realtime external data, or real balance search.`;

  return (
    <div
      aria-label={emptyAccessibleLabel}
      title={emptyAccessibleLabel}
      className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted"
    >
      <p>{message}</p>
      <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-3 py-2 text-xs font-semibold leading-5 text-invest-text-muted">
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

export default async function InvestModelSearchPage({
  searchParams
}: InvestModelSearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelCopy[locale];
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const rawQuery = firstSearchParam(resolvedSearchParams.q) ?? '';
  const query = rawQuery.trim();
  const searchResults = await readInvestModelSearchResults(query);
  const filteredModels = searchResults.investmentModels;
  const filteredFeedPosts = searchResults.feedPosts;
  const filteredSignals = searchResults.signalEvents;
  const resultLabel =
    query.length > 0
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
      eyebrow={locale === 'ko' ? 'Search' : 'Search'}
      title={locale === 'ko' ? 'Search' : 'Search'}
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
              ? 'Search models, FeedPosts, and SignalEvents'
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
                  ? 'Model, market, risk, or headline'
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
              {locale === 'ko' ? 'Search' : 'Search'}
            </button>
          </div>
          <p className="mt-3 text-[12px] font-semibold leading-5 text-invest-text-muted">
            {locale === 'ko'
              ? 'Search reads discoverable InvestmentModels plus DB-backed FeedPosts and SignalEvents. It does not search broker accounts, orders, realtime external feeds, or real balances.'
              : 'Search reads discoverable InvestmentModels plus DB-backed FeedPosts and SignalEvents. It does not search broker accounts, orders, realtime external feeds, or real balances.'}
          </p>
        </form>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? 'InvestmentModels' : 'InvestmentModels'}
            description={
              query.length > 0
                ? `${filteredModels.length} DB read model results`
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
                          <RiskBadge tone="neutral">InvestmentModel</RiskBadge>
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
                            DB read model
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
                message="No InvestmentModel matched this search."
              />
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? 'Results' : 'Results'}
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
                    post.linkedModelName ?? 'Unlinked FeedPost'
                  )}
                  title={searchResultAccessibleLabel(
                    locale,
                    'FeedPost',
                    post.title,
                    post.linkedModelName ?? 'Unlinked FeedPost'
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
                        <RiskBadge tone="neutral">{post.postType}</RiskBadge>
                        <RiskBadge tone="medium">DB FeedPost</RiskBadge>
                      </div>
                      <h2 className="mt-2 line-clamp-2 text-[16px] font-bold leading-6 text-invest-text">
                        {post.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-invest-text-muted">
                        {post.body}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2">
                        <span className="min-w-0 truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                          {post.linkedModelName ?? 'Unlinked FeedPost'}
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
                message="No DB-backed FeedPost matched this search."
              />
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? 'SignalEvents' : 'SignalEvents'}
            description={
              query.length > 0
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
                      <div className="flex flex-wrap gap-2">
                        <RiskBadge tone="neutral">
                          {signal.signalType}
                        </RiskBadge>
                        <RiskBadge tone="medium">DB SignalEvent</RiskBadge>
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
                message="No DB-backed SignalEvent matched this search."
              />
            )}
          </div>
        </div>

        <div
          aria-label={
            locale === 'ko'
              ? '검색 안전 경계. 결과는 모델 탐색, 정보성 FeedPost, 관찰 SignalEvent이며 추천, 주문, 수익률 보장, 브로커 동작, 실시간 외부 데이터, 계좌 데이터가 아닙니다.'
              : 'Search safety boundary. Results are model discovery, informational FeedPost, and observed SignalEvent records, not recommendations, orders, return claims, brokerage actions, realtime external data, or account data.'
          }
          title={
            locale === 'ko'
              ? '검색 안전 경계. 결과는 모델 탐색, 정보성 FeedPost, 관찰 SignalEvent이며 추천, 주문, 수익률 보장, 브로커 동작, 실시간 외부 데이터, 계좌 데이터가 아닙니다.'
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
                No advice / No orders
              </p>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? 'Search results are model discovery records, informational FeedPost records, and observed SignalEvent rows from the local DB-backed read model. They are not recommendations, model selections, return claims, broker actions, realtime external data, or account data.'
                  : 'Search results are model discovery records, informational FeedPost records, and observed SignalEvent rows from the local DB-backed read model. They are not recommendations, model selections, return claims, broker actions, realtime external data, or account data.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
