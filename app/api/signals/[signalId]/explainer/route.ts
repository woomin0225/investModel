import { NextRequest } from 'next/server';

import { readSignalExplainerSeedFixture } from '@/lib/db/signal-explainer-read-model';
import { canReadSignals } from '@/lib/domain/signals/signal-event';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route explains seeded SignalEvent score inputs for read-only UI cards.
 * It never creates advice, TradeIntent rows, orders, brokerage actions, or allocation state.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

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
      'Only signed-in user or admin roles can read observed SignalEvent explainer rows.'
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
    const explainer = await readSignalExplainerSeedFixture(signalPublicId);

    return Response.json({
      data: explainer,
      meta: {
        routeStatus: 'fixture_or_db_seed_projection',
        persistence: 'read_only_seed_projection',
        sourceTables: [
          'model_signal_events',
          'signal_score_snapshots',
          'signal_score_inputs',
          'model_versions',
          'investment_models',
          'market_instruments'
        ],
        observedInputsOnly: true,
        realtimeExternalData: false,
        externalPaidApi: false,
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
      'SignalEvent explainer could not be read. No advice, TradeIntent, orders, or brokerage actions were created.'
    );
  }
}
