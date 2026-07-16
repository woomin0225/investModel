import Link from 'next/link';
import { NextRequest } from 'next/server';
import {
  CalendarCheck,
  FileText,
  ShieldAlert,
  SquareCheckBig
} from 'lucide-react';
import { GET as readModelDetail } from '@/app/api/models/[modelId]/route';
import {
  DetailBackLink,
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
  dataContext:
    | 'db_read_model'
    | 'legacy_mock_fallback'
    | 'db_unavailable_mock_fallback';
};

const detailReadModelCopy = {
  ko: {
    dbDetailLabel: 'DB 조회 모델 상세',
    mockFallbackLabel: '모의 상세 대체 데이터',
    legacyMockFallbackLabel: '기존 비교 링크 모의 상세',
    dbUnavailableFallbackLabel: 'DB 조회 불가 - 모의 상세 대체',
    leverageAllowed: '레버리지 허용',
    noLeverageFlag: '레버리지 없음',
    derivativeAllowed: '파생상품 허용',
    shortSellingAllowed: '공매도 허용',
    userOverrideBlocked: '사용자 임의 변경 비활성',
    noRealOrder: '실제 주문, 입금, 브로커 연결은 생성되지 않습니다.',
    noFutureReturn:
      '백테스트와 대체 지표는 미래 성과를 의미하지 않습니다.',
    mandateFallback: '모델 운용 범위',
    riskTitleFallback: '위험과 제한',
    limitationTitleFallback: 'MVP 금지 동작',
    disclosureTitleFallback: '공시',
    actionLabelFallback: '선택 전 검토',
    disclosureFallback:
      '공시 행은 DB 기반 조회 맥락일 뿐이며 실제 운영 전 적격 검토가 필요합니다.',
    updatedFallback: 'DB 스냅샷',
    volatilityLabel: '변동성',
    backtestLabel: '백테스트',
    maxDrawdownLabel: '최대 낙폭',
    emptySectionFallback:
      'DB 기반 조회 맥락은 있지만 이 섹션에 채워진 행은 아직 없습니다.'
  },
  en: {
    dbDetailLabel: 'DB read model detail',
    mockFallbackLabel: 'Mock detail fallback',
    legacyMockFallbackLabel: 'Legacy comparison mock detail',
    dbUnavailableFallbackLabel: 'DB unavailable - mock detail fallback',
    leverageAllowed: 'Leverage allowed',
    noLeverageFlag: 'No leverage flag',
    derivativeAllowed: 'Derivatives allowed',
    shortSellingAllowed: 'Short selling allowed',
    userOverrideBlocked: 'User override disabled',
    noRealOrder: 'No real order, deposit, or brokerage connection is created.',
    noFutureReturn:
      'Backtest and placeholder metrics do not imply future performance.',
    mandateFallback: 'Model mandate',
    riskTitleFallback: 'Risks and limits',
    limitationTitleFallback: 'MVP forbidden actions',
    disclosureTitleFallback: 'Disclosure',
    actionLabelFallback: 'Review before selection',
    disclosureFallback:
      'Disclosure rows are DB read-model context only and still require qualified review before production use.',
    updatedFallback: 'DB snapshot',
    volatilityLabel: 'Volatility',
    backtestLabel: 'Backtest',
    maxDrawdownLabel: 'Max drawdown',
    emptySectionFallback:
      'DB read model context is available, but this section has no populated rows yet.'
  }
} as const;

