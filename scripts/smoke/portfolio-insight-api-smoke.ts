/**
 * Verifies GET /api/portfolio/insight.
 * It reads mock-safe Portfolio insight rows and never creates deposits,
 * balances, broker actions, orders, TradeIntent rows, or advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/portfolio/insight/route';
import { client } from '../../lib/db/drizzle';
import type { AccessRole } from '../../lib/domain/types';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ignoredClientUserPublicId = 'user_other_001';

const forbiddenNeedles = [
  'brokerAccount',
  'broker_account',
  'brokerageAccount',
  'accountNumber',
  'bankAccount',
  'routingNumber',
  'cashAvailable',
  'settledCash',
  'withdrawal',
  'depositNow',
  'brokerOrder',
  'expectedReturn',
  'guaranteedReturn',
  'principalProtection',
  'riskFree',
  'noLoss',
  'realDepositAmount',
  'realOrderId',
  'availableToWithdraw',
  'suitabilityScore',
  'externalApiKey'
];

async function readPortfolioInsight(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/portfolio/insight${search}`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    })
  );
}

function assertNoForbiddenFields(payload: unknown) {
  const serialized = JSON.stringify(payload);

  forbiddenNeedles.forEach((needle) => {
    assertCondition(
      !serialized.includes(needle),
      `portfolio insight API payload avoids ${needle}`
    );
  });
}

function containsIgnoredClientUserPublicId(value: unknown) {
  return JSON.stringify(value).includes(ignoredClientUserPublicId);
}

async function main() {
  const previousMysqlUrl = process.env.MYSQL_URL;
  delete process.env.MYSQL_URL;

  try {
    const publicResponse = await GET(
      new NextRequest('http://localhost/api/portfolio/insight', {
        method: 'GET'
      })
    );
    const creatorResponse = await readPortfolioInsight('', 'creator');
    const systemResponse = await readPortfolioInsight('', 'system');
    const userResponse = await readPortfolioInsight();
    const userJson = await userResponse.json();
    const adminResponse = await readPortfolioInsight('', 'admin');
    const adminJson = await adminResponse.json();
    const clientScopedResponse = await readPortfolioInsight(
      `?userPublicId=${ignoredClientUserPublicId}`
    );
    const clientScopedJson = await clientScopedResponse.json();

    assertCondition(publicResponse.status === 403, 'public role is forbidden');
    assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
    assertCondition(systemResponse.status === 403, 'system role is forbidden');
    assertCondition(userResponse.status === 200, 'portfolio insight responds');
    assertCondition(
      adminResponse.status === 200 &&
        adminJson.meta?.userPublicId === 'user_demo_001' &&
        adminJson.meta?.userScopeSource === 'demo_fallback' &&
        adminJson.meta?.mockOnly === true,
      'admin role can read portfolio insight without bypassing user scope'
    );

    assertCondition(
      userJson.data?.isMockOnly === true &&
        userJson.data?.safetyMeta?.mockOnly === true &&
        userJson.data?.safetyMeta?.realDeposit === false &&
        userJson.data?.safetyMeta?.realBalance === false &&
        userJson.data?.safetyMeta?.realOrder === false &&
        userJson.data?.safetyMeta?.brokerageConnection === false &&
        userJson.data?.safetyMeta?.financialAdvice === false,
      'portfolio insight DTO keeps mock-safe safety meta'
    );
    assertCondition(
      userJson.data?.seedSourceLabel === 'seed_008_portfolio_insight_read_model' &&
        userJson.data?.portfolioPublicId === 'portfolio_demo_001' &&
        userJson.data?.selectedModel?.selectionPublicId ===
          'selection_demo_signal_001' &&
        userJson.data?.selectedModel?.modelPublicId ===
          'model_demo_signal_guard',
      'portfolio insight DTO exposes seed and public id provenance'
    );
    assertCondition(
      Array.isArray(userJson.data?.allocationRationales) &&
        userJson.data.allocationRationales.length === 3 &&
        userJson.data.allocationRationales.every(
          (rationale: { safetyLabel?: string; sourceTables?: string[] }) =>
            rationale.safetyLabel === 'mock rationale only' &&
            Array.isArray(rationale.sourceTables) &&
            rationale.sourceTables.length > 0
        ),
      'portfolio insight DTO returns mock-safe allocation rationale rows'
    );
    assertCondition(
      Array.isArray(userJson.data?.statusTimeline) &&
        userJson.data.statusTimeline.length === 4 &&
        userJson.data.statusTimeline.some(
          (item: { state?: string; nextStatus?: string }) =>
            item.state === 'policy_blocked' &&
            item.nextStatus === 'blocked_policy_check'
        ) &&
        userJson.data.statusTimeline.every(
          (item: {
            safetyLabel?: string;
            previousStatus?: string;
            nextStatus?: string;
            actorRole?: string;
            reasonCode?: string;
            changedAt?: string;
          }) =>
            item.safetyLabel === 'read-only timeline' &&
            Boolean(item.previousStatus) &&
            Boolean(item.nextStatus) &&
            Boolean(item.actorRole) &&
            Boolean(item.reasonCode) &&
            item.changedAt?.endsWith('Z')
        ),
      'portfolio insight DTO returns read-only status transition rows'
    );

    assertCondition(
      userJson.meta?.routeStatus === 'db_backed' &&
        userJson.meta?.contract === 'PortfolioInsightDto' &&
        userJson.meta?.persistence === 'persisted_or_mock_safe_fallback' &&
        userJson.meta?.readOnly === true &&
        userJson.meta?.mockOnly === true &&
        userJson.meta?.simulated === true &&
        userJson.meta?.realDeposit === false &&
        userJson.meta?.realBalance === false &&
        userJson.meta?.realOrder === false &&
        userJson.meta?.brokerageConnection === false &&
        userJson.meta?.accountLinking === false &&
        userJson.meta?.externalPaidApi === false &&
        userJson.meta?.brokerConfirmed === false &&
        userJson.meta?.brokerConfirmedHoldings === false &&
        userJson.meta?.realHolding === false &&
        userJson.meta?.realAllocation === false &&
        userJson.meta?.orderExecution === false &&
        userJson.meta?.tradeFill === false &&
        userJson.meta?.settlement === false &&
        userJson.meta?.financialAdvice === false &&
        userJson.meta?.tradeIntentCreated === false &&
        userJson.meta?.allocationCommandCreated === false &&
        userJson.meta?.legalJudgment === false,
      'portfolio insight API meta blocks real-finance side effects'
    );
    assertCondition(
      clientScopedResponse.status === 200 &&
        clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
        clientScopedJson.meta?.userScopeSource === 'demo_fallback' &&
        !containsIgnoredClientUserPublicId(clientScopedJson),
      'client userPublicId does not switch or leak another portfolio insight scope'
    );

    assertNoForbiddenFields(userJson);
    assertNoForbiddenFields(adminJson);
    assertNoForbiddenFields(clientScopedJson);
  } finally {
    if (previousMysqlUrl) {
      process.env.MYSQL_URL = previousMysqlUrl;
    }
    await client.end();
  }
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
