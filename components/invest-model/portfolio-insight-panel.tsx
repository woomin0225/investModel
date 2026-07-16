'use client';

import {
  AlertCircle,
  GitBranch,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { InvestModelPortfolioInsight } from '@/lib/db/portfolio-insight-read-model';
import type { InvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';
import {
  RiskBadge,
  SectionHeader,
  investCardClass,
  investMotionClass
} from './ui';

type PortfolioInsightMeta = {
  readOnly?: boolean;
  mockOnly?: boolean;
  simulated?: boolean;
  realDeposit?: boolean;
  realBalance?: boolean;
  realOrder?: boolean;
  brokerageConnection?: boolean;
  accountLinking?: boolean;
  externalPaidApi?: boolean;
  brokerConfirmed?: boolean;
  brokerConfirmedHoldings?: boolean;
  realHolding?: boolean;
  realAllocation?: boolean;
  orderExecution?: boolean;
  tradeFill?: boolean;
  settlement?: boolean;
  financialAdvice?: boolean;
  tradeIntentCreated?: boolean;
  allocationCommandCreated?: boolean;
  legalJudgment?: boolean;
  generatedFrom?: string;
};

type PortfolioInsightState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      data: InvestModelPortfolioInsight;
      meta?: PortfolioInsightMeta;
    }
  | { status: 'empty'; meta?: PortfolioInsightMeta }
  | { status: 'error' };

type PortfolioInsightPanelProps = {
  locale: InvestModelLocale;
};

const insightCopy = {
  ko: {
    title: 'Mock portfolio insights',
    description:
      'DB seed/read-model rationale and status timeline only. No real deposit, order, broker connection, legal judgment, or advice.',
    loadingLabel: 'Loading mock portfolio insights read-model',
    errorTitle: 'Portfolio insights could not be read',
    errorDescription:
      'A failed read does not create a real deposit, order, broker action, allocation command, legal judgment, or advice.',
    emptyTitle: 'No mock insight rows yet',
    emptyDescription:
      'The panel stays empty until seed/read-model rationale or timeline rows are available.',
    rationaleTitle: 'Allocation rationale',
    timelineTitle: 'Status timeline',
    selectedModel: 'Selected model',
    sourceLabel: 'Seed/read-model',
    safetyLine:
      'mock rationale only / read-only timeline / pre-order simulation only / no real deposit / no real balance / no real order / no broker / not advice',
    sectionLabel: 'Portfolio insight mobile panel'
  },
  en: {
    title: 'Mock portfolio insights',
    description:
      'DB seed/read-model rationale and status timeline only. No real deposit, order, broker connection, legal judgment, or advice.',
    loadingLabel: 'Loading mock portfolio insights read-model',
    errorTitle: 'Portfolio insights could not be read',
    errorDescription:
      'A failed read does not create a real deposit, order, broker action, allocation command, legal judgment, or advice.',
    emptyTitle: 'No mock insight rows yet',
    emptyDescription:
      'The panel stays empty until seed/read-model rationale or timeline rows are available.',
    rationaleTitle: 'Allocation rationale',
    timelineTitle: 'Status timeline',
    selectedModel: 'Selected model',
    sourceLabel: 'Seed/read-model',
    safetyLine:
      'mock rationale only / read-only timeline / pre-order simulation only / no real deposit / no real balance / no real order / no broker / not advice',
    sectionLabel: 'Portfolio insight mobile panel'
  }
} as const;

async function readPortfolioInsight() {
  const response = await fetch('/api/portfolio/insight', {
    headers: {
      'x-invest-model-role': 'user'
    }
  });

  if (!response.ok) {
    throw new Error('Portfolio insight API read failed.');
  }

  return (await response.json()) as {
    data?: InvestModelPortfolioInsight;
    meta?: PortfolioInsightMeta;
  };
}

function booleanLabel(value: boolean | undefined) {
  return String(value ?? false);
}

function PortfolioInsightLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-portfolio-insight-loading-skeleton="mock-only"
      className={cn('space-y-2', investCardClass.listRail)}
    >
      {[0, 1].map((item) => (
        <div
          key={item}
          className="rounded-invest-card bg-invest-surface p-3 shadow-invest-card"
        >
          <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_7.25rem]">
            <div className="min-w-0">
              <div className="h-3 w-32 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
              <div className="mt-2 h-5 w-full rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
              <div className="mt-2 h-4 w-10/12 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
            </div>
            <div className="h-10 rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortfolioInsightPanel({ locale }: PortfolioInsightPanelProps) {
  const copy = insightCopy[locale];
  const [state, setState] = useState<PortfolioInsightState>({
    status: 'loading'
  });

  useEffect(() => {
    let isMounted = true;

    readPortfolioInsight()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        const rowCount =
          (payload.data?.allocationRationales.length ?? 0) +
          (payload.data?.statusTimeline.length ?? 0);

        setState(
          payload.data && rowCount > 0
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
      `externalPaidApi=${booleanLabel(meta?.externalPaidApi)}`,
      `brokerConfirmed=${booleanLabel(meta?.brokerConfirmed)}`,
      `brokerConfirmedHoldings=${booleanLabel(meta?.brokerConfirmedHoldings)}`,
      `realHolding=${booleanLabel(meta?.realHolding)}`,
      `realAllocation=${booleanLabel(meta?.realAllocation)}`,
      `orderExecution=${booleanLabel(meta?.orderExecution)}`,
      `tradeFill=${booleanLabel(meta?.tradeFill)}`,
      `settlement=${booleanLabel(meta?.settlement)}`,
      `financialAdvice=${booleanLabel(meta?.financialAdvice)}`,
      `tradeIntentCreated=${booleanLabel(meta?.tradeIntentCreated)}`,
      `allocationCommandCreated=${booleanLabel(meta?.allocationCommandCreated)}`,
      `legalJudgment=${booleanLabel(meta?.legalJudgment)}`
    ].join(' / ');
  }, [state]);

  const sectionAccessibleLabel = `${copy.sectionLabel}. ${copy.safetyLine}. ${safetyMetaLine}`;

  return (
    <section
      className="space-y-invest-card-gap"
      aria-label={sectionAccessibleLabel}
      data-portfolio-insight-panel="mock-safe"
    >
      <SectionHeader title={copy.title} description={copy.description} />

      {state.status === 'loading' ? (
        <PortfolioInsightLoading label={copy.loadingLabel} />
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
          <article
            role="listitem"
            aria-label={`${copy.selectedModel}. ${state.data.selectedModel.modelVersionLabel}. ${state.data.selectedModel.statusLabel}. ${copy.safetyLine}.`}
            className={cn(
              'rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card',
              investMotionClass.interactiveCard
            )}
          >
            <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                  {state.data.displayHints.cardTitle}
                </p>
                <p className="mt-1 line-clamp-2 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                  {state.data.selectedModel.modelVersionLabel} /{' '}
                  {state.data.selectedModel.statusLabel}
                </p>
              </div>
              <RiskBadge tone="medium" className="justify-center text-center">
                {copy.sourceLabel}
              </RiskBadge>
            </div>
          </article>

          <div
            role="list"
            aria-label={copy.rationaleTitle}
            className="grid gap-2 min-[390px]:grid-cols-2"
          >
            {state.data.allocationRationales.map((rationale) => (
              <article
                key={rationale.insightId}
                role="listitem"
                aria-label={`${rationale.label}. ${rationale.detail}. ${rationale.safetyLabel}. ${copy.safetyLine}.`}
                title={`${rationale.label}. ${rationale.safetyLabel}.`}
                className={cn(
                  'group rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card focus-within:border-invest-primary/40',
                  investMotionClass.interactiveCard
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary transition-[transform] duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                    <Lightbulb aria-hidden className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase leading-4 text-invest-text-muted">
                      {copy.rationaleTitle}
                    </p>
                    <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                      {rationale.label}
                    </h3>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 break-words text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                  {rationale.detail}
                </p>
                <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
                  <RiskBadge tone="neutral">{rationale.evidenceLabel}</RiskBadge>
                  <RiskBadge tone="blocked">{rationale.safetyLabel}</RiskBadge>
                </div>
              </article>
            ))}
          </div>

          <div
            role="list"
            aria-label={copy.timelineTitle}
            className="space-y-2 rounded-invest-control bg-invest-surface p-2"
          >
            {state.data.statusTimeline.map((item) => (
              <article
                key={item.timelineId}
                role="listitem"
                aria-label={`${item.headline}. ${item.previousStatus} to ${item.nextStatus}. ${item.reasonCode}. ${item.safetyLabel}.`}
                className="grid min-h-invest-touch-target gap-2 rounded-invest-control bg-invest-bg-soft px-2.5 py-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start gap-2">
                    <GitBranch
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-invest-primary"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 break-words text-[13px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
                        {item.headline}
                      </p>
                      <p className="mt-1 break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
                        {item.previousStatus} -&gt; {item.nextStatus} /{' '}
                        {item.actorRole} / {item.reasonCode}
                      </p>
                    </div>
                  </div>
                </div>
                <RiskBadge tone="low" className="justify-center text-center">
                  {item.occurredAtLabel}
                </RiskBadge>
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
