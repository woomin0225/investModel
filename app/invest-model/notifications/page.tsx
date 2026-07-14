import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { Bell, CheckCircle2, Database, ShieldCheck } from 'lucide-react';

import { POST as markAllNotificationsRead } from '@/app/api/notifications/mark-all-read/route';
import { GET as readNotifications } from '@/app/api/notifications/route';
import {
  investMotionClass,
  MobileShell,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model';
import type { NotificationCenterDto } from '@/lib/domain/notifications/notification-center';
import {
  investModelCopy,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type InvestModelNotificationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type InvestModelNotificationsResponse = {
  data: NotificationCenterDto;
  meta: {
    routeStatus: string;
    readOnly: boolean;
    sendsRealPush: boolean;
    sendsRealEmail: boolean;
    sendsRealSms: boolean;
    realOrder: boolean;
    brokerageConnection: boolean;
    financialAdvice: boolean;
  };
};

type NotificationCenterItem =
  InvestModelNotificationsResponse['data']['items'][number];

const notificationCopy = {
  ko: {
    eyebrow: 'Notifications',
    title: 'Notifications',
    summaryTitle: 'DB-backed notification center',
    summaryDescription:
      'This first slice derives notification rows from FeedPost read state for user_demo_001. It is not real push, email, SMS, broker, order, or account messaging.',
    unread: 'Unread',
    read: 'Read',
    emptyTitle: 'No DB-backed notifications yet',
    emptyDescription:
      'When FeedPost rows are added or read-state changes, this center can surface those records.',
    sectionTitle: 'Latest notification candidates',
    sectionDescription: 'Derived from FeedPost records and read state.',
    noAdvice: 'No advice',
    noOrders: 'No orders',
    noPush: 'No real push',
    markAllRead: 'Mark all read',
    allRead: 'All read',
    actionHint:
      'Updates only local DB read state. No push, email, SMS, orders, brokerage, or advice is sent.',
    footer:
      'Notifications here are prototype UI records from local DB read models. They do not recommend securities, guarantee returns, connect accounts, or execute orders.'
  },
  en: {
    eyebrow: 'Notifications',
    title: 'Notifications',
    summaryTitle: 'DB-backed notification center',
    summaryDescription:
      'This first slice derives notification rows from FeedPost read state for user_demo_001. It is not real push, email, SMS, broker, order, or account messaging.',
    unread: 'Unread',
    read: 'Read',
    emptyTitle: 'No DB-backed notifications yet',
    emptyDescription:
      'When FeedPost rows are added or read-state changes, this center can surface those records.',
    sectionTitle: 'Latest notification candidates',
    sectionDescription: 'Derived from FeedPost records and read state.',
    noAdvice: 'No advice',
    noOrders: 'No orders',
    noPush: 'No real push',
    markAllRead: 'Mark all read',
    allRead: 'All read',
    actionHint:
      'Updates only local DB read state. No push, email, SMS, orders, brokerage, or advice is sent.',
    footer:
      'Notifications here are prototype UI records from local DB read models. They do not recommend securities, guarantee returns, connect accounts, or execute orders.'
  }
} as const;

function notificationSummaryAccessibleLabel(
  locale: 'ko' | 'en',
  notificationCenter: NotificationCenterDto
) {
  if (locale === 'ko') {
    return `DB-backed notification center. 읽지 않은 알림 ${notificationCenter.unreadCount}개, DB row ${notificationCenter.items.length}개. FeedPost read state에서 파생된 prototype 알림이며 실제 push, email, SMS, 주문, 브로커, 계좌 메시지, 투자 조언이 아닙니다.`;
  }

  return `DB-backed notification center. ${notificationCenter.unreadCount} unread notifications and ${notificationCenter.items.length} DB rows. Prototype notifications derived from FeedPost read state; not real push, email, SMS, orders, brokerage, account messaging, or investment advice.`;
}

function notificationMarkAllReadAccessibleLabel(
  locale: 'ko' | 'en',
  notificationCenter: NotificationCenterDto
) {
  if (locale === 'ko') {
    return notificationCenter.unreadCount > 0
      ? `모두 읽음 처리. ${notificationCenter.unreadCount}개 FeedPost 알림 후보의 local DB read state만 업데이트합니다. 실제 push, email, SMS, 주문, 브로커, 계좌 메시지, 투자 조언은 전송하지 않습니다.`
      : '모든 DB-backed notification 후보가 읽음 상태입니다. 실제 push, email, SMS, 주문, 브로커, 계좌 메시지, 투자 조언은 연결되지 않았습니다.';
  }

  return notificationCenter.unreadCount > 0
    ? `Mark all read. Updates only local DB read state for ${notificationCenter.unreadCount} FeedPost notification candidates. No real push, email, SMS, orders, brokerage, account messaging, or investment advice is sent.`
    : 'All DB-backed notification candidates are read. No real push, email, SMS, orders, brokerage, account messaging, or investment advice is connected.';
}

function notificationItemAccessibleLabel(
  locale: 'ko' | 'en',
  item: NotificationCenterItem
) {
  const modelName = item.feedPost.linkedModelName ?? 'Unlinked FeedPost';

  if (locale === 'ko') {
    return `${item.status === 'unread' ? '읽지 않은' : '읽은'} DB-backed FeedPost 알림 후보: ${item.title}. ${item.eventLabel}. 연결 모델: ${modelName}. informational-only read model이며 실제 push, email, SMS, 주문, 브로커 동작, 투자 조언이 아닙니다.`;
  }

  return `${item.status === 'unread' ? 'Unread' : 'Read'} DB-backed FeedPost notification candidate: ${item.title}. ${item.eventLabel}. Linked model: ${modelName}. Informational-only read model; not real push, email, SMS, orders, brokerage action, or investment advice.`;
}

function notificationSafetyAccessibleLabel(locale: 'ko' | 'en') {
  if (locale === 'ko') {
    return 'Notifications 안전 경계. 이 화면은 local DB read model prototype입니다. 증권 추천, 수익 보장, 계좌 연결, 실제 주문, push, email, SMS 전송을 수행하지 않습니다.';
  }

  return 'Notifications safety boundary. This screen is a local DB read model prototype. It does not recommend securities, guarantee returns, connect accounts, execute orders, or send push, email, or SMS messages.';
}

function notificationSummaryVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['DB 읽음 상태', 'FeedPost 기반', '실제 푸시 없음', '실주문 없음']
    : ['DB read state', 'FeedPost derived', 'no real push', 'no orders'];
}

function notificationActionVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['로컬 읽음 처리', 'email/SMS 없음', '브로커 미연결', '추천 아님']
    : ['local read mutation', 'no email/SMS', 'no brokerage', 'not advice'];
}

function notificationItemVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['DB FeedPost', '정보성 알림', '계좌 메시지 아님']
    : ['DB FeedPost', 'informational alert', 'not account messaging'];
}

function notificationEmptyVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? [
        'DB 빈 상태',
        '실제 푸시 없음',
        'email/SMS 없음',
        '실주문 없음',
        '브로커 미연결',
        '추천 아님'
      ]
    : [
        'DB empty state',
        'no real push',
        'no email/SMS',
        'no orders',
        'no brokerage',
        'not advice'
      ];
}

async function readInvestModelNotifications() {
  const response = await readNotifications(
    new NextRequest(
      'http://localhost/api/notifications?userPublicId=user_demo_001',
      {
        method: 'GET',
        headers: {
          'x-invest-model-role': 'user'
        }
      }
    )
  );

  if (!response.ok) {
    throw new Error('InvestModel notifications API contract returned an error.');
  }

  return (await response.json()) as InvestModelNotificationsResponse;
}

async function markAllNotificationsReadAction() {
  'use server';

  const response = await markAllNotificationsRead(
    new NextRequest('http://localhost/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-invest-model-role': 'user'
      },
      body: JSON.stringify({
        userPublicId: 'user_demo_001',
        limit: 30
      })
    })
  );

  if (!response.ok) {
    throw new Error('InvestModel notification read-state update failed.');
  }

  revalidatePath('/invest-model');
  revalidatePath('/invest-model/notifications');
  revalidatePath('/invest-model/my');
}

