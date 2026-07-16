'use client';

import {
  Activity,
  AlertCircle,
  LineChart,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { InvestModelPriceHistoryReadModel } from '@/lib/db/price-history-read-model';
import type { InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import {
  RiskBadge,
  SectionHeader,
  investCardClass,
  investMotionClass
} from './ui';

type PriceHistoryMeta = {
  routeStatus?: string;
  contract?: string;
  persistence?: string;
  symbol?: string;
  limit?: number;
  generatedFrom?: string;
  readOnly?: boolean;
  mockOnly?: boolean;
  simulated?: boolean;
  sampleBacktestWindow?: boolean;
  liveMarketData?: boolean;
  realTimeQuotes?: boolean;
  externalPaidApi?: boolean;
  brokerageConnection?: boolean;
  tradeInstruction?: boolean;
  tradeIntentCreated?: boolean;
  realOrder?: boolean;
  financialAdvice?: boolean;
};

type PriceHistoryApiState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      data: InvestModelPriceHistoryReadModel;
      meta?: PriceHistoryMeta;
    }
  | { status: 'empty'; meta?: PriceHistoryMeta }
  | { status: 'error' };

type SeededPriceMiniChartCardProps = {
  locale: InvestModelLocale;
};

const priceMiniChartCopy = {
  ko: {
    title: 'Seeded price mini chart',
    description:
      'BK-501/BK-502 seed price history를 작은 차트로 보여주는 simulated sample_backtest_window입니다.',
    loadingLabel: 'Seeded price history mini chart loading',
    errorTitle: 'Seeded price history를 읽지 못했습니다',
    errorDescription:
      '실패해도 live quotes, 주문, 브로커 연결, 투자 조언을 시도하지 않습니다.',
    emptyTitle: 'Seeded price history가 아직 없습니다',
    emptyDescription:
      'bounded mock_seed data가 있을 때만 mini chart shell을 표시합니다.',
    latestLabel: 'Latest sample',
    rangeLabel: 'Sample range',
    pointLabel: 'Seeded points',
    sourceLabel: 'mock_seed / sample_backtest_window',
    safetyLine:
      'simulated seed fixture only / no live market data / no real-time quotes / no external paid API / no orders / not advice',
    chartLabel: 'Accessible seeded mini chart for SAMPLE_AI_BASKET'
  },
  en: {
    title: 'Seeded price mini chart',
    description:
      'A small simulated sample_backtest_window chart powered by the BK-501/BK-502 price-history fixture.',
    loadingLabel: 'Seeded price history mini chart loading',
    errorTitle: 'Seeded price history could not be read',
    errorDescription:
      'A failed read does not try live quotes, orders, brokerage connections, or advice.',
    emptyTitle: 'No seeded price history yet',
    emptyDescription:
      'The mini chart shell renders only when bounded mock_seed data is available.',
    latestLabel: 'Latest sample',
    rangeLabel: 'Sample range',
    pointLabel: 'Seeded points',
    sourceLabel: 'mock_seed / sample_backtest_window',
    safetyLine:
      'simulated seed fixture only / no live market data / no real-time quotes / no external paid API / no orders / not advice',
    chartLabel: 'Accessible seeded mini chart for SAMPLE_AI_BASKET'
  }
} as const;

async function readPriceHistory() {
  const response = await fetch('/api/price-history?symbol=SAMPLE_AI_BASKET&limit=6', {
    headers: {
      'x-invest-model-role': 'user'
    }
  });

  if (!response.ok) {
    throw new Error('Price history API read failed.');
  }

  return (await response.json()) as {
    data?: InvestModelPriceHistoryReadModel;
    meta?: PriceHistoryMeta;
  };
}

function booleanLabel(value: boolean | undefined) {
  return String(value ?? false);
}

function formatSamplePrice(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return '0.00 sample';
  }

  return `${Number(value).toFixed(2)} sample`;
}

