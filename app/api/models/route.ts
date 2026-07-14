import { NextRequest } from 'next/server';

import { readModelCardDtos } from '@/lib/db/model-read-model';
import {
  canReadModels,
  parseModelLimit
} from '@/lib/domain/models/model-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads public marketplace model catalog rows.
 * It never creates advice, TradeIntent rows, orders, brokerage actions, or allocation state.
 */

type ApiErrorCode = 'forbidden' | 'server_error';

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

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadModels(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only public, signed-in user, or admin roles can read marketplace models.'
    );
  }

  const limit = parseModelLimit(request.nextUrl.searchParams.get('limit'));

  try {
    const models = await readModelCardDtos(limit);

    return Response.json({
      data: models,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        sourceTables: [
          'investment_models',
          'model_creators',
          'model_versions',
          'model_risk_profiles',
          'model_performance_snapshots'
        ],
        limit,
        marketplaceVisibleOnly: true,
        backtestMetricsOnly: true,
        financialAdvice: false,
        modelSelectionCreated: false,
        tradeIntentCreated: false,
        realOrder: false,
        brokerageConnection: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Marketplace models could not be read. No advice, TradeIntent, orders, or brokerage actions were created.'
    );
  }
}
