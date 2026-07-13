import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import {
  Activity,
  Bot,
  ChartNoAxesCombined,
  Home,
  Newspaper
} from 'lucide-react';
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
    label: 'Invest',
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
  className?: string;
};

type BottomNavProps = {
  activeTab?: InvestModelTabKey;
  items?: InvestModelNavItem[];
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
        </header>

        <div className="flex-1 px-invest-screen-x pb-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom)+24px)] pt-invest-section-gap">
          {children}
        </div>

        <BottomNav activeTab={activeTab} />
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
  items = investModelNavItems
}: BottomNavProps) {
  return (
    <nav
      aria-label="investModel mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-invest-border bg-invest-surface/95 shadow-invest-nav backdrop-blur"
    >
      <div className="mx-auto grid h-[calc(var(--invest-bottom-nav-height)+env(safe-area-inset-bottom))] max-w-[var(--invest-mobile-frame-width)] grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeTab;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-invest-touch-target flex-col items-center justify-center gap-1 rounded-invest-control px-1 text-[11px] font-semibold leading-none transition-colors',
                isActive
                  ? 'text-invest-primary'
                  : 'text-invest-text-muted hover:text-invest-text'
              )}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
