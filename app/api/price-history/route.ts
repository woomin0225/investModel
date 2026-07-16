import { NextRequest } from 'next/server';

import {
  investModelPriceHistorySeedFixture,
  readInvestModelPriceHistorySeedFixture
} from '@/lib/db/price-history-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads bounded seed price history for mini charts.
 * It never creates live quotes, advice, TradeIntent rows, orders, or brokerage actions.
 */

type ApiErrorCode =
  | 'forbidden'
  | 'validation_error'
  | 'unsupported_symbol'
  | 'server_error';

const supportedSymbol = investModelPriceHistorySeedFixture.instrumentSymbol;

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

function canReadSeededPriceHistory(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function normalizeSymbol(value: string | null) {
  return (value ?? supportedSymbol).trim().toUpperCase();
}

function parseLimit(value: string | null) {
  if (!value) {
    return investModelPriceHistorySeedFixture.points.length;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > 48) {
    return null;
  }

  return limit;
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadSeededPriceHistory(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read seeded price history.'
    );
  }

  const symbol = normalizeSymbol(request.nextUrl.searchParams.get('symbol'));

  if (symbol !== supportedSymbol) {
    return errorResponse(
      404,
      'unsupported_symbol',
      'Only SAMPLE_AI_BASKET seeded price history is available in the mock-safe fixture.'
    );
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  if (limit === null) {
    return errorResponse(
      422,
      'validation_error',
      'limit must be an integer between 1 and 48.'
    );
  }

  try {
    const priceHistory = await readInvestModelPriceHistorySeedFixture(limit);

    return Response.json({
      data: priceHistory,
      meta: {
        routeStatus: 'fixture_backed',
        contract: 'PriceHistoryMiniChartDto',
        persistence: 'bounded_seed_fixture',
        sourceTables: priceHistory.sourceTables,
        symbol,
        limit,
        generatedFrom: priceHistory.generatedFrom,
        readOnly: true,
        mockOnly: true,
        simulated: true,
        sampleBacktestWindow: true,
        liveMarketData: false,
        realTimeQuotes: false,
        externalPaidApi: false,
        brokerageConnection: false,
        tradeInstruction: false,
        tradeIntentCreated: false,
        realOrder: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Seeded price history could not be read. No live quotes, advice, orders, or brokerage actions were created.'
    );
  }
}