export default async function InvestModelNotificationsPage({
  searchParams
}: InvestModelNotificationsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = notificationCopy[locale];
  const actionsCopy = investModelCopy[locale].actions;
  const { data: notificationCenter } = await readInvestModelNotifications();
  const hasUnreadNotifications = notificationCenter.unreadCount > 0;
  const summaryAccessibleLabel = notificationSummaryAccessibleLabel(
    locale,
    notificationCenter
  );
  const markAllReadAccessibleLabel = notificationMarkAllReadAccessibleLabel(
    locale,
    notificationCenter
  );
  const safetyAccessibleLabel = notificationSafetyAccessibleLabel(locale);
  const emptyAccessibleLabel =
    locale === 'ko'
      ? `${copy.emptyTitle}. ${copy.emptyDescription} DB-backed notification empty state이며 실제 push, email, SMS, 주문, 브로커 동작, 투자 조언이 아닙니다.`
      : `${copy.emptyTitle}. ${copy.emptyDescription} DB-backed notification empty state, not real push, email, SMS, orders, brokerage action, or investment advice.`;

  return (
    <MobileShell
      activeTab="home"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/notifications"
      trailing={
        <Link
          href={withInvestModelLocale('/invest-model/search', locale)}
          aria-label={actionsCopy.searchModels}
          className={cn(
            'grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card',
            investMotionClass.interactiveControl
          )}
        >
          <Database aria-hidden className="size-5" />
        </Link>
      }
    >
      <section className="space-y-invest-section-gap">
        <section
          aria-label={summaryAccessibleLabel}
          title={summaryAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
        >
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
              <Bell aria-hidden className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="medium">DB FeedPost</RiskBadge>
                <RiskBadge tone="neutral">{copy.noPush}</RiskBadge>
                {notificationSummaryVisibleBoundaries(locale).map(
                  (boundary) => (
                    <RiskBadge key={boundary} tone="neutral">
                      {boundary}
                    </RiskBadge>
                  )
                )}
              </div>
              <h2 className="mt-3 text-[20px] font-bold leading-7 text-invest-text">
                {copy.summaryTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                {copy.summaryDescription}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-invest-control bg-invest-bg-soft px-3 py-2">
                  <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                    {copy.unread}
                  </p>
                  <p className="mt-1 text-[24px] font-bold leading-8 tabular-nums text-invest-text">
                    {notificationCenter.unreadCount}
                  </p>
                </div>
                <div className="rounded-invest-control bg-invest-bg-soft px-3 py-2">
                  <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                    DB rows
                  </p>
                  <p className="mt-1 text-[24px] font-bold leading-8 tabular-nums text-invest-text">
                    {notificationCenter.items.length}
                  </p>
                </div>
              </div>
              <form
                action={markAllNotificationsReadAction}
                aria-label={markAllReadAccessibleLabel}
                title={markAllReadAccessibleLabel}
                className="mt-4 space-y-2"
              >
                <button
                  type="submit"
                  disabled={!hasUnreadNotifications}
                  aria-label={markAllReadAccessibleLabel}
                  title={markAllReadAccessibleLabel}
                  className={cn(
                    'inline-flex min-h-invest-touch-target w-full items-center justify-center gap-2 rounded-invest-control px-4 py-3 text-sm font-bold leading-5 shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                    hasUnreadNotifications
                      ? 'bg-invest-primary text-white active:translate-y-px'
                      : 'cursor-not-allowed bg-invest-bg-soft text-invest-text-muted shadow-none',
                    investMotionClass.interactiveControl
                  )}
                >
                  <CheckCircle2 aria-hidden className="size-4" />
                  {hasUnreadNotifications ? copy.markAllRead : copy.allRead}
                </button>
                <p className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                  {copy.actionHint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {notificationActionVisibleBoundaries(locale).map(
                    (boundary) => (
                      <RiskBadge key={boundary} tone="neutral">
                        {boundary}
                      </RiskBadge>
                    )
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.sectionTitle}
            description={copy.sectionDescription}
          />

          <div
            role="list"
            aria-label={copy.sectionDescription}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {notificationCenter.items.length > 0 ? (
              notificationCenter.items.map((item) => {
                const isUnread = item.status === 'unread';
                const itemAccessibleLabel = notificationItemAccessibleLabel(
                  locale,
                  item
                );

                return (
                  <Link
                    key={item.notificationPublicId}
                    href={withInvestModelLocale(item.href, locale)}
                    role="listitem"
                    aria-label={itemAccessibleLabel}
                    title={itemAccessibleLabel}
                    className={cn(
                      'group block rounded-invest-card border bg-invest-surface p-4 shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
                      isUnread
                        ? 'border-invest-primary/25'
                        : 'border-invest-border',
                      investMotionClass.interactiveCard
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'grid size-10 shrink-0 place-items-center rounded-invest-control',
                          isUnread
                            ? 'bg-invest-primary-soft text-invest-primary'
                            : 'bg-invest-bg-soft text-invest-text-muted'
                        )}
                      >
                        {isUnread ? (
                          <Bell aria-hidden className="size-5" />
                        ) : (
                          <CheckCircle2 aria-hidden className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <RiskBadge tone={isUnread ? 'medium' : 'neutral'}>
                            {isUnread ? copy.unread : copy.read}
                          </RiskBadge>
                          <RiskBadge tone="neutral">{item.feedPost.postType}</RiskBadge>
                          {notificationItemVisibleBoundaries(locale).map(
                            (boundary) => (
                              <RiskBadge key={boundary} tone="neutral">
                                {boundary}
                              </RiskBadge>
                            )
                          )}
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-[16px] font-bold leading-6 text-invest-text">
                          {item.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-invest-text-muted">
                          {item.body}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2">
                          <span className="min-w-0 truncate text-[12px] font-semibold leading-4 text-invest-text-muted">
                            {item.feedPost.linkedModelName ??
                              'Unlinked FeedPost'}
                          </span>
                          <span className="shrink-0 text-[12px] font-bold leading-4 text-invest-primary">
                            {item.eventLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div
                aria-label={emptyAccessibleLabel}
                title={emptyAccessibleLabel}
                className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5"
              >
                <h3 className="text-[16px] font-bold leading-6 text-invest-text">
                  {copy.emptyTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                  {copy.emptyDescription}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-2">
                  {notificationEmptyVisibleBoundaries(locale).map(
                    (boundary) => (
                      <RiskBadge key={boundary} tone="neutral">
                        {boundary}
                      </RiskBadge>
                    )
                  )}
                </div>
              </div>
            )}
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
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="blocked">{copy.noAdvice}</RiskBadge>
                <RiskBadge tone="medium">{copy.noOrders}</RiskBadge>
                <RiskBadge tone="neutral">{copy.noPush}</RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {copy.footer}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
