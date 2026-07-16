/**
 * This smoke test applies the tracked investModel app seed as a whole file and
 * verifies current DB-backed read models. It never creates real deposits,
 * balances, orders, broker links, bank links, external API calls, or advice.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { NextRequest } from 'next/server';

import { GET as readSignals } from '../../app/api/signals/route';
import { GET as readNotifications } from '../../app/api/notifications/route';
import { GET as readPortfolioSummary } from '../../app/api/portfolio/mock-summary/route';
import { client } from '../../lib/db/drizzle';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function applyInvestModelAppSeed() {
  const seedPath = path.resolve(
    'docs/database/seeds/001_invest_model_domain_seed.sql'
  );
  const sql = fs.readFileSync(seedPath, 'utf8');
  const connection = await mysql.createConnection({
    uri: process.env.MYSQL_URL,
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();
}

async function main() {
  await applyInvestModelAppSeed();

  const signalResponse = await readSignals(
    new NextRequest('http://localhost/api/signals?limit=10', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
  const signalJson = await signalResponse.json();
  const notificationResponse = await readNotifications(
    new NextRequest('http://localhost/api/notifications?userPublicId=user_demo_001&limit=12', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
  const notificationJson = await notificationResponse.json();
  const portfolioResponse = await readPortfolioSummary(
    new NextRequest('http://localhost/api/portfolio/mock-summary', {
      method: 'GET',
      headers: {
        'x-invest-model-role': 'user'
      }
    })
  );
  const portfolioJson = await portfolioResponse.json();

  assertCondition(signalResponse.status === 200, 'signals read model responds');
  assertCondition(
    signalJson.data?.length >= 3 &&
      signalJson.data.every(
        (signal: { scoreSnapshot?: { calculationContext?: string } }) =>
          signal.scoreSnapshot?.calculationContext === 'mock_seed'
      ),
    'seed creates SignalEvent rows with mock score snapshots'
  );
  assertCondition(
    notificationResponse.status === 200 &&
      notificationJson.data?.items?.length >= 4 &&
      notificationJson.data?.unreadCount >= 1 &&
      notificationJson.meta?.sendsRealPush === false &&
      notificationJson.meta?.sendsRealEmail === false &&
      notificationJson.meta?.sendsRealSms === false,
    'seed creates FeedPost notification candidates without real delivery'
  );
  assertCondition(
    portfolioResponse.status === 200 &&
      portfolioJson.data?.isMockOnly === true &&
      portfolioJson.data?.safetyMeta?.mockOnly === true &&
      portfolioJson.data?.safetyMeta?.realDeposit === false &&
      portfolioJson.data?.safetyMeta?.realBalance === false &&
      portfolioJson.data?.safetyMeta?.realOrder === false &&
      portfolioJson.data?.safetyMeta?.brokerageConnection === false &&
      portfolioJson.data?.safetyMeta?.financialAdvice === false &&
      portfolioJson.data?.selectedModel?.selectionPublicId ===
        'selection_demo_signal_001' &&
      portfolioJson.data?.mockDeposit?.safetyLabel ===
        'Not a real deposit or cash balance' &&
      portfolioJson.data?.tradeIntent?.boundaryLabel ===
        'pre-order simulation only' &&
      portfolioJson.meta?.mockOnly === true &&
      portfolioJson.meta?.realDeposit === false &&
      portfolioJson.meta?.realBalance === false &&
      portfolioJson.meta?.realOrder === false &&
      portfolioJson.meta?.brokerageConnection === false &&
      portfolioJson.meta?.financialAdvice === false,
    'seed creates mock-safe portfolio summary rows'
  );

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
