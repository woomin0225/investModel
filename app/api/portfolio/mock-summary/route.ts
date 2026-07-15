import { NextRequest } from 'next/server';

import { readInvestModelPortfolioSummary } from '@/lib/db/portfolio-read-model';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads mock-safe Portfolio state for the Portfolio surface.
 * It never creates real deposits, balances, orders, brokerage actions, or advice.
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

function canReadPortfolioSummary(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadPortfolioSummary(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe Portfolio summaries.'
    );
  }

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const summary = await readInvestModelPortfolioSummary(userScope.userPublicId);

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
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        clientUserPublicIdIgnored: Boolean(userScope.ignoredClientUserPublicId),
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
