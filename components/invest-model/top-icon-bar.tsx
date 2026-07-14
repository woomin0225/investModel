import type { ComponentType } from 'react';
import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { withInvestModelLocale, type InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import { investMotionClass } from './ui';

type TopIconActionTone = 'neutral' | 'primary';

type TopIconAction = {
  key: string;
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tone?: TopIconActionTone;
  badgeLabel?: string;
  dot?: boolean;
  rotateOnHover?: boolean;
};

type TopIconBarProps = {
  actions: TopIconAction[];
  locale: InvestModelLocale;
  className?: string;
};

type SearchAndNotificationActionsProps = {
  locale: InvestModelLocale;
  searchLabel: string;
  notificationLabel: string;
  unreadLabel?: string;
  className?: string;
};

type NotificationActionProps = {
  locale: InvestModelLocale;
  label: string;
  unreadLabel?: string;
  dot?: boolean;
  className?: string;
};

/**
 * TopIconBar keeps mobile header icon actions consistent across investModel screens.
 * It is route-ready but can render safe inert buttons until search/notification pages exist.
 */
export function TopIconBar({ actions, locale, className }: TopIconBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {actions.map((action) => (
        <TopIconButton key={action.key} action={action} locale={locale} />
      ))}
    </div>
  );
}

export function SearchAndNotificationActions({
  locale,
  searchLabel,
  notificationLabel,
  unreadLabel,
  className
}: SearchAndNotificationActionsProps) {
  return (
    <TopIconBar
      locale={locale}
      className={className}
      actions={[
        {
          key: 'search',
          label: searchLabel,
          href: '/invest-model/search',
          icon: Search
        },
        {
          key: 'notifications',
          label: notificationLabel,
          href: '/invest-model/notifications',
          icon: Bell,
          tone: 'primary',
          badgeLabel: unreadLabel,
          rotateOnHover: true
        }
      ]}
    />
  );
}

export function NotificationAction({
  locale,
  label,
  unreadLabel,
  dot = false,
  className
}: NotificationActionProps) {
  return (
    <TopIconBar
      locale={locale}
      className={className}
      actions={[
        {
          key: 'notifications',
          label,
          href: '/invest-model/notifications',
          icon: Bell,
          tone: 'primary',
          badgeLabel: unreadLabel,
          dot: unreadLabel ? false : dot,
          rotateOnHover: true
        }
      ]}
    />
  );
}

function TopIconButton({
  action,
  locale
}: {
  action: TopIconAction;
  locale: InvestModelLocale;
}) {
  const Icon = action.icon;
  const isPrimary = action.tone === 'primary';
  const className = cn(
    'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border shadow-invest-card focus-visible:ring-2',
    isPrimary
      ? 'border-invest-primary/25 bg-invest-primary-soft text-invest-primary focus-visible:ring-invest-primary/30'
      : 'border-invest-border bg-invest-surface text-invest-text focus-visible:ring-invest-primary/25',
    investMotionClass.interactiveControl
  );
  const content = (
    <>
      {!isPrimary ? (
        <span
          aria-hidden
          className="absolute inset-1 rounded-[10px] border border-transparent transition-colors duration-200 ease-out group-hover:border-invest-primary/15 group-active:border-invest-primary/30 motion-reduce:transition-none"
        />
      ) : null}
      <Icon
        aria-hidden
        className={cn(
          'size-5 transition-transform duration-200 ease-out group-active:scale-95 motion-reduce:transition-none motion-reduce:group-active:scale-100',
          action.rotateOnHover
            ? 'group-hover:-rotate-6 motion-reduce:group-hover:rotate-0'
            : 'group-hover:scale-105 motion-reduce:group-hover:scale-100'
        )}
      />
      {action.badgeLabel ? (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-invest-risk px-1 text-[10px] font-bold leading-none text-white ring-2 ring-invest-primary-soft"
        >
          {action.badgeLabel}
        </span>
      ) : null}
      {action.dot ? (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-invest-warning ring-2 ring-invest-primary-soft"
        />
      ) : null}
      <span
        aria-hidden
        className={cn(
          'absolute bottom-1 h-0.5 rounded-full transition-[background-color,opacity,transform] duration-200 ease-out group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-active:scale-x-100',
          isPrimary
            ? 'inset-x-2 bg-invest-primary opacity-70'
            : 'inset-x-3 origin-center scale-x-50 bg-invest-text-muted/40 opacity-80 group-hover:scale-x-100 group-hover:bg-invest-primary/70 motion-reduce:group-hover:scale-x-50'
        )}
      />
    </>
  );

  if (action.href) {
    return (
      <Link
        href={withInvestModelLocale(action.href, locale)}
        aria-label={action.label}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={action.label} className={className}>
      {content}
    </button>
  );
}
