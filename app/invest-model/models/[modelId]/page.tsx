import Link from 'next/link';
import { NextRequest } from 'next/server';
import { ArrowLeft, FileText, ShieldAlert, SquareCheckBig } from 'lucide-react';
import { GET as readModelDetail } from '@/app/api/models/[modelId]/route';
import {
  investMotionClass,
  MobileShell,
  ModelSelectionCta,
  ModelRiskBadgeGroup,
  PerformanceMetricGroup,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  findMockInvestmentModelDetail,
  investModelDetailCopy,
  type MockInvestmentModelDetail
} from '@/lib/mock/invest-model-model-detail';
import {
  getInvestmentModelStatusDisplay,
  resolveInvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import type { ModelDetailDto } from '@/lib/domain/models/model-read-model';
import { cn } from '@/lib/utils';

type InvestmentModelDetailView = MockInvestmentModelDetail & {
  dataContext: 'db_read_model' | 'mock_fallback';
};

const detailReadModelCopy = {
  ko: {
    dbDetailLabel: 'DB read model detail',
    mockFallbackLabel: 'Mock detail fallback',
    leverageAllowed: 'Leverage allowed',
    noLeverageFlag: 'No leverage flag',
    derivativeAllowed: 'Derivatives allowed',
    shortSellingAllowed: 'Short selling allowed',
    userOverrideBlocked: 'User override disabled',
    noRealOrder: 'No real order, deposit, or brokerage connection is created.',
    noFutureReturn:
      'Backtest and placeholder metrics do not imply future performance.',
    mandateFallback: 'Model mandate',
    disclosureFallback:
      'Disclosure rows are DB read-model context only and still require qualified review before production use.',
    updatedFallback: 'DB snapshot',
    volatilityLabel: 'Volatility'
  },
  en: {
    dbDetailLabel: 'DB read model detail',
    mockFallbackLabel: 'Mock detail fallback',
    leverageAllowed: 'Leverage allowed',
    noLeverageFlag: 'No leverage flag',
    derivativeAllowed: 'Derivatives allowed',
    shortSellingAllowed: 'Short selling allowed',
    userOverrideBlocked: 'User override disabled',
    noRealOrder: 'No real order, deposit, or brokerage connection is created.',
    noFutureReturn:
      'Backtest and placeholder metrics do not imply future performance.',
    mandateFallback: 'Model mandate',
    disclosureFallback:
      'Disclosure rows are DB read-model context only and still require qualified review before production use.',
    updatedFallback: 'DB snapshot',
    volatilityLabel: 'Volatility'
  }
} as const;

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
  const model = await readInvestmentModelDetailView(locale, modelId);
  const currentPath = `/invest-model/models/${modelId}`;
  const selectionCtaCopy =
    locale === 'ko'
      ? {
          description:
            '모델이 정한 운용 범위, 손실 가능성, 금지된 동작을 확인한 뒤 선택 기록을 저장합니다. 이 기록은 실제 입금, 주문, 브로커 연결이 아닙니다.',
          confirmLabel: '위험과 금지된 동작을 확인했습니다',
          confirmDescription:
            '선택 기록은 ModelVersion 저장용이며 사용자 투자성향 변경이나 실거래 동의가 아닙니다.',
          submitLabel: '선택 기록 저장',
          submittingLabel: '저장 중',
          successTitle: '선택 기록을 저장했습니다',
          duplicateTitle: '이미 저장된 선택 기록입니다',
          errorTitle: '선택 기록을 저장하지 못했습니다',
          signedOutMessage:
            '로그인된 사용자 public id를 찾지 못했습니다. 샘플 사용자 seed 또는 로그인이 필요합니다.',
          safetyLabel: '실입금/실주문 아님',
          persistedLabel: 'DB 저장됨',
          noLiveTradingLabel: copy.noLiveTradingLabel
        }
      : {
          description:
            'Save a selection record after reviewing this model mandate, loss possibility, and forbidden actions. This record is not a deposit, order, or brokerage connection.',
          confirmLabel: 'I reviewed the risks and forbidden actions',
          confirmDescription:
            'This saves a selected ModelVersion only. It is not user preference editing or real trading consent.',
          submitLabel: 'Save selection record',
          submittingLabel: 'Saving',
          successTitle: 'Selection record saved',
          duplicateTitle: 'Selection record already exists',
          errorTitle: 'Could not save the selection record',
          signedOutMessage:
            'A signed-in user public id was not found. A sample user seed or login is required.',
          safetyLabel: 'No real deposit/order',
          persistedLabel: 'DB persisted',
          noLiveTradingLabel: copy.noLiveTradingLabel
        };
  const detailSectionLinks = model
    ? [
        ['#model-mandate', model.mandateTitle],
        ['#model-risk', model.riskTitle],
        ['#model-limitations', model.limitationTitle],
        ['#model-disclosure', model.disclosureTitle]
      ]
    : [];
  const detailVisibleBoundaries = modelDetailVisibleBoundaries();
  const selectionVisibleBoundaries = modelDetailSelectionVisibleBoundaries();

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
          eyebrow={
            model.dataContext === 'db_read_model'
              ? detailReadModelCopy[locale].dbDetailLabel
              : copy.mockOnlyLabel
          }
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
          constraintLabels={[model.reviewLabel]}
          riskTone={model.riskTone}
          statusTone={model.statusTone}
        />
        <p className="text-[12px] font-semibold leading-5 text-invest-text-muted">
          {copy.noLiveTradingLabel}
        </p>

        <div
          aria-label="Model detail visible safety boundaries"
          className="rounded-invest-control bg-invest-bg-soft p-2 text-xs font-semibold leading-5 text-invest-text-muted"
        >
          {detailVisibleBoundaries.join(' / ')}
        </div>

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
            description={selectionCtaCopy.description}
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
              <span className="text-[12px] font-semibold leading-5 text-invest-text-muted">
                {copy.noLiveTradingLabel}
              </span>
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
            <p className="rounded-invest-control bg-invest-surface px-2 py-1 text-center text-[12px] font-semibold leading-5 text-invest-text-muted">
              {model.dataContext === 'db_read_model'
                ? detailReadModelCopy[locale].dbDetailLabel
                : copy.reviewPlaceholderLabel}
            </p>
            <p className="rounded-invest-control bg-invest-surface px-2 py-1 text-center text-[12px] font-semibold leading-5 text-invest-text-muted">
              {copy.noLiveTradingLabel}
            </p>
          </div>
          <div
            aria-label="Model selection visible safety boundaries"
            className="mt-3 rounded-invest-control bg-invest-bg-soft p-2 text-xs font-semibold leading-5 text-invest-text-muted"
          >
            {selectionVisibleBoundaries.join(' / ')}
          </div>
          <ModelSelectionCta
            modelPublicId={model.modelPublicId}
            modelVersionPublicId={model.modelVersionPublicId}
            copy={selectionCtaCopy}
          />
        </section>
      </section>
    </MobileShell>
  );
}