function formatCapturedAt(value: string | undefined) {
  if (!value) {
    return 'seed time unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(11, 16);
}

function SeededPriceMiniChartLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-price-history-mini-chart-loading="mock-only"
      className={cn('space-y-2', investCardClass.listRail)}
    >
      <div className="rounded-invest-card bg-invest-surface p-3 shadow-invest-card">
        <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7rem]">
          <div className="min-w-0">
            <div className="h-3 w-28 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            <div className="mt-2 h-7 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          </div>
          <div className="h-12 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
        </div>
        <div className="mt-3 grid h-20 grid-cols-6 items-end gap-1.5">
          {[36, 48, 58, 44, 72, 84].map((height) => (
            <div
              key={height}
              className="rounded-t-invest-control bg-invest-surface-muted motion-safe:animate-pulse"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeededPriceMiniChartCard({
  locale
}: SeededPriceMiniChartCardProps) {
  const copy = priceMiniChartCopy[locale];
  const [state, setState] = useState<PriceHistoryApiState>({
    status: 'loading'
  });

  useEffect(() => {
    let isMounted = true;

    readPriceHistory()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setState(
          payload.data && payload.data.points.length > 0
            ? { status: 'loaded', data: payload.data, meta: payload.meta }
            : { status: 'empty', meta: payload.meta }
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

  const safetyMetaLine = useMemo(() => {
    const meta =
      state.status === 'loaded' || state.status === 'empty'
        ? state.meta
        : undefined;

    return [
      `mockOnly=${booleanLabel(meta?.mockOnly)}`,
      `simulated=${booleanLabel(meta?.simulated)}`,
      `sampleBacktestWindow=${booleanLabel(meta?.sampleBacktestWindow)}`,
      `liveMarketData=${booleanLabel(meta?.liveMarketData)}`,
      `realTimeQuotes=${booleanLabel(meta?.realTimeQuotes)}`,
      `externalPaidApi=${booleanLabel(meta?.externalPaidApi)}`,
      `brokerageConnection=${booleanLabel(meta?.brokerageConnection)}`,
      `tradeInstruction=${booleanLabel(meta?.tradeInstruction)}`,
      `tradeIntentCreated=${booleanLabel(meta?.tradeIntentCreated)}`,
      `realOrder=${booleanLabel(meta?.realOrder)}`,
      `financialAdvice=${booleanLabel(meta?.financialAdvice)}`
    ].join(' / ');
  }, [state]);

  const chartMetrics = useMemo(() => {
    if (state.status !== 'loaded') {
      return null;
    }

    const prices = state.data.points.map((point) => point.samplePrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = Math.max(maxPrice - minPrice, 1);
    const latestPoint = state.data.points[state.data.points.length - 1];
    const firstPoint = state.data.points[0];

    return {
      firstPoint,
      latestPoint,
      minPrice,
      maxPrice,
      bars: state.data.points.map((point) => ({
        ...point,
        heightPercent: 28 + ((point.samplePrice - minPrice) / range) * 64
      }))
    };
  }, [state]);

  const sectionAccessibleLabel = `${copy.chartLabel}. ${copy.safetyLine}. ${safetyMetaLine}`;

  return (
    <section
      className="space-y-invest-card-gap"
      aria-label={sectionAccessibleLabel}
      data-price-history-mini-chart="SAMPLE_AI_BASKET"
    >
      <SectionHeader title={copy.title} description={copy.description} />

      {state.status === 'loading' ? (
        <SeededPriceMiniChartLoading label={copy.loadingLabel} />
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
            <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
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
          <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
            {copy.emptyDescription}
          </p>
          <p className="mt-3 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
            {copy.safetyLine}. {safetyMetaLine}
          </p>
        </div>
      ) : null}

      {state.status === 'loaded' && chartMetrics ? (
        <article
          aria-label={`${copy.chartLabel}. ${state.data.instrumentSymbol}. ${copy.safetyLine}. ${safetyMetaLine}`}
          title={`${copy.chartLabel}. ${state.data.instrumentSymbol}. ${copy.safetyLine}.`}
          className={cn(
            'rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card',
            investMotionClass.interactiveCard
          )}
        >
          <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-8 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                  <LineChart aria-hidden className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                    {state.data.instrumentSymbol}
                  </p>
                  <p className="mt-0.5 break-words text-[22px] font-bold leading-7 text-invest-text [overflow-wrap:anywhere]">
                    {formatSamplePrice(chartMetrics.latestPoint?.samplePrice)}
                  </p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 break-words text-[13px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                {chartMetrics.latestPoint?.instrumentName} /{' '}
                {copy.sourceLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-1">
              <div className="rounded-invest-control bg-invest-bg-soft p-2">
                <p className="text-[10px] font-bold leading-4 text-invest-text-muted">
                  {copy.rangeLabel}
                </p>
                <p className="mt-1 break-words text-[12px] font-bold leading-4 text-invest-text [overflow-wrap:anywhere]">
                  {formatSamplePrice(chartMetrics.minPrice)} -{' '}
                  {formatSamplePrice(chartMetrics.maxPrice)}
                </p>
              </div>
              <div className="rounded-invest-control bg-invest-bg-soft p-2">
                <p className="text-[10px] font-bold leading-4 text-invest-text-muted">
                  {copy.pointLabel}
                </p>
                <p className="mt-1 break-words text-[12px] font-bold leading-4 text-invest-text [overflow-wrap:anywhere]">
                  {state.data.points.length} points
                </p>
              </div>
            </div>
          </div>

          <div
            role="img"
            aria-label={`${copy.chartLabel}: ${state.data.points
              .map(
                (point) =>
                  `${formatCapturedAt(point.capturedAt)} ${formatSamplePrice(point.samplePrice)}`
              )
              .join(', ')}. ${copy.safetyLine}.`}
            className="mt-3 grid h-24 grid-cols-6 items-end gap-1.5 rounded-invest-control bg-invest-bg-soft px-2.5 py-2"
          >
            {chartMetrics.bars.map((point) => (
              <div
                key={point.id}
                data-price-history-bar={point.id}
                className="flex h-full min-w-0 items-end"
                title={`${formatCapturedAt(point.capturedAt)} ${formatSamplePrice(point.samplePrice)} ${point.seedSourceLabel}`}
              >
                <div
                  className="w-full rounded-t-invest-control bg-invest-primary transition-[height,transform,background-color] duration-200 ease-out hover:bg-invest-positive active:scale-y-95 motion-reduce:transition-none motion-reduce:active:scale-y-100"
                  style={{ height: `${point.heightPercent}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-bg-soft p-2.5 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                {copy.latestLabel}
              </p>
              <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text [overflow-wrap:anywhere]">
                {formatCapturedAt(chartMetrics.firstPoint?.capturedAt)} -{' '}
                {formatCapturedAt(chartMetrics.latestPoint?.capturedAt)} /{' '}
                {state.data.generatedFrom}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 min-[390px]:justify-end">
              <RiskBadge tone="medium">sample_backtest_window</RiskBadge>
              <RiskBadge tone="neutral">mock_seed</RiskBadge>
            </div>
          </div>

          <p className="mt-3 flex min-w-0 items-start gap-1.5 rounded-invest-control border border-invest-risk/10 bg-invest-risk-soft/45 px-2.5 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-invest-risk"
            />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">
              {copy.safetyLine}. {safetyMetaLine}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <RiskBadge tone="low">
              <Activity aria-hidden className="mr-1 size-3" />
              read-only fixture
            </RiskBadge>
            <RiskBadge tone="blocked">
              <Sparkles aria-hidden className="mr-1 size-3" />
              no live quotes
            </RiskBadge>
          </div>
        </article>
      ) : null}
    </section>
  );
}
