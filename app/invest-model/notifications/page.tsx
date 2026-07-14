import Link from 'next/link';
import { Bell, CheckCircle2, Database, ShieldCheck } from 'lucide-react';

import {
  investMotionClass,
  MobileShell,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model';
import { readNotificationCenter } from '@/lib/db/notification-read-model';
import {
  investModelCopy,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type InvestModelNotificationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
    footer:
      'Notifications here are prototype UI records from local DB read models. They do not recommend securities, guarantee returns, connect accounts, or execute orders.'
  }
} as const;

export default async function InvestModelNotificationsPage({
  searchParams
}: InvestModelNotificationsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = notificationCopy[locale];
  const actionsCopy = investModelCopy[locale].actions;
  const notificationCenter = await readNotificationCenter({
    userPublicId: 'user_demo_001',
    limit: 12
  });

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
        <section className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
              <Bell aria-hidden className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="medium">DB FeedPost</RiskBadge>
                <RiskBadge tone="neutral">{copy.noPush}</RiskBadge>
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
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {notificationCenter.items.length > 0 ? (
              notificationCenter.items.map((item) => {
                const isUnread = item.status === 'unread';

                return (
                  <Link
                    key={item.notificationPublicId}
                    href={withInvestModelLocale(item.href, locale)}
                    role="listitem"
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
              <div className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5">
                <h3 className="text-[16px] font-bold leading-6 text-invest-text">
                  {copy.emptyTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                  {copy.emptyDescription}
                </p>
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
