import { NextRequest } from 'next/server';

import { readInvestModelPortfolioHoldings } from '@/lib/db/portfolio-holdings-read-model';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads mock-safe PortfolioPosition holdings for mobile UI work.
 * It never creates real holdings, broker accounts, orders, fills, or advice.
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

function canReadPortfolioHoldings(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadPortfolioHoldings(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe Portfolio holdings.'
    );
  }

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const holdings = await readInvestModelPortfolioHoldings(
      userScope.userPublicId
    );

    return Response.json({
      data: holdings,
      meta: {
        routeStatus: 'db_backed',
        contract: 'PortfolioHoldingsDto',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: holdings.sourceTables,
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        generatedFrom: holdings.seedSourceLabel,
        ...portfolioMockSafetyMeta,
        readOnly: true,
        simulated: true,
        accountLinking: false,
        externalPaidApi: false,
        brokerConfirmed: false,
        brokerConfirmedHoldings: false,
        realHolding: false,
        orderExecution: false,
        tradeFill: false,
        settlement: false,
        tradeIntentCreated: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Portfolio holdings could not be read. No real holdings, broker accounts, orders, fills, or advice were created.'
    );
  }
}
