/**
 * This smoke test verifies GET /api/signals/[signalId]/explainer.
 * It reads seeded score inputs only and never mutates orders, funds,
 * broker connections, TradeIntent rows, or portfolio allocations.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/signals/[signalId]/explainer/route';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function explainerRequest(signalId: string, role = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/signals/${signalId}/explainer`, {
      method: 'GET',
      headers: {
        'x-invest-model-role': role
      }
    }),
    {
      params: Promise.resolve({ signalId })
    }
  );
}

async function main() {
  const originalMysqlUrl = process.env.MYSQL_URL;
  process.env.MYSQL_URL = '';

  try {
    const forbiddenResponse = await GET(
      new NextRequest(
        'http://localhost/api/signals/sig_mock_news_traffic_001/explainer',
        { method: 'GET' }
      ),
      {
        params: Promise.resolve({ signalId: 'sig_mock_news_traffic_001' })
      }
    );
    const explainerResponse = await explainerRequest(
      'sig_mock_news_traffic_001'
    );
    const explainerJson = await explainerResponse.json();

    assertCondition(
      forbiddenResponse.status === 403,
      'public role is forbidden'
    );
    assertCondition(explainerResponse.status === 200, 'explainer responds');
    assertCondition(
      explainerJson.data?.signalPublicId === 'sig_mock_news_traffic_001' &&
        explainerJson.data?.generatedFrom === 'deterministic_fixture' &&
        explainerJson.data?.drivers?.some(
          (driver: { sourceType?: string }) =>
            driver.sourceType === 'news_traffic'
        ) &&
        explainerJson.data?.scoreSnapshot?.calculationContext === 'mock_seed',
      'explainer exposes public seed context and score-input drivers only'
    );
    assertCondition(
      explainerJson.data?.id === undefined &&
        explainerJson.data?.orderId === undefined &&
        explainerJson.data?.tradeIntentId === undefined &&
        explainerJson.data?.brokerageAccountId === undefined,
      'explainer does not expose internal ids or order-capable fields'
    );
    assertCondition(
      explainerJson.data?.safetyMeta?.mockOnly === true &&
        explainerJson.data?.safetyMeta?.observedInputsOnly === true &&
        explainerJson.data?.safetyMeta?.liveMarketData === false &&
        explainerJson.data?.safetyMeta?.externalPaidApi === false &&
        explainerJson.data?.safetyMeta?.tradeIntentCreated === false &&
        explainerJson.data?.safetyMeta?.realOrder === false &&
        explainerJson.data?.safetyMeta?.brokerageConnection === false &&
        explainerJson.data?.safetyMeta?.financialAdvice === false,
      'explainer payload keeps mock-only safety meta'
    );
    assertCondition(
      explainerJson.meta?.routeStatus === 'fixture_or_db_seed_projection' &&
        explainerJson.meta?.persistence === 'read_only_seed_projection' &&
        explainerJson.meta?.sourceTables?.includes('signal_score_inputs') &&
        explainerJson.meta?.observedInputsOnly === true &&
        explainerJson.meta?.realtimeExternalData === false &&
        explainerJson.meta?.externalPaidApi === false &&
        explainerJson.meta?.tradeIntentCreated === false &&
        explainerJson.meta?.realOrder === false &&
        explainerJson.meta?.brokerageConnection === false &&
        explainerJson.meta?.financialAdvice === false,
      'explainer API keeps read-only mock-safe meta'
    );
  } finally {
    if (originalMysqlUrl === undefined) {
      delete process.env.MYSQL_URL;
    } else {
      process.env.MYSQL_URL = originalMysqlUrl;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
