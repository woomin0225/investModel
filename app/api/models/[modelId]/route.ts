import { NextRequest } from 'next/server';

import { readModelDetailDto } from '@/lib/db/model-read-model';
import { canReadModels } from '@/lib/domain/models/model-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads one public marketplace model by public id or slug.
 * It never creates advice, TradeIntent rows, orders, brokerage actions, or allocation state.
 */

type ApiErrorCode =
  | 'forbidden'
  | 'validation_error'
  | 'not_found'
  | 'server_error';

type RouteContext = {
  params: Promise<{
    modelId: string;
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

export async function GET(request: NextRequest, context: RouteContext) {
  const role = readRole(request);

  if (!canReadModels(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only public, signed-in user, or admin roles can read marketplace model details.'
    );
  }

  const { modelId } = await context.params;
  const modelIdOrSlug = modelId.trim();

  if (!modelIdOrSlug) {
    return errorResponse(
      422,
      'validation_error',
      'Model public id or slug is required.'
    );
  }

  try {
    const model = await readModelDetailDto(modelIdOrSlug);

    if (!model) {
      return errorResponse(
        404,
        'not_found',
        'Model public id or slug was not found or is not visible.'
      );
    }

    return Response.json({
      data: model,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        sourceTables: [
          'investment_models',
          'model_creators',
          'model_versions',
          'model_risk_profiles',
          'portfolio_mandates',
          'model_disclosures',
          'model_performance_snapshots'
        ],
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
      'Marketplace model detail could not be read. No advice, TradeIntent, orders, or brokerage actions were created.'
    );
  }
}
