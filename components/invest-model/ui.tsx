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

type ModelCardProps = {
  name: string;
  summary: string;
  market: string;
  riskLabel: string;
  riskTone?: RiskBadgeTone;
  performanceLabel: string;
  mandateLabel: string;
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
        'inline-flex min-h-6 max-w-full items-center rounded-invest-badge px-2.5 py-1 text-[11px] font-semibold leading-4',
        riskBadgeToneClass[tone],
        className
      )}
    >
      <span className="truncate">{children}</span>
    </span>
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
          className="flex min-h-invest-touch-target shrink-0 items-center gap-1 rounded-invest-control px-2 text-sm font-semibold text-invest-primary"
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
          <p className={cn('mt-2 text-[24px] font-bold leading-8', toneClass)}>
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
 * ModelCard summarizes an AI investment model with mandate and risk context before a user chooses it.
 */
export function ModelCard({
  name,
  summary,
  market,
  riskLabel,
  riskTone = 'neutral',
  performanceLabel,
  mandateLabel,
  className
}: ModelCardProps) {
  return (
    <article
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
          <TrendingUp aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-[17px] font-semibold leading-6 text-invest-text">
              {name}
            </h3>
            <RiskBadge tone={riskTone}>{riskLabel}</RiskBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            {summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <RiskBadge>{market}</RiskBadge>
            <RiskBadge tone="low">{performanceLabel}</RiskBadge>
            <RiskBadge tone="medium">{mandateLabel}</RiskBadge>
          </div>
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
          <div className="mt-3 flex flex-wrap gap-2">
            <RiskBadge>{marketLabel}</RiskBadge>
            <RiskBadge tone={riskTone}>{riskLabel}</RiskBadge>
            <RiskBadge tone="medium">{leverageLabel}</RiskBadge>
            {performanceLabel ? (
              <RiskBadge tone="low">{performanceLabel}</RiskBadge>
            ) : null}
            {mandateLabel ? (
              <RiskBadge tone="neutral">{mandateLabel}</RiskBadge>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
