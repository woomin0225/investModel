import Link from 'next/link';
import { NextRequest } from 'next/server';
import {
  ArrowRight,
  Bell,
  Bookmark,
  MessageCircle,
  UserRound
} from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  RiskBadge,
  SectionHeader,
  SearchAndNotificationActions,
  SoftBanner
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { GET as readMySummary } from '@/app/api/my/route';
import type { MyPageSummaryDto } from '@/lib/domain/my-page/summary';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type InvestModelMyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MyPageSummaryRouteMeta = {
  dataContext?: 'db_read_model' | 'mock_safe_fallback';
  userScopeSource?: 'session' | 'demo_fallback';
  readOnly?: boolean;
  realAccountConnection?: boolean;
  realOrder?: boolean;
  financialAdvice?: boolean;
};

type MyPageSummaryRouteResult = {
  data: MyPageSummaryDto;
  meta: MyPageSummaryRouteMeta;
};

function getActivitySortTime(activityAt?: string) {
  if (!activityAt) {
    return 0;
  }

  const time = Date.parse(activityAt);
  return Number.isNaN(time) ? 0 : time;
}

async function readMyPageSummaryRoute(): Promise<MyPageSummaryRouteResult> {
  const response = await readMySummary(
    new NextRequest('http://localhost/api/my', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );

  if (!response.ok) {
    throw new Error('My Page summary route read failed.');
  }

  const payload = (await response.json()) as {
    data?: MyPageSummaryDto;
    meta?: MyPageSummaryRouteMeta;
  };

  if (!payload.data) {
    throw new Error('My Page summary route returned no data.');
  }

  return {
    data: payload.data,
    meta: payload.meta ?? {}
  };
}

function myPageActivityAccessibleLabel(
  locale: 'ko' | 'en',
  title: string,
  description: string,
  badge: string
) {
  return locale === 'ko'
    ? `${title}. ${description}. 상태: ${badge}. 내 정보의 DB 기반 조회 또는 모의 안전 상태이며 실제 계좌, 주문, 브로커 동작, 푸시/이메일/SMS 전송, 투자 조언이 아닙니다.`
    : `${title}. ${description}. Status: ${badge}. My Page DB read model or mock-safe state, not a real account, order, brokerage action, push/email/SMS delivery, or investment advice.`;
}

function recentFeedActivityAccessibleLabel(
  locale: 'ko' | 'en',
  label: string,
  title: string,
  activityAt?: string
) {
  const timeLabel =
    activityAt ??
    (locale === 'ko' ? '활동 시각 없음' : 'No activity timestamp');

  return locale === 'ko'
    ? `${label} 피드 글 활동: ${title}. ${timeLabel}. 사용자 범위 DB 기반 조회의 읽기 바로가기이며 추천, 주문, 브로커 동작, 실계좌 데이터가 아닙니다.`
    : `${label} FeedPost activity: ${title}. ${timeLabel}. User-scoped DB read model reading shortcut, not advice, an order, a brokerage action, or real account data.`;
}

function myPageSafetyAccessibleLabel(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? '내 정보 안전 경계. 값은 현재 회원의 앱 내 DB 기반 조회 또는 모의 안전 상태이며 실제 계좌 잔고, 은행 연결, 브로커 주문, 푸시/이메일/SMS 전송, 법률 판단 또는 투자 조언이 아닙니다.'
    : 'My Page safety boundary. Values are current member in-app DB read models or mock-safe state, not real account balances, bank links, brokerage orders, push/email/SMS delivery, legal judgments, or investment advice.';
}

function myPageActivityVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['사용자 범위 DB 상태', '실계좌 없음', '실주문 없음', '추천 아님']
    : ['user-scoped DB state', 'no real account', 'no orders', 'not advice'];
}

function myPageRecentActivityVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['DB 피드 글 활동', '저장/댓글 읽기', '브로커 미연결', '푸시 전송 없음']
    : [
        'DB FeedPost activity',
        'saved/comment read model',
        'no brokerage',
        'no push delivery'
      ];
}

function myPageSummaryVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? [
        'DB 사용자 읽기 모델',
        '로컬 프로필 요약',
        '실계좌 없음',
        '브로커 미연결',
        '실주문 없음',
        '투자 조언 아님',
        '푸시 전송 없음'
      ]
    : [
        'DB user read model',
        'local profile summary',
        'no real account',
        'no brokerage',
        'no orders',
        'not advice',
        'no push delivery'
      ];
}

function myPageScopeBadgeLabel(
  locale: 'ko' | 'en',
  meta: MyPageSummaryRouteMeta
) {
  if (meta.userScopeSource === 'session') {
    return locale === 'ko' ? '세션 회원 범위' : 'Session member scope';
  }

  return locale === 'ko'
    ? '프로토타입 대체 범위'
    : 'Prototype fallback scope';
}

