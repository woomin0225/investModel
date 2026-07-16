/**
 * Admin review queue read-model fixture for operator review screens.
 * It exposes review workflow metadata only; it does not approve suitability,
 * finalize legal copy, create deposits, create TradeIntent rows, place orders,
 * or connect brokerage accounts.
 */

import { desc, eq } from 'drizzle-orm';

import {
  complianceReviews,
  investmentModels,
  modelCreators,
  modelVersions
} from '@/lib/db/schema';

export type AdminReviewQueueStatus =
  | 'pending_review'
  | 'rejected'
  | 'paused';

export type AdminReviewQueueTone = 'attention' | 'risk' | 'muted';

export type AdminReviewQueueItem = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  reviewPublicId: string;
  modelPublicId: string;
  modelVersionPublicId: string;
  modelName: string;
  creatorName: string;
  versionLabel: string;
  queueStatus: AdminReviewQueueStatus;
  modelStatus: string;
  complianceReviewStatus: string;
  reviewType: string;
  tone: AdminReviewQueueTone;
  submittedAt: string;
  reviewedAt: string | null;
  actorLabel: string;
  reasonPlaceholder: string;
  summary: string;
  safetyLabel: string;
  sourceMeta: {
    sourceTables: string[];
    mockOnly: true;
    auditSafeActor: true;
    reviewMetadataOnly: true;
    legalJudgment: false;
    suitabilityApproval: false;
    finalLegalApproval: false;
    tradeIntentCreated: false;
    realOrder: false;
    brokerageConnection: false;
    realDeposit: false;
    externalPaidApi: false;
  };
};

const adminReviewSafetyMeta = {
  sourceTables: [
    'investment_models',
    'model_versions',
    'model_creators',
    'compliance_reviews'
  ],
  mockOnly: true,
  auditSafeActor: true,
  reviewMetadataOnly: true,
  legalJudgment: false,
  suitabilityApproval: false,
  finalLegalApproval: false,
  tradeIntentCreated: false,
  realOrder: false,
  brokerageConnection: false,
  realDeposit: false,
  externalPaidApi: false
} as const;

