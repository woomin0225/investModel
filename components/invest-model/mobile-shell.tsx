import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import {
  Activity,
  Bot,
  ChartNoAxesCombined,
  Home,
  Newspaper
} from 'lucide-react';
import {
  investModelCopy,
  investModelNavLabels,
  type InvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

export type InvestModelTabKey =
  | 'home'
  | 'models'
  | 'signals'
  | 'feed'
  | 'portfolio';

export type InvestModelNavItem = {
  key: InvestModelTabKey;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
};

export const investModelNavItems: InvestModelNavItem[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/invest-model',
    icon: Home
  },
  {
    key: 'models',
    label: 'Models',
    href: '/invest-model/models',
    icon: Bot
  },
  {
    key: 'signals',
    label: 'Signals',
    href: '/invest-model/signals',
    icon: Activity
  },
  {
    key: 'feed',
    label: 'Feed',
    href: '/invest-model/feed',
    icon: Newspaper
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    href: '/invest-model/portfolio',
    icon: ChartNoAxesCombined
  }
];

type MobileShellProps = {
  children: ReactNode;
  activeTab?: InvestModelTabKey;
  title?: string;
  eyebrow?: string;
  trailing?: ReactNode;
  locale?: InvestModelLocale;
  currentPath?: string;
  className?: string;
};

type BottomNavProps = {
  activeTab?: InvestModelTabKey;
  items?: InvestModelNavItem[];
  locale?: InvestModelLocale;
};

/**
 * MobileShell defines the 390px-first mobile app frame used by investModel screens.
 * It reserves bottom safe-area space so the fixed tab bar does not cover content.
 */
export function MobileShell({
  children,
  activeTab = 'home',
  title = 'investModel',
  eyebrow,
  trailing,
  locale = 'ko',
  currentPath = '/invest-model',
  className
}: MobileShellProps) {
  return (
    <main className="min-h-dvh bg-invest-bg text-invest-text">
      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full max-w-[var(--invest-mobile-frame-width)] flex-col bg-invest-bg',
          className
        )}
      >
        <header className="sticky top-0 z-20 border-b border-invest-border/80 bg-invest-bg/95 px-invest-screen-x pb-3 pt-[calc(var(--invest-screen-top)+env(safe-area-inset-top))] backdrop-blur">
          <div className="flex min-h-invest-touch-target items-center justify-between gap-3">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-invest-primary">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="truncate text-[22px] font-bold leading-[30px] text-invest-text">
                {title}
              </h1>
            </div>
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
          </div>
          <LanguageToggle locale={locale} currentPath={currentPath} />
        </header>

        <div className="invest-view-enter flex-1 px-invest-screen-x pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)] pt-invest-section-gap">
          {children}
        </div>

        <BottomNav activeTab={activeTab} locale={locale} />
      </div>
    </main>
  );
}

/**
 * BottomNav is the five-tab mobile navigation used across the investModel PWA.
 * Each item keeps a stable touch target to prevent label or icon layout shifts.
 */
export function BottomNav({
  activeTab = 'home',
  items = investModelNavItems,
  locale = 'ko'
}: BottomNavProps) {
  const labels = investModelNavLabels[locale];
  const navigationLabel =
    locale === 'ko'
      ? 'investModel 하단 모바일 탭 내비게이션'
      : 'investModel bottom mobile tab navigation';

  return (
    <nav
      aria-label={navigationLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-invest-border bg-invest-surface/95 shadow-invest-nav backdrop-blur"
    >
      <div className="mx-auto grid h-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom))] max-w-[var(--invest-mobile-frame-width)] grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeTab;
          const label = labels[item.key];
          const accessibleLabel =
            locale === 'ko'
              ? `${label} 탭${isActive ? ', 현재 화면' : ''}`
              : `${label} tab${isActive ? ', current screen' : ''}`;

          return (
            <Link
              key={item.key}
              href={withInvestModelLocale(item.href, locale)}
              aria-label={accessibleLabel}
              aria-current={isActive ? 'page' : undefined}
              data-touch-target="44px"
              title={accessibleLabel}
              className={cn(
                'group relative flex min-h-invest-touch-target w-full min-w-invest-touch-target flex-col items-center justify-center gap-1 overflow-hidden rounded-invest-control px-1 text-[11px] font-semibold leading-none transition-[background-color,color,transform] duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invest-primary focus-visible:ring-offset-2 focus-visible:ring-offset-invest-surface motion-reduce:transition-none motion-reduce:active:scale-100',
                isActive
                  ? 'bg-invest-primary-soft text-invest-primary'
                  : 'text-invest-text-muted hover:bg-invest-surface-muted hover:text-invest-text'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute top-1 h-1 w-5 rounded-full bg-invest-primary transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
                  isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                )}
              />
              <span
                aria-hidden
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-invest-control transition-[background-color,box-shadow,transform] duration-200 ease-out group-active:scale-95 motion-reduce:transition-none motion-reduce:group-active:scale-100',
                  isActive
                    ? 'bg-invest-surface text-invest-primary shadow-[0_4px_12px_rgb(47_128_237_/_0.16)]'
                    : 'text-inherit group-hover:bg-invest-surface-muted'
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    'size-5 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none',
                    isActive && '-translate-y-0.5'
                  )}
                />
              </span>
              <span className="min-w-0 max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type LanguageToggleProps = {
  locale: InvestModelLocale;
  currentPath: string;
};

/**
 * LanguageToggle switches the prototype between Korean and English while Korean remains the default route.
 */
function LanguageToggle({ locale, currentPath }: LanguageToggleProps) {
  const copy = investModelCopy[locale].language;

  return (
    <div className="mt-2 flex justify-end">
      <div
        aria-label={copy.label}
        className="grid min-h-8 grid-cols-2 overflow-hidden rounded-invest-control border border-invest-border bg-invest-surface p-0.5 text-[11px] font-bold shadow-invest-card"
      >
        <Link
          href={withInvestModelLocale(currentPath, 'ko')}
          aria-current={locale === 'ko' ? 'true' : undefined}
          className={cn(
            'grid min-w-12 place-items-center rounded-[6px] px-2 transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-inset motion-reduce:transition-none motion-reduce:active:scale-100',
            locale === 'ko'
              ? 'bg-invest-primary text-invest-surface shadow-[0_4px_12px_rgb(47_128_237_/_0.22)]'
              : 'text-invest-text-muted hover:text-invest-text'
          )}
        >
          {copy.ko}
        </Link>
        <Link
          href={withInvestModelLocale(currentPath, 'en')}
          aria-current={locale === 'en' ? 'true' : undefined}
          className={cn(
            'grid min-w-12 place-items-center rounded-[6px] px-2 transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-inset motion-reduce:transition-none motion-reduce:active:scale-100',
            locale === 'en'
              ? 'bg-invest-primary text-invest-surface shadow-[0_4px_12px_rgb(47_128_237_/_0.22)]'
              : 'text-invest-text-muted hover:text-invest-text'
          )}
        >
          {copy.en}
        </Link>
      </div>
    </div>
  );
}
