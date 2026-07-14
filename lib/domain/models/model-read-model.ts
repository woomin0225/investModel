import type { PolicyNoticeDto } from '@/lib/domain/feed/feed-post';
import type { AccessRole, DomainPublicId } from '@/lib/domain/types';

export interface ModelRiskBadgeDto {
  level: 'low' | 'medium' | 'high' | 'very_high' | 'unknown';
  label: string;
  tone: 'low' | 'medium' | 'high' | 'danger' | 'neutral';
  leverageAllowed: boolean;
  derivativeAllowed: boolean;
  shortSellingAllowed: boolean;
  summary?: string;
}

export interface ModelPercentMetricDto {
  value: number | null;
  display: string;
  context: 'backtest_placeholder' | 'not_available';
}

export interface ModelMandateDto {
  allowedMarkets: string[];
  allowedAssetClasses: string[];
  forbiddenAssets?: string;
  minCashPct: number | null;
  maxSinglePositionPct: number | null;
  leveragePolicy?: string;
  rebalancePolicy?: string;
  userOverrideAllowed: boolean;
}

export interface ModelDisclosureDto {
  type: string;
  title: string;
  body: string;
  requiresLegalReview: boolean;
  reviewState: 'requires_review' | 'reviewed_placeholder';
}

export interface ModelCardDto {
  modelPublicId: DomainPublicId;
  modelVersionPublicId?: DomainPublicId;
  slug: string;
  name: string;
  shortDescription?: string;
  creatorName: string;
  status: 'approved' | 'live';
  risk: ModelRiskBadgeDto;
  targetMarkets: string[];
  assetClassLabels: string[];
  leverageAllowed: boolean;
  backtestReturn: ModelPercentMetricDto;
  maxDrawdown: ModelPercentMetricDto;
  reviewLabel: string;
  dataContext: 'db_read_model' | 'backtest_placeholder';
  notices: PolicyNoticeDto[];
}

export interface ModelDetailDto extends ModelCardDto {
  strategySummary?: string;
  assetUniverseSummary?: string;
  modelArtifactStatus: string;
  inputDataSummary?: string;
  forbiddenScope?: string;
  rebalanceFrequency?: string;
  mandate: ModelMandateDto;
  disclosures: ModelDisclosureDto[];
  performance: {
    periodLabel?: string;
    measuredAt?: string;
    cumulativeReturn: ModelPercentMetricDto;
    volatility: ModelPercentMetricDto;
    maxDrawdown: ModelPercentMetricDto;
    benchmarkSymbol?: string;
    isBacktest: boolean;
  };
}

export interface BuildModelDtoInput {
  modelPublicId: string;
  modelVersionPublicId?: string | null;
  slug: string;
  name: string;
  shortDescription?: string | null;
  creatorName?: string | null;
  status: string;
  riskLevel?: string | null;
  leverageAllowed?: boolean | null;
  derivativeAllowed?: boolean | null;
  shortSellingAllowed?: boolean | null;
  riskSummary?: string | null;
  targetMarkets?: string | null;
  assetUniverseSummary?: string | null;
  cumulativeReturnPct?: string | number | null;
  maxDrawdownPct?: string | number | null;
}

export interface BuildModelDetailDtoInput extends BuildModelDtoInput {
  strategySummary?: string | null;
  modelArtifactStatus?: string | null;
  inputDataSummary?: string | null;
  forbiddenScope?: string | null;
  rebalanceFrequency?: string | null;
  allowedMarkets?: string | null;
  allowedAssetClasses?: string | null;
  forbiddenAssets?: string | null;
  minCashPct?: string | number | null;
  maxSinglePositionPct?: string | number | null;
  leveragePolicy?: string | null;
  rebalancePolicy?: string | null;
  userOverrideAllowed?: boolean | null;
  periodLabel?: string | null;
  volatilityPct?: string | number | null;
  benchmarkSymbol?: string | null;
  isBacktest?: boolean | null;
  measuredAt?: Date | string | null;
}

export function canReadModels(role: AccessRole) {
  return role === 'public' || role === 'user' || role === 'admin';
}

export function parseModelLimit(value: string | null, fallback = 20) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

export function modelPolicyNotices(): PolicyNoticeDto[] {
  return [
    {
      code: 'informational_model_catalog',
      severity: 'info',
      message:
        'Model catalog data is informational context, not investment advice.'
    },
    {
      code: 'backtest_not_future_return',
      severity: 'warning',
      message:
        'Backtest and placeholder metrics do not imply future performance.'
    },
    {
      code: 'no_real_order',
      severity: 'warning',
      message:
        'This API does not create orders, broker actions, or portfolio allocations.'
    }
  ];
}

