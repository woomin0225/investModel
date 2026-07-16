/**
 * Model review calendar read-model fixture for Home/Models calendar strips.
 * It exposes review metadata only; it does not execute rebalances, create
 * TradeIntent rows, place orders, make legal judgments, or connect brokerage.
 */

import { desc, eq } from 'drizzle-orm';

import {
  complianceReviews,
  investmentModels,
  modelVersions
} from '@/lib/db/schema';

export type ModelReviewCalendarStatus =
  | 'review_due'
  | 'reviewed'
  | 'paused';

export type ModelReviewCalendarTone = 'info' | 'attention' | 'risk';

export type ModelReviewCalendarChange = {
  changedAt: string;
  label: string;
  source: 'mock_schedule' | 'compliance_review' | 'model_status';
};

export type ModelReviewCalendarItem = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  reviewPublicId: string;
  modelPublicId: string;
  modelVersionPublicId: string;
  modelName: string;
  versionLabel: string;
  status: ModelReviewCalendarStatus;
  tone: ModelReviewCalendarTone;
  dueAt: string;
  lastReviewedAt: string | null;
  scheduleSource: 'mock_schedule_seed' | 'compliance_review_projection';
  summary: string;
  safetyLabel: string;
  changeHistory: ModelReviewCalendarChange[];
  sourceMeta: {
    sourceTables: string[];
    mockOnly: true;
    reviewMetadataOnly: true;
    legalJudgment: false;
    rebalanceExecution: false;
    tradeIntentCreated: false;
    realOrder: false;
    brokerageConnection: false;
    externalPaidApi: false;
  };
};

const reviewCalendarSafetyMeta = {
  sourceTables: [
    'investment_models',
    'model_versions',
    'compliance_reviews'
  ],
  mockOnly: true,
  reviewMetadataOnly: true,
  legalJudgment: false,
  rebalanceExecution: false,
  tradeIntentCreated: false,
  realOrder: false,
  brokerageConnection: false,
  externalPaidApi: false
} as const;

