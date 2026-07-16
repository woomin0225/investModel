'use client';

import { AlertCircle, Database, ShieldCheck, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { InvestModelPortfolioCompactSummary } from '@/lib/db/portfolio-compact-read-model';
import type { InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import {
  SectionHeader,
  investCardClass,
  investMotionClass
} from './ui';

type PortfolioCompactSummaryMeta = {
  readOnly?: boolean;
  mockOnly?: boolean;
  simulated?: boolean;
  realDeposit?: boolean;
  realBalance?: boolean;
  realOrder?: boolean;
  brokerageConnection?: boolean;
  financialAdvice?: boolean;
  accountLinking?: boolean;
  tradeIntentCreated?: boolean;
  userScopeSource?: string;
  generatedFrom?: string;
};

type PortfolioCompactSummaryApiState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      data: InvestModelPortfolioCompactSummary;
      meta?: PortfolioCompactSummaryMeta;
    }
  | { status: 'empty'; meta?: PortfolioCompactSummaryMeta }
  | { status: 'error' };

type PortfolioCompactSummaryCardProps = {
  locale: InvestModelLocale;
};

const compactPortfolioCopy = {
  ko: {
    title: 'PortfolioSummary',
    description:
      'MockDeposit과 선택 모델 포트폴리오 요약을 작은 카드로 먼저 확인합니다.',
    loadingLabel: 'PortfolioSummary DB read-model을 불러오는 중',
    errorTitle: 'PortfolioSummary를 읽지 못했습니다',
    errorDescription:
      '실패해도 실제 입금, 실주문, 브로커 연결, 투자 조언을 시도하지 않습니다.',
    emptyTitle: 'PortfolioSummary 표시 준비 중',
    emptyDescription:
      'DB seed 또는 mock-safe fallback 요약이 준비되면 이 카드에 표시됩니다.',
    primaryMetric: '모의 포트폴리오 가치',
    secondaryMetric: 'MockDeposit 맥락',
    positionCount: '모의 포지션',
    selectedModel: '선택 모델',
    readModelSource: 'DB read-model',
    safetyLine:
      'MockDeposit / PortfolioSummary는 simulated read-model 값입니다. no real deposit / no real order / no brokerage / not advice.',
    visibleBoundary:
      'pre-order simulation only / no real balance / no account linking / TradeIntent not created',
    sectionLabel: 'Portfolio compact summary card'
  },
  en: {
    title: 'PortfolioSummary',
    description:
      'A compact first glance at MockDeposit and selected model portfolio context.',
    loadingLabel: 'Loading PortfolioSummary DB read-model',
    errorTitle: 'PortfolioSummary could not be read',
    errorDescription:
      'A failed read does not try real deposits, real orders, brokerage connections, or advice.',
    emptyTitle: 'PortfolioSummary pending',
    emptyDescription:
      'This card appears when the DB seed or mock-safe fallback summary is available.',
    primaryMetric: 'Simulated portfolio value',
    secondaryMetric: 'MockDeposit context',
    positionCount: 'Simulated positions',
    selectedModel: 'Selected model',
    readModelSource: 'DB read-model',
    safetyLine:
      'MockDeposit / PortfolioSummary are simulated read-model values. no real deposit / no real order / no brokerage / not advice.',
    visibleBoundary:
      'pre-order simulation only / no real balance / no account linking / TradeIntent not created',
    sectionLabel: 'Portfolio compact summary card'
  }
} as const;

async function readPortfolioCompactSummary() {
  const response = await fetch('/api/portfolio/compact-summary', {
    headers: {
      'x-invest-model-role': 'user'
    }
  });

  if (!response.ok) {
    throw new Error('Portfolio compact summary API read failed.');
  }

  const payload = (await response.json()) as {
    data?: InvestModelPortfolioCompactSummary;
    meta?: PortfolioCompactSummaryMeta;
  };

  return payload;
}

function PortfolioCompactLoadingRows({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-portfolio-compact-loading-skeleton="mock-only"
      className={cn('space-y-2', investCardClass.listRail)}
    >
      <div className="rounded-invest-control bg-invest-surface p-3 shadow-invest-card">
        <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7rem]">
          <div className="min-w-0">
            <div className="h-3 w-28 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            <div className="mt-2 h-7 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-10/12 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-1">
            <div className="h-10 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            <div className="h-10 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          </div>
        </div>
        <div className="mt-3 h-10 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

function booleanLabel(value: boolean | undefined) {
  return String(value ?? false);
}

export function PortfolioCompactSummaryCard({
  locale
}: PortfolioCompactSummaryCardProps) {
  const copy = compactPortfolioCopy[locale];
  const [state, setState] = useState<PortfolioCompactSummaryApiState>({
    status: 'loading'
  });

  useEffect(() => {
    let isMounted = true;

    readPortfolioCompactSummary()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setState(
          payload.data
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
      `accountLinking=${booleanLabel(meta?.accountLinking)}`,
      `financialAdvice=${booleanLabel(meta?.financialAdvice)}`,
      `tradeIntentCreated=${booleanLabel(meta?.tradeIntentCreated)}`
    ].join(' / ');
  }, [state]);

  const sectionAccessibleLabel = `${copy.sectionLabel}. ${copy.safetyLine} ${copy.visibleBoundary}. ${safetyMetaLine}`;

  return (
    <section
      className="space-y-invest-card-gap"
      aria-label={sectionAccessibleLabel}
    >
      <SectionHeader title={copy.title} description={copy.description} />

      {state.status === 'loading' ? (
        <PortfolioCompactLoadingRows label={copy.loadingLabel} />
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
            {copy.safetyLine} {copy.visibleBoundary}
          </p>
          <p className="mt-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
            No PortfolioSummary rows yet; browse mock models only.
          </p>
        </div>
      ) : null}

      {state.status === 'loaded' ? (
        <article
          aria-label={`${copy.title}. ${state.data.selectedModel.name}. ${copy.safetyLine} ${copy.visibleBoundary}.`}
          className={cn(
            'rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card',
            investMotionClass.interactiveCard
          )}
        >
          <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-8 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
                  <WalletCards aria-hidden className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                    {copy.primaryMetric}
                  </p>
                  <p className="mt-0.5 break-words text-[22px] font-bold leading-7 text-invest-text [overflow-wrap:anywhere]">
                    {state.data.portfolioSummary.simulatedValueLabel}
                  </p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 break-words text-[13px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                {state.data.selectedModel.name} /{' '}
                {state.data.selectedModel.statusLabel} /{' '}
                {state.data.selectedModel.riskLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-1">
              <div className="rounded-invest-control bg-invest-bg-soft p-2">
                <p className="text-[10px] font-bold leading-4 text-invest-text-muted">
                  {copy.secondaryMetric}
                </p>
                <p className="mt-1 line-clamp-2 break-words text-[12px] font-bold leading-4 text-invest-text [overflow-wrap:anywhere]">
                  {state.data.mockDeposit.statusLabel}
                </p>
              </div>
              <div className="rounded-invest-control bg-invest-bg-soft p-2">
                <p className="text-[10px] font-bold leading-4 text-invest-text-muted">
                  {copy.positionCount}
                </p>
                <p className="mt-1 break-words text-[12px] font-bold leading-4 text-invest-text [overflow-wrap:anywhere]">
                  {state.data.portfolioSummary.positionCountLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 rounded-invest-control bg-invest-bg-soft p-2.5 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-4 text-invest-text-muted">
                {copy.readModelSource}
              </p>
              <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-invest-text [overflow-wrap:anywhere]">
                {state.data.portfolioSummary.snapshotLabel} /{' '}
                {state.data.allocationDecision.sourceLabel}
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 min-[390px]:justify-end">
              <Database
                aria-hidden
                className="size-4 shrink-0 text-invest-text-muted"
              />
              <span className="min-w-0 break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
                {state.data.displayHints.safetyLine}
              </span>
            </div>
          </div>

          <p className="mt-3 flex min-w-0 items-start gap-1.5 rounded-invest-control border border-invest-risk/10 bg-invest-risk-soft/45 px-2.5 py-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-invest-risk"
            />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">
              {copy.safetyLine} {copy.visibleBoundary}. {safetyMetaLine}
            </span>
          </p>
        </article>
      ) : null}
    </section>
  );
}
