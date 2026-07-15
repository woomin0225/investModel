import {
  ArrowLeft,
  MessageCircle,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NextRequest } from 'next/server';

import { GET as readFeedPostDetail } from '@/app/api/feed/[postId]/route';
import {
  FeedCommentAction,
  FeedLikeAction,
  FeedReadAction,
  FeedSaveAction,
  investMotionClass,
  MobileShell,
  NotificationAction,
  RiskBadge
} from '@/components/invest-model';
import type {
  FeedCommentDto,
  FeedPostDetailDto
} from '@/lib/domain/feed/feed-post';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type FeedDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type FeedLocale = 'ko' | 'en';

type FeedDetailApiResponse = {
  data: FeedPostDetailDto;
  meta: {
    routeStatus: string;
    informationalOnly: boolean;
    realOrder: boolean;
    brokerageConnection: boolean;
    financialAdvice: boolean;
  };
};

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

function feedActionVisibleBoundaries(locale: FeedLocale) {
  return locale === 'ko'
    ? ['DB 사용자 상태', '정보성 반응', '추천 아님', '실주문 없음', '브로커 미연결']
    : [
        'DB user state',
        'informational interaction',
        'not advice',
        'no orders',
        'no brokerage'
      ];
}

function feedActionBoundaryLabel(locale: FeedLocale) {
  return locale === 'ko'
    ? 'Feed 상세 액션은 DB 사용자 범위의 읽음, 댓글, 좋아요, 저장 상태만 변경하며 추천, 실주문, 브로커 연결, 투자 조언이 아닙니다.'
    : 'Feed detail actions only change DB user-scoped read, comment, like, and save state; they are not advice, orders, brokerage, or investment recommendations.';
}

