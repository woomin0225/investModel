/**
 * Model compare read-model fixture for seeded comparison screens.
 * It reads model-owned risk, mandate, disclosure, and backtest metadata only.
 */

import { and, desc, eq, inArray } from 'drizzle-orm';

import {
  investmentModels,
  modelCreators,
  modelDisclosures,
  modelPerformanceSnapshots,
  modelRiskProfiles,
  modelVersions,
  portfolioMandates
} from '@/lib/db/schema';
import {
  buildModelDisclosureDto,
  type ModelDisclosureDto,
  type ModelMandateDto,
  type ModelPercentMetricDto,
  type ModelRiskBadgeDto
} from '@/lib/domain/models/model-read-model';
import {
  formatModelPercent,
  nullableFiniteNumber
} from '@/lib/domain/formatting/invest-model-number';

export type ModelCompareGeneratedFrom =
  | 'deterministic_fixture'
  | 'db_seed_projection';

export type ModelCompareItem = {
  generatedFrom: ModelCompareGeneratedFrom;
  modelPublicId: string;
  modelVersionPublicId: string;
  slug: string;
  name: string;
  creatorName: string;
  status: 'approved' | 'live';
  strategySummary: string;
  risk: ModelRiskBadgeDto;
  mandate: ModelMandateDto;
  disclosures: ModelDisclosureDto[];
  backtestContext: {
    periodLabel: string;
    measuredAt: string;
    cumulativeReturn: ModelPercentMetricDto;
    volatility: ModelPercentMetricDto;
    maxDrawdown: ModelPercentMetricDto;
    benchmarkSymbol: string;
    isBacktest: true;
  };
  safetyLabel: string;
  sourceMeta: {
    sourceTables: string[];
    mockOnly: true;
    informationalOnly: true;
    backtestOnly: true;
    externalPaidApi: false;
  };
};

const compareSeedSlugs = [
  'quant-us-leverage-alpha',
  'macro-etf-balance',
  'defensive-income-rotation'
] as const;

const visibleModelStatuses = ['approved', 'live'] as const;
const visibleModelVisibilities = ['public', 'marketplace'] as const;

const compareSourceTables = [
  'investment_models',
  'model_versions',
  'model_risk_profiles',
  'portfolio_mandates',
  'model_disclosures',
  'model_performance_snapshots'
];

const compareSafetyMeta = {
  sourceTables: compareSourceTables,
  mockOnly: true,
  informationalOnly: true,
  backtestOnly: true,
  externalPaidApi: false
} as const;

const compareSafetyLabel =
  'Mock model comparison only: informational metadata and backtest placeholders, no account action or external paid API.';