function myPageScopeAccessibleLabel(
  locale: 'ko' | 'en',
  meta: MyPageSummaryRouteMeta
) {
  const scopeLabel = myPageScopeBadgeLabel(locale, meta);

  return locale === 'ko'
    ? `${scopeLabel}. 내 정보는 API의 사용자 범위 출처를 기준으로 현재 회원 DB 기반 조회 또는 프로토타입 대체 상태를 구분합니다. 클라이언트가 보낸 사용자 공개 ID로 회원 범위를 바꾸지 않습니다.`
    : `${scopeLabel}. My Page distinguishes current member DB read model state from prototype fallback through the API userScopeSource. Client-provided userPublicId does not change the member scope.`;
}

const myPageCopy = {
  ko: {
    eyebrow: '내 정보',
    title: '내 정보',
    alertLabel: '내 알림',
    bannerEyebrow: '회원 상태',
    bannerTitle: '현재 회원의 앱 활동',
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
      noticesDescription: '실제 푸시/이메일/SMS 아님'
    },
    selectedSectionTitle: '선택한 투자 모델',
    selectedSectionDescription:
      'DB에 저장된 활성 모델 선택 기록을 읽습니다. 투자 성향이나 주문 설정이 아닙니다.',
    activityTitle: '활동 읽기 모델',
    activityDescription:
      '내 정보는 앞으로 저장, 댓글, 알림 상태를 DB 기반 조회로 묶어 보여줍니다.',
    activityItems: [
      {
        icon: Bookmark,
        href: '/invest-model/feed',
        title: '저장 글',
        description: '피드 글 저장 토글이 연결되면 최근 저장한 글을 표시합니다.',
        badge: '준비 중'
      },
      {
        icon: MessageCircle,
        href: '/invest-model/feed',
        title: '댓글',
        description: '댓글/대댓글 기능이 연결되면 최근 작성한 댓글을 표시합니다.',
        badge: '준비 중'
      },
      {
        icon: Bell,
        href: '/invest-model/notifications',
        title: '알림',
        description: '모델 선택, 신호 변화, 피드 반응 알림을 모의 안전 상태로 표시합니다.',
        badge: '실제 발송 없음'
      }
    ],
    footer:
      '내 정보의 모든 값은 현재 회원의 앱 내 읽기 모델 또는 준비 중인 모의 안전 상태입니다. 실제 계좌 잔고, 은행 연결, 브로커 주문, 법률 판단을 표시하지 않습니다.'
  },
  en: {
    eyebrow: 'Member',
    title: 'My Page',
    alertLabel: 'My notifications',
    bannerEyebrow: 'Member state',
    bannerTitle: 'Current member app activity',
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
      'Every My Page value is either an in-app read model for the current member or a pending mock-safe state. It never displays real account balances, bank links, brokerage orders, or legal judgments.'
  }
} as const;

