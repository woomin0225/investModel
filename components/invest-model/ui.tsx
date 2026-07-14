import type { ComponentType, ReactNode } from 'react';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconComponent = ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
}>;

type RiskBadgeTone = 'neutral' | 'low' | 'medium' | 'high' | 'blocked';

const riskBadgeToneClass: Record<RiskBadgeTone, string> = {
  neutral: 'bg-invest-surface-muted text-invest-text-muted',
  low: 'bg-invest-positive-soft text-invest-positive',
  medium: 'bg-invest-warning-soft text-[#966300]',
  high: 'bg-invest-risk-soft text-invest-risk',
  blocked: 'bg-invest-text text-invest-surface'
};

const interactiveCardClass =
  'transition-[border-color,box-shadow,transform] duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:border-invest-primary/30 hover:shadow-invest-nav active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100';

type RiskBadgeProps = {
  children: ReactNode;
  tone?: RiskBadgeTone;
  className?: string;
};

type SectionHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  className?: string;
};

type SoftBannerProps = {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: IconComponent;
  className?: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  description?: string;
  trend?: string;
  tone?: 'neutral' | 'positive' | 'risk';
  className?: string;
};

type PerformanceMetricItem = {
  label: string;
  value: string;
  description: string;
  tone?: 'neutral' | 'positive' | 'risk';
};

type PerformanceMetricGroupProps = {
  title: string;
  description: string;
  returnMetric: PerformanceMetricItem;
  volatilityMetric: PerformanceMetricItem;
  drawdownMetric: PerformanceMetricItem;
  sourceLabel: string;
  className?: string;
};

type ModelRiskBadgeGroupProps = {
  marketLabel: string;
  riskLabel: string;
  assetClassLabel?: string;
  leverageLabel?: string;
  highRiskLabel?: string;
  statusLabel?: string;
  performanceLabel?: string;
  constraintLabels?: readonly string[];
  riskTone?: RiskBadgeTone;
  statusTone?: RiskBadgeTone;
  className?: string;
};

type ModelCardProps = {
  name: string;
  summary: string;
  market: string;
  riskLabel: string;
  riskTone?: RiskBadgeTone;
  statusLabel?: string;
  statusTone?: RiskBadgeTone;
  performanceLabel: string;
  mandateLabel: string;
  constraintLabels?: readonly string[];
  footerBadges?: readonly {
    label: string;
    tone?: RiskBadgeTone;
  }[];
  isSelectionDisabled?: boolean;
  className?: string;
};

type InvestmentModelCardProps = {
  name: string;
  summary: string;
  marketLabel: string;
  riskLabel: string;
  leverageLabel: string;
  statusLabel: string;
  performanceLabel?: string;
  mandateLabel?: string;
  riskTone?: RiskBadgeTone;
  statusTone?: RiskBadgeTone;
  className?: string;
};

type InvestmentModelDetailMetric = {
  label: string;
  value: string;
  description?: string;
};

type InvestmentModelDetailProps = {
  name: string;
  summary: string;
  marketLabel: string;
  riskLabel: string;
  leverageLabel: string;
  statusLabel: string;
  mandateTitle: string;
  mandateItems: string[];
  riskTitle: string;
  riskItems: string[];
  metrics?: InvestmentModelDetailMetric[];
  disclosureLabel?: string;
  riskTone?: RiskBadgeTone;
  statusTone?: RiskBadgeTone;
  className?: string;
};

/**
 * RiskBadge marks model constraints such as leverage, market, and risk level without implying a recommendation.
 */
export function RiskBadge({
  children,
  tone = 'neutral',
  className
}: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 max-w-full items-center rounded-invest-badge px-2.5 py-1 text-[11px] font-semibold leading-4 transition-[background-color,color,transform] duration-200 ease-out motion-reduce:transition-none',
        riskBadgeToneClass[tone],
        className
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ModelRiskBadgeGroup({
  marketLabel,
  riskLabel,
  assetClassLabel,
  leverageLabel,
  highRiskLabel,
  statusLabel,
  performanceLabel,
  constraintLabels = [],
  riskTone = 'neutral',
  statusTone = 'neutral',
  className
}: ModelRiskBadgeGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {statusLabel ? <RiskBadge tone={statusTone}>{statusLabel}</RiskBadge> : null}
      <RiskBadge>{marketLabel}</RiskBadge>
      {assetClassLabel ? <RiskBadge>{assetClassLabel}</RiskBadge> : null}
      <RiskBadge tone={riskTone}>{riskLabel}</RiskBadge>
      {leverageLabel ? (
        <RiskBadge tone="medium">{leverageLabel}</RiskBadge>
      ) : null}
      {riskTone === 'high' && highRiskLabel ? (
        <RiskBadge tone="high">{highRiskLabel}</RiskBadge>
      ) : null}
      {performanceLabel ? (
        <RiskBadge tone="low">{performanceLabel}</RiskBadge>
      ) : null}
      {constraintLabels.map((label) => (
        <RiskBadge key={label}>{label}</RiskBadge>
      ))}
    </div>
  );
}

