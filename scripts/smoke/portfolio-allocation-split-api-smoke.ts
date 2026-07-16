/**
 * Verifies GET /api/portfolio/allocation-split.
 * It reads deterministic mock allocation buckets and never accepts user risk
 * settings, account links, orders, fills, settlements, TradeIntent rows, or
 * advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/portfolio/allocation-split/route';
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
  'riskTolerance',
  'riskSetting',
  'userPreference',
  'stockBondRatio',
  'bondRatio',
  'equityRatio',
  'leveragePreference',
  'directAllocation',
  'mandateOverride',
  'riskFree',
  'noLoss',
  'realDepositAmount',
  'realOrderId',
  'liveBalance',
  'confirmedHolding',
  'liveQuoteProvider',
  'externalApiKey'
];

async function readAllocationSplit(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(
      `http://localhost/api/portfolio/allocation-split${search}`,
      {
        method: 'GET',
        headers: {
          'x-invest-model-role': role
        }
      }
    )
  );
}

function numberFromMoneyLabel(label: string) {
  const parsed = Number.parseFloat(label.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberFromWeightLabel(label: string) {
  const parsed = Number.parseFloat(label.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function assertNoForbiddenFields(payload: unknown) {
  const serialized = JSON.stringify(payload);

  forbiddenNeedles.forEach((needle) => {
    assertCondition(
      !serialized.includes(needle),
      `allocation split API payload avoids ${needle}`
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
      new NextRequest('http://localhost/api/portfolio/allocation-split', {
        method: 'GET'
      })
    );
    const creatorResponse = await readAllocationSplit('', 'creator');
    const systemResponse = await readAllocationSplit('', 'system');
    const userResponse = await readAllocationSplit();
    const userJson = await userResponse.json();
    const adminResponse = await readAllocationSplit('', 'admin');
    const adminJson = await adminResponse.json();
    const clientScopedResponse = await readAllocationSplit(
      `?userPublicId=${ignoredClientUserPublicId}`
    );
    const clientScopedJson = await clientScopedResponse.json();

    assertCondition(publicResponse.status === 403, 'public role is forbidden');
    assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
    assertCondition(systemResponse.status === 403, 'system role is forbidden');
    assertCondition(
      userResponse.status === 200,
      'allocation split route responds'
    );
    assertCondition(
      adminResponse.status === 200 &&
        adminJson.meta?.userPublicId === 'user_demo_001' &&
        adminJson.meta?.userScopeSource === 'demo_fallback' &&
        adminJson.meta?.mockOnly === true,
      'admin role can read allocation split without bypassing user scope'
    );

    assertCondition(
      userJson.data?.isMockOnly === true &&
        userJson.data?.safetyMeta?.mockOnly === true &&
        userJson.data?.safetyMeta?.realDeposit === false &&
        userJson.data?.safetyMeta?.realBalance === false &&
        userJson.data?.safetyMeta?.realOrder === false &&
        userJson.data?.safetyMeta?.brokerageConnection === false &&
        userJson.data?.safetyMeta?.financialAdvice === false,
      'allocation split DTO keeps mock-safe safety meta'
    );
    assertCondition(
      userJson.data?.summaryAlignment?.sourceSummaryValueLabel ===
        '$78,000 simulated' &&
        userJson.data?.summaryAlignment?.holdingsTotalLabel ===
          '$78,000 simulated' &&
        userJson.data?.summaryAlignment?.bucketTotalLabel ===
          '$78,000 simulated' &&
        userJson.data?.summaryAlignment?.allocationBasisLabel ===
          'PortfolioSummary simulated total',
      'allocation split DTO remains anchored to the BK-508 78000 seed total'
    );

    const sectorBuckets = userJson.data?.sectorBuckets ?? [];
    const assetClassBuckets = userJson.data?.assetClassBuckets ?? [];
    assertCondition(
      Array.isArray(sectorBuckets) &&
        sectorBuckets.length === 3 &&
        Array.isArray(assetClassBuckets) &&
        assetClassBuckets.length === 3,
      'allocation split DTO returns sector and asset-class bucket arrays'
    );

    const sectorTotal = sectorBuckets.reduce(
      (total: number, bucket: { valueLabel: string }) =>
        total + numberFromMoneyLabel(bucket.valueLabel),
      0
    );
    const assetClassTotal = assetClassBuckets.reduce(
      (total: number, bucket: { valueLabel: string }) =>
        total + numberFromMoneyLabel(bucket.valueLabel),
      0
    );
    const sectorWeight = sectorBuckets.reduce(
      (total: number, bucket: { weightLabel: string }) =>
        total + numberFromWeightLabel(bucket.weightLabel),
      0
    );
    const assetClassWeight = assetClassBuckets.reduce(
      (total: number, bucket: { weightLabel: string }) =>
        total + numberFromWeightLabel(bucket.weightLabel),
      0
    );

    assertCondition(sectorTotal === 78000, 'sector buckets sum to 78000');
    assertCondition(
      assetClassTotal === 78000,
      'asset-class buckets sum to 78000'
    );
    assertCondition(sectorWeight === 100, 'sector bucket weights sum to 100');
    assertCondition(
      assetClassWeight === 100,
      'asset-class bucket weights sum to 100'
    );
    assertCondition(
      sectorBuckets.every(
        (bucket: { sourceSymbols?: string[]; safetyLabel?: string }) =>
          Array.isArray(bucket.sourceSymbols) &&
          bucket.sourceSymbols.length > 0 &&
          bucket.safetyLabel === 'simulated allocation bucket'
      ) &&
        assetClassBuckets.every(
          (bucket: { sourceSymbols?: string[]; safetyLabel?: string }) =>
            Array.isArray(bucket.sourceSymbols) &&
            bucket.sourceSymbols.length > 0 &&
            bucket.safetyLabel === 'simulated allocation bucket'
        ),
      'all buckets keep source symbols and simulated safety labels'
    );

    assertCondition(
      userJson.meta?.routeStatus === 'db_backed' &&
        userJson.meta?.contract === 'PortfolioAllocationSplitDto' &&
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
        userJson.meta?.userRiskSettingAccepted === false &&
        userJson.meta?.userAllocationOverrideAccepted === false &&
        userJson.meta?.orderExecution === false &&
        userJson.meta?.tradeFill === false &&
        userJson.meta?.settlement === false &&
        userJson.meta?.financialAdvice === false &&
        userJson.meta?.tradeIntentCreated === false &&
        userJson.meta?.totalValidation?.sectorBucketsSumToExpected === true &&
        userJson.meta?.totalValidation?.assetClassBucketsSumToExpected === true &&
        userJson.meta?.totalValidation?.weightsSumToHundred === true,
      'allocation split API meta blocks user-risk, broker, order, and account side effects'
    );
    assertCondition(
      clientScopedResponse.status === 200 &&
        clientScopedJson.meta?.userPublicId === 'user_demo_001' &&
        clientScopedJson.meta?.userScopeSource === 'demo_fallback' &&
        !containsIgnoredClientUserPublicId(clientScopedJson),
      'client userPublicId does not switch or leak another allocation scope'
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
