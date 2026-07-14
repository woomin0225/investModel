import {
  Bell,
  Bookmark,
  Eye,
  MessageCircle,
  MessageSquareText,
  ShieldCheck
} from 'lucide-react';
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

const feedActionIcons = [Eye, Bookmark, MessageCircle] as const;

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
  const feedActions =
    locale === 'ko'
      ? ['읽기', '저장', '의견']
      : ['Read', 'Save', 'Discuss'];

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
            'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-primary/20 bg-invest-primary-soft text-invest-primary shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/30',
            investMotionClass.interactiveControl
          )}
        >
          <Bell
            aria-hidden
            className="size-5 transition-transform duration-200 ease-out group-hover:-rotate-6 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100"
          />
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-invest-risk ring-2 ring-invest-primary-soft"
          />
          <span
            aria-hidden
            className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-invest-primary opacity-70 transition-[opacity,transform] duration-200 ease-out group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-active:scale-x-100"
          />
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

          <div
            role="list"
            aria-label={feedCopy.sectionTitle}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {posts.map((post) => (
              <article
                key={post.id}
                role="listitem"
                aria-label={`${post.title} ${post.typeLabel}`}
                className={cn(
                  'rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus-within:border-invest-primary/40',
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
                          {post.authorLabel}
                        </p>
                        <h3 className="mt-1 text-[17px] font-semibold leading-6 text-invest-text">
                          {post.title}
                        </h3>
                        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-invest-control bg-invest-bg-soft p-1.5">
                          {[post.sourceLabel, post.timeLabel, post.typeLabel].map(
                            (meta) => (
                              <span
                                key={`${post.id}-${meta}`}
                                className="min-w-0 truncate rounded-invest-badge bg-invest-surface px-2 py-1 text-center text-[10px] font-bold leading-4 text-invest-text-muted"
                              >
                                {meta}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <RiskBadge
                          tone={postToneBadge[post.tone]}
                          className="justify-center"
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
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-invest-border pt-3">
                      {feedActions.map((action, index) => {
                        const Icon = feedActionIcons[index];
                        const isPrimaryAction = index === 0;

                        return (
                          <button
                            key={`${post.id}-${action}`}
                            type="button"
                            aria-label={`${post.title} ${action}`}
                            aria-pressed={isPrimaryAction}
                            className={cn(
                              'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-invest-control border px-2 text-[12px] font-semibold leading-4',
                              isPrimaryAction
                                ? 'border-invest-primary/20 bg-invest-primary-soft text-invest-primary'
                                : 'border-transparent bg-invest-bg-soft text-invest-text-muted hover:text-invest-primary',
                              investMotionClass.interactiveControl
                            )}
                          >
                            <Icon
                              aria-hidden
                              className={cn(
                                'size-3.5',
                                isPrimaryAction && 'fill-invest-primary/10'
                              )}
                            />
                            <span className="truncate">{action}</span>
                          </button>
                        );
                      })}
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