function modelDetailVisibleBoundaries() {
  return [
    'Approved/public model',
    'ModelVersion context',
    'PortfolioMandate context',
    'RiskProfile context'
  ];
}

function modelDetailSelectionVisibleBoundaries() {
  return [
    'No recommendation',
    'No live order',
    'No brokerage',
    'No advice'
  ];
}

async function readInvestmentModelDetailView(
  locale: 'ko' | 'en',
  modelId: string
): Promise<InvestmentModelDetailView | undefined> {
  try {
    const response = await readModelDetail(
      new NextRequest(`http://localhost/api/models/${modelId}`, {
        method: 'GET',
        headers: {
          'x-invest-model-role': 'public'
        }
      }),
      {
        params: Promise.resolve({
          modelId
        })
      }
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        data?: ModelDetailDto;
      };

      if (payload.data) {
        return toInvestmentModelDetailView(payload.data, locale);
      }
    }
  } catch {
    // Fall through to the legacy mock detail so old comparison links remain visible
    // when a local DB is unavailable.
  }

  const mockModel = findMockInvestmentModelDetail(locale, modelId);

  return mockModel
    ? {
        ...mockModel,
        dataContext: 'mock_fallback'
      }
    : undefined;
}

function toInvestmentModelDetailView(
  model: ModelDetailDto,
  locale: 'ko' | 'en'
): InvestmentModelDetailView {
  const copy = investModelDetailCopy[locale];
  const readCopy = detailReadModelCopy[locale];
  const statusDisplay = getInvestmentModelStatusDisplay(model.status, locale);
  const marketLabel =
    model.targetMarkets.join(', ') || model.mandate.allowedMarkets.join(', ');
  const mandateLabel =
    model.assetClassLabels.join(', ') ||
    model.mandate.allowedAssetClasses.join(', ') ||
    readCopy.mandateFallback;
  const leverageLabel = model.risk.leverageAllowed
    ? readCopy.leverageAllowed
    : readCopy.noLeverageFlag;
  const riskTone = toDetailRiskTone(model.risk.tone);
  const disclosureDescription =
    model.disclosures.map((disclosure) => disclosure.body).join('\n') ||
    readCopy.disclosureFallback;

  return {
    id: model.slug,
    modelPublicId: model.modelPublicId,
    modelVersionPublicId: model.modelVersionPublicId ?? model.modelPublicId,
    name: model.name,
    summary:
      model.strategySummary ??
      model.shortDescription ??
      model.risk.summary ??
      readCopy.mandateFallback,
    marketLabel: marketLabel || readCopy.mandateFallback,
    riskLabel: model.risk.label,
    riskTone,
    leverageLabel,
    statusLabel: statusDisplay.label,
    statusTone: toDetailStatusTone(statusDisplay.tone),
    mandateLabel,
    reviewLabel: model.reviewLabel,
    updatedLabel: model.performance.measuredAt ?? readCopy.updatedFallback,
    metrics: [
      {
        label: 'Backtest',
        value: model.performance.cumulativeReturn.display,
        description: readCopy.noFutureReturn,
        tone:
          model.performance.cumulativeReturn.value !== null &&
          model.performance.cumulativeReturn.value >= 0
            ? 'positive'
            : 'risk'
      },
      {
        label: 'Max drawdown',
        value: model.performance.maxDrawdown.display,
        description: model.risk.summary ?? readCopy.noFutureReturn,
        tone: 'risk'
      },
      {
        label: readCopy.volatilityLabel,
        value: model.performance.volatility.display,
        description: model.risk.summary ?? readCopy.noFutureReturn
      }
    ],
    mandateTitle: copy.models[0]?.mandateTitle ?? 'Model mandate',
    mandateItems: compactDetailItems([
      model.strategySummary,
      model.assetUniverseSummary,
      model.inputDataSummary,
      model.rebalanceFrequency,
      model.mandate.leveragePolicy,
      model.mandate.rebalancePolicy
    ]),
    riskTitle: copy.models[0]?.riskTitle ?? 'Risks and limits',
    riskItems: compactDetailItems([
      model.risk.summary,
      model.risk.derivativeAllowed ? readCopy.derivativeAllowed : undefined,
      model.risk.shortSellingAllowed ? readCopy.shortSellingAllowed : undefined,
      model.maxDrawdown.display,
      readCopy.noFutureReturn
    ]),
    limitationTitle: copy.models[0]?.limitationTitle ?? 'MVP forbidden actions',
    limitationItems: compactDetailItems([
      model.forbiddenScope,
      model.mandate.forbiddenAssets,
      model.mandate.userOverrideAllowed
        ? undefined
        : readCopy.userOverrideBlocked,
      readCopy.noRealOrder
    ]),
    disclosureTitle: copy.models[0]?.disclosureTitle ?? 'Disclosure',
    disclosureDescription,
    actionLabel: copy.models[0]?.actionLabel ?? 'Review before selection',
    dataContext: 'db_read_model'
  };
}