export const adminReviewQueueSeedFixture: AdminReviewQueueItem[] = [
  {
    generatedFrom: 'deterministic_fixture',
    reviewPublicId: 'admin_review_queue_mock_pending_001',
    modelPublicId: 'model_admin_review_pending_001',
    modelVersionPublicId: 'model_version_admin_review_pending_001',
    modelName: 'Admin Pending Sample',
    creatorName: 'Admin Review Seed Creator',
    versionLabel: 'v1-admin-review-pending',
    queueStatus: 'pending_review',
    modelStatus: 'pending_review',
    complianceReviewStatus: 'pending',
    reviewType: 'model_release_candidate',
    tone: 'attention',
    submittedAt: '2026-07-16T09:10:00.000Z',
    reviewedAt: null,
    actorLabel: 'unassigned_operator',
    reasonPlaceholder:
      'Pending checklist review placeholder; no legal or suitability conclusion has been made.',
    summary:
      'Operator queue metadata for a pending release candidate. This row is read-only and cannot publish or trade.',
    safetyLabel:
      'Admin review metadata only: no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
    sourceMeta: {
      ...adminReviewSafetyMeta,
      sourceTables: [...adminReviewSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    reviewPublicId: 'admin_review_queue_mock_rejected_001',
    modelPublicId: 'model_admin_review_rejected_001',
    modelVersionPublicId: 'model_version_admin_review_rejected_001',
    modelName: 'Admin Rejected Sample',
    creatorName: 'Admin Review Seed Creator',
    versionLabel: 'v1-admin-review-rejected',
    queueStatus: 'rejected',
    modelStatus: 'pending_review',
    complianceReviewStatus: 'rejected',
    reviewType: 'model_release_candidate',
    tone: 'risk',
    submittedAt: '2026-07-16T09:15:00.000Z',
    reviewedAt: '2026-07-16T09:20:00.000Z',
    actorLabel: 'admin_review_queue_operator',
    reasonPlaceholder:
      'Rejected placeholder: disclosure and leverage wording require revision; this is not a legal determination.',
    summary:
      'Operator queue metadata for a rejected release candidate. The rejection reason is a placeholder for creator revision.',
    safetyLabel:
      'Rejected review metadata only: no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
    sourceMeta: {
      ...adminReviewSafetyMeta,
      sourceTables: [...adminReviewSafetyMeta.sourceTables]
    }
  },
  {
    generatedFrom: 'deterministic_fixture',
    reviewPublicId: 'admin_review_queue_mock_paused_001',
    modelPublicId: 'model_admin_review_paused_001',
    modelVersionPublicId: 'model_version_admin_review_paused_001',
    modelName: 'Admin Paused Sample',
    creatorName: 'Admin Review Seed Creator',
    versionLabel: 'v1-admin-review-paused',
    queueStatus: 'paused',
    modelStatus: 'paused',
    complianceReviewStatus: 'pending',
    reviewType: 'model_pause_review',
    tone: 'muted',
    submittedAt: '2026-07-16T09:25:00.000Z',
    reviewedAt: null,
    actorLabel: 'admin_review_queue_operator',
    reasonPlaceholder:
      'Paused placeholder: operator metadata review is open; no allocation, order, or account action is created.',
    summary:
      'Operator queue metadata for a paused model. The paused state is derived from InvestmentModel status.',
    safetyLabel:
      'Paused review metadata only: no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
    sourceMeta: {
      ...adminReviewSafetyMeta,
      sourceTables: [...adminReviewSafetyMeta.sourceTables]
    }
  }
];

function cloneFixture(): AdminReviewQueueItem[] {
  return adminReviewQueueSeedFixture.map((item) => ({
    ...item,
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

function queueStatusFromReview(row: {
  modelStatus: string;
  complianceReviewStatus: string;
}): AdminReviewQueueStatus {
  if (row.modelStatus === 'paused') {
    return 'paused';
  }

  if (row.complianceReviewStatus === 'rejected') {
    return 'rejected';
  }

  return 'pending_review';
}

function toneFromStatus(status: AdminReviewQueueStatus): AdminReviewQueueTone {
  if (status === 'rejected') {
    return 'risk';
  }

  return status === 'paused' ? 'muted' : 'attention';
}

async function readDbProjection(): Promise<AdminReviewQueueItem[] | null> {
  const { db } = await import('@/lib/db/drizzle');

  const rows = await db
    .select({
      reviewId: complianceReviews.id,
      reviewType: complianceReviews.reviewType,
      complianceReviewStatus: complianceReviews.status,
      reviewedAt: complianceReviews.reviewedAt,
      submittedAt: complianceReviews.createdAt,
      notes: complianceReviews.notes,
      reviewerUserId: complianceReviews.reviewerUserId,
      modelPublicId: investmentModels.publicId,
      modelName: investmentModels.name,
      modelStatus: investmentModels.status,
      modelVersionPublicId: modelVersions.publicId,
      versionLabel: modelVersions.versionLabel,
      creatorName: modelCreators.displayName
    })
    .from(complianceReviews)
    .leftJoin(investmentModels, eq(complianceReviews.modelId, investmentModels.id))
    .leftJoin(modelVersions, eq(complianceReviews.modelVersionId, modelVersions.id))
    .leftJoin(modelCreators, eq(investmentModels.creatorId, modelCreators.id))
    .orderBy(desc(complianceReviews.createdAt))
    .limit(12);

  if (rows.length === 0) {
    return null;
  }

  return rows.map((row) => {
    const modelStatus = row.modelStatus ?? 'draft';
    const complianceReviewStatus = row.complianceReviewStatus ?? 'pending';
    const queueStatus = queueStatusFromReview({
      modelStatus,
      complianceReviewStatus
    });
    const submittedAt =
      asIsoString(row.submittedAt) ?? '2026-07-16T09:10:00.000Z';

    return {
      generatedFrom: 'db_seed_projection',
      reviewPublicId: `admin_review_queue_seed_${row.reviewId}`,
      modelPublicId: row.modelPublicId ?? 'model_admin_review_unknown',
      modelVersionPublicId:
        row.modelVersionPublicId ?? 'model_version_admin_review_unknown',
      modelName: row.modelName ?? 'Admin review seed model',
      creatorName: row.creatorName ?? 'Admin Review Seed Creator',
      versionLabel: row.versionLabel ?? 'seed-review-version',
      queueStatus,
      modelStatus,
      complianceReviewStatus,
      reviewType: row.reviewType,
      tone: toneFromStatus(queueStatus),
      submittedAt,
      reviewedAt: asIsoString(row.reviewedAt),
      actorLabel: row.reviewerUserId
        ? 'admin_review_queue_operator'
        : 'unassigned_operator',
      reasonPlaceholder:
        row.notes ??
        'Admin review queue placeholder reason; no legal or suitability conclusion has been made.',
      summary:
        'DB seed ComplianceReview metadata projected for a read-only admin review queue.',
      safetyLabel:
        'DB seed admin review metadata only: no legal judgment, no final suitability approval, no real order, no broker connection, and no deposit movement.',
      sourceMeta: {
        ...adminReviewSafetyMeta,
        sourceTables: [...adminReviewSafetyMeta.sourceTables]
      }
    };
  });
}

export async function readAdminReviewQueueSeedFixture(): Promise<
  AdminReviewQueueItem[]
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
