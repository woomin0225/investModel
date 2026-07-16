/**
 * Verifies GET /api/portfolio/compact-summary.
 * It reads the mock-safe compact Portfolio contract and never creates
 * deposits, balances, broker connections, orders, TradeIntent rows, or advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/portfolio/compact-summary/route';
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
  'orderExecution',
  'tradeFill',
  'brokerOrder',
  'brokerAction',
  'expectedReturn',
  'guaranteedReturn',
  'principalProtection',
  'riskFree',
  'noLoss',
  'realDepositAmount',
  'realOrderId'
];

async function readCompactSummary(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/portfolio/compact-summary${search}`, {
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
      `compact portfolio API payload avoids ${needle}`
    );
  });
}

function containsIgnoredClientUserPublicId(value: unknown) {
  return JSON.stringify(value).includes(ignoredClientUserPublicId);
}

async function main() {
  const publicResponse = await GET(
    new NextRequest('http://localhost/api/portfolio/compact-summary', {
      method: 'GET'
    })
  );
  const creatorResponse = await readCompactSummary('', 'creator');
  const systemResponse = await readCompactSummary('', 'system');
  const userResponse = await readCompactSummary();
  const userJson = await userResponse.json();
  const adminResponse = await readCompactSummary('', 'admin');
  const adminJson = await adminResponse.json();
  const clientScopedResponse = await readCompactSummary(
    `?userPublicId=${ignoredClientUserPublicId}`
  );
  const clientScopedJson = await clientScopedResponse.json();

  assertCondition(publicResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(systemResponse.status === 403, 'system role is forbidden');
  assertCondition(userResponse.status === 200, 'compact portfolio responds');
  assertCondition(
    adminResponse.status === 200 &&
      adminJson.meta?.userPublicId === 'user_demo_001' &&
      adminJson.meta?.userScopeSource === 'demo_fallback' &&
      adminJson.meta?.mockOnly === true,
    'admin role can read compact portfolio without bypassing user scope'
  );
  assertCondition(
    userJson.data?.isMockOnly === true &&
      userJson.data?.safetyMeta?.mockOnly === true &&
      userJson.data?.safetyMeta?.realDeposit === false &&
      userJson.data?.safetyMeta?.realBalance === false &&
      userJson.data?.safetyMeta?.realOrder === false &&
      userJson.data?.safetyMeta?.brokerageConnection === false &&
      userJson.data?.safetyMeta?.financialAdvice === false,
    'compact portfolio DTO keeps mock-safe safety meta'
  );
  assertCondition(
    typeof userJson.data?.selectedModel?.selectionPublicId === 'string' &&
      userJson.data.selectedModel.selectionPublicId.length > 0 &&
      typeof userJson.data?.selectedModel?.modelPublicId === 'string' &&
      userJson.data.selectedModel.modelPublicId.length > 0 &&
      typeof userJson.data?.selectedModel?.modelVersionPublicId === 'string' &&
      userJson.data.selectedModel.modelVersionPublicId.length > 0 &&
      userJson.data?.selectedModel?.mandateLabel
        ?.toLowerCase()
        .includes('portfoliomandate'),
    'compact portfolio keeps UserModelSelection, InvestmentModel, ModelVersion, and PortfolioMandate labels'
  );
  assertCondition(
    userJson.data?.mockDeposit?.displayLabel?.includes('MockDeposit') &&
      userJson.data?.mockDeposit?.safetyLabel ===
        'Not a real deposit or cash balance' &&
      userJson.data?.portfolioSummary?.simulatedValueLabel
        ?.toLowerCase()
        .includes('simulated') &&
      userJson.data?.portfolioSummary?.mockCashBufferLabel
        ?.toLowerCase()
        .includes('mock') &&
      userJson.data?.tradeIntentBoundary?.boundaryLabel ===
        'pre-order simulation only',
    'compact portfolio labels remain mock/simulated and pre-order only'
  );
  assertCondition(
    userJson.meta?.routeStatus === 'db_backed' &&
      userJson.meta?.contract === 'PortfolioCompactSummaryDto' &&
      userJson.meta?.readOnly === true &&
      userJson.meta?.mockOnly === true &&
      userJson.meta?.simulated === true &&
      userJson.meta?.realDeposit === false &&
      userJson.meta?.realBalance === false &&
      userJson.meta?.realOrder === false &&
      userJson.meta?.brokerageConnection === false &&
      userJson.meta?.accountLinking === false &&
      userJson.meta?.externalPaidApi === false &&
      userJson.meta?.financialAdvice === false &&
      userJson.meta?.tradeIntentCreated === false,
    'compact portfolio API meta blocks real-finance side effects'
  );
  assertCondition(
    clientScopedResponse.status === 200 &&
      clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
      clientScopedJson.meta?.userScopeSource === 'demo_fallback' &&
      !containsIgnoredClientUserPublicId(clientScopedJson),
    'client userPublicId does not switch or leak another portfolio scope'
  );

  assertNoForbiddenFields(userJson);
  assertNoForbiddenFields(adminJson);
  assertNoForbiddenFields(clientScopedJson);

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
