'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

import type { InvestModelWatchlistReadModel } from '@/lib/db/watchlist-read-model';
import type { InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import {
  EmptyStateCta,
  SectionHeader,
  investCardClass,
  investMotionClass
} from './ui';

type WatchlistApiState =
  | { status: 'loading' }
  | { status: 'loaded'; data: InvestModelWatchlistReadModel }
  | { status: 'empty'; data?: InvestModelWatchlistReadModel }
  | { status: 'error' };

type WatchlistSeedPanelProps = {
  locale: InvestModelLocale;
};

const watchlistCopy = {
  ko: {
    title: '관찰 관심 목록',
    description:
      '선택 모델과 SignalEvent seed를 홈에서 읽기 쉬운 순서로 보여줍니다.',
    loadingLabel: 'seed/mock 관심 목록을 불러오는 중',
    emptyTitle: '관찰 목록 준비 중',
    emptyDescription:
      'seed 기반 관심 모델과 신호가 준비되면 이 영역에 표시됩니다.',
    emptyCtaLabel: '모의 관찰 신호 보기',
    emptyCtaDescription:
      'Signals 화면에서 seed/mock 관찰값만 둘러봅니다.',
    errorTitle: '관심 목록을 읽지 못했습니다',
    errorDescription:
      '홈은 실패해도 실시간 시세, 실입금, 실주문, 브로커 연결을 시도하지 않습니다.',
    safetyLine:
      'mock seed와 DB read-model 관찰값만 표시합니다. 실시간 시세, 투자조언, 실입금, 실주문, 브로커 연결은 없습니다.',
    sourceLabel: 'seed/read-model',
    sectionLabel: 'Home seed watchlist read model',
    simulationOnly: 'simulation only',
    noLiveTrading: 'no live trading',
    notAdvice: 'not advice',
    noBrokerage: 'no brokerage'
  },
  en: {
    title: 'Observation watchlist',
    description:
      'Shows selected model and SignalEvent seed rows in a scan-friendly home order.',
    loadingLabel: 'Loading seed/mock watchlist observations',
    emptyTitle: 'Observation list pending',
    emptyDescription:
      'Seed-based models and signals will appear here when the read model is available.',
    emptyCtaLabel: 'Browse mock observations',
    emptyCtaDescription:
      'Open Signals to review seed/mock observations only.',
    errorTitle: 'Watchlist could not be read',
    errorDescription:
      'Home does not try live market data, real deposits, orders, or brokerage connections when this read fails.',
    safetyLine:
      'Shows only mock seed and DB read-model observations. No live market data, advice, real deposit, live order, or brokerage connection is connected.',
    sourceLabel: 'seed/read-model',
    sectionLabel: 'Home seed watchlist read model',
    simulationOnly: 'simulation only',
    noLiveTrading: 'no live trading',
    notAdvice: 'not advice',
    noBrokerage: 'no brokerage'
  }
} as const;

async function readWatchlist() {
  const response = await fetch('/api/watchlist/mock-summary?limit=3', {
    headers: {
      'x-invest-model-role': 'user'
    }
  });

  if (!response.ok) {
    throw new Error('Watchlist seed API read failed.');
  }

  const payload = (await response.json()) as {
    data?: InvestModelWatchlistReadModel;
  };

  if (!payload.data) {
    throw new Error('Watchlist seed API returned no data.');
  }

  return payload.data;
}

function WatchlistLoadingRows({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('space-y-2', investCardClass.listRail)}
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-invest-control bg-invest-surface p-3 shadow-invest-card"
        >
          <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2.5 min-[390px]:grid-cols-[2rem_minmax(0,1fr)_auto]">
            <div className="size-8 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            <div className="min-w-0">
              <div className="h-3 w-28 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
              <div className="mt-2 h-5 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
              <div className="mt-2 h-4 w-9/12 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            </div>
            <div className="col-span-2 flex gap-1.5 min-[390px]:col-span-1 min-[390px]:block">
              <div className="h-6 w-20 rounded-invest-badge bg-invest-surface-muted motion-safe:animate-pulse" />
              <div className="h-6 w-24 rounded-invest-badge bg-invest-surface-muted motion-safe:animate-pulse min-[390px]:mt-1.5" />
            </div>
          </div>
          <div className="mt-3 h-8 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function WatchlistSeedPanel({ locale }: WatchlistSeedPanelProps) {
  const copy = watchlistCopy[locale];
  const [state, setState] = useState<WatchlistApiState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    readWatchlist()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setState(
          data.items.length > 0
            ? { status: 'loaded', data }
            : { status: 'empty', data }
        );
      })
      .catch(() => {
        if (isMounted) {
          setState({ status: 'error' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleItems = state.status === 'loaded' ? state.data.items : [];
  const safetySummary = useMemo(() => {
    if (state.status === 'loaded' || state.status === 'empty') {
      return state.data?.safetySummary ?? copy.safetyLine;
    }

    return copy.safetyLine;
  }, [copy.safetyLine, state]);
  const sectionAccessibleLabel = `${copy.sectionLabel}. ${copy.safetyLine}`;

  return (
    <section className="space-y-invest-card-gap" aria-label={sectionAccessibleLabel}>
      <SectionHeader title={copy.title} description={copy.description} />

      {state.status === 'loading' ? (
        <WatchlistLoadingRows label={copy.loadingLabel} />
      ) : null}

      {state.status === 'error' ? (
        <div className={cn('flex gap-3', investCardClass.mutedPanel)}>
          <AlertCircle
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-invest-risk"
          />
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-5 text-invest-text">
              {copy.errorTitle}
            </p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-invest-text-muted">
              {copy.errorDescription}
            </p>
          </div>
        </div>
      ) : null}

      {state.status === 'empty' ? (
        <div className={investCardClass.mutedPanel}>
          <p className="text-[15px] font-bold leading-5 text-invest-text">
            {copy.emptyTitle}
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-invest-text-muted">
            {copy.emptyDescription}
          </p>
          <EmptyStateCta
            href={
              locale === 'en'
                ? '/invest-model/signals?lang=en'
                : '/invest-model/signals'
            }
            label={copy.emptyCtaLabel}
            description={copy.emptyCtaDescription}
          />
        </div>
      ) : null}

      {state.status === 'loaded' ? (
        <div
          role="list"
          aria-label={copy.title}
          className={cn('space-y-2', investCardClass.listRail)}
        >
          {visibleItems.map((item, index) => (
            <article
              key={item.id}
              role="listitem"
              aria-label={`${item.displayName}. ${item.observationLabel}. ${item.statusLabel}. ${item.safetyLabel}.`}
              className={cn(
                'group rounded-invest-control bg-invest-surface p-3 shadow-invest-card',
                investMotionClass.interactiveCard
              )}
            >
              <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2.5 min-[390px]:grid-cols-[2rem_minmax(0,1fr)_auto]">
                <div className="grid size-8 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-[13px] font-bold text-invest-primary">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
                    {item.observationLabel}
                  </p>
                  <h3 className="mt-0.5 line-clamp-2 break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                    {item.displayName}
                  </h3>
                  <p className="mt-1 line-clamp-2 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                    {item.linkedModelName}
                    {' · '}
                    {item.freshnessLabel}
                  </p>
                </div>
                <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-1.5 min-[390px]:col-span-1 min-[390px]:block min-[390px]:text-right">
                  <span className="rounded-invest-badge bg-invest-positive-soft px-2 py-1 text-[11px] font-bold leading-4 text-invest-positive">
                    {item.scoreLabel}
                  </span>
                  <span className="rounded-invest-badge bg-invest-surface-muted px-2 py-1 text-[11px] font-semibold leading-4 text-invest-text-muted">
                    {item.statusLabel}
                  </span>
                </div>
              </div>
              <p className="mt-2 flex min-w-0 items-start gap-1.5 rounded-invest-control bg-invest-surface-muted px-2.5 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 size-3 shrink-0 text-invest-risk"
                />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                  {item.safetyLabel}
                </span>
              </p>
            </article>
          ))}
        </div>
      ) : null}

      <p className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-3 text-xs font-medium leading-5 text-invest-text-muted shadow-invest-card">
        <span className="font-bold text-invest-text">{copy.sourceLabel}</span>
        {' / '}
        {copy.simulationOnly}
        {' / '}
        {copy.noLiveTrading}
        {' / '}
        {copy.noBrokerage}
        {' / '}
        {copy.notAdvice}
        {' · '}
        {safetySummary}
        {' '}
        {copy.safetyLine}
      </p>
    </section>
  );
}