const detailReviewScheduleCopy = {
  ko: {
    title: '모델 검토 일정',
    description:
      '리뷰와 모의 리밸런싱 점검만 표시하며 실제 주문, 체결, 브로커 동작 일정이 아닙니다.',
    safetyLabel: '검토 전용 / 모의 점검 / 실제 거래 실행 없음',
    items: {
      review: {
        label: '모델 리뷰',
        dateLabel: '리뷰',
        statusLabel: '검토 기록',
        description:
          '운영자 승인 맥락을 확인하는 항목이며 투자 조언이나 법률 판단이 아닙니다.'
      },
      rebalance: {
        label: '모의 리밸런싱 점검',
        dateLabel: '모의',
        statusLabel: '체크포인트',
        description:
          '모델 원칙을 점검하는 mock checkpoint이며 실제 주문이나 체결 계획이 아닙니다.'
      },
      disclosure: {
        label: '고지 문구 검토',
        dateLabel: '고지',
        statusLabel: '검토 필요',
        description:
          '공개 전 문구 확인 알림이며 자문 확정이나 브로커 실행 지시가 아닙니다.'
      }
    }
  },
  en: {
    title: 'Model review schedule',
    description:
      'Shows review and mock rebalance checkpoints only, not real orders, execution, or brokerage actions.',
    safetyLabel: 'Review only / Mock checkpoint / No real trading execution',
    items: {
      review: {
        label: 'Model review',
        dateLabel: 'Review',
        statusLabel: 'Reviewed context',
        description:
          'Confirms operator review context only. It is not investment advice or legal approval.'
      },
      rebalance: {
        label: 'Mock rebalance check',
        dateLabel: 'Mock',
        statusLabel: 'Checkpoint',
        description:
          'Checks model principles as a mock checkpoint, not a real trade or execution plan.'
      },
      disclosure: {
        label: 'Disclosure review',
        dateLabel: 'Notice',
        statusLabel: 'Review needed',
        description:
          'Reminds reviewers to inspect copy before release. It is not advisory approval or brokerage instruction.'
      }
    }
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
            '모델이 정한 운용 범위, 손실 가능성, 금지된 동작을 확인한 뒤 검토한 선택 기록만 남깁니다. 이 기록은 실제 입금, 주문, 브로커 연결이 아닙니다.',
          confirmLabel: '위험과 금지된 동작을 확인했습니다',
          confirmDescription:
            '검토 기록은 모델 버전 확인용이며 사용자 투자성향 변경이나 실거래 동의가 아닙니다.',
          submitLabel: '검토 선택 기록',
          submittingLabel: '검토 기록 중',
          successTitle: '검토 선택 기록을 남겼습니다',
          duplicateTitle: '이미 저장된 선택 기록입니다',
          errorTitle: '검토 선택 기록을 남기지 못했습니다',
          signedOutMessage:
            '로그인된 사용자 식별자를 찾지 못했습니다. 샘플 사용자 데이터 또는 로그인이 필요합니다.',
          safetyLabel: '읽기 전용 상태 / 실입금·실주문·브로커 미연결',
          persistedLabel: 'DB 저장됨',
          noLiveTradingLabel: copy.noLiveTradingLabel
        }
      : {
          description:
            'Record a reviewed selection after checking this model mandate, loss possibility, and forbidden actions. This record is not a deposit, order, or brokerage connection.',
          confirmLabel: 'I reviewed the risks and forbidden actions',
          confirmDescription:
            'This records a reviewed ModelVersion only. It is not user preference editing or real trading consent.',
          submitLabel: 'Record reviewed selection',
          submittingLabel: 'Recording review',
          successTitle: 'Reviewed selection recorded',
          duplicateTitle: 'Selection record already exists',
          errorTitle: 'Could not record the reviewed selection',
          signedOutMessage:
            'A signed-in user public id was not found. A sample user seed or login is required.',
          safetyLabel: 'Read-only status / No real deposit, order, or brokerage',
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
  const detailVisibleBoundaries = modelDetailVisibleBoundaries(locale);
  const selectionVisibleBoundaries =
    modelDetailSelectionVisibleBoundaries(locale);

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
          <DetailBackLink
            href={withInvestModelLocale('/invest-model/models', locale)}
            label={copy.backLabel}
            className="text-invest-primary"
          />
        </section>
      </MobileShell>
    );
  }

  const reviewScheduleItems = modelDetailReviewScheduleItems(locale, model);

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={model.name}
      locale={locale}
      currentPath={currentPath}
      trailing={
        <DetailBackLink
          href={withInvestModelLocale('/invest-model/models', locale)}
          label={copy.backLabel}
          variant="icon"
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={modelDetailDataContextLabel(locale, model.dataContext)}
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

        <ModelReviewScheduleStrip
          locale={locale}
          items={reviewScheduleItems}
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
          <div className="mt-4 grid gap-2 rounded-invest-control bg-invest-bg-soft p-2 min-[480px]:grid-cols-2">
            <p className="rounded-invest-control bg-invest-surface px-2 py-1 text-center text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
              {modelDetailDataContextLabel(locale, model.dataContext)}
            </p>
            <p className="rounded-invest-control bg-invest-surface px-2 py-1 text-center text-[12px] font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
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

type ModelReviewScheduleItem = {
  label: string;
  dateLabel: string;
  statusLabel: string;
  description: string;
};

function ModelReviewScheduleStrip({
  locale,
  items
}: {
  locale: 'ko' | 'en';
  items: ModelReviewScheduleItem[];
}) {
  const copy = detailReviewScheduleCopy[locale];

  return (
    <section
      aria-label={copy.title}
      className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
    >
      <SectionHeader title={copy.title} description={copy.description} />
      <div className="mt-4 grid gap-2" role="list">
        {items.map((item) => (
          <div
            key={`${item.dateLabel}-${item.label}`}
            role="listitem"
            className={cn(
              'grid min-h-invest-touch-target grid-cols-[4.75rem_minmax(0,1fr)] gap-3 rounded-invest-control border border-invest-border bg-invest-surface-muted p-2.5',
              investMotionClass.interactiveCard
            )}
          >
            <div className="grid min-w-0 content-center rounded-invest-control bg-invest-bg-soft px-2 py-1 text-center">
              <p className="truncate text-[11px] font-bold uppercase leading-4 tracking-normal text-invest-primary">
                {item.dateLabel}
              </p>
              <p className="truncate text-[11px] font-semibold leading-4 text-invest-text-muted">
                {item.statusLabel}
              </p>
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <CalendarCheck
                  aria-hidden
                  className="size-4 shrink-0 text-invest-primary"
                />
                <p className="min-w-0 text-sm font-bold leading-5 text-invest-text">
                  {item.label}
                </p>
              </div>
              <p className="mt-1 text-xs leading-5 text-invest-text-muted">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-invest-control bg-invest-bg-soft p-2 text-xs font-semibold leading-5 text-invest-text-muted">
        {copy.safetyLabel}
      </p>
    </section>
  );
}

function modelDetailReviewScheduleItems(
  locale: 'ko' | 'en',
  model: InvestmentModelDetailView
): ModelReviewScheduleItem[] {
  const copy = detailReviewScheduleCopy[locale].items;

  return [
    {
      ...copy.review,
      statusLabel: model.reviewLabel || copy.review.statusLabel
    },
    {
      ...copy.rebalance,
      statusLabel:
        model.mandateItems.find((item) =>
          item.toLowerCase().includes('rebalance')
        ) ?? copy.rebalance.statusLabel
    },
    {
      ...copy.disclosure,
      statusLabel:
        modelDetailDataContextLabel(locale, model.dataContext) ||
        copy.disclosure.statusLabel
    }
  ];
}

function modelDetailVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? [
        '승인/공개 모델',
        '모델 버전 맥락',
        '모델 운용 범위 맥락',
        '위험 프로필 맥락'
      ]
    : [
        'Approved/public model',
        'ModelVersion context',
        'PortfolioMandate context',
        'RiskProfile context'
      ];
}

function modelDetailSelectionVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? ['추천 아님', '실주문 없음', '브로커 연결 없음', '투자 조언 아님']
    : [
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
  let fallbackContext: InvestmentModelDetailView['dataContext'] =
    'legacy_mock_fallback';

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

    if (response.status >= 500) {
      fallbackContext = 'db_unavailable_mock_fallback';
    }
  } catch {
    fallbackContext = 'db_unavailable_mock_fallback';
  }

  const mockModel = findMockInvestmentModelDetail(locale, modelId);

  return mockModel
    ? {
        ...mockModel,
        dataContext: fallbackContext
      }
    : undefined;
}

function modelDetailDataContextLabel(
  locale: 'ko' | 'en',
  dataContext: InvestmentModelDetailView['dataContext']
) {
  const readCopy = detailReadModelCopy[locale];

  if (dataContext === 'db_read_model') {
    return readCopy.dbDetailLabel;
  }

  if (dataContext === 'db_unavailable_mock_fallback') {
    return readCopy.dbUnavailableFallbackLabel;
  }

  return readCopy.legacyMockFallbackLabel;
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
        label: readCopy.backtestLabel,
        value: model.performance.cumulativeReturn.display,
        description: readCopy.noFutureReturn,
        tone:
          model.performance.cumulativeReturn.value !== null &&
          model.performance.cumulativeReturn.value >= 0
            ? 'positive'
            : 'risk'
      },
      {
        label: readCopy.maxDrawdownLabel,
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
    mandateTitle: copy.models[0]?.mandateTitle ?? readCopy.mandateFallback,
    mandateItems: compactDetailItems([
      model.strategySummary,
      model.assetUniverseSummary,
      model.inputDataSummary,
      model.rebalanceFrequency,
      model.mandate.leveragePolicy,
      model.mandate.rebalancePolicy
    ], readCopy.emptySectionFallback),
    riskTitle: copy.models[0]?.riskTitle ?? readCopy.riskTitleFallback,
    riskItems: compactDetailItems([
      model.risk.summary,
      model.risk.derivativeAllowed ? readCopy.derivativeAllowed : undefined,
      model.risk.shortSellingAllowed ? readCopy.shortSellingAllowed : undefined,
      model.maxDrawdown.display,
      readCopy.noFutureReturn
    ], readCopy.emptySectionFallback),
    limitationTitle:
      copy.models[0]?.limitationTitle ?? readCopy.limitationTitleFallback,
    limitationItems: compactDetailItems([
      model.forbiddenScope,
      model.mandate.forbiddenAssets,
      model.mandate.userOverrideAllowed
        ? undefined
        : readCopy.userOverrideBlocked,
      readCopy.noRealOrder
    ], readCopy.emptySectionFallback),
    disclosureTitle:
      copy.models[0]?.disclosureTitle ?? readCopy.disclosureTitleFallback,
    disclosureDescription,
    actionLabel: copy.models[0]?.actionLabel ?? readCopy.actionLabelFallback,
    dataContext: 'db_read_model'
  };
}

function compactDetailItems(items: Array<string | undefined>, fallback: string) {
  const compacted = items.filter((item): item is string => Boolean(item));

  return compacted.length > 0 ? compacted : [fallback];
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
