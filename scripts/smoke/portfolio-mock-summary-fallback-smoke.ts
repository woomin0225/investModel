/**
 * Verifies /api/portfolio/mock-summary returns a mock-safe fallback when
 * MYSQL_URL is absent. This never opens a DB connection or creates deposits,
 * balances, orders, brokerage links, or advice.
 */

import { NextRequest } from 'next/server';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const previousMysqlUrl = process.env.MYSQL_URL;
  delete process.env.MYSQL_URL;

  try {
    const { GET } = await import('../../app/api/portfolio/mock-summary/route');
    const response = await GET(
      new NextRequest('http://localhost/api/portfolio/mock-summary', {
        method: 'GET',
        headers: {
          'x-invest-model-role': 'user'
        }
      })
    );
    const json = await response.json();

    assertCondition(response.status === 200, 'fallback portfolio responds');
    assertCondition(
      json.data?.isMockOnly === true &&
        json.data?.safetyMeta?.mockOnly === true &&
        json.data?.safetyMeta?.realDeposit === false &&
        json.data?.safetyMeta?.realBalance === false &&
        json.data?.safetyMeta?.realOrder === false &&
        json.data?.safetyMeta?.brokerageConnection === false &&
        json.data?.safetyMeta?.financialAdvice === false &&
        json.data?.mockDeposit?.safetyLabel ===
          'Not a real deposit or cash balance' &&
        json.data?.tradeIntent?.boundaryLabel === 'pre-order simulation only',
      'fallback portfolio keeps mock-safe DTO safety meta'
    );
    assertCondition(
      json.meta?.mockOnly === true &&
        json.meta?.realDeposit === false &&
        json.meta?.realBalance === false &&
        json.meta?.realOrder === false &&
        json.meta?.brokerageConnection === false &&
        json.meta?.financialAdvice === false &&
        json.meta?.fallbackLabel === json.data?.safetyMeta?.fallbackLabel,
      'fallback portfolio keeps mock-safe API meta'
    );
  } finally {
    if (previousMysqlUrl) {
      process.env.MYSQL_URL = previousMysqlUrl;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