export default async function InvestModelMyPage({
  searchParams
}: InvestModelMyPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = myPageCopy[locale];
  const myPageRouteResult = await readMyPageSummaryRoute();
  const myPageSummary = myPageRouteResult.data;
  const myPageMeta = myPageRouteResult.meta;
  const routeDataContext = myPageMeta.dataContext ?? myPageSummary.dataContext;
  const activitySummary = myPageSummary.feedActivity;
  const notificationSummary = myPageSummary.notificationSummary;
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const profileTitle = `${myPageSummary.profile.displayName} · ${myPageSummary.profile.roleLabel}`;
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
    routeDataContext === 'db_read_model'
      ? locale === 'ko'
        ? 'DB 기반 조회'
        : 'DB read model'
      : locale === 'ko'
        ? '대기'
        : 'pending';
  const routeDataContextLabel =
    routeDataContext === 'db_read_model'
      ? locale === 'ko'
        ? 'DB 기반 조회'
        : 'DB read model'
      : locale === 'ko'
        ? '모의 안전 상태'
        : 'mock-safe';
  const safetyAccessibleLabel = myPageSafetyAccessibleLabel(locale);
  const scopeAccessibleLabel = myPageScopeAccessibleLabel(locale, myPageMeta);
  const summaryVisibleBoundaries = myPageSummaryVisibleBoundaries(locale);
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
  const noticesValue = `${notificationSummary.unreadCount}/${notificationSummary.totalCount}`;
  const noticesDescription =
    notificationSummary.latestNotificationTitle ??
    (locale === 'ko'
      ? 'DB 알림 읽기 활동 없음'
      : 'No DB notification read-model activity');

  return (
    <MobileShell
      activeTab="home"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/my"
      trailing={
        <SearchAndNotificationActions
          locale={locale}
          searchLabel={investModelCopy[locale].actions.searchModels}
          notificationLabel={copy.alertLabel}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={profileTitle}
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
            value={noticesValue}
            description={noticesDescription}
            trend={locale === 'ko' ? '모의' : 'mock'}
            tone="risk"
            className="p-3"
          />
        </div>
        <div className="rounded-invest-control bg-invest-surface-muted px-3 py-2">
          <p className="text-[12px] font-semibold leading-5 text-invest-text-muted">
            {myPageScopeBadgeLabel(locale, myPageMeta)}
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-invest-text-muted">
            {summaryVisibleBoundaries.join(' / ')}
          </p>
        </div>
        <p
          aria-label={scopeAccessibleLabel}
          title={scopeAccessibleLabel}
          className="text-[12px] leading-5 text-invest-text-muted"
        >
          {locale === 'ko'
            ? '회원 범위는 API의 사용자 범위 출처로 확인하며, 화면 값은 현재 회원 DB 기반 조회 또는 프로토타입 대체 상태만 표시합니다.'
            : 'Member scope is confirmed through the API userScopeSource, and this screen shows only current member DB read models or prototype fallback state.'}
        </p>
        <p className="text-[12px] leading-5 text-invest-text-muted">
          {locale === 'ko'
            ? `데이터 출처: ${routeDataContextLabel}.`
            : `API dataContext: ${routeDataContext}.`}
        </p>

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
                  ? locale === 'ko'
                    ? 'DB 기반 조회'
                    : 'DB read model'
                  : item.badge;
              const activityAccessibleLabel = myPageActivityAccessibleLabel(
                locale,
                item.title,
                item.description,
                badge
              );

              return (
                <Link
                  key={item.title}
                  href={withInvestModelLocale(item.href, locale)}
                  role="listitem"
                  aria-label={activityAccessibleLabel}
                  title={activityAccessibleLabel}
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
                      <p className="mt-3 text-[12px] font-semibold leading-5 text-invest-text-muted">
                        {myPageActivityVisibleBoundaries(locale).join(' / ')}
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
                    ? '최근 피드 글 활동'
                    : 'Recent FeedPost activity'}
                </h2>
                <p className="mt-1 text-[12px] leading-5 text-invest-text-muted">
                  {locale === 'ko'
                    ? '현재 회원의 저장/댓글 바로가기를 DB 기반 조회에서 최신순으로 표시합니다.'
                    : 'DB-backed saved and comment shortcuts for the current member, sorted by latest activity.'}
                </p>
              </div>
              <p className="shrink-0 text-right text-[12px] font-semibold leading-5 text-invest-text-muted">
                {activitySummary.sourceLabel === 'db_read_model'
                  ? locale === 'ko'
                    ? 'DB 기반 조회'
                    : 'DB read model'
                  : locale === 'ko'
                    ? '모의 안전'
                    : 'mock-safe'}
              </p>
            </div>
            <p className="mt-3 text-[12px] font-semibold leading-5 text-invest-text-muted">
              {myPageRecentActivityVisibleBoundaries(locale).join(' / ')}
            </p>

            {recentActivityRows.length > 0 ? (
              <div
                role="list"
                aria-label={
                  locale === 'ko'
                    ? '최근 피드 글 활동. 현재 회원의 저장 및 댓글 DB 기반 조회 바로가기입니다.'
                    : 'Recent FeedPost activity. Current member saved and comment DB read model shortcuts.'
                }
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
                    aria-label={recentFeedActivityAccessibleLabel(
                      locale,
                      item.label,
                      item.title,
                      item.activityAt
                    )}
                    title={recentFeedActivityAccessibleLabel(
                      locale,
                      item.label,
                      item.title,
                      item.activityAt
                    )}
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
                  ? '표시할 DB 피드 글 활동이 아직 없습니다.'
                  : 'No DB FeedPost activity to show yet.'}
              </p>
            )}

            <p className="mt-3 text-[12px] leading-5 text-invest-text-muted">
              {locale === 'ko'
                ? '저장/댓글 활동은 정보성 읽기 바로가기이며 추천, 주문, 실계좌, 실제 알림 전송과 연결되지 않습니다.'
                : 'Saved/comment activity is an informational reading shortcut only, not advice, orders, real accounts, or notification delivery.'}
            </p>
          </div>
        </div>

        <div
          aria-label={safetyAccessibleLabel}
          title={safetyAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding"
        >
          <p className="text-xs font-semibold leading-5 text-invest-text-muted">
            {locale === 'ko'
              ? '실계좌 없음 / 실주문 없음 / DB 기반 조회'
              : 'No real account / No real orders / DB read model'}
          </p>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {copy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
