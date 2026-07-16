/**
 * Verifies GET /api/portfolio/holdings.
 * It reads mock-safe PortfolioPosition holdings and never creates real
 * holdings, broker accounts, orders, fills, settlements, TradeIntent rows, or
 * advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/portfolio/holdings/route';
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
  'brokerAction',
  'expectedReturn',
  'guaranteedReturn',
  'principalProtection',
  'riskFree',
  'noLoss',
  'realDepositAmount',
  'realOrderId',
  'liveBalance',
  'confirmedHolding',
  'liveQuoteProvider',
  'externalApiKey'
];

async function readHoldings(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/portfolio/holdings${search}`, {
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
      `portfolio holdings API payload avoids ${needle}`
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
      new NextRequest('http://localhost/api/portfolio/holdings', {
        method: 'GET'
      })
    );
    const creatorResponse = await readHoldings('', 'creator');
    const systemResponse = await readHoldings('', 'system');
    const userResponse = await readHoldings();
    const userJson = await userResponse.json();
    const adminResponse = await readHoldings('', 'admin');
    const adminJson = await adminResponse.json();
    const clientScopedResponse = await readHoldings(
      `?userPublicId=${ignoredClientUserPublicId}`
    );
    const clientScopedJson = await clientScopedResponse.json();

    assertCondition(publicResponse.status === 403, 'public role is forbidden');
    assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
    assertCondition(systemResponse.status === 403, 'system role is forbidden');
    assertCondition(userResponse.status === 200, 'holdings route responds');
    assertCondition(
      adminResponse.status === 200 &&
        adminJson.meta?.userPublicId === 'user_demo_001' &&
        adminJson.meta?.userScopeSource === 'demo_fallback' &&
        adminJson.meta?.mockOnly === true,
      'admin role can read holdings without bypassing user scope'
    );
    assertCondition(
      userJson.data?.isMockOnly === true &&
        userJson.data?.safetyMeta?.mockOnly === true &&
        userJson.data?.safetyMeta?.realDeposit === false &&
        userJson.data?.safetyMeta?.realBalance === false &&
        userJson.data?.safetyMeta?.realOrder === false &&
        userJson.data?.safetyMeta?.brokerageConnection === false &&
        userJson.data?.safetyMeta?.financialAdvice === false,
      'holdings DTO keeps mock-safe safety meta'
    );
    assertCondition(
      userJson.data?.summaryAlignment?.sourceSummaryValueLabel
        ?.toLowerCase()
        .includes('simulated') &&
        userJson.data?.summaryAlignment?.mockCashBufferLabel
          ?.toLowerCase()
          .includes('mock') &&
        userJson.data?.summaryAlignment?.allocationBasisLabel ===
          'PortfolioSummary simulated total',
      'holdings DTO remains aligned to PortfolioSummary context'
    );
    assertCondition(
      Array.isArray(userJson.data?.holdings) &&
        userJson.data.holdings.length >= 3 &&
        userJson.data.holdings.every(
          (holding: {
            symbol?: string;
            valueLabel?: string;
            weightLabel?: string;
            stateLabel?: string;
            safetyLabel?: string;
          }) =>
            typeof holding.symbol === 'string' &&
            holding.valueLabel?.toLowerCase().includes('simulated') &&
            typeof holding.weightLabel === 'string' &&
            holding.weightLabel.length > 0 &&
            holding.stateLabel === 'simulated position' &&
            holding.safetyLabel === 'not broker-confirmed'
        ),
      'holdings DTO returns symbol/value/allocation fields as simulated positions'
    );
    assertCondition(
      userJson.meta?.routeStatus === 'db_backed' &&
        userJson.meta?.contract === 'PortfolioHoldingsDto' &&
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
        userJson.meta?.orderExecution === false &&
        userJson.meta?.tradeFill === false &&
        userJson.meta?.settlement === false &&
        userJson.meta?.financialAdvice === false &&
        userJson.meta?.tradeIntentCreated === false,
      'holdings API meta blocks broker/order/account side effects'
    );
    assertCondition(
      clientScopedResponse.status === 200 &&
        clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
        clientScopedJson.meta?.userScopeSource === 'demo_fallback' &&
        !containsIgnoredClientUserPublicId(clientScopedJson),
      'client userPublicId does not switch or leak another holdings scope'
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
