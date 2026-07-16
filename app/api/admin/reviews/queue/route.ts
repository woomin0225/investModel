import { NextRequest } from 'next/server';

import {
  readAdminReviewQueueSeedFixture,
  type AdminReviewQueueItem,
  type AdminReviewQueueStatus
} from '@/lib/db/admin-review-queue-read-model';
import {
  canReviewInvestmentModel
} from '@/lib/domain/models/admin-review';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route exposes read-only admin review queue metadata.
 * It does not approve models, finalize legal copy, persist state transitions,
 * execute model files, create deposits, create TradeIntent rows, place orders,
 * or connect brokerage accounts.
 */

type ApiErrorCode = 'forbidden' | 'server_error';

type AdminReviewQueueGroup = {
  pendingReview: AdminReviewQueueItem[];
  rejected: AdminReviewQueueItem[];
  paused: AdminReviewQueueItem[];
};

function readRole(request: NextRequest): AccessRole {
  const role = request.headers.get('x-invest-model-role');

  if (
    role === 'public' ||
    role === 'user' ||
    role === 'creator' ||
    role === 'admin' ||
    role === 'system'
  ) {
    return role;
  }

  return 'public';
}

function parseQueueStatus(value: string | null): AdminReviewQueueStatus | null {
  if (
    value === 'pending_review' ||
    value === 'rejected' ||
    value === 'paused'
  ) {
    return value;
  }

  return null;
}

function countByStatus(items: AdminReviewQueueItem[]) {
  return items.reduce<Record<AdminReviewQueueStatus, number>>(
    (counts, item) => {
      counts[item.queueStatus] += 1;
      return counts;
    },
    {
      pending_review: 0,
      rejected: 0,
      paused: 0
    }
  );
}

function groupItems(items: AdminReviewQueueItem[]): AdminReviewQueueGroup {
  return {
    pendingReview: items.filter((item) => item.queueStatus === 'pending_review'),
    rejected: items.filter((item) => item.queueStatus === 'rejected'),
    paused: items.filter((item) => item.queueStatus === 'paused')
  };
}

function queueSafetyMeta(
  items: AdminReviewQueueItem[],
  requestedStatus: AdminReviewQueueStatus | null
) {
  return {
    routeStatus: 'fixture_or_db_seed_projection',
    contract: 'AdminReviewQueueDto',
    persistence:
      items.some((item) => item.generatedFrom === 'db_seed_projection')
        ? 'read_only_db_seed_projection'
        : 'deterministic_fixture',
    sourceTables: [
      'investment_models',
      'model_versions',
      'model_creators',
      'compliance_reviews'
    ],
    requestedStatus,
    returnedCount: items.length,
    statusCounts: countByStatus(items),
    filtersApplied: {
      queueStatus: requestedStatus !== null
    },
    emptyState:
      items.length === 0
        ? {
            title: 'No admin review queue items match this filter',
            message:
              'Seed or mock ComplianceReview rows are required before admin review queue items appear.'
          }
        : null,
    adminOnly: true,
    readOnly: true,
    mockOnly: true,
    auditSafeActor: true,
    reviewMetadataOnly: true,
    legalJudgment: false,
    suitabilityApproval: false,
    finalLegalApproval: false,
    modelStatusChanged: false,
    disclosureFinalized: false,
    modelExecution: false,
    modelSelectionCreated: false,
    realTrading: false,
    realOrderCancellation: false,
    realFundsMovement: false,
    sendsRealPush: false,
    sendsRealEmail: false,
    sendsRealSms: false,
    tradeIntentCreated: false,
    realOrder: false,
    brokerageConnection: false,
    realDeposit: false,
    externalPaidApi: false,
    financialAdvice: false
  };
}

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        resource: 'admin_review_queue',
        action: 'read_admin_review_queue'
      },
      meta: queueSafetyMeta([], null)
    },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReviewInvestmentModel(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only admin roles can read the admin review queue metadata.'
    );
  }

  const requestedStatus = parseQueueStatus(
    request.nextUrl.searchParams.get('status')
  );

  try {
    const allItems = await readAdminReviewQueueSeedFixture();
    const items = requestedStatus
      ? allItems.filter((item) => item.queueStatus === requestedStatus)
      : allItems;

    return Response.json({
      ok: true,
      data: {
        items,
        groups: groupItems(items)
      },
      meta: queueSafetyMeta(items, requestedStatus)
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Admin review queue metadata could not be read. No legal judgment, suitability approval, model status change, order, TradeIntent, deposit, or brokerage action was created.'
    );
  }
}
