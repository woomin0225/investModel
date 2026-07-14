import {
  Bookmark,
  Eye,
  MessageCircle,
  MessageSquareText,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

import {
  investMotionClass,
  MetricCard,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { readFeedPostDtos } from '@/lib/db/feed-read-model';
import {
  parseFeedPostType,
  type FeedPostDto,
  type FeedPostType
} from '@/lib/domain/feed/feed-post';
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

type FeedLocale = 'ko' | 'en';
type FeedPostTone = keyof typeof postToneAccent;
type CopyFeedPost = (typeof investModelCopy)[FeedLocale]['feed']['posts'][number];

type FeedCard = {
  id: string;
  authorLabel: string;
  title: string;
  typeLabel: string;
  sourceLabel: string;
  timeLabel: string;
  tone: FeedPostTone;
  excerpt: string;
  linkedModelName: string;
  tags: string[];
};

const feedPostToneByType = {
  model_note: 'low',
  market_context: 'medium',
  risk_note: 'high',
  review_note: 'neutral'
} as const satisfies Record<FeedPostType, FeedPostTone>;

const feedPostTypeLabels = {
  ko: {
    model_note: '모델 노트',
    market_context: '시장 맥락',
    risk_note: '위험 노트',
    review_note: '검토 노트'
  },
  en: {
    model_note: 'Model note',
    market_context: 'Market context',
    risk_note: 'Risk note',
    review_note: 'Review note'
  }
} as const satisfies Record<FeedLocale, Record<FeedPostType, string>>;

const feedPostTypeTags = {
  ko: {
    model_note: ['모델 관찰', 'DB 샘플'],
    market_context: ['시장 맥락', '관찰 입력'],
    risk_note: ['위험 알림', '변동성'],
    review_note: ['운영 검토', '정보성']
  },
  en: {
    model_note: ['model note', 'DB sample'],
    market_context: ['market context', 'observed input'],
    risk_note: ['risk note', 'volatility'],
    review_note: ['review note', 'informational']
  }
} as const satisfies Record<FeedLocale, Record<FeedPostType, string[]>>;

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function filterHref(locale: FeedLocale, postType: FeedPostType | null) {
  const params = new URLSearchParams({ lang: locale });

  if (postType) {
    params.set('postType', postType);
  }

  return `/invest-model/feed?${params.toString()}`;
}

function formatPublishedAt(value: string | undefined, locale: FeedLocale) {
  if (!value) {
    return locale === 'ko' ? '시각 미정' : 'Time pending';
  }

  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function toFeedCard(post: FeedPostDto, locale: FeedLocale): FeedCard {
  const body = post.body.trim();

  return {
    id: post.postPublicId,
    authorLabel:
      post.authorDisplayName ??
      (locale === 'ko' ? '모델 인사이트' : 'Model insight'),
    title: post.title,
    typeLabel: feedPostTypeLabels[locale][post.postType],
    sourceLabel: locale === 'ko' ? 'DB 피드' : 'DB feed',
    timeLabel: formatPublishedAt(post.publishedAt, locale),
    tone: feedPostToneByType[post.postType],
    excerpt: body.length > 112 ? `${body.slice(0, 112)}...` : body,
    linkedModelName:
      post.linkedModelName ??
      (locale === 'ko' ? '연결 모델 없음' : 'No linked model'),
    tags: [...feedPostTypeTags[locale][post.postType]]
  };
}

function copyPostToFeedCard(post: CopyFeedPost): FeedCard {
  return {
    ...post,
    tags: [...post.tags]
  };
}

export default async function InvestModelFeedPage({
  searchParams
}: InvestModelFeedPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const selectedPostType = parseFeedPostType(
    firstSearchParam(resolvedSearchParams.postType) ?? null
  );
  const copy = investModelCopy[locale];
  const feedCopy = copy.feed;
  const { summary, filters, posts: fallbackPosts } = feedCopy;
  const filterOptions = [
    { label: filters[0], postType: null },
    { label: filters[1], postType: 'model_note' },
    { label: filters[2], postType: 'market_context' },
    { label: filters[3], postType: 'risk_note' }
  ] as const satisfies ReadonlyArray<{
    label: string;
    postType: FeedPostType | null;
  }>;
  const selectedFilter =
    filterOptions.find((filter) => filter.postType === selectedPostType) ??
    filterOptions[0];
  let feedReadState: 'db' | 'empty' | 'fallback' = 'db';
  let dbPosts: FeedPostDto[] = [];

  try {
    dbPosts = await readFeedPostDtos({ postType: selectedPostType, limit: 20 });

    if (dbPosts.length === 0) {
      feedReadState = 'empty';
    }
  } catch {
    feedReadState = 'fallback';
  }

  const posts: FeedCard[] =
    feedReadState === 'db'
      ? dbPosts.map((post) => toFeedCard(post, locale))
      : feedReadState === 'fallback'
        ? fallbackPosts.map(copyPostToFeedCard)
        : [];
  const visiblePostCountLabel =
    locale === 'ko' ? `${posts.length}개 표시` : `${posts.length} shown`;
  const feedActions =
    locale === 'ko' ? ['읽기', '저장', '댓글'] : ['Read', 'Save', 'Comment'];
  const dataStateLabel =
    feedReadState === 'db'
      ? locale === 'ko'
        ? 'DB 기반'
        : 'DB backed'
      : feedReadState === 'empty'
        ? locale === 'ko'
          ? '표시할 DB 피드 없음'
          : 'No DB feed rows'
        : locale === 'ko'
          ? '샘플 표시'
          : 'Sample fallback';

  return (
    <MobileShell
      activeTab="feed"
      eyebrow={feedCopy.eyebrow}
      title={feedCopy.title}
      locale={locale}
      currentPath="/invest-model/feed"
      trailing={
        <NotificationAction
          locale={locale}
          label={copy.actions.feedNotifications}
        />
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
            value={visiblePostCountLabel}
            description={dataStateLabel}
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
              {filterOptions.map((filter) => {
                const isActive = filter.postType === selectedFilter.postType;

                return (
                  <Link
                    key={filter.label}
                    href={filterHref(locale, filter.postType)}
                    aria-pressed={isActive}
                    className={cn(
                      'inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control border px-3 text-sm font-semibold shadow-invest-card',
                      isActive
                        ? 'border-invest-primary/25 bg-invest-primary-soft text-invest-primary'
                        : 'border-invest-border bg-invest-surface text-invest-text',
                      investMotionClass.interactiveControl
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-invest-primary"
                      />
                    ) : null}
                    {filter.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-4 text-invest-text-muted">
            <span className="min-w-0 truncate text-invest-text">
              {selectedFilter.label}
            </span>
            <span className="shrink-0">{visiblePostCountLabel}</span>
          </div>

          <div
            role="list"
            aria-label={feedCopy.sectionTitle}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {posts.length > 0 ? (
              posts.map((post) => (
                <article
                  key={post.id}
                  role="listitem"
                  aria-label={`${post.title} ${post.typeLabel}`}
                  className={cn(
                    'group rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus-within:border-invest-primary/40',
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
                        'grid size-11 shrink-0 place-items-center rounded-invest-control transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100',
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
                            {[
                              post.sourceLabel,
                              post.timeLabel,
                              post.typeLabel
                            ].map((meta) => (
                              <span
                                key={`${post.id}-${meta}`}
                                className="min-w-0 truncate rounded-invest-badge bg-invest-surface px-2 py-1 text-center text-[10px] font-bold leading-4 text-invest-text-muted transition-[background-color,color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft/55 group-hover:text-invest-primary group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active:scale-100"
                              >
                                {meta}
                              </span>
                            ))}
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
                        <p className="min-w-0 truncate rounded-full bg-invest-surface-muted px-3 py-1.5 text-[12px] font-semibold leading-4 text-invest-text-muted transition-[background-color,color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft/60 group-hover:text-invest-primary group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100">
                          {post.linkedModelName}
                        </p>
                        <div className="flex min-w-0 flex-wrap justify-start gap-1.5 min-[360px]:justify-end">
                          {post.tags.slice(0, 2).map((tag) => (
                            <RiskBadge
                              key={`${post.id}-${tag}`}
                              tone="neutral"
                              className="transition-transform duration-200 ease-out group-hover:scale-[1.01] group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                            >
                              {tag}
                            </RiskBadge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.tags.slice(2).map((tag) => (
                          <RiskBadge
                            key={`${post.id}-${tag}`}
                            tone="neutral"
                            className="transition-transform duration-200 ease-out group-hover:scale-[1.01] group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                          >
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
                                'group inline-flex min-h-9 items-center justify-center gap-1.5 rounded-invest-control border px-2 text-[12px] font-semibold leading-4',
                                isPrimaryAction
                                  ? 'border-invest-primary/20 bg-invest-primary-soft text-invest-primary'
                                  : 'border-transparent bg-invest-bg-soft text-invest-text-muted hover:text-invest-primary',
                                investMotionClass.interactiveControl
                              )}
                            >
                              <Icon
                                aria-hidden
                                className={cn(
                                  'size-3.5 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100',
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
              ))
            ) : (
              <div className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? '선택한 필터에 표시할 DB 피드가 아직 없습니다.'
                  : 'There are no DB feed rows for this filter yet.'}
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