export function buildModelCardDto(input: BuildModelDtoInput): ModelCardDto {
  const risk = buildRiskBadge(input);

  return {
    modelPublicId: input.modelPublicId as DomainPublicId,
    modelVersionPublicId: input.modelVersionPublicId
      ? (input.modelVersionPublicId as DomainPublicId)
      : undefined,
    slug: input.slug,
    name: input.name,
    shortDescription: input.shortDescription ?? undefined,
    creatorName: input.creatorName ?? 'Unknown creator',
    status: modelStatus(input.status),
    risk,
    targetMarkets: splitList(input.targetMarkets),
    assetClassLabels: splitList(input.assetUniverseSummary),
    leverageAllowed: risk.leverageAllowed,
    backtestReturn: percentMetric(input.cumulativeReturnPct),
    maxDrawdown: percentMetric(input.maxDrawdownPct),
    reviewLabel: 'Marketplace read model',
    dataContext: 'db_read_model',
    notices: modelPolicyNotices()
  };
}

export function buildModelDetailDto(input: {
  row: BuildModelDetailDtoInput;
  disclosures: ModelDisclosureDto[];
}): ModelDetailDto {
  const card = buildModelCardDto(input.row);
  const measuredAt =
    input.row.measuredAt instanceof Date
      ? input.row.measuredAt.toISOString()
      : input.row.measuredAt ?? undefined;

  return {
    ...card,
    strategySummary: input.row.strategySummary ?? undefined,
    assetUniverseSummary: input.row.assetUniverseSummary ?? undefined,
    modelArtifactStatus: input.row.modelArtifactStatus ?? 'metadata_only',
    inputDataSummary: input.row.inputDataSummary ?? undefined,
    forbiddenScope: input.row.forbiddenScope ?? undefined,
    rebalanceFrequency: input.row.rebalanceFrequency ?? undefined,
    mandate: {
      allowedMarkets: splitList(input.row.allowedMarkets),
      allowedAssetClasses: splitList(input.row.allowedAssetClasses),
      forbiddenAssets: input.row.forbiddenAssets ?? undefined,
      minCashPct: nullableNumber(input.row.minCashPct),
      maxSinglePositionPct: nullableNumber(input.row.maxSinglePositionPct),
      leveragePolicy: input.row.leveragePolicy ?? undefined,
      rebalancePolicy: input.row.rebalancePolicy ?? undefined,
      userOverrideAllowed: input.row.userOverrideAllowed ?? false
    },
    disclosures: input.disclosures,
    performance: {
      periodLabel: input.row.periodLabel ?? undefined,
      measuredAt,
      cumulativeReturn: percentMetric(input.row.cumulativeReturnPct),
      volatility: percentMetric(input.row.volatilityPct),
      maxDrawdown: percentMetric(input.row.maxDrawdownPct),
      benchmarkSymbol: input.row.benchmarkSymbol ?? undefined,
      isBacktest: input.row.isBacktest ?? true
    }
  };
}

export function buildModelDisclosureDto(input: {
  disclosureType: string;
  title: string;
  body: string;
  requiresLegalReview: boolean;
  reviewedAt?: Date | string | null;
}): ModelDisclosureDto {
  return {
    type: input.disclosureType,
    title: input.title,
    body: input.body,
    requiresLegalReview: input.requiresLegalReview,
    reviewState: input.reviewedAt ? 'reviewed_placeholder' : 'requires_review'
  };
}

function buildRiskBadge(input: BuildModelDtoInput): ModelRiskBadgeDto {
  const level = riskLevel(input.riskLevel);

  return {
    level,
    label: riskLabel(level),
    tone: riskTone(level),
    leverageAllowed: input.leverageAllowed ?? false,
    derivativeAllowed: input.derivativeAllowed ?? false,
    shortSellingAllowed: input.shortSellingAllowed ?? false,
    summary: input.riskSummary ?? undefined
  };
}

function modelStatus(status: string): 'approved' | 'live' {
  return status === 'approved' ? 'approved' : 'live';
}

function riskLevel(value?: string | null): ModelRiskBadgeDto['level'] {
  if (
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'very_high'
  ) {
    return value;
  }

  return 'unknown';
}

function riskLabel(level: ModelRiskBadgeDto['level']) {
  switch (level) {
    case 'low':
      return 'Low risk';
    case 'medium':
      return 'Medium risk';
    case 'high':
      return 'High risk';
    case 'very_high':
      return 'Very high risk';
    case 'unknown':
      return 'Risk pending';
  }
}

function riskTone(level: ModelRiskBadgeDto['level']): ModelRiskBadgeDto['tone'] {
  switch (level) {
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case 'very_high':
      return 'danger';
    case 'unknown':
      return 'neutral';
  }
}

function splitList(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function percentMetric(value?: string | number | null): ModelPercentMetricDto {
  const parsed = nullableNumber(value);

  return {
    value: parsed,
    display: parsed === null ? 'N/A' : `${parsed > 0 ? '+' : ''}${parsed}%`,
    context: parsed === null ? 'not_available' : 'backtest_placeholder'
  };
}

function nullableNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
