'use client';

import { AlertCircle, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { InvestModelPortfolioHoldings } from '@/lib/db/portfolio-holdings-read-model';
import type { InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import {
  RiskBadge,
  SectionHeader,
  investCardClass,
  investMotionClass
} from './ui';

type PortfolioHoldingsMeta = {
  readOnly?: boolean;
  mockOnly?: boolean;
  simulated?: boolean;
  realDeposit?: boolean;
  realBalance?: boolean;
  realOrder?: boolean;
  brokerageConnection?: boolean;
  brokerConfirmedHoldings?: boolean;
  realHolding?: boolean;
  orderExecution?: boolean;
  tradeFill?: boolean;
  settlement?: boolean;
  accountLinking?: boolean;
  externalPaidApi?: boolean;
  financialAdvice?: boolean;
  tradeIntentCreated?: boolean;
  generatedFrom?: string;
};

type PortfolioHoldingsApiState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      data: InvestModelPortfolioHoldings;
      meta?: PortfolioHoldingsMeta;
    }
  | { status: 'empty'; meta?: PortfolioHoldingsMeta }
  | { status: 'error' };

type PortfolioHoldingsListCardProps = {
  locale: InvestModelLocale;
};

const holdingsCopy = {
  ko: {
    title: 'Simulated holdings',
    description:
      'DB seed/read-model PortfolioPositions only. No broker-confirmed holdings, account link, order, fill, or advice.',
    loadingLabel: 'Loading simulated holdings read-model',
    errorTitle: 'Holdings could not be read',
    errorDescription:
      'A failed read does not try broker accounts, real holdings, orders, fills, or advice.',
    emptyTitle: 'No simulated holdings yet',
    emptyDescription:
      'The holdings list stays empty until mock-safe seed rows are available.',
    allocationLabel: 'Mock allocation',
    quantityLabel: 'Simulated units',
    valueLabel: 'Simulated value',
    sourceLabel: 'DB read-model',
    safetyLine:
      'simulated holdings only / not broker-confirmed / no real holding / no order execution / no account linking / not advice',
    sectionLabel: 'Portfolio holdings mobile list'
  },
  en: {
    title: 'Simulated holdings',
    description:
      'DB seed/read-model PortfolioPositions only. No broker-confirmed holdings, account link, order, fill, or advice.',
    loadingLabel: 'Loading simulated holdings read-model',
    errorTitle: 'Holdings could not be read',
    errorDescription:
      'A failed read does not try broker accounts, real holdings, orders, fills, or advice.',
    emptyTitle: 'No simulated holdings yet',
    emptyDescription:
      'The holdings list stays empty until mock-safe seed rows are available.',
    allocationLabel: 'Mock allocation',
    quantityLabel: 'Simulated units',
    valueLabel: 'Simulated value',
    sourceLabel: 'DB read-model',
    safetyLine:
      'simulated holdings only / not broker-confirmed / no real holding / no order execution / no account linking / not advice',
    sectionLabel: 'Portfolio holdings mobile list'
  }
} as const;

async function readPortfolioHoldings() {
  const response = await fetch('/api/portfolio/holdings', {
    headers: {
      'x-invest-model-role': 'user'
    }
  });

  if (!response.ok) {
    throw new Error('Portfolio holdings API read failed.');
  }

  return (await response.json()) as {
    data?: InvestModelPortfolioHoldings;
    meta?: PortfolioHoldingsMeta;
  };
}

function booleanLabel(value: boolean | undefined) {
  return String(value ?? false);
}

function parsePercentLabel(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : 0;
}

function PortfolioHoldingsLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-portfolio-holdings-loading-skeleton="mock-only"
      className={cn('space-y-2', investCardClass.listRail)}
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-invest-card bg-invest-surface p-3 shadow-invest-card"
        >
          <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7rem]">
            <div className="min-w-0">
              <div className="h-3 w-20 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
              <div className="mt-2 h-5 w-10/12 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            </div>
            <div className="h-10 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          </div>
          <div className="mt-3 h-2 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function PortfolioHoldingsListCard({
  locale
}: PortfolioHoldingsListCardProps) {
  const copy = holdingsCopy[locale];
  const [state, setState] = useState<PortfolioHoldingsApiState>({
    status: 'loading'
  });

  useEffect(() => {
    let isMounted = true;

    readPortfolioHoldings()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        const holdings = payload.data?.holdings ?? [];
        setState(
          payload.data && holdings.length > 0
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
      `brokerConfirmedHoldings=${booleanLabel(meta?.brokerConfirmedHoldings)}`,
      `realHolding=${booleanLabel(meta?.realHolding)}`,
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
      data-portfolio-holdings-list="mock-safe"
    >
      <SectionHeader title={copy.title} description={copy.description} />

      {state.status === 'loading' ? (
        <PortfolioHoldingsLoading label={copy.loadingLabel} />
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
          className={cn('space-y-2', investCardClass.listRail)}
        >
          <div className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">
            <div className="grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                  {state.data.displayHints.listTitle}
                </p>
                <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                  {state.data.summaryAlignment.sourceSummaryValueLabel} /{' '}
                  {state.data.summaryAlignment.positionCountLabel}
                </p>
              </div>
              <RiskBadge tone="medium" className="justify-center text-center">
                {state.data.displayHints.allocationTitle}
              </RiskBadge>
            </div>
            <p className="mt-2 break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
              {state.data.summaryAlignment.allocationBasisLabel} /{' '}
              {state.data.summaryAlignment.mockCashBufferLabel}
            </p>
          </div>

          {state.data.holdings.map((holding) => (
            <article
              key={holding.symbol}
              role="listitem"
              aria-label={`${holding.symbol}. ${holding.name}. ${holding.weightLabel}. ${holding.valueLabel}. ${copy.safetyLine}.`}
              title={`${holding.symbol} ${holding.weightLabel} ${holding.safetyLabel}`}
              className={cn(
                'group rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card focus-within:border-invest-primary/40',
                investMotionClass.interactiveCard
              )}
            >
              <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]">
                <div className="flex min-w-0 gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary transition-[background-color,transform] duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                    <BriefcaseBusiness aria-hidden className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-[16px] font-bold leading-6 text-invest-text [overflow-wrap:anywhere]">
                      {holding.symbol}
                    </p>
                    <p className="line-clamp-2 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                      {holding.name}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 text-right">
                  <p className="break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                    {holding.weightLabel}
                  </p>
                  <p className="mt-1 break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
                    {holding.valueLabel}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-invest-control bg-invest-surface-muted">
                <div
                  className="h-full origin-left rounded-invest-control bg-invest-primary transition-[width,transform] duration-200 ease-out group-hover:scale-y-110 group-active:scale-y-95 motion-reduce:transition-none motion-reduce:group-hover:scale-y-100 motion-reduce:group-active:scale-y-100"
                  style={{ width: `${parsePercentLabel(holding.weightLabel)}%` }}
                />
              </div>

              <div className="mt-3 grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0 rounded-invest-control bg-invest-bg-soft px-2.5 py-2">
                  <p className="text-[10px] font-bold uppercase leading-4 text-invest-text-muted">
                    {copy.quantityLabel}
                  </p>
                  <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text [overflow-wrap:anywhere]">
                    {holding.quantityLabel}
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-1.5 min-[390px]:justify-end">
                  <RiskBadge tone="neutral">{holding.stateLabel}</RiskBadge>
                  <RiskBadge tone="blocked">{holding.safetyLabel}</RiskBadge>
                </div>
              </div>
            </article>
          ))}

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
