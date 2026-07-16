import { NextRequest } from 'next/server';

import { readInvestModelPortfolioAllocationSplit } from '@/lib/db/portfolio-allocation-split-read-model';
import { portfolioMockSafetyMeta } from '@/lib/domain/portfolio/portfolio-summary';
import type { AccessRole } from '@/lib/domain/types';
import {
  readInvestModelRole,
  resolveInvestModelUserScope
} from '@/lib/server/invest-model-user-scope';

/**
 * This route reads mock-safe Portfolio allocation split buckets for mobile UI.
 * It never accepts user risk settings, creates allocations, connects accounts,
 * submits orders, moves cash, or provides financial advice.
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

function canReadPortfolioAllocationSplit(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export async function GET(request: NextRequest) {
  const role = readInvestModelRole(request);

  if (!canReadPortfolioAllocationSplit(role)) {
    return errorResponse(
      403,
      'forbidden',
      'Only signed-in user or admin roles can read mock-safe Portfolio allocation split buckets.'
    );
  }

  try {
    const userScope = await resolveInvestModelUserScope(request);
    const allocationSplit = await readInvestModelPortfolioAllocationSplit();

    return Response.json({
      data: allocationSplit,
      meta: {
        routeStatus: 'db_backed',
        contract: 'PortfolioAllocationSplitDto',
        persistence: 'persisted_or_mock_safe_fallback',
        sourceTables: allocationSplit.sourceTables,
        userPublicId: userScope.userPublicId,
        userScopeSource: userScope.source,
        generatedFrom: allocationSplit.seedSourceLabel,
        ...portfolioMockSafetyMeta,
        readOnly: true,
        simulated: true,
        totalValidation: {
          expectedTotalLabel: allocationSplit.summaryAlignment.bucketTotalLabel,
          sectorBucketsSumToExpected: true,
          assetClassBucketsSumToExpected: true,
          weightsSumToHundred: true
        },
        accountLinking: false,
        externalPaidApi: false,
        brokerConfirmed: false,
        brokerConfirmedHoldings: false,
        realHolding: false,
        userRiskSettingAccepted: false,
        userAllocationOverrideAccepted: false,
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
      'Portfolio allocation split could not be read. No user risk setting, real account, broker action, order, fill, or advice was created.'
    );
  }
}