/**
 * SectionHeader standardizes compact mobile section titles and optional navigation actions.
 */
export function SectionHeader({
  title,
  description,
  actionLabel,
  className
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold leading-7 text-invest-text">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-invest-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          className="flex min-h-invest-touch-target shrink-0 items-center gap-1 rounded-invest-control px-2 text-sm font-semibold text-invest-primary transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <span>{actionLabel}</span>
          <ArrowRight aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * SoftBanner highlights non-critical context such as prototype mode, AI signal status, or review notices.
 */
export function SoftBanner({
  title,
  description,
  eyebrow,
  icon: Icon = ShieldCheck,
  className
}: SoftBannerProps) {
  return (
    <section
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-primary-soft p-invest-card-padding',
        className
      )}
    >
      <div className="flex gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-surface text-invest-primary">
          <Icon aria-hidden className="size-5" />
        </div>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-invest-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-[20px] font-bold leading-7 text-invest-text">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * MetricCard displays one compact number with context so performance is not shown without caveats.
 */
export function MetricCard({
  label,
  value,
  description,
  trend,
  tone = 'neutral',
  className
}: MetricCardProps) {
  const toneClass =
    tone === 'positive'
      ? 'text-invest-positive'
      : tone === 'risk'
        ? 'text-invest-risk'
        : 'text-invest-text';

  return (
    <article
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-invest-text-muted">{label}</p>
          <p
            className={cn(
              'mt-2 text-[24px] font-bold leading-8 tabular-nums',
              toneClass
            )}
          >
            {value}
          </p>
        </div>
        {trend ? (
          <RiskBadge tone={tone === 'risk' ? 'high' : 'low'}>{trend}</RiskBadge>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm leading-5 text-invest-text-muted">
          {description}
        </p>
      ) : null}
    </article>
  );
}

/**
 * PerformanceMetricGroup keeps return, volatility, and drawdown together so a model's return is never shown without risk context.
 */
export function PerformanceMetricGroup({
  title,
  description,
  returnMetric,
  volatilityMetric,
  drawdownMetric,
  sourceLabel,
  className
}: PerformanceMetricGroupProps) {
  const metrics = [
    returnMetric,
    volatilityMetric,
    drawdownMetric
  ] satisfies PerformanceMetricItem[];

  return (
    <section
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold leading-7 text-invest-text">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-invest-text-muted">
            {description}
          </p>
        </div>
        <RiskBadge tone="neutral">{sourceLabel}</RiskBadge>
      </div>

      <div className="mt-4 grid gap-3">
        {metrics.map((metric) => (
          <div
            key={`${metric.label}-${metric.value}`}
            className="rounded-invest-control bg-invest-surface-muted p-3"
          >
            <p className="text-xs font-medium text-invest-text-muted">
              {metric.label}
            </p>
            <p
              className={cn(
                'mt-2 text-[22px] font-bold leading-7',
                metric.tone === 'positive'
                  ? 'text-invest-positive'
                  : metric.tone === 'risk'
                    ? 'text-invest-risk'
                    : 'text-invest-text'
              )}
            >
              {metric.value}
            </p>
            <p className="mt-1 text-xs leading-5 text-invest-text-muted">
              {metric.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * ModelCard summarizes an AI investment model with mandate and risk context before a user chooses it.
 */
export function ModelCard({
  name,
  summary,
  market,
  riskLabel,
  riskTone = 'neutral',
  statusLabel,
  statusTone = 'neutral',
  performanceLabel,
  mandateLabel,
  constraintLabels,
  footerBadges = [],
  isSelectionDisabled = false,
  className
}: ModelCardProps) {
  const hasNumericPerformance = /[\d$%]/.test(performanceLabel);

  return (
    <article
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
        interactiveCardClass,
        isSelectionDisabled && 'border-invest-border bg-invest-surface-muted opacity-80',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
          <TrendingUp aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[17px] font-semibold leading-6 text-invest-text">
                {name}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {statusLabel ? (
                  <RiskBadge tone={statusTone}>{statusLabel}</RiskBadge>
                ) : null}
                <RiskBadge tone={riskTone}>{riskLabel}</RiskBadge>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  'text-[17px] font-bold leading-6 tabular-nums',
                  hasNumericPerformance ? 'text-invest-positive' : 'text-invest-text'
                )}
              >
                {performanceLabel}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
                {mandateLabel}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            {summary}
          </p>
          <ModelRiskBadgeGroup
            className="mt-3"
            marketLabel={market}
            assetClassLabel={mandateLabel}
            riskLabel={riskLabel}
            riskTone={riskTone}
            constraintLabels={constraintLabels}
          />
          {footerBadges.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-invest-border pt-3">
              {footerBadges.map((badge) => (
                <RiskBadge key={badge.label} tone={badge.tone ?? 'neutral'}>
                  {badge.label}
                </RiskBadge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * InvestmentModelCard shows the checklist-required market, risk, leverage, and model status for an AI investment model.
 */
export function InvestmentModelCard({
  name,
  summary,
  marketLabel,
  riskLabel,
  leverageLabel,
  statusLabel,
  performanceLabel,
  mandateLabel,
  riskTone = 'neutral',
  statusTone = 'neutral',
  className
}: InvestmentModelCardProps) {
  return (
    <article
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
        interactiveCardClass,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
          <TrendingUp aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-[17px] font-semibold leading-6 text-invest-text">
              {name}
            </h3>
            <RiskBadge tone={statusTone}>{statusLabel}</RiskBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            {summary}
          </p>
          <ModelRiskBadgeGroup
            className="mt-3"
            marketLabel={marketLabel}
            assetClassLabel={mandateLabel}
            riskLabel={riskLabel}
            leverageLabel={leverageLabel}
            riskTone={riskTone}
            performanceLabel={performanceLabel}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * InvestmentModelDetail은 사용자가 모델 선택 전에 운용 범위와 위험 설명을 분리해서 확인하도록 돕는다.
 */
export function InvestmentModelDetail({
  name,
  summary,
  marketLabel,
  riskLabel,
  leverageLabel,
  statusLabel,
  mandateTitle,
  mandateItems,
  riskTitle,
  riskItems,
  metrics = [],
  disclosureLabel,
  riskTone = 'neutral',
  statusTone = 'neutral',
  className
}: InvestmentModelDetailProps) {
  return (
    <article
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-bold leading-8 text-invest-text">
            {name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            {summary}
          </p>
        </div>
        <RiskBadge tone={statusTone}>{statusLabel}</RiskBadge>
      </div>

      <ModelRiskBadgeGroup
        className="mt-4"
        marketLabel={marketLabel}
        riskLabel={riskLabel}
        leverageLabel={leverageLabel}
        riskTone={riskTone}
      />

      {metrics.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {metrics.map((metric) => (
            <div
              key={`${metric.label}-${metric.value}`}
              className="rounded-invest-control bg-invest-surface-muted p-3"
            >
              <p className="text-xs font-medium text-invest-text-muted">
                {metric.label}
              </p>
              <p className="mt-1 text-[18px] font-bold leading-6 text-invest-text">
                {metric.value}
              </p>
              {metric.description ? (
                <p className="mt-1 text-xs leading-5 text-invest-text-muted">
                  {metric.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <DetailList title={mandateTitle} items={mandateItems} />
        <DetailList title={riskTitle} items={riskItems} tone="risk" />
      </div>

      {disclosureLabel ? (
        <p className="mt-5 rounded-invest-control bg-invest-primary-soft p-3 text-xs leading-5 text-invest-text-muted">
          {disclosureLabel}
        </p>
      ) : null}
    </article>
  );
}

function DetailList({
  title,
  items,
  tone = 'neutral'
}: {
  title: string;
  items: string[];
  tone?: 'neutral' | 'risk';
}) {
  const markerClass =
    tone === 'risk' ? 'bg-invest-risk' : 'bg-invest-primary';

  return (
    <section>
      <h3 className="text-[16px] font-semibold leading-6 text-invest-text">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6">
            <span
              aria-hidden
              className={cn('mt-2 size-1.5 shrink-0 rounded-full', markerClass)}
            />
            <span className="min-w-0 text-invest-text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
