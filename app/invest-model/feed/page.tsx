import {
  Activity,
  Bookmark,
  Eye,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { NextRequest } from 'next/server';
import Link from 'next/link';

import { GET as readFeedPosts } from '@/app/api/feed/route';
import { GET as readFeedRankings } from '@/app/api/feed/rankings/route';
import {
  FeedCardSaveAction,
  EmptyStateCta,
  investMotionClass,
  MobileShell,
  MobileFilterRail,
  RiskBadge,
  SectionHeader,
  SearchAndNotificationActions
} from '@/components/invest-model';
import {
  parseFeedPostType,
  type FeedPostDto,
  type FeedPostRankingDto,
  type FeedPostType
} from '@/lib/domain/feed/feed-post';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
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
  mediaLabel: string;
  sourceContextLabel: string;
  reactionContextLabel: string;
  tags: string[];
};

type RankingCard = {
  postPublicId: string;
  rank: number;
  title: string;
  linkedModelName: string;
  likeCountLabel: string;
  windowLabel: string;
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

const feedCardVisualCopy = {
  ko: {
    model_note: {
      mediaLabel: '모델 메모',
      sourceContextLabel: '모델 관찰 메모 출처',
      reactionContextLabel: '읽음, 저장, 댓글 상태만 기록'
    },
    market_context: {
      mediaLabel: '시장 맥락',
      sourceContextLabel: '시장 관찰 맥락 출처',
      reactionContextLabel: '정보성 반응 상태만 기록'
    },
    risk_note: {
      mediaLabel: '위험 메모',
      sourceContextLabel: '위험 관찰 메모 출처',
      reactionContextLabel: '투자 조언이 아닌 확인 상태'
    },
    review_note: {
      mediaLabel: '검토 메모',
      sourceContextLabel: '운영 검토 메모 출처',
      reactionContextLabel: '검토 읽기 바로가기 상태'
    }
  },
  en: {
    model_note: {
      mediaLabel: 'Model note',
      sourceContextLabel: 'Model observation source',
      reactionContextLabel: 'Read, save, and comment state only'
    },
    market_context: {
      mediaLabel: 'Market context',
      sourceContextLabel: 'Market observation source',
      reactionContextLabel: 'Informational reaction state only'
    },
    risk_note: {
      mediaLabel: 'Risk note',
      sourceContextLabel: 'Risk observation source',
      reactionContextLabel: 'Review state, not investment advice'
    },
    review_note: {
      mediaLabel: 'Review note',
      sourceContextLabel: 'Operator review note source',
      reactionContextLabel: 'Review reading shortcut state'
    }
  }
} as const satisfies Record<
  FeedLocale,
  Record<
    FeedPostType,
    {
      mediaLabel: string;
      sourceContextLabel: string;
      reactionContextLabel: string;
    }
  >
>;

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

function feedDetailHref(locale: FeedLocale, postId: string) {
  const params = new URLSearchParams({ lang: locale });

  return `/invest-model/feed/${postId}?${params.toString()}`;
}

function feedDetailSectionHref(
  locale: FeedLocale,
  postId: string,
  sectionId: string
) {
  return `${feedDetailHref(locale, postId)}#${sectionId}`;
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
  const visualCopy = feedCardVisualCopy[locale][post.postType];

  return {
    id: post.postPublicId,
    authorLabel:
      post.authorDisplayName ??
      (locale === 'ko' ? '모델 인사이트' : 'Model insight'),
    title: post.title,
    typeLabel: feedPostTypeLabels[locale][post.postType],
    sourceLabel: locale === 'ko' ? 'DB 샘플 피드' : 'DB sample feed',
    timeLabel: formatPublishedAt(post.publishedAt, locale),
    tone: feedPostToneByType[post.postType],
    excerpt: body.length > 112 ? `${body.slice(0, 112)}...` : body,
    linkedModelName:
      post.linkedModelName ??
      (locale === 'ko' ? '연결 모델 없음' : 'No linked model'),
    mediaLabel: visualCopy.mediaLabel,
    sourceContextLabel: visualCopy.sourceContextLabel,
    reactionContextLabel: visualCopy.reactionContextLabel,
    tags: [...feedPostTypeTags[locale][post.postType]]
  };
}

function copyPostToFeedCard(post: CopyFeedPost, locale: FeedLocale): FeedCard {
  const visualCopy =
    post.typeLabel === feedPostTypeLabels[locale].market_context
      ? feedCardVisualCopy[locale].market_context
      : post.typeLabel === feedPostTypeLabels[locale].risk_note
        ? feedCardVisualCopy[locale].risk_note
        : post.typeLabel === feedPostTypeLabels[locale].review_note
          ? feedCardVisualCopy[locale].review_note
          : feedCardVisualCopy[locale].model_note;

  return {
    ...post,
    mediaLabel: visualCopy.mediaLabel,
    sourceContextLabel: visualCopy.sourceContextLabel,
    reactionContextLabel: visualCopy.reactionContextLabel,
    tags: [...post.tags]
  };
}

function toRankingCard(
  ranking: FeedPostRankingDto,
  locale: FeedLocale
): RankingCard {
  return {
    postPublicId: ranking.postPublicId,
    rank: ranking.rank,
    title: ranking.title,
    linkedModelName:
      ranking.linkedModelName ??
      (locale === 'ko' ? '연결 모델 없음' : 'No linked model'),
    likeCountLabel:
      locale === 'ko'
        ? `추적 좋아요 ${ranking.likeCount}개`
        : `${ranking.likeCount} tracked likes`,
    windowLabel: ranking.windowLabel
  };
}

function feedFilterAccessibleLabel(
  locale: FeedLocale,
  label: string,
  isActive: boolean,
  visiblePostCountLabel: string
) {
  return locale === 'ko'
    ? `${label} 피드 글 필터. ${isActive ? '현재 선택됨' : '선택 가능'}. DB 기반 피드 조회만 필터링하며 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다. ${visiblePostCountLabel}.`
    : `${label} FeedPost filter. ${isActive ? 'Currently selected' : 'Available'}. ${visiblePostCountLabel}. Filters only the DB-backed FeedPost read model, not recommendations, orders, brokerage actions, or realtime external data.`;
}

function feedPostAccessibleLabel(locale: FeedLocale, post: FeedCard) {
  return locale === 'ko'
    ? `피드 글: ${post.title}. ${post.typeLabel}. ${post.linkedModelName}. ${post.sourceLabel}, ${post.timeLabel}. 정보성 DB 기반 조회 글이며 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다.`
    : `FeedPost: ${post.title}. ${post.typeLabel}. ${post.linkedModelName}. ${post.sourceLabel}, ${post.timeLabel}. Informational DB read model post, not a recommendation, order, brokerage action, or realtime external data.`;
}

function feedActionAccessibleLabel(
  locale: FeedLocale,
  post: FeedCard,
  action: string,
  isPrimaryAction: boolean
) {
  return locale === 'ko'
    ? `${post.title} ${action}. ${isPrimaryAction ? '피드 상세를 열고 읽음 상태를 기록합니다.' : '목록 또는 상세 댓글 영역의 DB 기반 피드 동작을 실행합니다.'} 정보성 피드 상호작용이며 추천, 주문, 브로커 동작이 아닙니다.`
    : `${post.title} ${action}. ${isPrimaryAction ? 'Opens FeedPost detail and records read state.' : 'Runs a DB-backed FeedPost interaction from the list or detail section.'} Informational FeedPost interaction, not a recommendation, order, or brokerage action.`;
}

function feedRankingAccessibleLabel(locale: FeedLocale, ranking: RankingCard) {
  return locale === 'ko'
    ? `피드 좋아요 순위 ${ranking.rank}위: ${ranking.title}. ${ranking.likeCountLabel}, ${ranking.windowLabel}. DB 기반 추적 좋아요 순위이며 모델 품질, 기대 수익, 추천, 주문 근거가 아닙니다.`
    : `FeedPost like ranking #${ranking.rank}: ${ranking.title}. ${ranking.likeCountLabel}, ${ranking.windowLabel}. DB-backed tracked like ranking, not model quality, expected return, recommendation, or order evidence.`;
}

function feedRankingVisibleBoundaries(locale: FeedLocale) {
  return locale === 'ko'
    ? [
        'DB 기반 관심도 순위',
        '정보성 관심도',
        '모델 품질 아님',
        '추천 아님',
        '주문 아님',
        '브로커 미연결'
      ]
    : [
        'DB engagement ranking',
        'informational attention',
        'not model quality',
        'not advice',
        'not an order',
        'no brokerage'
      ];
}

function feedRankingEmptyAccessibleLabel(locale: FeedLocale) {
  return locale === 'ko'
    ? '좋아요 순위 빈 상태입니다. 아직 추적된 DB 좋아요 순위 행이 없으며 정보성 관심도 히스토리만 표시합니다. 추천, 주문, 브로커 연결, 실시간 외부 데이터, 수익 보장과 연결되지 않습니다.'
    : 'Like ranking empty state. No tracked DB like-ranking rows are available yet, and this area only presents informational attention history. Not advice, orders, brokerage connection, realtime external data, or return claims.';
}

function feedEmptyAccessibleLabel(locale: FeedLocale) {
  return locale === 'ko'
    ? '피드 빈 상태입니다. DB 기반 피드 조회 범위만 표시하며 정보성 상태일 뿐 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다.'
    : 'FeedPost empty state. DB-backed FeedPost read model scope only; informational only, not a recommendation, order, brokerage action, or realtime external data.';
}

function feedEmptyVisibleBoundaries(locale: FeedLocale) {
  return locale === 'ko'
    ? [
        'DB 피드 빈 상태',
        '정보성 상태만',
        '추천 아님',
        '주문 아님',
        '브로커 미연결',
        '실시간 외부 데이터 없음'
      ]
    : [
        'DB FeedPost empty state',
        'informational only',
        'no recommendation',
        'no order',
        'no brokerage',
        'no realtime external data'
      ];
}

function feedSafetyAccessibleLabel(locale: FeedLocale) {
  return locale === 'ko'
    ? '피드 안전 경계. 피드 글과 좋아요 순위는 정보성 DB 기반 조회이며 추천, 주문, 수익률 보장, 브로커 동작, 실시간 외부 데이터 또는 실계좌 데이터가 아닙니다.'
    : 'Feed safety boundary. FeedPosts and like rankings are informational DB read models, not recommendations, orders, return claims, brokerage actions, realtime external data, or real account data.';
}

async function readInvestModelFeedRankings(
  locale: FeedLocale
): Promise<RankingCard[]> {
  const response = await readFeedRankings(
    new NextRequest('http://localhost/api/feed/rankings?limit=3', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: FeedPostRankingDto[] };

  return (payload.data ?? []).map((ranking) => toRankingCard(ranking, locale));
}

async function readInvestModelFeedPosts(
  postType: FeedPostType | null
): Promise<FeedPostDto[]> {
  const params = new URLSearchParams({ limit: '20' });

  if (postType) {
    params.set('postType', postType);
  }

  const response = await readFeedPosts(
    new NextRequest(`http://localhost/api/feed?${params.toString()}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    throw new Error('FeedPost route read failed.');
  }

  const payload = (await response.json()) as { data?: FeedPostDto[] };

  return payload.data ?? [];
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
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const feedCopy = copy.feed;
  const { filters, posts: fallbackPosts } = feedCopy;
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
  let rankingCards: RankingCard[] = [];

  try {
    dbPosts = await readInvestModelFeedPosts(selectedPostType);

    if (dbPosts.length === 0) {
      feedReadState = 'empty';
    }
  } catch {
    feedReadState = 'fallback';
  }

  try {
    rankingCards = await readInvestModelFeedRankings(locale);
  } catch {
    rankingCards = [];
  }

  const posts: FeedCard[] =
    feedReadState === 'db'
      ? dbPosts.map((post) => toFeedCard(post, locale))
      : feedReadState === 'fallback'
        ? fallbackPosts.map((post) => copyPostToFeedCard(post, locale))
        : [];
  const visiblePostCountLabel =
    locale === 'ko' ? `${posts.length}개 표시` : `${posts.length} shown`;
  const feedActions =
    locale === 'ko' ? ['읽기', '저장', '댓글'] : ['Read', 'Save', 'Comment'];
  const dataStateLabel =
    feedReadState === 'db'
      ? locale === 'ko'
        ? 'DB 샘플'
        : 'DB sample'
      : feedReadState === 'empty'
        ? locale === 'ko'
          ? '표시할 DB 샘플 피드 없음'
          : 'No DB sample feed rows'
        : locale === 'ko'
          ? '샘플 표시'
          : 'Sample fallback';
  const safetyAccessibleLabel = feedSafetyAccessibleLabel(locale);
  const emptyAccessibleLabel = feedEmptyAccessibleLabel(locale);

  return (
    <MobileShell
      activeTab="feed"
      eyebrow={feedCopy.eyebrow}
      title={feedCopy.title}
      locale={locale}
      currentPath="/invest-model/feed"
      trailing={
        <SearchAndNotificationActions
          locale={locale}
          searchLabel={copy.actions.searchModels}
          notificationLabel={copy.actions.feedNotifications}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={feedCopy.sectionTitle}
            description={feedCopy.sectionDescription}
          />

          <MobileFilterRail
            ariaLabel={locale === 'ko' ? '피드 필터' : 'Feed filters'}
          >
            {filterOptions.map((filter) => {
              const isActive = filter.postType === selectedFilter.postType;
              const filterAccessibleLabel = feedFilterAccessibleLabel(
                locale,
                filter.label,
                isActive,
                visiblePostCountLabel
              );

              return (
                <Link
                  key={filter.label}
                  href={filterHref(locale, filter.postType)}
                  aria-label={filterAccessibleLabel}
                  aria-pressed={isActive}
                  aria-current={isActive ? 'true' : undefined}
                  title={filterAccessibleLabel}
                  className={cn(
                    'inline-flex min-h-invest-touch-target w-full min-w-0 items-center justify-center gap-2 rounded-invest-control border px-3 text-center text-sm font-semibold shadow-invest-card min-[520px]:w-auto',
                    isActive
                      ? 'border-invest-primary/25 bg-invest-primary-soft text-invest-primary'
                      : 'border-invest-border bg-invest-surface text-invest-text',
                    investMotionClass.interactiveControl
                  )}
                >
                  {isActive ? (
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-invest-primary"
                    />
                  ) : null}
                  <span className="min-w-0 truncate">{filter.label}</span>
                </Link>
              );
            })}
          </MobileFilterRail>

          <div className="flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-4 text-invest-text-muted">
            <span className="min-w-0 truncate text-invest-text">
              {selectedFilter.label}
            </span>
            <span className="shrink-0">{visiblePostCountLabel}</span>
          </div>

          <div
            role="list"
            aria-label={feedCopy.sectionTitle}
            className="space-y-2.5 rounded-invest-control bg-invest-bg-soft p-1.5"
          >
            {posts.length > 0 ? (
              posts.map((post) => (
                <article
                  key={post.id}
                  role="listitem"
                  aria-label={feedPostAccessibleLabel(locale, post)}
                  title={feedPostAccessibleLabel(locale, post)}
                  className={cn(
                    'group relative rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus-within:border-invest-primary/40',
                    investMotionClass.interactiveCard
                  )}
                >
                  <Link
                    href={feedDetailHref(locale, post.id)}
                    aria-label={feedActionAccessibleLabel(
                      locale,
                      post,
                      feedActions[0],
                      true
                    )}
                    title={feedActionAccessibleLabel(
                      locale,
                      post,
                      feedActions[0],
                      true
                    )}
                    className="absolute inset-0 z-10 rounded-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-surface"
                  >
                    <span className="sr-only">{post.title}</span>
                  </Link>
                  <div
                    className={cn(
                      'mb-3 h-1.5 rounded-full',
                      postToneAccent[post.tone]
                    )}
                  />
                  <div className="relative z-0 grid gap-3 min-[390px]:grid-cols-[64px_minmax(0,1fr)]">
                    <div
                      className={cn(
                        'grid h-20 w-16 shrink-0 place-items-center rounded-invest-control px-2 py-2 text-center transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100',
                        postToneIcon[post.tone]
                      )}
                    >
                      <MessageSquareText aria-hidden className="size-5" />
                      <span className="line-clamp-2 text-[10px] font-bold leading-3">
                        {post.mediaLabel}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                            {post.authorLabel}
                          </p>
                          <h3 className="mt-1 line-clamp-2 break-words text-[17px] font-semibold leading-6 text-invest-text">
                            {post.title}
                          </h3>
                          <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-invest-control bg-invest-bg-soft p-1.5">
                            {[post.sourceLabel, post.timeLabel].map((meta) => (
                              <span
                                key={`${post.id}-${meta}`}
                                className="min-w-0 truncate rounded-invest-badge bg-invest-surface px-2 py-1 text-center text-[10px] font-bold leading-4 text-invest-text-muted transition-[background-color,color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft/55 group-hover:text-invest-primary group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active:scale-100"
                              >
                                {meta}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 grid gap-1.5 min-[360px]:grid-cols-2">
                            <p className="flex min-w-0 items-center gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
                              <Newspaper
                                aria-hidden
                                className="size-3.5 shrink-0 text-invest-primary"
                              />
                              <span className="truncate">
                                {post.sourceContextLabel}
                              </span>
                            </p>
                            <p className="flex min-w-0 items-center gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
                              <Activity
                                aria-hidden
                                className="size-3.5 shrink-0 text-invest-primary"
                              />
                              <span className="truncate">
                                {post.reactionContextLabel}
                              </span>
                            </p>
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
                      <div className="mt-3 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 border-t border-invest-border pt-3">
                        {feedActions.map((action, index) => {
                          const Icon = feedActionIcons[index];
                          const isPrimaryAction = index === 0;
                          const isSaveAction = index === 1;
                          const isCommentAction = index === 2;
                          const actionAccessibleLabel =
                            feedActionAccessibleLabel(
                              locale,
                              post,
                              action,
                              isPrimaryAction
                            );

                        return (
                            isPrimaryAction ? (
                              <Link
                                key={`${post.id}-${action}`}
                                href={feedDetailHref(locale, post.id)}
                                aria-label={actionAccessibleLabel}
                                aria-pressed="true"
                                title={actionAccessibleLabel}
                                className={cn(
                                  'relative z-20 group inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-invest-control border border-invest-primary/20 bg-invest-primary-soft px-2 text-[12px] font-semibold leading-4 text-invest-primary',
                                  investMotionClass.interactiveControl
                                )}
                              >
                                <Icon
                                  aria-hidden
                                  className="size-3.5 fill-invest-primary/10 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                                />
                                <span className="min-w-0 truncate">
                                  {action}
                                </span>
                              </Link>
                            ) : isSaveAction ? (
                              <FeedCardSaveAction
                                key={`${post.id}-${action}`}
                                postPublicId={post.id}
                                label={action}
                                ariaLabel={actionAccessibleLabel}
                                locale={locale}
                              />
                            ) : isCommentAction ? (
                              <Link
                                key={`${post.id}-${action}`}
                                href={feedDetailSectionHref(
                                  locale,
                                  post.id,
                                  'comments'
                                )}
                                aria-label={actionAccessibleLabel}
                                title={actionAccessibleLabel}
                                className={cn(
                                  'relative z-20 group inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-invest-control border border-transparent bg-invest-bg-soft px-2 text-[12px] font-semibold leading-4 text-invest-text-muted hover:text-invest-primary',
                                  investMotionClass.interactiveControl
                                )}
                              >
                                <Icon
                                  aria-hidden
                                  className="size-3.5 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                                />
                                <span className="min-w-0 truncate">
                                  {action}
                                </span>
                              </Link>
                            ) : (
                              <button
                                key={`${post.id}-${action}`}
                                type="button"
                                aria-label={actionAccessibleLabel}
                                aria-pressed="false"
                                title={actionAccessibleLabel}
                                className={cn(
                                  'relative z-20 group inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-invest-control border border-transparent bg-invest-bg-soft px-2 text-[12px] font-semibold leading-4 text-invest-text-muted hover:text-invest-primary',
                                  investMotionClass.interactiveControl
                                )}
                              >
                                <Icon
                                  aria-hidden
                                  className="size-3.5 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                                />
                                <span className="min-w-0 truncate">
                                  {action}
                                </span>
                              </button>
                            )
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div
                aria-label={emptyAccessibleLabel}
                title={emptyAccessibleLabel}
                className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted"
              >
                <p>
                  {locale === 'ko'
                    ? '선택한 필터에 표시할 DB 샘플 피드가 아직 없습니다.'
                    : 'There are no DB sample feed rows for this filter yet.'}
                </p>
                <p className="mt-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                  {feedEmptyVisibleBoundaries(locale).join(' / ')}
                </p>
                <EmptyStateCta
                  href={filterHref(locale, null)}
                  label={locale === 'ko' ? '전체 피드 보기' : 'View all FeedPosts'}
                  description={
                    locale === 'ko'
                      ? '필터를 해제하고 DB 기반 피드 글을 다시 탐색합니다.'
                      : 'Clear the filter and browse DB-backed FeedPosts again.'
                  }
                  ariaLabel={
                    locale === 'ko'
                      ? '전체 피드 보기. 필터를 해제하고 DB 기반 피드 글을 다시 탐색합니다. 추천, 주문, 브로커 동작, 실시간 외부 데이터가 아닙니다.'
                      : 'View all FeedPosts. Clears the filter and browses DB-backed FeedPosts again. Not advice, an order, brokerage action, or realtime external data.'
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={locale === 'ko' ? '좋아요 순위' : 'Like ranking'}
            description={
              locale === 'ko'
                ? 'DB 기반 관심도 맥락일 뿐이며 모델 품질이나 기대 수익이 아닙니다.'
                : 'DB-backed popularity context only, not model quality or expected return.'
            }
          />

          <div className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
            <div className="grid gap-2.5">
              {rankingCards.length > 0 ? (
                rankingCards.map((ranking) => (
                  <Link
                    key={ranking.postPublicId}
                    href={feedDetailHref(locale, ranking.postPublicId)}
                    aria-label={feedRankingAccessibleLabel(locale, ranking)}
                    title={feedRankingAccessibleLabel(locale, ranking)}
                    className={cn(
                      'group grid gap-3 rounded-invest-control bg-invest-bg-soft p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invest-primary focus-visible:ring-offset-2 focus-visible:ring-offset-invest-surface active:bg-invest-primary-soft/55 min-[400px]:grid-cols-[auto_minmax(0,1fr)]',
                      investMotionClass.interactiveCard
                    )}
                  >
                    <div className="grid size-10 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                      <Trophy aria-hidden className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap gap-1.5">
                        <RiskBadge tone="neutral" className="min-w-0">
                          #{ranking.rank}
                        </RiskBadge>
                        <RiskBadge tone="medium" className="min-w-0">
                          {ranking.windowLabel}
                        </RiskBadge>
                        <span className="min-h-6 min-w-0 max-w-full rounded-invest-badge bg-invest-surface px-2.5 py-1 text-[11px] font-bold leading-4 text-invest-primary">
                          <span className="block truncate">
                            {ranking.likeCountLabel}
                          </span>
                        </span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 break-words text-[15px] font-bold leading-5 text-invest-text">
                        {ranking.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 break-words text-[12px] font-semibold leading-4 text-invest-text-muted">
                        {ranking.linkedModelName}
                      </p>
                      <p className="mt-2 rounded-invest-control bg-invest-surface px-2 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                        {feedRankingVisibleBoundaries(locale).join(' / ')}
                      </p>
                    </div>
                    <p className="min-w-0 text-[11px] font-semibold leading-4 text-invest-text-muted min-[400px]:col-start-2">
                      {locale === 'ko' ? '추천 아님' : 'No advice'}
                    </p>
                  </Link>
                ))
              ) : (
                <div
                  aria-label={feedRankingEmptyAccessibleLabel(locale)}
                  title={feedRankingEmptyAccessibleLabel(locale)}
                  className="rounded-invest-control border border-dashed border-invest-border bg-invest-bg-soft p-4 text-sm font-semibold leading-6 text-invest-text-muted"
                >
                  <p>
                    {locale === 'ko'
                      ? '아직 추적된 좋아요 순위 행이 없습니다.'
                      : 'No tracked like ranking rows yet.'}
                  </p>
                  <p className="mt-3 rounded-invest-control bg-invest-surface px-2 py-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                    {feedRankingVisibleBoundaries(locale).join(' / ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          aria-label={safetyAccessibleLabel}
          title={safetyAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-primary"
            />
            <div className="min-w-0">
              <p className="text-[12px] font-bold leading-5 text-invest-text-muted">
                {feedCopy.footerBadges.noAdvice} /{' '}
                {feedCopy.footerBadges.reviewPlaceholder}
              </p>
              <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                {feedCopy.footer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
