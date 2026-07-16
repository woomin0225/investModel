import { NextRequest } from 'next/server';

import { readModelReviewCalendarSeedFixture } from '@/lib/db/model-review-calendar-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  readInvestModelSessionRole
} from '@/lib/server/invest-model-user-scope';

/**
 * This route exposes one model review calendar item by public id.
 * It is read-only metadata and never executes rebalances, orders, legal
 * judgments, TradeIntent creation, or brokerage connections.
 */

type ApiErrorCode = 'forbidden' | 'not_found' | 'validation_error' | 'server_error';

type RouteContext = {
  params: Promise<{
    reviewPublicId: string;
  }>;
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

function reviewCalendarDetailMeta() {
  return {
    routeStatus: 'fixture_or_db_seed_projection',
    contract: 'ModelReviewCalendarDto',
    persistence: 'read_only_seed_projection',
    sourceTables: [
      'investment_models',
      'model_versions',
      'compliance_reviews'
    ],
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

export async function GET(request: NextRequest, context: RouteContext) {
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

  const { reviewPublicId } = await context.params;
  const normalizedReviewPublicId = reviewPublicId.trim();

  if (!normalizedReviewPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'Model review calendar public id is required.'
    );
  }

  try {
    const items = await readModelReviewCalendarSeedFixture();
    const item = items.find(
      (candidate) => candidate.reviewPublicId === normalizedReviewPublicId
    );

    if (!item) {
      return errorResponse(
        404,
        'not_found',
        'Model review calendar item was not found in the seed projection. No live review system, rebalance, order, or brokerage action was queried.'
      );
    }

    return Response.json({
      data: item,
      meta: reviewCalendarDetailMeta()
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Model review calendar item could not be read. No rebalance, legal judgment, order, TradeIntent, or brokerage action was created.'
    );
  }
}
