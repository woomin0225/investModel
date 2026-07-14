import { NextRequest } from 'next/server';
import { readSignalEventDtos } from '@/lib/db/signal-read-model';
import {
  canReadSignals,
  parseSignalEventType,
  parseSignalLimit
} from '@/lib/domain/signals/signal-event';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads observed SignalEvent rows for Signals surfaces.
 * It never creates advice, TradeIntent rows, orders, brokerage actions, or allocation state.
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

  if (!canReadSignals(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read observed SignalEvent rows.'
    );
  }

  const signalTypeParam = request.nextUrl.searchParams.get('signalType');
  const signalType = parseSignalEventType(signalTypeParam);

  if (signalTypeParam && !signalType) {
    return errorResponse(
      422,
      'validation_error',
      'signalType must be one of news_traffic, price_trend, macro, risk, or risk_alert.'
    );
  }

  const limit = parseSignalLimit(request.nextUrl.searchParams.get('limit'));

  try {
    const signals = await readSignalEventDtos({ signalType, limit });

    return Response.json({
      data: signals,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted',
        sourceTables: [
          'model_signal_events',
          'model_versions',
          'investment_models',
          'market_instruments'
        ],
        limit,
        signalType: signalType ?? 'all',
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
      'SignalEvent rows could not be read. No advice, TradeIntent, orders, or brokerage actions were created.'
    );
  }
}
