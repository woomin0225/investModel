import Link from 'next/link';
import { ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import {
  MobileShell,
  MetricCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  findMockInvestmentModelDetail,
  investModelDetailCopy
} from '@/lib/mock/invest-model-model-detail';
import {
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';

type InvestModelDetailPageProps = {
  params: Promise<{
    modelId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestModelDetailPage({
  params,
  searchParams
}: InvestModelDetailPageProps) {
  const [{ modelId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelDetailCopy[locale];
  const model = findMockInvestmentModelDetail(locale, modelId);
  const currentPath = `/invest-model/models/${modelId}`;

  if (!model) {
    return (
      <MobileShell
        activeTab="models"
        eyebrow={copy.eyebrow}
        title={copy.notFoundTitle}
        locale={locale}
        currentPath={currentPath}
      >
        <section className="space-y-invest-card-gap">
          <SoftBanner
            icon={ShieldAlert}
            title={copy.notFoundTitle}
            description={copy.notFoundDescription}
          />
          <Link
            href={withInvestModelLocale('/invest-model/models', locale)}
            className="inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control px-2 text-sm font-semibold text-invest-primary"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {copy.backLabel}
          </Link>
        </section>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={model.name}
      locale={locale}
      currentPath={currentPath}
      trailing={
        <Link
          href={withInvestModelLocale('/invest-model/models', locale)}
          aria-label={copy.backLabel}
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.mockOnlyLabel}
          icon={FileText}
          title={model.mandateLabel}
          description={model.summary}
        />

        <div className="flex flex-wrap gap-2">
          <RiskBadge tone="blocked">{copy.noLiveTradingLabel}</RiskBadge>
          <RiskBadge tone={model.riskTone}>{model.riskLabel}</RiskBadge>
          <RiskBadge tone={model.statusTone}>{model.statusLabel}</RiskBadge>
          <RiskBadge>{model.reviewLabel}</RiskBadge>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {model.metrics.map((metric) => (
            <MetricCard
              key={`${model.id}-${metric.label}`}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              tone={metric.tone}
            />
          ))}
        </div>

        <DetailPanel
          title={model.mandateTitle}
          items={model.mandateItems}
          markerClassName="bg-invest-primary"
        />

        <DetailPanel
          title={model.riskTitle}
          items={model.riskItems}
          markerClassName="bg-invest-risk"
        />

        <DetailPanel
          title={model.limitationTitle}
          items={model.limitationItems}
          markerClassName="bg-invest-text"
        />

        <section className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
          <SectionHeader
            title={model.disclosureTitle}
            description={copy.reviewPlaceholderLabel}
          />
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {model.disclosureDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge>{model.marketLabel}</RiskBadge>
            <RiskBadge tone="medium">{model.leverageLabel}</RiskBadge>
            <RiskBadge tone="neutral">{model.updatedLabel}</RiskBadge>
          </div>
        </section>

        <section className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
          <SectionHeader
            title={copy.selectionReviewTitle}
            description={copy.selectionReviewDescription}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge tone={model.riskTone}>{model.riskLabel}</RiskBadge>
            <RiskBadge>{model.mandateLabel}</RiskBadge>
            <RiskBadge tone="blocked">{copy.noLiveTradingLabel}</RiskBadge>
          </div>
          {model.riskTone === 'high' ? (
            <p className="mt-3 rounded-invest-control bg-invest-risk-soft p-3 text-sm leading-6 text-invest-risk">
              {copy.highRiskNotice}
            </p>
          ) : null}
        </section>

        <button
          type="button"
          disabled
          className="min-h-invest-touch-target w-full rounded-invest-control bg-invest-text/70 px-4 text-sm font-bold text-invest-surface shadow-invest-card"
        >
          {copy.selectionDisabledLabel}
        </button>
      </section>
    </MobileShell>
  );
}

function DetailPanel({
  title,
  items,
  markerClassName
}: {
  title: string;
  items: string[];
  markerClassName: string;
}) {
  return (
    <section className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <h2 className="text-[20px] font-bold leading-7 text-invest-text">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6">
            <span
              aria-hidden
              className={`mt-2 size-1.5 shrink-0 rounded-full ${markerClassName}`}
            />
            <span className="min-w-0 text-invest-text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
