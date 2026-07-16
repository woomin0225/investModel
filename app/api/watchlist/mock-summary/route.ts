import { NextRequest } from 'next/server';

import { readInvestModelWatchlistSeedFixture } from '@/lib/db/watchlist-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads mock-safe watchlist seed data for Home and Signals surfaces.
 * It never creates recommendations, TradeIntent rows, orders, deposits, or broker links.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return Response.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

function canReadWatchlist(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function parseWatchlistLimit(value: string | null) {
  if (!value) {
    return 3;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 6) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadWatchlist(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe watchlist seed data.'
    );
  }

  const limit = parseWatchlistLimit(request.nextUrl.searchParams.get('limit'));

  if (!limit) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer from 1 to 6.'
    );
  }

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const watchlist = await readInvestModelWatchlistSeedFixture(limit);

    return Response.json({
      data: watchlist,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: [
          'model_signal_events',
          'signal_score_snapshots',
          'model_versions',
          'investment_models'
        ],
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        limit,
        generatedFrom: watchlist.generatedFrom,
        readOnly: true,
        observedInputsOnly: true,
        mockOnly: true,
        simulated: true,
        liveMarketData: false,
        realtimeExternalData: false,
        externalPaidApi: false,
        financialAdvice: false,
        tradeIntentCreated: false,
        realDeposit: false,
        realOrder: false,
        brokerageConnection: false,
        accountLinking: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Watchlist seed data could not be read. No advice, TradeIntent, orders, deposits, or brokerage actions were created.'
    );
  }
}