export const modelReviewCalendarSeedFixture: ModelReviewCalendarItem[] = [
  {
    generatedFrom: 'deterministic_fixture',
    reviewPublicId: 'review_calendar_mock_due_001',
    modelPublicId: 'model_mock_signal_observer',
    modelVersionPublicId: 'version_mock_signal_observer_v1',
    modelName: 'Demo Signal Observer',
    versionLabel: 'v1 mock-reviewed',
    status: 'review_due',
    tone: 'attention',
    dueAt: '2026-07-23T09:00:00.000Z',
    lastReviewedAt: '2026-06-23T09:00:00.000Z',
    scheduleSource: 'mock_schedule_seed',
    summary:
      'Mock monthly review is due for model metadata and risk copy. This reminder is read-only and does not rebalance or trade.',
    safetyLabel:
      'Mock review schedule only: no legal judgment, rebalance execution, order, TradeIntent, brokerage connection, or paid external API.',
    changeHistory: [
      {
        changedAt: '2026-06-23T09:00:00.000Z',
        label: 'Previous placeholder review recorded',
        source: 'compliance_review'
      },
      {
        changedAt: '2026-07-16T09:00:00.000Z',
        label: 'Next mock review window opened',
        source: 'mock_schedule'
      }
    ],
    sourceMeta: {
      ...reviewCalendarSafetyMeta,
      sourceTables: [...reviewCalendarSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    reviewPublicId: 'review_calendar_mock_reviewed_001',
    modelPublicId: 'model_mock_income_guard',
    modelVersionPublicId: 'version_mock_income_guard_v2',
    modelName: 'Demo Income Guard',
    versionLabel: 'v2 reviewed-placeholder',
    status: 'reviewed',
    tone: 'info',
    dueAt: '2026-08-12T09:00:00.000Z',
    lastReviewedAt: '2026-07-12T09:00:00.000Z',
    scheduleSource: 'mock_schedule_seed',
    summary:
      'Mock review metadata is current. The calendar only confirms placeholder review timing, not suitability or legal approval.',
    safetyLabel:
      'Reviewed placeholder metadata only: no legal suitability conclusion, trade, rebalance, deposit, or broker action.',
    changeHistory: [
      {
        changedAt: '2026-07-12T09:00:00.000Z',
        label: 'Placeholder disclosure review marked reviewed',
        source: 'compliance_review'
      }
    ],
    sourceMeta: {
      ...reviewCalendarSafetyMeta,
      sourceTables: [...reviewCalendarSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    reviewPublicId: 'review_calendar_mock_paused_001',
    modelPublicId: 'model_mock_volatility_watch',
    modelVersionPublicId: 'version_mock_volatility_watch_v1',
    modelName: 'Demo Volatility Watch',
    versionLabel: 'v1 paused-metadata',
    status: 'paused',
    tone: 'risk',
    dueAt: '2026-07-18T09:00:00.000Z',
    lastReviewedAt: null,
    scheduleSource: 'mock_schedule_seed',
    summary:
      'Mock model status is paused for operator review metadata. The pause is informational and does not change allocations or orders.',
    safetyLabel:
      'Paused metadata only: no rebalance execution, no order, no legal judgment, no real account data, and no brokerage connection.',
    changeHistory: [
      {
        changedAt: '2026-07-15T09:00:00.000Z',
        label: 'Mock model status changed to paused for review',
        source: 'model_status'
      }
    ],
    sourceMeta: {
      ...reviewCalendarSafetyMeta,
      sourceTables: [...reviewCalendarSafetyMeta.sourceTables]
    }
  }
];

function cloneFixture(): ModelReviewCalendarItem[] {
  return modelReviewCalendarSeedFixture.map((item) => ({
    ...item,
    changeHistory: item.changeHistory.map((change) => ({ ...change })),
    sourceMeta: {
      ...item.sourceMeta,
      sourceTables: [...item.sourceMeta.sourceTables]
    }
  }));
}

function asIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function statusFromReview(row: {
  modelStatus: string;
  reviewStatus: string;
  reviewedAt: Date | string | null;
}): ModelReviewCalendarStatus {
  if (row.modelStatus === 'paused') {
    return 'paused';
  }

  if (row.reviewStatus === 'approved' || row.reviewedAt) {
    return 'reviewed';
  }

  return 'review_due';
}

function toneFromStatus(status: ModelReviewCalendarStatus): ModelReviewCalendarTone {
  return status === 'paused' ? 'risk' : status === 'review_due' ? 'attention' : 'info';
}

async function readDbProjection(): Promise<ModelReviewCalendarItem[] | null> {
  const { db } = await import('@/lib/db/drizzle');

  const rows = await db
    .select({
      reviewId: complianceReviews.id,
      reviewType: complianceReviews.reviewType,
      reviewStatus: complianceReviews.status,
      reviewedAt: complianceReviews.reviewedAt,
      reviewCreatedAt: complianceReviews.createdAt,
      notes: complianceReviews.notes,
      modelPublicId: investmentModels.publicId,
      modelName: investmentModels.name,
      modelStatus: investmentModels.status,
      modelVersionPublicId: modelVersions.publicId,
      versionLabel: modelVersions.versionLabel
    })
    .from(complianceReviews)
    .leftJoin(investmentModels, eq(complianceReviews.modelId, investmentModels.id))
    .leftJoin(modelVersions, eq(complianceReviews.modelVersionId, modelVersions.id))
    .orderBy(desc(complianceReviews.createdAt))
    .limit(8);

  if (rows.length === 0) {
    return null;
  }

  return rows.map((row) => {
    const status = statusFromReview({
      modelStatus: row.modelStatus ?? 'draft',
      reviewStatus: row.reviewStatus,
      reviewedAt: row.reviewedAt
    });
    const reviewCreatedAt =
      asIsoString(row.reviewCreatedAt) ?? '2026-07-16T09:00:00.000Z';
    const lastReviewedAt = asIsoString(row.reviewedAt);

    return {
      generatedFrom: 'db_seed_projection',
      reviewPublicId: `review_calendar_seed_${row.reviewId}`,
      modelPublicId: row.modelPublicId ?? 'model_seed_unknown',
      modelVersionPublicId: row.modelVersionPublicId ?? 'version_seed_unknown',
      modelName: row.modelName ?? 'Seeded model review',
      versionLabel: row.versionLabel ?? 'seed version',
      status,
      tone: toneFromStatus(status),
      dueAt: reviewCreatedAt,
      lastReviewedAt,
      scheduleSource: 'compliance_review_projection',
      summary:
        row.notes ??
        'DB seed ComplianceReview metadata is projected for a read-only review calendar.',
      safetyLabel:
        'DB seed review calendar only: no legal judgment, rebalance execution, order, TradeIntent, brokerage connection, or paid external API.',
      changeHistory: [
        {
          changedAt: reviewCreatedAt,
          label: `${row.reviewType} review metadata captured`,
          source: 'compliance_review'
        }
      ],
      sourceMeta: {
        ...reviewCalendarSafetyMeta,
        sourceTables: [...reviewCalendarSafetyMeta.sourceTables]
      }
    };
  });
}

export async function readModelReviewCalendarSeedFixture(): Promise<
  ModelReviewCalendarItem[]
> {
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
