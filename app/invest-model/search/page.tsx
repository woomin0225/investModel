import Link from 'next/link';
import { Activity, ArrowRight, Database, Search, ShieldCheck } from 'lucide-react';

import {
  investMotionClass,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model';
import { readFeedPostDtos } from '@/lib/db/feed-read-model';
import { readSignalEventDtos } from '@/lib/db/signal-read-model';
import type { FeedPostDto } from '@/lib/domain/feed/feed-post';
import type { SignalEventDto } from '@/lib/domain/signals/signal-event';
import {
  getInvestmentModelStatusDisplay,
  investModelCopy,
  type InvestmentModelPublicationStatus,
  isPublicDiscoverableInvestmentModel,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type InvestModelSearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SearchableInvestmentModel = {
  id: string;
  name: string;
  summary: string;
  market: string;
  riskLabel: string;
  riskTone: 'neutral' | 'low' | 'medium' | 'high' | 'blocked';
  performanceLabel: string;
  mandateLabel: string;
  status: InvestmentModelPublicationStatus;
  tags: readonly string[];
  reviewLabel: string;
  simulatedAumLabel: string;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function matchesFeedPostSearch(post: FeedPostDto, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    post.title,
    post.body,
    post.linkedModelName,
    post.authorDisplayName,
    post.postType,
    ...post.tags
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

  return searchableText.includes(normalizedQuery);
}

function matchesSignalEventSearch(signal: SignalEventDto, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    signal.title,
    signal.summary,
    signal.linkedModelName,
    signal.signalType,
    signal.sourceLabel,
    signal.scoreDisplay
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

  return searchableText.includes(normalizedQuery);
}

function matchesInvestmentModelSearch(
  model: SearchableInvestmentModel,
  query: string
) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    model.name,
    model.summary,
    model.market,
    model.riskLabel,
    model.performanceLabel,
    model.mandateLabel,
    model.reviewLabel,
    model.simulatedAumLabel,
    model.status,
    ...model.tags
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

  return searchableText.includes(normalizedQuery);
}

function buildFeedDetailHref(postPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/feed/${postPublicId}`, locale);
}

function buildSignalDetailHref(signalPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/signals/${signalPublicId}`, locale);
}

function buildModelDetailHref(modelId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/models/${modelId}`, locale);
}

export default async function InvestModelSearchPage({
  searchParams
}: InvestModelSearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelCopy[locale];
  const rawQuery = firstSearchParam(resolvedSearchParams.q) ?? '';
  const query = rawQuery.trim();
  const [feedPosts, signals] = await Promise.all([
    readFeedPostDtos({ limit: 30 }),
    readSignalEventDtos({ limit: 20 })
  ]);
  const discoverableModels = copy.models.models.filter(
    isPublicDiscoverableInvestmentModel
  );
  const filteredModels = discoverableModels.filter((model) =>
    matchesInvestmentModelSearch(model, query)
  );
  const filteredFeedPosts = feedPosts.filter((post) =>
    matchesFeedPostSearch(post, query)
  );
  const filteredSignals = signals.filter((signal) =>
    matchesSignalEventSearch(signal, query)
  );
  const resultLabel =
    query.length > 0
      ? `${filteredModels.length} InvestmentModels | ${filteredFeedPosts.length} FeedPosts | ${filteredSignals.length} SignalEvents`
      : `${filteredModels.length} discoverable InvestmentModels | ${filteredFeedPosts.length} recent FeedPosts | ${filteredSignals.length} recent SignalEvents`;

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
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <form
          action="/invest-model/search"
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
                ? `${filteredModels.length} mock discovery model results`
                : `${filteredModels.length} discoverable mock discovery models`
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
                    key={model.id}
                    href={buildModelDetailHref(model.id, locale)}
                    role="listitem"
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
                          <RiskBadge tone={model.riskTone}>
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
                            Mock discovery model
                          </span>
                          <ArrowRight
                            aria-hidden
                            className="size-4 shrink-0 text-invest-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? 'No InvestmentModel matched this search.'
                  : 'No InvestmentModel matched this search.'}
              </div>
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
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? 'No DB-backed FeedPost matched this search.'
                  : 'No DB-backed FeedPost matched this search.'}
              </div>
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
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? 'No DB-backed SignalEvent matched this search.'
                  : 'No DB-backed SignalEvent matched this search.'}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-primary"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="blocked">
                  {locale === 'ko' ? 'No advice' : 'No advice'}
                </RiskBadge>
                <RiskBadge tone="medium">
                  {locale === 'ko' ? 'No orders' : 'No orders'}
                </RiskBadge>
              </div>
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
