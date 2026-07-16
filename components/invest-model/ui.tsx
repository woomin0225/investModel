import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import Link from 'next/link';
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

export const investMotionClass = {
  interactiveCard:
    'transition-[border-color,box-shadow,transform] duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:border-invest-primary/30 hover:shadow-invest-nav active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
  interactiveControl:
    'transition-[background-color,border-color,transform] duration-200 ease-out hover:border-invest-primary/30 hover:bg-invest-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg motion-reduce:transition-none motion-reduce:active:scale-100'
} as const;

export const investCardClass = {
  surface:
    'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
  mutedPanel:
    'rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding',
  listRail: 'rounded-invest-control bg-invest-bg-soft p-1.5'
} as const;

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

type EmptyStateCtaProps = {
  href: string;
  label: string;
  description: string;
  ariaLabel?: string;
  className?: string;
};

type MobileFilterRailProps = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

type DetailBackLinkProps = {
  href: string;
  label: string;
  ariaLabel?: string;
  variant?: 'inline' | 'icon';
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
  actionLabel?: string;
  actionTone?: 'active' | 'disabled';
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
        'inline-flex min-h-6 min-w-0 max-w-full items-start rounded-invest-badge px-2.5 py-1 text-left text-[11px] font-semibold leading-4 whitespace-normal transition-[background-color,color,transform] duration-200 ease-out [overflow-wrap:anywhere] motion-reduce:transition-none',
        riskBadgeToneClass[tone],
        className
      )}
    >
      <span className="min-w-0 line-clamp-2 [overflow-wrap:anywhere]">
        {children}
      </span>
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
  const actionAccessibleLabel = actionLabel
    ? `${actionLabel}: ${title}`
    : undefined;

  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="min-w-0 break-words text-[20px] font-bold leading-7 text-invest-text [overflow-wrap:anywhere]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 break-words text-sm leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          aria-label={actionAccessibleLabel}
          title={actionAccessibleLabel}
          className={cn(
            'flex min-h-invest-touch-target shrink-0 items-center gap-1 rounded-invest-control px-2 text-sm font-semibold text-invest-primary',
            investMotionClass.interactiveControl
          )}
        >
          <span>{actionLabel}</span>
          <ArrowRight aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function MobileFilterRail({
  children,
  ariaLabel,
  className
}: MobileFilterRailProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'grid grid-cols-2 gap-2 min-[520px]:flex min-[520px]:flex-wrap',
        investCardClass.listRail,
        className
      )}
    >
      {children}
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
        investCardClass.surface,
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
 * EmptyStateCta gives empty states one safe navigation action without implying money movement, orders, account or brokerage connection, push delivery, or advice.
 */
export function EmptyStateCta({
  href,
  label,
  description,
  ariaLabel,
  className
}: EmptyStateCtaProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? `${label}. ${description}`}
      title={ariaLabel ?? `${label}. ${description}`}
      className={cn(
        'group mt-4 flex min-h-invest-touch-target min-w-0 items-center justify-between gap-3 rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 py-2.5 text-left shadow-invest-card',
        investMotionClass.interactiveControl,
        className
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold leading-5 text-invest-primary">
          {label}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[12px] font-semibold leading-5 text-invest-text-muted">
          {description}
        </span>
      </span>
      <ArrowRight
        aria-hidden
        className="size-4 shrink-0 text-invest-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:scale-100"
      />
    </Link>
  );
}

export function DetailBackLink({
  href,
  label,
  ariaLabel,
  variant = 'inline',
  className
}: DetailBackLinkProps) {
  const accessibleLabel = ariaLabel ?? label;

  if (variant === 'icon') {
    return (
      <Link
        href={href}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        data-navigation-affordance="detail-back"
        className={cn(
          'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card',
          investMotionClass.interactiveControl,
          className
        )}
      >
        <ArrowLeft
          aria-hidden
          className="size-5 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:scale-100"
        />
        <span className="sr-only">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      data-navigation-affordance="detail-back"
      className={cn(
        'inline-flex min-h-invest-touch-target max-w-full items-center gap-2 rounded-invest-control border border-invest-border bg-invest-surface px-3 text-sm font-bold leading-5 text-invest-text shadow-invest-card',
        investMotionClass.interactiveControl,
        className
      )}
    >
      <ArrowLeft aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
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
        investCardClass.surface,
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
        <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
          {sourceLabel}
        </span>
      </div>

      <div
        role="list"
        className={cn('mt-4 space-y-2', investCardClass.listRail)}
      >
        {metrics.map((metric) => (
          <div
            key={`${metric.label}-${metric.value}`}
            role="listitem"
            className="group flex min-h-[76px] items-center justify-between gap-3 rounded-invest-control bg-invest-surface px-3 py-2.5 shadow-invest-card transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/70 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-bold leading-4 text-invest-text">
                {metric.label}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-invest-text-muted">
                {metric.description}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  'text-[21px] font-bold leading-7 tabular-nums transition-transform duration-200 ease-out group-hover:scale-[1.02] group-active:scale-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                  metric.tone === 'positive'
                    ? 'text-invest-positive'
                    : metric.tone === 'risk'
                      ? 'text-invest-risk'
                      : 'text-invest-text'
                )}
              >
                {metric.value}
              </p>
            </div>
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
  actionLabel,
  actionTone = 'active',
  isSelectionDisabled = false,
  className
}: ModelCardProps) {
  const hasNumericPerformance = /[\d$%]/.test(performanceLabel);
  const hasFooter = footerBadges.length > 0 || actionLabel;

  return (
    <article
      className={cn(
        'group',
        investCardClass.surface,
        investMotionClass.interactiveCard,
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
              <h3 className="line-clamp-2 break-words text-[17px] font-semibold leading-6 text-invest-text [overflow-wrap:anywhere]">
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
          {hasFooter ? (
            <div className="mt-4 space-y-2.5 border-t border-invest-border pt-3">
              {footerBadges.length > 0 ? (
                <p className="break-words text-xs font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
                  {footerBadges.map((badge) => badge.label).join(' / ')}
                </p>
              ) : null}
              {actionLabel ? (
                <div
                  className={cn(
                    'flex min-h-9 items-center justify-between gap-3 rounded-invest-control px-3 text-xs font-bold leading-4 transition-[background-color,color,transform] duration-200 ease-out motion-reduce:transition-none',
                    actionTone === 'disabled'
                      ? 'bg-invest-surface text-invest-text-muted'
                      : 'bg-invest-primary-soft text-invest-primary group-hover:bg-invest-primary group-hover:text-white'
                  )}
                >
                  <span className="min-w-0 line-clamp-2 [overflow-wrap:anywhere]">
                    {actionLabel}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className={cn(
                      'size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none',
                      actionTone === 'active' && 'group-hover:translate-x-0.5'
                    )}
                  />
                </div>
              ) : null}
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
        investCardClass.surface,
        investMotionClass.interactiveCard,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
          <TrendingUp aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 break-words text-[17px] font-semibold leading-6 text-invest-text [overflow-wrap:anywhere]">
              {name}
            </h3>
            <RiskBadge tone={statusTone}>{statusLabel}</RiskBadge>
          </div>
          <p className="mt-2 break-words text-sm leading-6 text-invest-text-muted [overflow-wrap:anywhere]">
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
        investCardClass.surface,
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
