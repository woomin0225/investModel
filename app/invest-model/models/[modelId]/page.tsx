import Link from 'next/link';
import { ArrowLeft, FileText, ShieldAlert, SquareCheckBig } from 'lucide-react';
import {
  investMotionClass,
  MobileShell,
  ModelRiskBadgeGroup,
  PerformanceMetricGroup,
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
import { cn } from '@/lib/utils';

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
  const detailSectionLinks = model
    ? [
        ['#model-mandate', model.mandateTitle],
        ['#model-risk', model.riskTitle],
        ['#model-limitations', model.limitationTitle],
        ['#model-disclosure', model.disclosureTitle]
      ]
    : [];

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
            className={cn(
              'inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control px-2 text-sm font-semibold text-invest-primary',
              investMotionClass.interactiveControl
            )}
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
          className={cn(
            'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/25',
            investMotionClass.interactiveControl
          )}
        >
          <span className="absolute inset-1 rounded-[10px] border border-transparent transition-colors duration-200 ease-out group-hover:border-invest-primary/15 group-active:border-invest-primary/30 motion-reduce:transition-none" />
          <ArrowLeft
            aria-hidden
            className="size-5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:scale-100"
          />
          <span className="absolute inset-x-3 bottom-1 h-0.5 origin-center scale-x-50 rounded-full bg-invest-text-muted/40 opacity-80 transition-[background-color,transform] duration-200 ease-out group-hover:scale-x-100 group-hover:bg-invest-primary/70 group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-hover:scale-x-50 motion-reduce:group-active:scale-x-50" />
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

        <ModelRiskBadgeGroup
          marketLabel={model.marketLabel}
          assetClassLabel={model.mandateLabel}
          riskLabel={model.riskLabel}
          leverageLabel={model.leverageLabel}
          statusLabel={model.statusLabel}
          constraintLabels={[copy.noLiveTradingLabel, model.reviewLabel]}
          riskTone={model.riskTone}
          statusTone={model.statusTone}
        />

        <PerformanceMetricGroup
          title={copy.performanceGroupTitle}
          description={copy.performanceGroupDescription}
          returnMetric={model.metrics[0]}
          volatilityMetric={model.metrics[2]}
          drawdownMetric={model.metrics[1]}
          sourceLabel={copy.performanceGroupSourceLabel}
        />

        <nav
          aria-label={
            locale === 'ko' ? '모델 상세 섹션 이동' : 'Model detail sections'
          }
          className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-2"
        >
          <div className="grid grid-cols-2 gap-2">
            {detailSectionLinks.map(([href, label], index) => {
              const isPrimarySection = index === 0;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isPrimarySection ? 'true' : undefined}
                  className={cn(
                    'inline-flex min-h-invest-touch-target min-w-0 items-center justify-center gap-2 rounded-invest-control border px-2 text-center text-[13px] font-bold leading-5 shadow-invest-card',
                    investMotionClass.interactiveControl,
                    isPrimarySection
                      ? 'border-invest-primary bg-invest-primary text-white shadow-invest-card-strong'
                      : 'border-invest-border bg-invest-surface text-invest-text hover:text-invest-primary'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 rounded-full',
                      isPrimarySection ? 'bg-white' : 'bg-invest-border'
                    )}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <DetailPanel
          id="model-mandate"
          title={model.mandateTitle}
          items={model.mandateItems}
          markerClassName="bg-invest-primary"
        />

        <DetailPanel
          id="model-risk"
          title={model.riskTitle}
          items={model.riskItems}
          markerClassName="bg-invest-risk"
        />

        <DetailPanel
          id="model-limitations"
          title={model.limitationTitle}
          items={model.limitationItems}
          markerClassName="bg-invest-text"
        />

        <section
          id="model-disclosure"
          className="scroll-mt-24 rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
        >
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

        <section
          id="model-selection-review"
          className={cn(
            'scroll-mt-24 rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card',
            investMotionClass.interactiveCard
          )}
        >
          <SectionHeader
            title={copy.selectionReviewTitle}
            description={copy.selectionReviewDescription}
          />
          <div className="mt-4 grid gap-2">
            {[
              model.mandateTitle,
              model.riskTitle,
              copy.noLiveTradingLabel
            ].map((label, index) => (
              <div
                key={label}
                className="flex min-h-invest-touch-target items-center gap-3 rounded-invest-control border border-transparent bg-invest-surface-muted px-3 py-2 transition-[background-color,border-color,transform] duration-200 ease-out hover:border-invest-primary/20 hover:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-invest-surface text-xs font-bold tabular-nums text-invest-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 text-sm font-semibold leading-5 text-invest-text">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div
            role="list"
            aria-label={copy.selectionReviewTitle}
            className="mt-4 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-bg-soft p-2"
          >
            <span role="listitem">
              <RiskBadge tone={model.riskTone}>{model.riskLabel}</RiskBadge>
            </span>
            <span role="listitem">
              <RiskBadge>{model.mandateLabel}</RiskBadge>
            </span>
            <span role="listitem">
              <RiskBadge tone="blocked">{copy.noLiveTradingLabel}</RiskBadge>
            </span>
          </div>
          {model.riskTone === 'high' ? (
            <div
              role="note"
              className="mt-3 rounded-invest-control border border-invest-risk/20 bg-invest-risk-soft p-2.5 text-invest-risk"
            >
              <div className="flex gap-2">
                <ShieldAlert
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0"
                />
                <p className="text-sm font-semibold leading-6">
                  {copy.highRiskNotice}
                </p>
              </div>
              <div
                className={cn(
                  'mt-2.5 flex gap-2 rounded-invest-control border border-invest-risk/25 bg-invest-surface/95 p-2.5 text-invest-text shadow-invest-card',
                  investMotionClass.interactiveCard
                )}
              >
                <SquareCheckBig
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-invest-risk"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-5">
                    {copy.highRiskConfirmLabel}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-invest-text-muted">
                    {copy.highRiskConfirmDescription}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid gap-2 rounded-invest-control bg-invest-bg-soft p-2 min-[360px]:grid-cols-2">
            <RiskBadge tone="neutral" className="justify-center text-center">
              {copy.reviewPlaceholderLabel}
            </RiskBadge>
            <RiskBadge tone="blocked" className="justify-center text-center">
              {copy.noLiveTradingLabel}
            </RiskBadge>
          </div>
          <button
            type="button"
            disabled
            aria-describedby="model-selection-review-status"
            className="mt-3 inline-flex min-h-invest-touch-target w-full items-center justify-center gap-2 rounded-invest-control border border-invest-text/10 bg-invest-text/75 px-4 text-sm font-bold text-invest-surface shadow-invest-card-strong transition-[box-shadow,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-90 motion-reduce:transition-none"
          >
            <SquareCheckBig aria-hidden className="size-4" />
            {copy.selectionDisabledLabel}
          </button>
          <p
            id="model-selection-review-status"
            className="mt-2 text-center text-[12px] font-semibold leading-5 text-invest-text-muted"
          >
            {copy.noLiveTradingLabel}
          </p>
        </section>
      </section>
    </MobileShell>
  );
}

function DetailPanel({
  id,
  title,
  items,
  markerClassName
}: {
  id: string;
  title: string;
  items: string[];
  markerClassName: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
    >
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
