import { NextRequest } from 'next/server';

import { readInvestModelPortfolioInsight } from '@/lib/db/portfolio-insight-read-model';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads mock-safe Portfolio insight rationale and status timeline rows.
 * It never creates deposits, balances, orders, broker actions, or advice.
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

function canReadPortfolioInsight(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadPortfolioInsight(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe Portfolio insights.'
    );
  }

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const insight = await readInvestModelPortfolioInsight();

    return Response.json({
      data: insight,
      meta: {
        routeStatus: 'db_backed',
        contract: 'PortfolioInsightDto',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: insight.sourceTables,
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        generatedFrom: insight.seedSourceLabel,
        ...portfolioMockSafetyMeta,
        readOnly: true,
        simulated: true,
        accountLinking: false,
        externalPaidApi: false,
        brokerConfirmed: false,
        brokerConfirmedHoldings: false,
        realHolding: false,
        realAllocation: false,
        orderExecution: false,
        tradeFill: false,
        settlement: false,
        tradeIntentCreated: false,
        allocationCommandCreated: false,
        legalJudgment: false
      }
    });
  } catch {
    return errorResponse(
      500,
      'server_error',
      'Portfolio insights could not be read. No deposit, balance, order, broker action, or advice was created.'
    );
  }
}
