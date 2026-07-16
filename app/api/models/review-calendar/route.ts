import { NextRequest } from 'next/server';

import {
  readModelReviewCalendarSeedFixture,
  type ModelReviewCalendarItem,
  type ModelReviewCalendarStatus
} from '@/lib/db/model-review-calendar-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  readInvestModelSessionRole
} from '@/lib/server/invest-model-user-scope';

/**
 * This route exposes model review calendar metadata for Home/Models strips.
 * It never executes rebalances, creates TradeIntent rows, places orders,
 * makes legal judgments, or connects brokerage accounts.
 */

type ApiErrorCode = 'forbidden' | 'server_error';

type ModelReviewCalendarGroup = {
  reviewDue: ModelReviewCalendarItem[];
  reviewed: ModelReviewCalendarItem[];
  paused: ModelReviewCalendarItem[];
};

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return Response.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

function canReadModelReviewCalendar(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function countByStatus(items: ModelReviewCalendarItem[]) {
  return items.reduce<Record<ModelReviewCalendarStatus, number>>(
    (counts, item) => {
      counts[item.status] += 1;
      return counts;
    },
    {
      review_due: 0,
      reviewed: 0,
      paused: 0
    }
  );
}

function groupItems(items: ModelReviewCalendarItem[]): ModelReviewCalendarGroup {
  return {
    reviewDue: items.filter((item) => item.status === 'review_due'),
    reviewed: items.filter((item) => item.status === 'reviewed'),
    paused: items.filter((item) => item.status === 'paused')
  };
}

function reviewCalendarMeta(items: ModelReviewCalendarItem[]) {
  return {
    routeStatus: 'fixture_or_db_seed_projection',
    contract: 'ModelReviewCalendarDto',
    persistence: 'read_only_seed_projection',
    sourceTables: [
      'investment_models',
      'model_versions',
      'compliance_reviews'
    ],
    emptyState:
      items.length === 0
        ? {
            title: 'No model review calendar items yet',
            message:
              'Seed or mock ComplianceReview rows are required before review calendar items appear.'
          }
        : null,
    statusCounts: countByStatus(items),
    mockOnly: true,
    reviewMetadataOnly: true,
    legalJudgment: false,
    rebalanceExecution: false,
    allocationChanged: false,
    tradeIntentCreated: false,
    realOrder: false,
    brokerageConnection: false,
    externalPaidApi: false,
    financialAdvice: false
  };
}

export async function GET(request: NextRequest) {
  const headerRole = readInvestModelRole(request);
  const role =
    headerRole === 'public'
      ? await readInvestModelSessionRole(request)
      : headerRole;

  if (!canReadModelReviewCalendar(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read model review calendar metadata.'
    );
  }

  try {
    const items = await readModelReviewCalendarSeedFixture();

    return Response.json({
      data: {
        upcoming: items.filter((item) => item.status === 'review_due'),
        recent: items.filter((item) => item.status === 'reviewed'),
        paused: items.filter((item) => item.status === 'paused'),
        all: items
      },
      groups: groupItems(items),
      meta: reviewCalendarMeta(items)
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Model review calendar metadata could not be read. No rebalance, legal judgment, order, TradeIntent, or brokerage action was created.'
    );
  }
}
