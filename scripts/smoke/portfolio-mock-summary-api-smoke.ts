/**
 * This smoke test verifies GET /api/portfolio/mock-summary.
 * It reads the mock-safe Portfolio read model and never creates deposits,
 * balances, broker connections, orders, TradeIntent rows, or advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/portfolio/mock-summary/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function readPortfolioSummary(search = '') {
  return GET(
    new NextRequest(`http://localhost/api/portfolio/mock-summary${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
}

async function main() {
  const forbiddenResponse = await GET(
    new NextRequest('http://localhost/api/portfolio/mock-summary', {
      method: 'GET'
    })
  );
  const creatorResponse = await GET(
    new NextRequest('http://localhost/api/portfolio/mock-summary', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'creator'
      }
    })
  );
  const summaryResponse = await readPortfolioSummary();
  const summaryJson = await summaryResponse.json();
  const explicitDemoResponse = await readPortfolioSummary(
    '?userPublicId=user_demo_001'
  );
  const explicitDemoJson = await explicitDemoResponse.json();
  const invalidUserResponse = await readPortfolioSummary(
    '?userPublicId=user_other_001'
  );

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(summaryResponse.status === 200, 'portfolio summary responds');
  assertCondition(
    summaryJson.data?.isMockOnly === true &&
      summaryJson.data?.mockDeposit?.safetyLabel ===
        'Not a real deposit or cash balance' &&
      summaryJson.data?.tradeIntent?.boundaryLabel ===
        'pre-order simulation only',
    'portfolio summary keeps mock-safe DTO boundaries'
  );
  assertCondition(
    summaryJson.meta?.routeStatus === 'db_backed' &&
      summaryJson.meta?.mockOnly === true &&
      summaryJson.meta?.realDeposit === false &&
      summaryJson.meta?.realBalance === false &&
      summaryJson.meta?.realOrder === false &&
      summaryJson.meta?.brokerageConnection === false &&
      summaryJson.meta?.financialAdvice === false,
    'portfolio summary keeps mock-safe API meta'
  );
  assertCondition(
    explicitDemoResponse.status === 200 &&
      explicitDemoJson.meta?.userPublicId === 'user_demo_001',
    'explicit demo userPublicId is accepted'
  );
  assertCondition(
    invalidUserResponse.status === 422,
    'non-demo userPublicId returns validation error'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