function CommentItem({
  comment,
  locale,
  depth = 0
}: {
  comment: FeedCommentDto;
  locale: FeedLocale;
  depth?: number;
}) {
  return (
    <div
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card',
        depth > 0 && 'ml-5 border-invest-primary/15 bg-invest-primary-soft/25'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-5 text-invest-text">
            {comment.authorDisplayName}
          </p>
          <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
            {formatPublishedAt(comment.createdAt, locale)}
          </p>
        </div>
        {comment.replyCount > 0 ? (
          <RiskBadge tone="neutral">
            {locale === 'ko'
              ? `답글 ${comment.replyCount}`
              : `${comment.replyCount} replies`}
          </RiskBadge>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-invest-text-muted">
        {comment.body}
      </p>
      {comment.replies?.length ? (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.commentPublicId}
              comment={reply}
              locale={locale}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

async function readInvestModelFeedPostDetail({
  postPublicId
}: {
  postPublicId: string;
}) {
  const response = await readFeedPostDetail(
    new NextRequest(`http://localhost/api/feed/${postPublicId}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    }),
    {
      params: Promise.resolve({
        postId: postPublicId
      })
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('InvestModel FeedPost detail API contract returned an error.');
  }

  return ((await response.json()) as FeedDetailApiResponse).data;
}

export default async function InvestModelFeedDetailPage({
  params,
  searchParams
}: FeedDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelCopy[locale];
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const feedCopy = copy.feed;
  const post = await readInvestModelFeedPostDetail({
    postPublicId: resolvedParams.postId
  });

  if (!post) {
    notFound();
  }

  const currentPath = `/invest-model/feed/${resolvedParams.postId}`;
  const backHref = `/invest-model/feed?lang=${locale}`;
  const userPublicId = post.userState.userPublicId;
  const stateItems = [
    {
      label: locale === 'ko' ? '댓글' : 'Comments',
      value: String(post.userState.commentCount),
      icon: MessageCircle
    }
  ];

  return (
    <MobileShell
      activeTab="feed"
      eyebrow={locale === 'ko' ? 'Feed Detail' : 'Feed Detail'}
      title={locale === 'ko' ? '피드 상세' : 'Feed Detail'}
      locale={locale}
      currentPath={currentPath}
      trailing={
        <NotificationAction
          locale={locale}
          label={copy.actions.feedNotifications}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <Link
          href={backHref}
          className={cn(
            'inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control border border-invest-border bg-invest-surface px-3 text-sm font-bold text-invest-text shadow-invest-card',
            investMotionClass.interactiveControl
          )}
        >
          <ArrowLeft aria-hidden className="size-4" />
          {locale === 'ko' ? '피드로 돌아가기' : 'Back to feed'}
        </Link>

        <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
              <MessageSquareText aria-hidden className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="neutral">{post.postType}</RiskBadge>
                <RiskBadge tone="medium">
                  {post.sourceAttribution.reviewState}
                </RiskBadge>
              </div>
              <h2 className="mt-3 text-[22px] font-bold leading-7 text-invest-text">
                {post.title}
              </h2>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-invest-text-muted">
                {post.authorDisplayName ?? 'investModel'} ·{' '}
                {formatPublishedAt(post.publishedAt, locale)}
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-invest-text">
            {post.body}
          </p>

          <div className="mt-5 rounded-invest-card bg-invest-bg-soft p-3">
            <p className="text-[12px] font-bold leading-4 text-invest-text">
              {locale === 'ko' ? '연결 모델' : 'Linked model'}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-invest-text-muted">
              {post.linkedModelName ??
                (locale === 'ko' ? '연결 모델 없음' : 'No linked model')}
            </p>
          </div>

          <div className="mt-3 rounded-invest-card bg-invest-bg-soft p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold leading-4 text-invest-text">
                Related SignalEvents
              </p>
              <RadioTower
                aria-hidden
                className="size-4 shrink-0 text-invest-primary"
              />
            </div>
            {post.relatedSignalPublicIds.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {post.relatedSignalPublicIds.map((signalPublicId) => (
                  <Link
                    key={signalPublicId}
                    href={`/invest-model/signals/${signalPublicId}?lang=${locale}`}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-invest-control border border-invest-border bg-invest-surface px-3 text-[12px] font-bold text-invest-text-muted',
                      investMotionClass.interactiveControl
                    )}
                    aria-label={`Open related DB-backed SignalEvent ${signalPublicId}. Informational context only, not advice or an order.`}
                  >
                    {signalPublicId}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm font-semibold leading-6 text-invest-text-muted">
                No DB-backed SignalEvent links yet.
              </p>
            )}
          </div>
        </article>

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <FeedReadAction
            postPublicId={post.postPublicId}
            userPublicId={userPublicId}
            initialState={post.userState}
            locale={locale}
          />
          {stateItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold leading-4 text-invest-text-muted">
                    {item.label}
                  </p>
                  <Icon aria-hidden className="size-4 text-invest-primary" />
                </div>
                <p className="mt-2 text-xl font-bold leading-6 text-invest-text">
                  {item.value}
                </p>
              </div>
            );
          })}
          <FeedLikeAction
            postPublicId={post.postPublicId}
            userPublicId={userPublicId}
            initialState={post.userState}
            locale={locale}
          />
          <FeedSaveAction
            postPublicId={post.postPublicId}
            userPublicId={userPublicId}
            initialState={post.userState}
            locale={locale}
          />
        </div>

        <div
          className="flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-2"
          aria-label={feedActionBoundaryLabel(locale)}
          title={feedActionBoundaryLabel(locale)}
        >
          {feedActionVisibleBoundaries(locale).map((boundary) => (
            <RiskBadge key={boundary} tone="neutral">
              {boundary}
            </RiskBadge>
          ))}
        </div>

        {post.recentLikeRanking ? (
          <section className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <RiskBadge tone="neutral">
                    {post.recentLikeRanking.windowLabel}
                  </RiskBadge>
                  <RiskBadge tone="low">
                    {locale === 'ko' ? 'Engagement only' : 'Engagement only'}
                  </RiskBadge>
                </div>
                <h2 className="mt-3 text-[20px] font-bold leading-7 text-invest-text">
                  {locale === 'ko'
                    ? 'Recent like ranking'
                    : 'Recent like ranking'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                  {locale === 'ko'
                    ? 'Like ranking is a DB-backed reading signal. It is not model quality, advice, return, or order intent.'
                    : 'Like ranking is a DB-backed reading signal. It is not model quality, advice, return, or order intent.'}
                </p>
              </div>
              <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                <Trophy aria-hidden className="size-5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-invest-card bg-invest-bg-soft p-2">
              <div className="rounded-invest-control bg-invest-surface p-3">
                <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                  {locale === 'ko' ? 'Rank' : 'Rank'}
                </p>
                <p className="mt-1 text-[24px] font-bold leading-8 text-invest-text tabular-nums">
                  #{post.recentLikeRanking.rank}
                </p>
              </div>
              <div className="rounded-invest-control bg-invest-surface p-3">
                <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                  {locale === 'ko' ? 'Likes' : 'Likes'}
                </p>
                <p className="mt-1 text-[24px] font-bold leading-8 text-invest-primary tabular-nums">
                  {post.recentLikeRanking.likeCount}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section id="comments" className="scroll-mt-4">
          <FeedCommentAction
            postPublicId={post.postPublicId}
            userPublicId={userPublicId}
            initialComments={post.comments}
            initialState={post.userState}
            locale={locale}
          />
        </section>

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
                  {locale === 'ko' ? '읽기 전용' : 'Read-only'}
                </RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? '이 상세 화면은 정보성 피드와 사용자별 읽기 상태를 보여주며, 실제 주문·브로커 연결·투자 조언을 생성하지 않습니다.'
                  : 'This detail screen shows informational feed context and user-scoped read state. It does not create orders, broker actions, or investment advice.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
