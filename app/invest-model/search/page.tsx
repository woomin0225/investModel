import Link from 'next/link';
import { ArrowRight, Database, Search, ShieldCheck } from 'lucide-react';

import {
  investMotionClass,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model';
import { readFeedPostDtos } from '@/lib/db/feed-read-model';
import type { FeedPostDto } from '@/lib/domain/feed/feed-post';
import {
  investModelCopy,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type InvestModelSearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

function buildFeedDetailHref(postPublicId: string, locale: 'ko' | 'en') {
  return withInvestModelLocale(`/invest-model/feed/${postPublicId}`, locale);
}

export default async function InvestModelSearchPage({
  searchParams
}: InvestModelSearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelCopy[locale];
  const rawQuery = firstSearchParam(resolvedSearchParams.q) ?? '';
  const query = rawQuery.trim();
  const feedPosts = await readFeedPostDtos({ limit: 30 });
  const filteredFeedPosts = feedPosts.filter((post) =>
    matchesFeedPostSearch(post, query)
  );
  const resultLabel =
    query.length > 0
      ? `${filteredFeedPosts.length} DB-backed FeedPost results`
      : `${filteredFeedPosts.length} recent DB-backed FeedPosts`;

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
            {locale === 'ko' ? 'Search FeedPosts' : 'Search FeedPosts'}
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
              ? 'This first search slice reads DB-backed FeedPosts only. It does not search broker accounts, orders, or real balances.'
              : 'This first search slice reads DB-backed FeedPosts only. It does not search broker accounts, orders, or real balances.'}
          </p>
        </form>

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
                  ? 'Search results are informational FeedPost records from the local DB-backed read model. They are not recommendations, return claims, broker actions, or account data.'
                  : 'Search results are informational FeedPost records from the local DB-backed read model. They are not recommendations, return claims, broker actions, or account data.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