export const modelCompareSeedFixture: ModelCompareItem[] = [
  {
    generatedFrom: 'deterministic_fixture',
    modelPublicId: 'model_compare_quant_us_leverage_alpha',
    modelVersionPublicId: 'model_version_compare_quant_us_leverage_alpha_v1',
    slug: 'quant-us-leverage-alpha',
    name: 'Quant US Leverage Alpha',
    creatorName: 'Demo Compare Creator',
    status: 'approved',
    strategySummary:
      'Mock compare row for a higher-volatility US equity factor model.',
    risk: riskBadge({
      riskLevel: 'very_high',
      leverageAllowed: false,
      derivativeAllowed: false,
      shortSellingAllowed: false,
      riskSummary:
        'Very high risk placeholder with concentration and drawdown context.'
    }),
    mandate: mandate({
      allowedMarkets: 'US simulated equity references',
      allowedAssetClasses: 'Large-cap equity factors, cash-like mock state',
      forbiddenAssets:
        'No leverage, derivatives, short selling, crypto, real account actions, or external paid data.',
      minCashPct: 3,
      maxSinglePositionPct: 18,
      leveragePolicy: 'No leverage in this compare seed.',
      rebalancePolicy: 'Monthly mock review cadence only.',
      userOverrideAllowed: false
    }),
    disclosures: [
      disclosure('mock_seed_boundary', 'Mock seed boundary'),
      disclosure('risk_notice', 'High volatility placeholder'),
      disclosure('backtest_notice', 'Backtest-only context')
    ],
    backtestContext: backtest({
      periodLabel: 'sample_backtest_12m',
      cumulativeReturnPct: 11.8,
      volatilityPct: 24.4,
      maxDrawdownPct: -15.2,
      benchmarkSymbol: 'SAMPLE_US_FACTOR',
      measuredAt: '2026-07-16T09:00:00.000Z'
    }),
    safetyLabel: compareSafetyLabel,
    sourceMeta: cloneSafetyMeta()
  },
  {
    generatedFrom: 'deterministic_fixture',
    modelPublicId: 'model_compare_macro_etf_balance',
    modelVersionPublicId: 'model_version_compare_macro_etf_balance_v1',
    slug: 'macro-etf-balance',
    name: 'Macro ETF Balance',
    creatorName: 'Demo Compare Creator',
    status: 'live',
    strategySummary:
      'Mock compare row for diversified ETF rotation context.',
    risk: riskBadge({
      riskLevel: 'medium',
      leverageAllowed: false,
      derivativeAllowed: false,
      shortSellingAllowed: false,
      riskSummary:
        'Medium risk placeholder across broad ETF references and cash buffers.'
    }),
    mandate: mandate({
      allowedMarkets: 'US simulated ETF references',
      allowedAssetClasses: 'Equity ETF, bond ETF, cash-like mock state',
      forbiddenAssets:
        'No individual security execution, leverage, derivatives, crypto, or real account actions.',
      minCashPct: 8,
      maxSinglePositionPct: 28,
      leveragePolicy: 'No leverage in this compare seed.',
      rebalancePolicy: 'Quarterly mock review cadence only.',
      userOverrideAllowed: false
    }),
    disclosures: [
      disclosure('mock_seed_boundary', 'Mock seed boundary'),
      disclosure('risk_notice', 'Diversification placeholder'),
      disclosure('backtest_notice', 'Backtest-only context')
    ],
    backtestContext: backtest({
      periodLabel: 'sample_backtest_12m',
      cumulativeReturnPct: 6.4,
      volatilityPct: 11.9,
      maxDrawdownPct: -6.8,
      benchmarkSymbol: 'SAMPLE_BALANCED_ETF',
      measuredAt: '2026-07-16T09:05:00.000Z'
    }),
    safetyLabel: compareSafetyLabel,
    sourceMeta: cloneSafetyMeta()
  },
  {
    generatedFrom: 'deterministic_fixture',
    modelPublicId: 'model_compare_defensive_income_rotation',
    modelVersionPublicId:
      'model_version_compare_defensive_income_rotation_v1',
    slug: 'defensive-income-rotation',
    name: 'Defensive Income Rotation',
    creatorName: 'Demo Compare Creator',
    status: 'approved',
    strategySummary:
      'Mock compare row for defensive income and lower drawdown context.',
    risk: riskBadge({
      riskLevel: 'low',
      leverageAllowed: false,
      derivativeAllowed: false,
      shortSellingAllowed: false,
      riskSummary:
        'Low risk placeholder focused on defensive income references.'
    }),
    mandate: mandate({
      allowedMarkets: 'US simulated income references',
      allowedAssetClasses: 'Dividend equity basket, bond ETF, cash-like mock state',
      forbiddenAssets:
        'No leverage, derivatives, short selling, crypto, or real account actions.',
      minCashPct: 12,
      maxSinglePositionPct: 16,
      leveragePolicy: 'No leverage in this compare seed.',
      rebalancePolicy: 'Monthly mock risk review cadence only.',
      userOverrideAllowed: false
    }),
    disclosures: [
      disclosure('mock_seed_boundary', 'Mock seed boundary'),
      disclosure('risk_notice', 'Income stability placeholder'),
      disclosure('backtest_notice', 'Backtest-only context')
    ],
    backtestContext: backtest({
      periodLabel: 'sample_backtest_12m',
      cumulativeReturnPct: 3.9,
      volatilityPct: 7.4,
      maxDrawdownPct: -3.6,
      benchmarkSymbol: 'SAMPLE_INCOME_BASKET',
      measuredAt: '2026-07-16T09:10:00.000Z'
    }),
    safetyLabel: compareSafetyLabel,
    sourceMeta: cloneSafetyMeta()
  }
];

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
  const parsed = nullableFiniteNumber(value);

  return {
    value: parsed,
    display: formatModelPercent(parsed),
    context: parsed === null ? 'not_available' : 'backtest_placeholder'
  };
}

