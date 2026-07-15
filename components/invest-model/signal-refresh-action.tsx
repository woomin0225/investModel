'use client';

import { useEffect, useState, useTransition } from 'react';
import { RefreshCw, TimerReset } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { investMotionClass } from './ui';

type SignalRefreshActionProps = {
  locale: 'ko' | 'en';
  lastUpdatedLabel: string;
  disabled?: boolean;
};

export function SignalRefreshAction({
  locale,
  lastUpdatedLabel,
  disabled = false
}: SignalRefreshActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  function refreshSignals() {
    if (disabled) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  useEffect(() => {
    if (!autoRefreshEnabled || disabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [autoRefreshEnabled, disabled, router]);

  const refreshLabel =
    locale === 'ko' ? 'DB 스냅샷 새로고침' : 'Refresh DB snapshot';
  const autoLabel =
    locale === 'ko' ? '60초 자동 갱신' : 'Auto refresh 60s';
  const pendingLabel = locale === 'ko' ? '갱신 중' : 'Refreshing';
  const safeBoundary =
    locale === 'ko'
      ? 'DB 점수 스냅샷만 새로고침합니다. 외부 실시간 데이터, 투자 조언, 주문이 아닙니다.'
      : 'DB score snapshots only. No external realtime data, advice, or order.';
  const refreshMetaLine =
    locale === 'ko'
      ? ['DB 기반 조회 새로고침', '점수 스냅샷 테이블'].join(' / ')
      : ['DB read model refresh', 'signal_score_snapshots'].join(' / ');

  return (
    <div className="rounded-invest-control border border-invest-border bg-invest-surface p-2 shadow-invest-card">
      <div className="grid gap-2 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold leading-4 text-invest-text">
            {lastUpdatedLabel}
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-4 text-invest-text-muted">
            {safeBoundary}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshSignals}
          disabled={disabled || isPending}
          className={cn(
            'inline-flex min-h-invest-touch-target items-center justify-center gap-2 rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 text-sm font-bold text-invest-primary disabled:cursor-not-allowed disabled:opacity-60',
            investMotionClass.interactiveControl
          )}
        >
          <RefreshCw
            aria-hidden
            className={cn('size-4', isPending && 'animate-spin')}
          />
          <span>{isPending ? pendingLabel : refreshLabel}</span>
        </button>
      </div>

      <label className="mt-2 flex min-h-invest-touch-target items-center justify-between gap-3 rounded-invest-control bg-invest-bg-soft px-3 py-2">
        <span className="inline-flex min-w-0 items-center gap-2 text-[12px] font-bold leading-4 text-invest-text">
          <TimerReset aria-hidden className="size-4 shrink-0 text-invest-primary" />
          <span className="truncate">{autoLabel}</span>
        </span>
        <input
          type="checkbox"
          checked={autoRefreshEnabled}
          disabled={disabled}
          onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
          className="size-4 accent-invest-primary"
        />
      </label>

      <div className="mt-2 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
        {refreshMetaLine}
      </div>
    </div>
  );
}