function compactDetailItems(items: Array<string | undefined>) {
  const compacted = items.filter((item): item is string => Boolean(item));

  return compacted.length > 0
    ? compacted
    : ['DB read model context is available, but this section has no populated rows yet.'];
}

function toDetailRiskTone(
  tone: ModelDetailDto['risk']['tone']
): MockInvestmentModelDetail['riskTone'] {
  if (tone === 'low' || tone === 'medium') {
    return tone;
  }

  return 'high';
}

function toDetailStatusTone(
  tone: ReturnType<typeof getInvestmentModelStatusDisplay>['tone']
): MockInvestmentModelDetail['statusTone'] {
  if (tone === 'low' || tone === 'medium' || tone === 'high') {
    return tone;
  }

  return tone === 'blocked' ? 'blocked' : 'low';
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
          <li
            key={item}
            className="group flex gap-2 rounded-invest-control px-2 py-1.5 text-sm leading-6 transition-[background-color,transform] duration-200 ease-out hover:bg-invest-primary-soft/60 focus-within:bg-invest-primary-soft/60 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <span
              aria-hidden
              className={`mt-2 size-1.5 shrink-0 rounded-full transition-transform duration-200 ease-out group-hover:scale-125 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100 ${markerClassName}`}
            />
            <span className="min-w-0 text-invest-text-muted transition-colors duration-200 ease-out group-hover:text-invest-text motion-reduce:transition-none">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
