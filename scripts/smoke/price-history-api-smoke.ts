/**
 * Verifies GET /api/price-history.
 * It reads bounded seed price history and never creates live quotes, broker
 * connections, orders, TradeIntent rows, real deposits, or advice.
 */

import { NextRequest } from 'next/server';

import { GET } from '../../app/api/price-history/route';
import type { AccessRole } from '../../lib/domain/types';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

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
  'realOrderId',
  'liveQuoteProvider',
  'externalApiKey'
];

async function readPriceHistory(search = '', role: AccessRole = 'user') {
  return GET(
    new NextRequest(`http://localhost/api/price-history${search}`, {
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
      `price history API payload avoids ${needle}`
    );
  });
}

async function main() {
  const publicResponse = await GET(
    new NextRequest('http://localhost/api/price-history', {
      method: 'GET'
    })
  );
  const creatorResponse = await readPriceHistory('', 'creator');
  const systemResponse = await readPriceHistory('', 'system');
  const successResponse = await readPriceHistory(
    '?symbol=SAMPLE_AI_BASKET&limit=3'
  );
  const successJson = await successResponse.json();
  const lowercaseResponse = await readPriceHistory(
    '?symbol=sample_ai_basket&limit=2',
    'admin'
  );
  const lowercaseJson = await lowercaseResponse.json();
  const unsupportedResponse = await readPriceHistory('?symbol=AAPL');
  const unsupportedJson = await unsupportedResponse.json();
  const invalidLimitResponse = await readPriceHistory(
    '?symbol=SAMPLE_AI_BASKET&limit=0'
  );

  assertCondition(publicResponse.status === 403, 'public role is forbidden');
  assertCondition(creatorResponse.status === 403, 'creator role is forbidden');
  assertCondition(systemResponse.status === 403, 'system role is forbidden');
  assertCondition(successResponse.status === 200, 'price history responds');
  assertCondition(
    Array.isArray(successJson.data?.points) &&
      successJson.data.points.length === 3,
    'price history respects bounded limit'
  );
  assertCondition(
    successJson.data?.instrumentSymbol === 'SAMPLE_AI_BASKET' &&
      successJson.data?.displaySurface === 'mini_chart' &&
      successJson.data?.generatedFrom === 'deterministic_fixture' &&
      successJson.data?.sourceTables?.includes('market_price_snapshots'),
    'price history exposes mini chart fixture contract'
  );
  assertCondition(
    successJson.data?.points.every(
      (point: {
        seedProvider?: string;
        dataWindowLabel?: string;
        seedSourceLabel?: string;
        samplePrice?: number;
      }) =>
        point.seedProvider === 'mock_seed_sample_backtest_window' &&
        point.dataWindowLabel === 'sample_backtest_window' &&
        point.seedSourceLabel === 'mock_seed' &&
        typeof point.samplePrice === 'number'
    ),
    'price history points keep mock seed sample backtest context'
  );
  assertCondition(
    successJson.meta?.routeStatus === 'fixture_backed' &&
      successJson.meta?.contract === 'PriceHistoryMiniChartDto' &&
      successJson.meta?.readOnly === true &&
      successJson.meta?.mockOnly === true &&
      successJson.meta?.sampleBacktestWindow === true &&
      successJson.meta?.liveMarketData === false &&
      successJson.meta?.realTimeQuotes === false &&
      successJson.meta?.externalPaidApi === false &&
      successJson.meta?.brokerageConnection === false &&
      successJson.meta?.tradeInstruction === false &&
      successJson.meta?.tradeIntentCreated === false &&
      successJson.meta?.realOrder === false &&
      successJson.meta?.financialAdvice === false,
    'price history API meta blocks realtime and real-finance side effects'
  );
  assertCondition(
    lowercaseResponse.status === 200 &&
      lowercaseJson.meta?.symbol === 'SAMPLE_AI_BASKET' &&
      lowercaseJson.data?.points?.length === 2,
    'symbol guard normalizes supported lowercase symbol'
  );
  assertCondition(
    unsupportedResponse.status === 404 &&
      unsupportedJson.error?.code === 'unsupported_symbol',
    'unsupported symbol is guarded'
  );
  assertCondition(
    invalidLimitResponse.status === 422,
    'invalid limit returns validation error'
  );

  assertNoForbiddenFields(successJson);
  assertNoForbiddenFields(lowercaseJson);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
