import Link from 'next/link';
import { NextRequest } from 'next/server';
import {
  ArrowRight,
  Bell,
  Bookmark,
  MessageCircle,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  NotificationAction,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { GET as readMyActivity } from '@/app/api/my/activity/route';
import type { MyPageFeedActivitySummary } from '@/lib/db/my-page-read-model';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type InvestModelMyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getActivitySortTime(activityAt?: string) {
  if (!activityAt) {
    return 0;
  }

  const time = Date.parse(activityAt);
  return Number.isNaN(time) ? 0 : time;
}

async function readMyPageActivityRoute(): Promise<MyPageFeedActivitySummary> {
  const response = await readMyActivity(
    new NextRequest('http://localhost/api/my/activity', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    throw new Error('My Page activity route read failed.');
  }

  const payload = (await response.json()) as {
    data?: MyPageFeedActivitySummary;
  };

  if (!payload.data) {
    throw new Error('My Page activity route returned no data.');
  }

  return payload.data;
}

const myPageCopy = {
  ko: {
    eyebrow: '내 정보',
    title: 'My Page',
    alertLabel: '내 알림',
    bannerEyebrow: '회원 상태',
    bannerTitle: '사용자 1의 앱 활동',
    bannerDescription:
      '모델 선택, 저장 글, 댓글 같은 앱 안의 활동만 보여줍니다. 실계좌, 실입금, 실주문 정보는 연결하지 않습니다.',
    summary: {
      saved: '저장 글',
      savedValue: '0개',
      savedDescription: '피드 저장 기능 연결 전',
      comments: '댓글',
      commentsValue: '0개',
      commentsDescription: '댓글 API 연결 전',
      notices: '알림',
      noticesValue: '준비 중',
      noticesDescription: '실제 push/email/SMS 아님'
    },
    selectedSectionTitle: '선택한 InvestmentModel',
    selectedSectionDescription:
      'DB에 저장된 active UserModelSelection을 읽습니다. 투자 성향이나 주문 설정이 아닙니다.',
    activityTitle: '활동 read model',
    activityDescription:
      'My Page는 앞으로 저장, 댓글, 알림 상태를 DB read model로 묶어 보여줍니다.',
    activityItems: [
      {
        icon: Bookmark,
        href: '/invest-model/feed',
        title: '저장 글',
        description: 'FeedPost 저장 토글이 연결되면 최근 저장한 글을 표시합니다.',
        badge: '준비 중'
      },
      {
        icon: MessageCircle,
        href: '/invest-model/feed',
        title: '댓글',
        description: '댓글/대댓글 API가 연결되면 최근 작성한 댓글을 표시합니다.',
        badge: '준비 중'
      },
      {
        icon: Bell,
        href: '/invest-model/notifications',
        title: '알림',
        description: '모델 선택, 신호 변화, 피드 반응 알림을 mock-safe 상태로 표시합니다.',
        badge: '실제 발송 없음'
      }
    ],
    footer:
      'My Page의 모든 값은 회원 1의 앱 내 read model 또는 준비 중인 mock-safe 상태입니다. 실제 계좌 잔고, 은행 연결, 브로커 주문, 법률 판단을 표시하지 않습니다.'
  },
  en: {
    eyebrow: 'Member',
    title: 'My Page',
    alertLabel: 'My notifications',
    bannerEyebrow: 'Member state',
    bannerTitle: 'User 1 app activity',
    bannerDescription:
      'Shows only in-app activity such as model selection, saved posts, and comments. No real account, deposit, or order data is connected.',
    summary: {
      saved: 'Saved',
      savedValue: '0',
      savedDescription: 'Feed save action pending',
      comments: 'Comments',
      commentsValue: '0',
      commentsDescription: 'Comment API pending',
      notices: 'Alerts',
      noticesValue: 'Pending',
      noticesDescription: 'No real push/email/SMS'
    },
    selectedSectionTitle: 'Selected InvestmentModel',
    selectedSectionDescription:
      'Reads the active UserModelSelection persisted in DB. It is not a suitability or order setting.',
    activityTitle: 'Activity read model',
    activityDescription:
      'My Page will collect saved, comment, and notification states through DB read models.',
    activityItems: [
      {
        icon: Bookmark,
        href: '/invest-model/feed',
        title: 'Saved posts',
        description: 'Recent saved FeedPosts will appear after the save toggle is connected.',
        badge: 'Pending'
      },
      {
        icon: MessageCircle,
        href: '/invest-model/feed',
        title: 'Comments',
        description: 'Recent comments will appear after comment and reply APIs are connected.',
        badge: 'Pending'
      },
      {
        icon: Bell,
        href: '/invest-model/notifications',
        title: 'Notifications',
        description: 'Model, signal, and feed reaction notices will appear as mock-safe state.',
        badge: 'No delivery'
      }
    ],
    footer:
      'Every My Page value is either an in-app read model for user 1 or a pending mock-safe state. It never displays real account balances, bank links, brokerage orders, or legal judgments.'
  }
} as const;

export default async function InvestModelMyPage({
  searchParams
}: InvestModelMyPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = myPageCopy[locale];
  const activitySummary = await readMyPageActivityRoute();
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const savedValue =
    locale === 'ko'
      ? `${activitySummary.savedCount}개`
      : String(activitySummary.savedCount);
  const commentsValue =
    locale === 'ko'
      ? `${activitySummary.commentCount}개`
      : String(activitySummary.commentCount);
  const savedDescription =
    activitySummary.latestSavedPostTitle ??
    (locale === 'ko'
      ? 'DB 저장 활동 없음'
      : 'No saved FeedPost activity');
  const commentsDescription =
    activitySummary.latestCommentPostTitle ??
    (locale === 'ko' ? 'DB 댓글 활동 없음' : 'No comment activity');
  const sourceTrend =
    activitySummary.sourceLabel === 'db_read_model'
      ? 'DB read model'
      : locale === 'ko'
        ? '대기'
        : 'pending';
  const recentActivityRows = [
    ...activitySummary.recentSavedPosts.map((item) => ({
      ...item,
      label: locale === 'ko' ? '저장' : 'Saved'
    })),
    ...activitySummary.recentCommentPosts.map((item) => ({
      ...item,
      label: locale === 'ko' ? '댓글' : 'Comment'
    }))
  ]
    .sort(
      (left, right) =>
        getActivitySortTime(right.activityAt) -
        getActivitySortTime(left.activityAt)
    )
    .slice(0, 4);

  return (
    <MobileShell
      activeTab="home"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/my"
      trailing={
        <NotificationAction
          locale={locale}
          label={copy.alertLabel}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={UserRound}
        />

        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label={copy.summary.saved}
            value={savedValue}
            description={savedDescription}
            trend={sourceTrend}
            className="p-3"
          />
          <MetricCard
            label={copy.summary.comments}
            value={commentsValue}
            description={commentsDescription}
            trend={sourceTrend}
            className="p-3"
          />
          <MetricCard
            label={copy.summary.notices}
            value={copy.summary.noticesValue}
            description={copy.summary.noticesDescription}
            trend={locale === 'ko' ? 'mock' : 'mock'}
            tone="risk"
            className="p-3"
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.selectedSectionTitle}
            description={copy.selectedSectionDescription}
          />
          <ModelSelectionReadStatus copy={modelSelectionReadStatusCopy[locale]} />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.activityTitle}
            description={copy.activityDescription}
          />
          <div
            role="list"
            aria-label={copy.activityTitle}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {copy.activityItems.map((item, index) => {
              const Icon = item.icon;
              const badge =
                index < 2 && activitySummary.sourceLabel === 'db_read_model'
                  ? 'DB read model'
                  : item.badge;

              return (
                <Link
                  key={item.title}
                  href={withInvestModelLocale(item.href, locale)}
                  role="listitem"
                  className={cn(
                    'group block rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary transition-[background-color,transform] duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                      <Icon aria-hidden className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-[16px] font-bold leading-6 text-invest-text">
                          {item.title}
                        </h2>
                        <div className="flex shrink-0 items-center gap-2">
                          <RiskBadge tone="medium">{badge}</RiskBadge>
                          <ArrowRight
                            aria-hidden
                            className="size-4 text-invest-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:scale-100"
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-5 text-invest-text">
                  {locale === 'ko'
                    ? '최근 FeedPost 활동'
                    : 'Recent FeedPost activity'}
                </h2>
                <p className="mt-1 text-[12px] leading-5 text-invest-text-muted">
                  {locale === 'ko'
                    ? 'user 1의 저장/댓글 shortcut을 DB read model에서 최신순으로 표시합니다.'
                    : 'DB-backed saved and comment shortcuts for user 1, sorted by latest activity.'}
                </p>
              </div>
              <RiskBadge
                tone={
                  activitySummary.sourceLabel === 'db_read_model'
                    ? 'low'
                    : 'medium'
                }
              >
                {activitySummary.sourceLabel === 'db_read_model'
                  ? 'DB read model'
                  : 'mock-safe'}
              </RiskBadge>
            </div>

            {recentActivityRows.length > 0 ? (
              <div
                role="list"
                aria-label="Recent FeedPost activity"
                className="mt-3 space-y-2"
              >
                {recentActivityRows.map((item) => (
                  <Link
                    key={`${item.activityLabel}-${item.postPublicId}-${item.activityAt ?? 'none'}`}
                    href={withInvestModelLocale(
                      `/invest-model/feed/${item.postPublicId}`,
                      locale
                    )}
                    role="listitem"
                    className={cn(
                      'group flex min-h-invest-touch-target items-start justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-surface',
                      investMotionClass.interactiveControl
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold leading-4 text-invest-primary">
                        {item.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-invest-text">
                        {item.title}
                      </p>
                      {item.activityAt ? (
                        <p className="mt-1 text-[11px] leading-4 text-invest-text-muted">
                          {item.activityAt}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight
                      aria-hidden
                      className="mt-1 size-4 shrink-0 text-invest-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:scale-100"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-sm leading-5 text-invest-text-muted">
                {locale === 'ko'
                  ? '표시할 DB FeedPost 활동이 아직 없습니다.'
                  : 'No DB FeedPost activity to show yet.'}
              </p>
            )}

            <p className="mt-3 text-[12px] leading-5 text-invest-text-muted">
              {locale === 'ko'
                ? '저장/댓글 활동은 정보성 읽기 shortcut이며 추천, 주문, 실계좌, 실제 알림 전송과 연결되지 않습니다.'
                : 'Saved/comment activity is an informational reading shortcut only, not advice, orders, real accounts, or notification delivery.'}
            </p>
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex flex-wrap gap-2">
            <RiskBadge tone="blocked">
              {locale === 'ko' ? '실계좌 없음' : 'No real account'}
            </RiskBadge>
            <RiskBadge tone="blocked">
              {locale === 'ko' ? '실주문 없음' : 'No real orders'}
            </RiskBadge>
            <RiskBadge>
              <ShieldCheck aria-hidden className="mr-1 inline size-3" />
              {locale === 'ko' ? 'DB read model' : 'DB read model'}
            </RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {copy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