function riskBadge(input: {
  riskLevel?: string | null;
  leverageAllowed?: boolean | null;
  derivativeAllowed?: boolean | null;
  shortSellingAllowed?: boolean | null;
  riskSummary?: string | null;
}): ModelRiskBadgeDto {
  const level =
    input.riskLevel === 'low' ||
    input.riskLevel === 'medium' ||
    input.riskLevel === 'high' ||
    input.riskLevel === 'very_high'
      ? input.riskLevel
      : 'unknown';

  return {
    level,
    label:
      level === 'low'
        ? 'Low risk'
        : level === 'medium'
          ? 'Medium risk'
          : level === 'high'
            ? 'High risk'
            : level === 'very_high'
              ? 'Very high risk'
              : 'Risk pending',
    tone:
      level === 'low'
        ? 'low'
        : level === 'medium'
          ? 'medium'
          : level === 'high'
            ? 'high'
            : level === 'very_high'
              ? 'danger'
              : 'neutral',
    leverageAllowed: input.leverageAllowed ?? false,
    derivativeAllowed: input.derivativeAllowed ?? false,
    shortSellingAllowed: input.shortSellingAllowed ?? false,
    summary: input.riskSummary ?? undefined
  };
}

function mandate(input: {
  allowedMarkets?: string | null;
  allowedAssetClasses?: string | null;
  forbiddenAssets?: string | null;
  minCashPct?: string | number | null;
  maxSinglePositionPct?: string | number | null;
  leveragePolicy?: string | null;
  rebalancePolicy?: string | null;
  userOverrideAllowed?: boolean | null;
}): ModelMandateDto {
  return {
    allowedMarkets: splitList(input.allowedMarkets),
    allowedAssetClasses: splitList(input.allowedAssetClasses),
    forbiddenAssets: input.forbiddenAssets ?? undefined,
    minCashPct: nullableFiniteNumber(input.minCashPct),
    maxSinglePositionPct: nullableFiniteNumber(input.maxSinglePositionPct),
    leveragePolicy: input.leveragePolicy ?? undefined,
    rebalancePolicy: input.rebalancePolicy ?? undefined,
    userOverrideAllowed: input.userOverrideAllowed ?? false
  };
}

function disclosure(type: string, title: string): ModelDisclosureDto {
  return {
    type,
    title,
    body:
      'Seeded compare disclosure placeholder for UI development. It is informational copy awaiting review.',
    requiresLegalReview: true,
    reviewState: 'requires_review'
  };
}

function backtest(input: {
  periodLabel: string;
  measuredAt: string;
  cumulativeReturnPct?: string | number | null;
  volatilityPct?: string | number | null;
  maxDrawdownPct?: string | number | null;
  benchmarkSymbol: string;
}): ModelCompareItem['backtestContext'] {
  return {
    periodLabel: input.periodLabel,
    measuredAt: input.measuredAt,
    cumulativeReturn: percentMetric(input.cumulativeReturnPct),
    volatility: percentMetric(input.volatilityPct),
    maxDrawdown: percentMetric(input.maxDrawdownPct),
    benchmarkSymbol: input.benchmarkSymbol,
    isBacktest: true
  };
}

function cloneSafetyMeta(): ModelCompareItem['sourceMeta'] {
  return {
    ...compareSafetyMeta,
    sourceTables: [...compareSafetyMeta.sourceTables]
  };
}

function cloneFixture() {
  return modelCompareSeedFixture.map((item) => ({
    ...item,
    risk: { ...item.risk },
    mandate: {
      ...item.mandate,
      allowedMarkets: [...item.mandate.allowedMarkets],
      allowedAssetClasses: [...item.mandate.allowedAssetClasses]
    },
    disclosures: item.disclosures.map((disclosureItem) => ({
      ...disclosureItem
    })),
    backtestContext: {
      ...item.backtestContext,
      cumulativeReturn: { ...item.backtestContext.cumulativeReturn },
      volatility: { ...item.backtestContext.volatility },
      maxDrawdown: { ...item.backtestContext.maxDrawdown }
    },
    sourceMeta: {
      ...item.sourceMeta,
      sourceTables: [...item.sourceMeta.sourceTables]
    }
  }));
}

function asIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return '2026-07-16T09:00:00.000Z';
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function readDbProjection(): Promise<ModelCompareItem[] | null> {
  const { db } = await import('@/lib/db/drizzle');

  const rows = await db
    .select({
      modelVersionId: modelVersions.id,
      modelPublicId: investmentModels.publicId,
      modelVersionPublicId: modelVersions.publicId,
      slug: investmentModels.slug,
      name: investmentModels.name,
      creatorName: modelCreators.displayName,
      status: investmentModels.status,
      strategySummary: modelVersions.strategySummary,
      riskLevel: modelRiskProfiles.riskLevel,
      leverageAllowed: modelRiskProfiles.leverageAllowed,
      derivativeAllowed: modelRiskProfiles.derivativeAllowed,
      shortSellingAllowed: modelRiskProfiles.shortSellingAllowed,
      riskSummary: modelRiskProfiles.riskSummary,
      allowedMarkets: portfolioMandates.allowedMarkets,
      allowedAssetClasses: portfolioMandates.allowedAssetClasses,
      forbiddenAssets: portfolioMandates.forbiddenAssets,
      minCashPct: portfolioMandates.minCashPct,
      maxSinglePositionPct: portfolioMandates.maxSinglePositionPct,
      leveragePolicy: portfolioMandates.leveragePolicy,
      rebalancePolicy: portfolioMandates.rebalancePolicy,
      userOverrideAllowed: portfolioMandates.userOverrideAllowed,
      periodLabel: modelPerformanceSnapshots.periodLabel,
      cumulativeReturnPct: modelPerformanceSnapshots.cumulativeReturnPct,
      volatilityPct: modelPerformanceSnapshots.volatilityPct,
      maxDrawdownPct: modelPerformanceSnapshots.maxDrawdownPct,
      benchmarkSymbol: modelPerformanceSnapshots.benchmarkSymbol,
      isBacktest: modelPerformanceSnapshots.isBacktest,
      measuredAt: modelPerformanceSnapshots.measuredAt
    })
    .from(investmentModels)
    .innerJoin(modelCreators, eq(investmentModels.creatorId, modelCreators.id))
    .innerJoin(
      modelVersions,
      eq(investmentModels.currentVersionId, modelVersions.id)
    )
    .innerJoin(
      modelRiskProfiles,
      eq(modelRiskProfiles.modelVersionId, modelVersions.id)
    )
    .innerJoin(
      portfolioMandates,
      eq(portfolioMandates.modelVersionId, modelVersions.id)
    )
    .innerJoin(
      modelPerformanceSnapshots,
      eq(modelPerformanceSnapshots.modelVersionId, modelVersions.id)
    )
    .where(
      and(
        inArray(investmentModels.slug, compareSeedSlugs),
        inArray(investmentModels.status, visibleModelStatuses),
        inArray(investmentModels.visibility, visibleModelVisibilities)
      )
    )
    .orderBy(
      desc(modelPerformanceSnapshots.measuredAt),
      investmentModels.name
    );

  if (rows.length === 0) {
    return null;
  }

  const disclosuresByVersion = new Map<number, ModelDisclosureDto[]>();

  await Promise.all(
    rows.map(async (row) => {
      const disclosures = await db
        .select({
          disclosureType: modelDisclosures.disclosureType,
          title: modelDisclosures.title,
          body: modelDisclosures.body,
          requiresLegalReview: modelDisclosures.requiresLegalReview,
          reviewedAt: modelDisclosures.reviewedAt
        })
        .from(modelDisclosures)
        .where(eq(modelDisclosures.modelVersionId, row.modelVersionId))
        .orderBy(modelDisclosures.disclosureType);

      disclosuresByVersion.set(
        row.modelVersionId,
        disclosures.map(buildModelDisclosureDto)
      );
    })
  );

  return rows.map((row) => ({
    generatedFrom: 'db_seed_projection',
    modelPublicId: row.modelPublicId,
    modelVersionPublicId: row.modelVersionPublicId,
    slug: row.slug,
    name: row.name,
    creatorName: row.creatorName,
    status: row.status === 'approved' ? 'approved' : 'live',
    strategySummary: row.strategySummary,
    risk: riskBadge(row),
    mandate: mandate(row),
    disclosures: disclosuresByVersion.get(row.modelVersionId) ?? [],
    backtestContext: backtest({
      periodLabel: row.periodLabel,
      cumulativeReturnPct: row.cumulativeReturnPct,
      volatilityPct: row.volatilityPct,
      maxDrawdownPct: row.maxDrawdownPct,
      benchmarkSymbol: row.benchmarkSymbol ?? 'SAMPLE_COMPARE',
      measuredAt: asIsoString(row.measuredAt)
    }),
    safetyLabel: compareSafetyLabel,
    sourceMeta: cloneSafetyMeta()
  }));
}

export async function readModelCompareSeedFixture(): Promise<ModelCompareItem[]> {
  if (!process.env.MYSQL_URL) {
    return cloneFixture();
  }

  try {
    const projection = await readDbProjection();
    return projection && projection.length > 0 ? projection : cloneFixture();
  } catch {
    return cloneFixture();
  }
}
