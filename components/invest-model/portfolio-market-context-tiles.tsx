'use client';

import { AlertCircle, Grid2X2, ShieldCheck, Waves } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { InvestModelPortfolioAllocationSplit } from '@/lib/db/portfolio-allocation-split-read-model';
import type { InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import {
  RiskBadge,
  SectionHeader,
  investCardClass,
  investMotionClass
} from './ui';

type MarketContextMeta = {
  readOnly?: boolean;
  mockOnly?: boolean;
  simulated?: boolean;
  realDeposit?: boolean;
  realBalance?: boolean;
  realOrder?: boolean;
  brokerageConnection?: boolean;
  brokerConfirmed?: boolean;
  brokerConfirmedHoldings?: boolean;
  realHolding?: boolean;
  userRiskSettingAccepted?: boolean;
  userAllocationOverrideAccepted?: boolean;
  orderExecution?: boolean;
  tradeFill?: boolean;
  settlement?: boolean;
  accountLinking?: boolean;
  externalPaidApi?: boolean;
  financialAdvice?: boolean;
  tradeIntentCreated?: boolean;
  generatedFrom?: string;
};

type MarketContextState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      data: InvestModelPortfolioAllocationSplit;
      meta?: MarketContextMeta;
    }
  | { status: 'empty'; meta?: MarketContextMeta }
  | { status: 'error' };

type PortfolioMarketContextTilesProps = {
  locale: InvestModelLocale;
};

const marketContextCopy = {
  ko: {
    title: 'Simulated market context',
    description:
      'Seeded sector and asset-class tiles from mock allocation split data. No live market feed, broker account, order, or advice.',
    loadingLabel: 'Loading simulated market context tiles',
    errorTitle: 'Market context tiles could not be read',
    errorDescription:
      'A failed read does not try live market data, external paid APIs, broker accounts, orders, or advice.',
    emptyTitle: 'No seeded context tiles yet',
    emptyDescription:
      'Market context tiles stay empty until mock-safe allocation buckets are available.',
    sourceLabel: 'Seed/read-model context',
    sectorLabel: 'Sector cluster',
    assetLabel: 'Asset-class cluster',
    tileSafety: 'simulated context tile',
    safetyLine:
      'seeded allocation context only / no live market data / no external paid API / no real holding / no order execution / not advice',
    sectionLabel: 'Portfolio simulated market context tiles'
  },
  en: {
    title: 'Simulated market context',
    description:
      'Seeded sector and asset-class tiles from mock allocation split data. No live market feed, broker account, order, or advice.',
    loadingLabel: 'Loading simulated market context tiles',
    errorTitle: 'Market context tiles could not be read',
    errorDescription:
      'A failed read does not try live market data, external paid APIs, broker accounts, orders, or advice.',
    emptyTitle: 'No seeded context tiles yet',
    emptyDescription:
      'Market context tiles stay empty until mock-safe allocation buckets are available.',
    sourceLabel: 'Seed/read-model context',
    sectorLabel: 'Sector cluster',
    assetLabel: 'Asset-class cluster',
    tileSafety: 'simulated context tile',
    safetyLine:
      'seeded allocation context only / no live market data / no external paid API / no real holding / no order execution / not advice',
    sectionLabel: 'Portfolio simulated market context tiles'
  }
} as const;

async function readPortfolioAllocationSplit() {
  const response = await fetch('/api/portfolio/allocation-split', {
    headers: {
      'x-invest-model-role': 'user'
    }
  });

  if (!response.ok) {
    throw new Error('Portfolio allocation split API read failed.');
  }

  return (await response.json()) as {
    data?: InvestModelPortfolioAllocationSplit;
    meta?: MarketContextMeta;
  };
}

function booleanLabel(value: boolean | undefined) {
  return String(value ?? false);
}

function parseWeightLabel(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : 0;
}

function PortfolioMarketContextLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-portfolio-market-context-loading="mock-only"
      className="grid gap-2 min-[390px]:grid-cols-2"
    >
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-invest-card bg-invest-surface p-3 shadow-invest-card"
        >
          <div className="h-3 w-24 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          <div className="mt-3 h-8 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          <div className="mt-3 h-2 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function PortfolioMarketContextTiles({
  locale
}: PortfolioMarketContextTilesProps) {
  const copy = marketContextCopy[locale];
  const [state, setState] = useState<MarketContextState>({
    status: 'loading'
  });

  useEffect(() => {
    let isMounted = true;

    readPortfolioAllocationSplit()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        const tileCount =
          (payload.data?.sectorBuckets.length ?? 0) +
          (payload.data?.assetClassBuckets.length ?? 0);

        setState(
          payload.data && tileCount > 0
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
      `realDeposit=${booleanLabel(meta?.realDeposit)}`,
      `realBalance=${booleanLabel(meta?.realBalance)}`,
      `realOrder=${booleanLabel(meta?.realOrder)}`,
      `brokerageConnection=${booleanLabel(meta?.brokerageConnection)}`,
      `brokerConfirmed=${booleanLabel(meta?.brokerConfirmed)}`,
      `brokerConfirmedHoldings=${booleanLabel(meta?.brokerConfirmedHoldings)}`,
      `realHolding=${booleanLabel(meta?.realHolding)}`,
      `userRiskSettingAccepted=${booleanLabel(meta?.userRiskSettingAccepted)}`,
      `userAllocationOverrideAccepted=${booleanLabel(meta?.userAllocationOverrideAccepted)}`,
      `orderExecution=${booleanLabel(meta?.orderExecution)}`,
      `tradeFill=${booleanLabel(meta?.tradeFill)}`,
      `settlement=${booleanLabel(meta?.settlement)}`,
      `accountLinking=${booleanLabel(meta?.accountLinking)}`,
      `externalPaidApi=${booleanLabel(meta?.externalPaidApi)}`,
      `financialAdvice=${booleanLabel(meta?.financialAdvice)}`,
      `tradeIntentCreated=${booleanLabel(meta?.tradeIntentCreated)}`
    ].join(' / ');
  }, [state]);

  const sectionAccessibleLabel = `${copy.sectionLabel}. ${copy.safetyLine}. ${safetyMetaLine}`;

  return (
    <section
      className="space-y-invest-card-gap"
      aria-label={sectionAccessibleLabel}
      data-portfolio-market-context-tiles="mock-safe"
    >
      <SectionHeader title={copy.title} description={copy.description} />

      {state.status === 'loading' ? (
        <PortfolioMarketContextLoading label={copy.loadingLabel} />
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

      {state.status === 'loaded' ? (
        <div
          role="list"
          aria-label={`${copy.title}. ${copy.safetyLine}. ${safetyMetaLine}`}
          className="space-y-2 rounded-invest-control bg-invest-bg-soft p-1.5"
        >
          <div className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">
            <div className="grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                  {state.data.displayHints.segmentedControlTitle}
                </p>
                <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                  {state.data.summaryAlignment.holdingsTotalLabel} /{' '}
                  {state.data.summaryAlignment.allocationBasisLabel}
                </p>
              </div>
              <RiskBadge tone="medium" className="justify-center text-center">
                {copy.sourceLabel}
              </RiskBadge>
            </div>
          </div>

          <div className="grid gap-2 min-[390px]:grid-cols-2">
            {state.data.sectorBuckets.map((bucket) => (
              <article
                key={bucket.bucketId}
                role="listitem"
                aria-label={`${copy.sectorLabel}: ${bucket.label}. ${bucket.weightLabel}. ${bucket.valueLabel}. ${copy.safetyLine}.`}
                title={`${bucket.label} ${bucket.weightLabel} ${bucket.safetyLabel}`}
                className={cn(
                  'group rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card focus-within:border-invest-primary/40',
                  investMotionClass.interactiveCard
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary transition-[transform] duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                    <Grid2X2 aria-hidden className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase leading-4 text-invest-text-muted">
                      {copy.sectorLabel}
                    </p>
                    <h3 className="break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                      {bucket.label}
                    </h3>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-invest-control bg-invest-surface-muted">
                  <div
                    className="h-full origin-left rounded-invest-control bg-invest-primary transition-[width,transform] duration-200 ease-out group-hover:scale-y-110 group-active:scale-y-95 motion-reduce:transition-none motion-reduce:group-hover:scale-y-100 motion-reduce:group-active:scale-y-100"
                    style={{ width: `${parseWeightLabel(bucket.weightLabel)}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
                  <p className="break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                    {bucket.valueLabel} / {bucket.sourceSymbols.join(', ')}
                  </p>
                  <RiskBadge tone="low" className="justify-center text-center">
                    {bucket.weightLabel}
                  </RiskBadge>
                </div>
              </article>
            ))}

            {state.data.assetClassBuckets.map((bucket) => (
              <article
                key={bucket.bucketId}
                role="listitem"
                aria-label={`${copy.assetLabel}: ${bucket.label}. ${bucket.weightLabel}. ${bucket.valueLabel}. ${copy.safetyLine}.`}
                title={`${bucket.label} ${bucket.weightLabel} ${bucket.safetyLabel}`}
                className={cn(
                  'group rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card focus-within:border-invest-primary/40',
                  investMotionClass.interactiveCard
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-invest-control bg-invest-positive-soft text-invest-positive transition-[transform] duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                    <Waves aria-hidden className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase leading-4 text-invest-text-muted">
                      {copy.assetLabel}
                    </p>
                    <h3 className="break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                      {bucket.label}
                    </h3>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-invest-control bg-invest-surface-muted">
                  <div
                    className="h-full origin-left rounded-invest-control bg-invest-positive transition-[width,transform] duration-200 ease-out group-hover:scale-y-110 group-active:scale-y-95 motion-reduce:transition-none motion-reduce:group-hover:scale-y-100 motion-reduce:group-active:scale-y-100"
                    style={{ width: `${parseWeightLabel(bucket.weightLabel)}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
                  <p className="break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                    {bucket.valueLabel} / {bucket.sourceSymbols.join(', ')}
                  </p>
                  <RiskBadge tone="neutral" className="justify-center text-center">
                    {bucket.weightLabel}
                  </RiskBadge>
                </div>
              </article>
            ))}
          </div>

          <p className="flex min-w-0 items-start gap-1.5 rounded-invest-control border border-invest-risk/10 bg-invest-risk-soft/45 px-2.5 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-invest-risk"
            />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">
              {copy.safetyLine}. {state.data.displayHints.safetyLine}{' '}
              {safetyMetaLine}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
