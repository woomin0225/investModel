import { NextRequest } from 'next/server';

import { readInvestModelPortfolioCompactSummary } from '@/lib/db/portfolio-compact-read-model';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads the mock-safe Portfolio compact card contract.
 * It never creates real deposits, balances, orders, brokerage actions, or advice.
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

function canReadPortfolioCompactSummary(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadPortfolioCompactSummary(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe Portfolio compact summaries.'
    );
  }

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const summary = await readInvestModelPortfolioCompactSummary(
      userScope.userPublicId
    );

    return Response.json({
      data: summary,
      meta: {
        routeStatus: 'db_backed',
        contract: 'PortfolioCompactSummaryDto',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: summary.sourceTables,
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        generatedFrom: summary.seedSourceLabel,
        ...portfolioMockSafetyMeta,
        readOnly: true,
        simulated: true,
        accountLinking: false,
        externalPaidApi: false,
        tradeIntentCreated: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Portfolio compact summary could not be read. No deposits, balances, orders, brokerage actions, or advice were created.'
    );
  }
}
