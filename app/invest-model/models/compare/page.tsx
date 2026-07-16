import { BarChart3 } from 'lucide-react';

import {
  DetailBackLink,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner,
  investCardClass,
  investMotionClass
} from '@/components/invest-model';
import { readModelCompareSeedFixture } from '@/lib/db/model-compare-read-model';
import type { ModelCompareItem } from '@/lib/db/model-compare-read-model';
import {
  resolveInvestModelLocale,
  withInvestModelLocale,
  type InvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type CompareMetricTone = 'neutral' | 'positive' | 'risk';
type CompareRiskTone = 'neutral' | 'low' | 'medium' | 'high' | 'blocked';

type ModelComparePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const defaultComparePublicIds = [
  'model_compare_quant_us_leverage_alpha',
  'model_compare_macro_etf_balance',
  'model_compare_defensive_income_rotation'
] as const;

const comparisonCopy = {
  ko: {
    eyebrow: '비교',
    title: '모델 비교',
    bannerEyebrow: '모의 비교표',
    bannerTitle: '성과는 위험과 함께 봅니다',
    bannerDescription:
      '승인 또는 공개 상태의 모의 모델만 비교합니다. 수익률은 백테스트 참고 값이며 조언, 모델 선택, 주문 실행으로 이어지지 않습니다.',
    sectionTitle: '검토된 모델 비교',
    sectionDescription:
      '위험, 운용 범위, 공시 검토, 백테스트 맥락을 390px 모바일 화면에서 세로 카드로 확인합니다.',
    labels: {
      creator: '운영자',
      status: '공개 상태',
      return: '백테스트 수익',
      volatility: '변동성',
      drawdown: '최대 손실',
      benchmark: '기준 지표',
      period: '측정 구간',
      risk: '위험',
      mandate: '운용 범위',
      disclosure: '공시 검토',
      allowedMarkets: '시장',
      allowedAssets: '자산군',
      forbiddenAssets: '제외 자산',
      cash: '최소 현금',
      maxPosition: '단일 비중 한도',
      leverage: '레버리지',
      rebalance: '리밸런싱',
      review: '검토 상태',
      source: '데이터 출처'
    },
    status: {
      approved: '검토 완료',
      live: '공개 중'
    },
    disclosureReviewRequired: '검토 필요',
    disclosureEmpty: '공시 항목 없음',
    sourceLine:
      'InvestmentModel / ModelVersion / ModelRiskProfile / PortfolioMandate / ModelDisclosure / ModelPerformanceSnapshot',
    safetyLine:
      '모의 비교 / 백테스트 참고 / 조언 아님 / 모델 선택 생성 없음 / 주문 없음 / 브로커 미연결',
    footer:
      '이 화면은 seed/mock 기반 읽기 전용 비교입니다. 실제 계좌 연결, 입금, 주문, 외부 유료 데이터 호출을 만들지 않습니다.',
    backToModels: '모델 목록으로'
  },
  en: {
    eyebrow: 'Compare',
    title: 'Model Compare',
    bannerEyebrow: 'Mock comparison',
    bannerTitle: 'Returns stay next to risk',
    bannerDescription:
      'Only approved or live mock models are compared. Return figures are backtest placeholders and do not create advice, model selection, or order execution.',
    sectionTitle: 'Reviewed model comparison',
    sectionDescription:
      'Risk, mandate, disclosure review, and backtest context are stacked for a 390px mobile viewport.',
    labels: {
      creator: 'Operator',
      status: 'Visibility',
      return: 'Backtest return',
      volatility: 'Volatility',
      drawdown: 'Max drawdown',
      benchmark: 'Benchmark',
      period: 'Measured period',
      risk: 'Risk',
      mandate: 'Mandate',
      disclosure: 'Disclosure review',
      allowedMarkets: 'Markets',
      allowedAssets: 'Asset classes',
      forbiddenAssets: 'Excluded assets',
      cash: 'Minimum cash',
      maxPosition: 'Single-position cap',
      leverage: 'Leverage',
      rebalance: 'Rebalance',
      review: 'Review state',
      source: 'Data source'
    },
    status: {
      approved: 'Reviewed',
      live: 'Live'
    },
    disclosureReviewRequired: 'Review required',
    disclosureEmpty: 'No disclosures',
    sourceLine:
      'InvestmentModel / ModelVersion / ModelRiskProfile / PortfolioMandate / ModelDisclosure / ModelPerformanceSnapshot',
    safetyLine:
      'Mock comparison / Backtest placeholder / Not advice / No model selection created / No order / No brokerage',
    footer:
      'This is a seed/mock read-only comparison. It creates no account connection, funding, orders, or external paid data calls.',
    backToModels: 'Back to models'
  }
} as const;

export default async function ModelComparePage({
  searchParams
}: ModelComparePageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = comparisonCopy[locale];
  const selectedPublicIds = parseSelectedPublicIds(resolvedSearchParams?.ids);
  const models = selectCompareModels(
    await readModelCompareSeedFixture(),
    selectedPublicIds
  );
  const safetyFooterLabel = `${copy.safetyLine}. ${copy.footer}`;

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/models/compare"
      trailing={
        <DetailBackLink
          href={withInvestModelLocale('/invest-model/models', locale)}
          label={copy.backToModels}
          variant="icon"
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={BarChart3}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.sectionTitle}
            description={copy.sectionDescription}
          />

          <div className="space-y-invest-card-gap">
            {models.map((model) => (
              <CompareModelCard
                key={model.modelPublicId}
                model={model}
                locale={locale}
              />
            ))}
          </div>
        </div>

        <div
          className={cn(investCardClass.mutedPanel, 'min-w-0')}
          aria-label={safetyFooterLabel}
          title={safetyFooterLabel}
        >
          <p className="break-words text-xs font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
            {copy.safetyLine}
          </p>
          <p className="mt-3 break-words text-sm leading-6 text-invest-text-muted [overflow-wrap:anywhere]">
            {copy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}

function CompareModelCard({
  model,
  locale
}: {
  model: ModelCompareItem;
  locale: InvestModelLocale;
}) {
  const copy = comparisonCopy[locale];
  const riskTone = mapCompareRiskTone(model.risk.tone);
  const statusTone = model.status === 'live' ? 'low' : 'medium';
  const disclosureTitles = model.disclosures.map((disclosure) => {
    const reviewLabel = disclosure.requiresLegalReview
      ? copy.disclosureReviewRequired
      : disclosure.reviewState;

    return `${disclosure.title} (${reviewLabel})`;
  });
  const mandateRows = [
    {
      label: copy.labels.allowedMarkets,
      value: joinList(model.mandate.allowedMarkets)
    },
    {
      label: copy.labels.allowedAssets,
      value: joinList(model.mandate.allowedAssetClasses)
    },
    {
      label: copy.labels.forbiddenAssets,
      value: model.mandate.forbiddenAssets ?? '-'
    },
    {
      label: copy.labels.cash,
      value: formatPercentValue(model.mandate.minCashPct)
    },
    {
      label: copy.labels.maxPosition,
      value: formatPercentValue(model.mandate.maxSinglePositionPct)
    },
    {
      label: copy.labels.leverage,
      value: model.mandate.leveragePolicy ?? '-'
    },
    {
      label: copy.labels.rebalance,
      value: model.mandate.rebalancePolicy ?? '-'
    }
  ];

  return (
    <article
      className={cn(
        'group min-w-0',
        investCardClass.surface,
        investMotionClass.interactiveCard
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[18px] font-bold leading-7 text-invest-text [overflow-wrap:anywhere]">
            {model.name}
          </h2>
          <p className="mt-1 break-words text-sm leading-6 text-invest-text-muted [overflow-wrap:anywhere]">
            {model.strategySummary}
          </p>
        </div>
        <RiskBadge tone={statusTone}>{copy.status[model.status]}</RiskBadge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <RiskBadge tone={riskTone}>{model.risk.label}</RiskBadge>
        <RiskBadge>{model.creatorName}</RiskBadge>
        <RiskBadge tone="neutral">{model.modelVersionPublicId}</RiskBadge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label={copy.labels.return}
          value={model.backtestContext.cumulativeReturn.display}
          tone="positive"
        />
        <Metric
          label={copy.labels.drawdown}
          value={model.backtestContext.maxDrawdown.display}
          tone="risk"
        />
        <Metric
          label={copy.labels.volatility}
          value={model.backtestContext.volatility.display}
        />
        <Metric
          label={copy.labels.benchmark}
          value={model.backtestContext.benchmarkSymbol}
        />
      </div>

      <div className="mt-4 grid gap-3">
        <CompareColumn
          title={copy.labels.risk}
          rows={[
            { label: copy.labels.risk, value: model.risk.summary ?? model.risk.label },
            {
              label: copy.labels.leverage,
              value: model.risk.leverageAllowed ? 'allowed' : 'not allowed'
            },
            {
              label: 'Derivatives',
              value: model.risk.derivativeAllowed ? 'allowed' : 'not allowed'
            },
            {
              label: 'Short selling',
              value: model.risk.shortSellingAllowed ? 'allowed' : 'not allowed'
            }
          ]}
        />
        <CompareColumn title={copy.labels.mandate} rows={mandateRows} />
        <CompareColumn
          title={copy.labels.disclosure}
          rows={[
            {
              label: copy.labels.review,
              value:
                disclosureTitles.length > 0
                  ? disclosureTitles.join(' / ')
                  : copy.disclosureEmpty
            },
            {
              label: copy.labels.period,
              value: model.backtestContext.periodLabel
            },
            {
              label: copy.labels.source,
              value: copy.sourceLine
            }
          ]}
        />
      </div>

      <p className="mt-4 break-words rounded-invest-control bg-invest-surface-muted px-3 py-2 text-xs font-semibold leading-5 text-invest-text-muted [overflow-wrap:anywhere]">
        {model.safetyLabel}
      </p>
    </article>
  );
}

function CompareColumn({
  title,
  rows
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="min-w-0 rounded-invest-control bg-invest-bg-soft p-3">
      <h3 className="break-words text-[13px] font-bold leading-5 text-invest-text [overflow-wrap:anywhere]">
        {title}
      </h3>
      <dl className="mt-2 grid gap-2">
        {rows.map((row) => (
          <div
            key={`${title}-${row.label}`}
            className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] gap-2"
          >
            <dt className="break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
              {row.label}
            </dt>
            <dd className="min-w-0 break-words text-[12px] font-semibold leading-5 text-invest-text [overflow-wrap:anywhere]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  tone?: CompareMetricTone;
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-invest-positive'
      : tone === 'risk'
        ? 'text-invest-risk'
        : 'text-invest-text';

  return (
    <div className="min-h-24 min-w-0 rounded-invest-control bg-invest-surface-muted p-3 transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft/60 group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100">
      <p className="break-words text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 break-words text-[18px] font-bold leading-6 [overflow-wrap:anywhere]',
          toneClass
        )}
      >
        {value}
      </p>
    </div>
  );
}

function parseSelectedPublicIds(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [...defaultComparePublicIds];
  }

  return Array.from(
    new Set(
      rawValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    )
  );
}

function selectCompareModels(
  models: ModelCompareItem[],
  selectedPublicIds: string[]
) {
  const visibleModels = models.filter(
    (model) => model.status === 'approved' || model.status === 'live'
  );
  const modelByPublicId = new Map(
    visibleModels.map((model) => [model.modelPublicId, model])
  );
  const selectedModels = selectedPublicIds
    .map((publicId) => modelByPublicId.get(publicId))
    .filter((model): model is ModelCompareItem => Boolean(model));

  return selectedModels.length > 0 ? selectedModels : visibleModels.slice(0, 3);
}

function mapCompareRiskTone(tone: string): CompareRiskTone {
  if (tone === 'low' || tone === 'medium' || tone === 'high') {
    return tone;
  }

  if (tone === 'danger') {
    return 'high';
  }

  return 'neutral';
}

function joinList(values: string[]) {
  return values.length > 0 ? values.join(' / ') : '-';
}

function formatPercentValue(value: number | null) {
  return value === null ? '-' : `${value}%`;
}
