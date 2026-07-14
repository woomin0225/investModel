import { NextRequest } from 'next/server';

import { readInvestModelPortfolioSummary } from '@/lib/db/portfolio-read-model';
import type { AccessRole } from '@/lib/domain/types';

/**
 * This route reads mock-safe Portfolio state for the Portfolio surface.
 * It never creates real deposits, balances, orders, brokerage actions, or advice.
 */

type ApiErrorCode = 'forbidden' | 'validation_error' | 'server_error';

const demoUserPublicId = 'user_demo_001';

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

function canReadPortfolioSummary(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

function parseUserPublicId(value: string | null) {
  if (!value) {
    return demoUserPublicId;
  }

  return value === demoUserPublicId ? value : null;
}

export async function GET(request: NextRequest) {
  const role = readRole(request);

  if (!canReadPortfolioSummary(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe Portfolio summaries.'
    );
  }

  const userPublicId = parseUserPublicId(
    request.nextUrl.searchParams.get('userPublicId')
  );

  if (!userPublicId) {
    return errorResponse(
      422,
      'validation_error',
      'userPublicId is limited to the demo user in this prototype.'
    );
  }

  try {
    const summary = await readInvestModelPortfolioSummary(userPublicId);

    return Response.json({
      data: summary,
      meta: {
        routeStatus: 'db_backed',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: [
          'users',
          'user_model_selections',
          'investment_models',
          'model_versions',
          'mock_deposits',
          'portfolios',
          'portfolio_positions',
          'allocation_decisions',
          'trade_intents'
        ],
        userPublicId,
        mockOnly: true,
        realDeposit: false,
        realBalance: false,
        realOrder: false,
        brokerageConnection: false,
        financialAdvice: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Portfolio summary could not be read. No deposits, balances, orders, brokerage actions, or advice were created.'
    );
  }
}
