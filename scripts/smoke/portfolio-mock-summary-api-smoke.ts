/**
 * This smoke test verifies GET /api/portfolio/mock-summary.
 * It reads the mock-safe Portfolio read model and never creates deposits,
 * balances, broker connections, orders, TradeIntent rows, or advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/portfolio/mock-summary/route';
import { client } from '../../lib/db/drizzle';
import type { AccessRole } from '../../lib/domain/types';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ignoredClientUserPublicId = 'user_other_001';

function containsIgnoredClientUserPublicId(value: unknown) {
  return JSON.stringify(value).includes(ignoredClientUserPublicId);
}

async function readPortfolioSummary(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/portfolio/mock-summary${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
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
  const systemResponse = await readPortfolioSummary('', 'system');
  const summaryResponse = await readPortfolioSummary();
  const summaryJson = await summaryResponse.json();
  const adminSummaryResponse = await readPortfolioSummary('', 'admin');
  const adminSummaryJson = await adminSummaryResponse.json();
  const clientScopedResponse = await readPortfolioSummary(
    `?userPublicId=${ignoredClientUserPublicId}`
  );
  const clientScopedJson = await clientScopedResponse.json();

  assertCondition(
    forbiddenResponse.status === 403,
    'public role is forbidden'
  );
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(systemResponse.status === 403, 'system role is forbidden');
  assertCondition(summaryResponse.status === 200, 'portfolio summary responds');
  assertCondition(
    adminSummaryResponse.status === 200 &&
      adminSummaryJson.meta?.userPublicId === 'user_demo_001' &&
      adminSummaryJson.meta?.userScopeSource === 'demo_fallback' &&
      adminSummaryJson.meta?.mockOnly === true,
    'admin role can read the mock-safe prototype portfolio summary without bypassing user scope'
  );
  assertCondition(
    summaryJson.data?.isMockOnly === true &&
      summaryJson.data?.safetyMeta?.mockOnly === true &&
      summaryJson.data?.safetyMeta?.realDeposit === false &&
      summaryJson.data?.safetyMeta?.realBalance === false &&
      summaryJson.data?.safetyMeta?.realOrder === false &&
      summaryJson.data?.safetyMeta?.brokerageConnection === false &&
      summaryJson.data?.safetyMeta?.financialAdvice === false &&
      summaryJson.data?.mockDeposit?.safetyLabel ===
        'Not a real deposit or cash balance' &&
      summaryJson.data?.tradeIntent?.boundaryLabel ===
        'pre-order simulation only',
    'portfolio summary keeps mock-safe DTO boundaries and safety meta'
  );
  assertCondition(
    Array.isArray(summaryJson.data?.timeSnapshots) &&
      summaryJson.data.timeSnapshots.length === 3 &&
      ['1D', '1W', '1M'].every((rangeLabel) =>
        summaryJson.data.timeSnapshots.some(
          (snapshot: { rangeLabel?: string }) =>
            snapshot.rangeLabel === rangeLabel
        )
      ) &&
      summaryJson.data.timeSnapshots.every(
        (snapshot: {
          valueLabel?: string;
          checkpointLabel?: string;
          signalLabel?: string;
          safetyLabel?: string;
        }) =>
          Boolean(snapshot.valueLabel) &&
          Boolean(snapshot.checkpointLabel) &&
          Boolean(snapshot.signalLabel) &&
          Boolean(snapshot.safetyLabel) &&
          !snapshot.safetyLabel?.toLowerCase().includes('guarantee')
      ),
    'portfolio summary exposes complete mock-safe 1D/1W/1M time snapshots'
  );
  assertCondition(
    Array.isArray(summaryJson.data?.positions) &&
      summaryJson.data.positions.length > 0 &&
      summaryJson.data.positions.every(
        (position: {
          quantityLabel?: string;
          valueLabel?: string;
          sourceLabel?: string;
        }) =>
          position.quantityLabel?.toLowerCase().includes('simulated units') &&
          position.valueLabel?.toLowerCase().includes('simulated') &&
          (position.sourceLabel === 'DB mock position' ||
            position.sourceLabel?.toLowerCase().includes('mock'))
      ),
    'portfolio positions expose mock-safe simulated quantity and value labels'
  );
  assertCondition(
    summaryJson.meta?.routeStatus === 'db_backed' &&
      summaryJson.meta?.mockOnly === true &&
      summaryJson.meta?.realDeposit === false &&
      summaryJson.meta?.realBalance === false &&
      summaryJson.meta?.realOrder === false &&
      summaryJson.meta?.brokerageConnection === false &&
      summaryJson.meta?.financialAdvice === false &&
      summaryJson.meta?.fallbackLabel ===
        summaryJson.data?.safetyMeta?.fallbackLabel &&
      summaryJson.meta?.userScopeSource === 'demo_fallback' &&
      summaryJson.meta?.clientUserPublicIdIgnored === undefined,
    'portfolio summary keeps mock-safe API meta'
  );
  assertCondition(
    clientScopedResponse.status === 200 &&
      clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
      clientScopedJson.meta?.userScopeSource === 'demo_fallback' &&
      clientScopedJson.meta?.clientUserPublicIdIgnored === undefined &&
      !containsIgnoredClientUserPublicId(clientScopedJson),
    'client userPublicId does not switch or leak another portfolio scope'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
