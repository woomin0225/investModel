import { NextRequest } from 'next/server';

import { readSignalEventDtoByPublicId } from '@/lib/db/signal-read-model';
import { canReadSignals } from '@/lib/domain/signals/signal-event';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads one observed SignalEvent by public id.
 * It never creates advice, TradeIntent rows, orders, brokerage actions, or allocation state.
 */

type ApiErrorCode =
  | 'forbidden'
  | 'validation_error'
  | 'not_found'
  | 'server_error';

type RouteContext = {
  params: Promise<{
    signalId: string;
  }>;
};

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

  if (!canReadSignals(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read observed SignalEvent detail rows.'
    );
  }

  const { signalId } = await context.params;
  const signalPublicId = signalId.trim();

  if (!signalPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'SignalEvent public id is required.'
    );
  }

  try {
    const signal = await readSignalEventDtoByPublicId(signalPublicId);

    if (!signal) {
      return errorResponse(
        404,
        'not_found',
        'SignalEvent public id was not found or is not visible.'
      );
    }

    return Response.json({
      data: signal,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        sourceTables: [
          'model_signal_events',
          'model_versions',
          'investment_models',
          'market_instruments'
        ],
        observedInputsOnly: true,
        realtimeExternalData: false,
        financialAdvice: false,
        tradeIntentCreated: false,
        realOrder: false,
        brokerageConnection: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'SignalEvent detail could not be read. No advice, TradeIntent, orders, or brokerage actions were created.'
    );
  }
}
