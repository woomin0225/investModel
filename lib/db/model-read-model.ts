import { and, desc, eq, inArray, or, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
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
  buildModelCardDto,
  buildModelDetailDto,
  buildModelDisclosureDto,
  type ModelCardDto,
  type ModelDetailDto
} from '@/lib/domain/models/model-read-model';

const visibleModelStatuses = ['approved', 'live'] as const;
const visibleModelVisibilities = ['public', 'marketplace'] as const;

function modelSelectFields() {
  return {
    modelPublicId: investmentModels.publicId,
    modelVersionPublicId: modelVersions.publicId,
    slug: investmentModels.slug,
    name: investmentModels.name,
    shortDescription: investmentModels.shortDescription,
    creatorName: modelCreators.displayName,
    status: investmentModels.status,
    riskLevel: modelRiskProfiles.riskLevel,
    leverageAllowed: modelRiskProfiles.leverageAllowed,
    derivativeAllowed: modelRiskProfiles.derivativeAllowed,
    shortSellingAllowed: modelRiskProfiles.shortSellingAllowed,
    riskSummary: modelRiskProfiles.riskSummary,
    targetMarkets: modelVersions.targetMarkets,
    assetUniverseSummary: modelVersions.assetUniverseSummary,
    cumulativeReturnPct: modelPerformanceSnapshots.cumulativeReturnPct,
    maxDrawdownPct: modelPerformanceSnapshots.maxDrawdownPct
  };
}

function modelDetailSelectFields() {
  return {
    ...modelSelectFields(),
    modelVersionId: modelVersions.id,
    strategySummary: modelVersions.strategySummary,
    modelArtifactStatus: modelVersions.modelArtifactStatus,
    inputDataSummary: modelVersions.inputDataSummary,
    forbiddenScope: modelVersions.forbiddenScope,
    rebalanceFrequency: modelVersions.rebalanceFrequency,
    allowedMarkets: portfolioMandates.allowedMarkets,
    allowedAssetClasses: portfolioMandates.allowedAssetClasses,
    forbiddenAssets: portfolioMandates.forbiddenAssets,
    minCashPct: portfolioMandates.minCashPct,
    maxSinglePositionPct: portfolioMandates.maxSinglePositionPct,
    leveragePolicy: portfolioMandates.leveragePolicy,
    rebalancePolicy: portfolioMandates.rebalancePolicy,
    userOverrideAllowed: portfolioMandates.userOverrideAllowed,
    periodLabel: modelPerformanceSnapshots.periodLabel,
    volatilityPct: modelPerformanceSnapshots.volatilityPct,
    benchmarkSymbol: modelPerformanceSnapshots.benchmarkSymbol,
    isBacktest: modelPerformanceSnapshots.isBacktest,
    measuredAt: modelPerformanceSnapshots.measuredAt
  };
}

function visibleModelFilters(): SQL[] {
  return [
    inArray(investmentModels.status, visibleModelStatuses),
    inArray(investmentModels.visibility, visibleModelVisibilities)
  ];
}

function modelBaseQuery() {
  return db
    .select(modelSelectFields())
    .from(investmentModels)
    .innerJoin(modelCreators, eq(investmentModels.creatorId, modelCreators.id))
    .leftJoin(
      modelVersions,
      eq(investmentModels.currentVersionId, modelVersions.id)
    )
    .leftJoin(
      modelRiskProfiles,
      eq(modelRiskProfiles.modelVersionId, modelVersions.id)
    )
    .leftJoin(
      modelPerformanceSnapshots,
      eq(modelPerformanceSnapshots.modelVersionId, modelVersions.id)
    );
}

function modelDetailBaseQuery() {
  return db
    .select(modelDetailSelectFields())
    .from(investmentModels)
    .innerJoin(modelCreators, eq(investmentModels.creatorId, modelCreators.id))
    .leftJoin(
      modelVersions,
      eq(investmentModels.currentVersionId, modelVersions.id)
    )
    .leftJoin(
      modelRiskProfiles,
      eq(modelRiskProfiles.modelVersionId, modelVersions.id)
    )
    .leftJoin(
      portfolioMandates,
      eq(portfolioMandates.modelVersionId, modelVersions.id)
    )
    .leftJoin(
      modelPerformanceSnapshots,
      eq(modelPerformanceSnapshots.modelVersionId, modelVersions.id)
    );
}

export async function readModelCardDtos(limit: number): Promise<ModelCardDto[]> {
  const rows = await modelBaseQuery()
    .where(and(...visibleModelFilters()))
    .orderBy(
      desc(modelPerformanceSnapshots.measuredAt),
      desc(investmentModels.updatedAt)
    )
    .limit(limit);

  return rows.map(buildModelCardDto);
}

export async function readModelDetailDto(
  modelIdOrSlug: string
): Promise<ModelDetailDto | null> {
  const filters = [
    ...visibleModelFilters(),
    or(
      eq(investmentModels.publicId, modelIdOrSlug),
      eq(investmentModels.slug, modelIdOrSlug)
    )
  ];

  const rows = await modelDetailBaseQuery()
    .where(and(...filters))
    .orderBy(desc(modelPerformanceSnapshots.measuredAt))
    .limit(1);
  const row = rows[0];

  if (!row) {
    return null;
  }

  const disclosures = row.modelVersionId
    ? await db
        .select({
          disclosureType: modelDisclosures.disclosureType,
          title: modelDisclosures.title,
          body: modelDisclosures.body,
          requiresLegalReview: modelDisclosures.requiresLegalReview,
          reviewedAt: modelDisclosures.reviewedAt
        })
        .from(modelDisclosures)
        .where(eq(modelDisclosures.modelVersionId, row.modelVersionId))
        .orderBy(modelDisclosures.disclosureType)
    : [];

  return buildModelDetailDto({
    row,
    disclosures: disclosures.map(buildModelDisclosureDto)
  });
}
