import { Bell, MessageSquareText, ShieldCheck } from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

const postToneBadge = {
  neutral: 'neutral',
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

const postToneAccent = {
  neutral: 'bg-invest-primary',
  low: 'bg-invest-positive',
  medium: 'bg-invest-warning',
  high: 'bg-invest-risk'
} as const;

const postToneIcon = {
  neutral: 'bg-invest-bg-soft text-invest-primary',
  low: 'bg-invest-positive-soft text-invest-positive',
  medium: 'bg-invest-warning-soft text-[#966300]',
  high: 'bg-invest-risk-soft text-invest-risk'
} as const;

type InvestModelFeedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestModelFeedPage({
  searchParams
}: InvestModelFeedPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = investModelCopy[locale];
  const feedCopy = copy.feed;
  const { summary, filters, posts } = feedCopy;
  const selectedFilter = filters[0];
  const visiblePostCountLabel =
    locale === 'ko' ? `${posts.length}개 표시` : `${posts.length} shown`;

  return (
    <MobileShell
      activeTab="feed"
      eyebrow={feedCopy.eyebrow}
      title={feedCopy.title}
      locale={locale}
      currentPath="/invest-model/feed"
      trailing={
        <button
          type="button"
          aria-label={copy.actions.feedNotifications}
          className={cn(
            'grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card',
            investMotionClass.interactiveControl
          )}
        >
          <Bell aria-hidden className="size-5" />
        </button>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={feedCopy.bannerEyebrow}
          title={summary.title}
          description={summary.description}
          icon={MessageSquareText}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={feedCopy.metrics.posts}
            value={summary.postCountLabel}
            description={feedCopy.metrics.prototypeContent}
            trend={feedCopy.metrics.mock}
          />
          <MetricCard
            label={feedCopy.metrics.sources}
            value={summary.sourceCountLabel}
            description={feedCopy.metrics.approvedModelContext}
            trend={feedCopy.metrics.sample}
          />
        </div>

        <MetricCard
          label={feedCopy.metrics.disclosureState}
          value={summary.reviewLabel}
          description={feedCopy.metrics.legalCopy}
          trend={feedCopy.metrics.review}
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={feedCopy.sectionTitle}
            description={feedCopy.sectionDescription}
          />

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {filters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={index === 0}
                  className={cn(
                    'inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control border px-3 text-sm font-semibold shadow-invest-card',
                    index === 0
                      ? 'border-invest-primary/25 bg-invest-primary-soft text-invest-primary'
                      : 'border-invest-border bg-invest-surface text-invest-text',
                    investMotionClass.interactiveControl
                  )}
                >
                  {index === 0 ? (
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-invest-primary"
                    />
                  ) : null}
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-4 text-invest-text-muted">
            <span className="min-w-0 truncate text-invest-text">
              {selectedFilter}
            </span>
            <span className="shrink-0">{visiblePostCountLabel}</span>
          </div>

          <div className="space-y-invest-card-gap">
            {posts.map((post) => (
              <article
                key={post.id}
                aria-label={`${post.title} ${post.typeLabel}`}
                className={cn(
                  'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card focus-within:border-invest-primary/40',
                  investMotionClass.interactiveCard
                )}
              >
                <div
                  className={cn(
                    'mb-3 h-1.5 rounded-full',
                    postToneAccent[post.tone]
                  )}
                />
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-invest-control',
                      postToneIcon[post.tone]
                    )}
                  >
                    <MessageSquareText aria-hidden className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                          {post.authorLabel} / {post.sourceLabel}
                        </p>
                        <h3 className="mt-1 text-[17px] font-semibold leading-6 text-invest-text">
                          {post.title}
                        </h3>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[12px] font-semibold leading-4 text-invest-text-muted">
                          {post.timeLabel}
                        </p>
                        <RiskBadge
                          tone={postToneBadge[post.tone]}
                          className="mt-2"
                        >
                          {post.typeLabel}
                        </RiskBadge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                      {post.excerpt}
                    </p>
                    <div className="mt-3 grid gap-2 border-t border-invest-border pt-3 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
                      <p className="min-w-0 truncate rounded-full bg-invest-surface-muted px-3 py-1.5 text-[12px] font-semibold leading-4 text-invest-text-muted">
                        {post.linkedModelName}
                      </p>
                      <div className="flex min-w-0 flex-wrap justify-start gap-1.5 min-[360px]:justify-end">
                        {post.tags.slice(0, 2).map((tag) => (
                          <RiskBadge key={`${post.id}-${tag}`} tone="neutral">
                            {tag}
                          </RiskBadge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                      {post.tags.slice(2).map((tag) => (
                        <RiskBadge key={`${post.id}-${tag}`} tone="neutral">
                          {tag}
                        </RiskBadge>
                      ))}
                    </div>
                    <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
                      {post.tags.slice(2).map((tag) => (
                        <RiskBadge key={`${post.id}-${tag}`} tone="neutral">
                          {tag}
                        </RiskBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
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
                  {feedCopy.footerBadges.noAdvice}
                </RiskBadge>
                <RiskBadge tone="medium">
                  {feedCopy.footerBadges.reviewPlaceholder}
                </RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {feedCopy.footer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
