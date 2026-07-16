/**
 * Watchlist read-model fixture for mobile Home/Signals surfaces.
 * It is deterministic seed data, not live market data, brokerage state, or advice.
 */

import { desc, eq } from 'drizzle-orm';

import {
  investmentModels,
  modelSignalEvents,
  modelVersions,
  signalScoreSnapshots
} from '@/lib/db/schema';

export type InvestModelWatchlistItem = {
  id: string;
  displayName: string;
  linkedModelName: string;
  sourceType: 'model_signal_event' | 'model_version';
  sourcePublicId: string;
  seedSourceLabel: 'mock_seed';
  observationLabel: string;
  scoreLabel: string;
  statusLabel: string;
  freshnessLabel: string;
  safetyLabel: string;
  safetyMeta: {
    mockOnly: true;
    simulated: true;
    liveMarketData: false;
    externalPaidApi: false;
    brokerageConnection: false;
    realDeposit: false;
    financialAdvice: false;
  };
};

export type InvestModelWatchlistReadModel = {
  generatedFrom: 'db_seed_projection' | 'deterministic_fixture';
  items: InvestModelWatchlistItem[];
  emptyState: {
    title: string;
    description: string;
    actionLabel: string;
  };
  safetySummary: string;
};

const watchlistSafetyMeta = {
  mockOnly: true,
  simulated: true,
  liveMarketData: false,
  externalPaidApi: false,
  brokerageConnection: false,
  realDeposit: false,
  financialAdvice: false
} as const;

export const investModelWatchlistSeedFixture: InvestModelWatchlistReadModel = {
  generatedFrom: 'deterministic_fixture',
  safetySummary:
    'Mock seed watchlist for mobile UI only. It uses no live market data, external paid API, brokerage connection, real deposit, or financial advice.',
  emptyState: {
    title: 'No simulated watchlist yet',
    description:
      'Saved models and SignalEvent observations will appear here after seed data is available.',
    actionLabel: 'Browse mock models'
  },
  items: [
    {
      id: 'watch_seed_model_demo_signal_001',
      displayName: 'Demo Signal Observer',
      linkedModelName: 'Demo Signal Observer',
      sourceType: 'model_version',
      sourcePublicId: 'model_version_demo_signal_001',
      seedSourceLabel: 'mock_seed',
      observationLabel: 'Selected model context',
      scoreLabel: 'Seeded model',
      statusLabel: 'Simulation only',
      freshnessLabel: 'Seed snapshot',
      safetyLabel: 'No live trading or brokerage connection',
      safetyMeta: watchlistSafetyMeta
    },
    {
      id: 'watch_seed_sig_mock_news_traffic_001',
      displayName: 'AI chip headline traffic acceleration',
      linkedModelName: 'Demo Signal Observer',
      sourceType: 'model_signal_event',
      sourcePublicId: 'sig_mock_news_traffic_001',
      seedSourceLabel: 'mock_seed',
      observationLabel: 'SignalEvent observation',
      scoreLabel: '84.75 mock score',
      statusLabel: 'Observation only',
      freshnessLabel: '2026-07-14 seed',
      safetyLabel: 'No recommendation, no live market feed',
      safetyMeta: watchlistSafetyMeta
    },
    {
      id: 'watch_seed_sig_mock_price_trend_001',
      displayName: 'Semiconductor basket trend watch',
      linkedModelName: 'Demo Signal Observer',
      sourceType: 'model_signal_event',
      sourcePublicId: 'sig_mock_price_trend_001',
      seedSourceLabel: 'mock_seed',
      observationLabel: 'SignalEvent observation',
      scoreLabel: '78.40 mock score',
      statusLabel: 'Simulation input',
      freshnessLabel: '2026-07-14 seed',
      safetyLabel: 'No recommendation, no external paid API',
      safetyMeta: watchlistSafetyMeta
    }
  ]
};

function cloneFixture(): InvestModelWatchlistReadModel {
  return {
    ...investModelWatchlistSeedFixture,
    emptyState: { ...investModelWatchlistSeedFixture.emptyState },
    items: investModelWatchlistSeedFixture.items.map((item) => ({
      ...item,
      safetyMeta: { ...item.safetyMeta }
    }))
  };
}

function formatScore(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 'mock score pending';
  }

  return `${numeric.toFixed(2)} mock score`;
}

function formatFreshness(value: Date | string | null | undefined) {
  if (!value) {
    return 'DB seed snapshot';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'DB seed snapshot';
  }

  return `${date.toISOString().slice(0, 10)} seed`;
}

export async function readInvestModelWatchlistSeedFixture(
  limit = 3
): Promise<InvestModelWatchlistReadModel> {
  if (!process.env.MYSQL_URL) {
    return cloneFixture();
  }

  try {
    const { db } = await import('@/lib/db/drizzle');

    const rows = await db
      .select({
        signalPublicId: modelSignalEvents.publicId,
        title: modelSignalEvents.title,
        signalType: modelSignalEvents.signalType,
        signalScore: modelSignalEvents.score,
        capturedAt: modelSignalEvents.createdAt,
        modelName: investmentModels.name,
        modelVersionPublicId: modelVersions.publicId,
        snapshotTotalScore: signalScoreSnapshots.totalScore,
        snapshotCapturedAt: signalScoreSnapshots.capturedAt,
        calculationContext: signalScoreSnapshots.calculationContext
      })
      .from(modelSignalEvents)
      .innerJoin(
        modelVersions,
        eq(modelSignalEvents.modelVersionId, modelVersions.id)
      )
      .innerJoin(investmentModels, eq(modelVersions.modelId, investmentModels.id))
      .leftJoin(
        signalScoreSnapshots,
        eq(signalScoreSnapshots.signalEventId, modelSignalEvents.id)
      )
      .orderBy(desc(signalScoreSnapshots.capturedAt), desc(modelSignalEvents.score))
      .limit(limit);

    if (rows.length === 0) {
      return cloneFixture();
    }

    return {
      ...cloneFixture(),
      generatedFrom: 'db_seed_projection',
      items: rows.map((row) => ({
        id: `watch_seed_${row.signalPublicId}`,
        displayName: row.title,
        linkedModelName: row.modelName,
        sourceType: 'model_signal_event',
        sourcePublicId: row.signalPublicId,
        seedSourceLabel: 'mock_seed',
        observationLabel: `${row.signalType} SignalEvent observation`,
        scoreLabel: formatScore(row.snapshotTotalScore ?? row.signalScore),
        statusLabel:
          row.calculationContext === 'mock_seed'
            ? 'Observation only'
            : 'Simulation input',
        freshnessLabel: formatFreshness(
          row.snapshotCapturedAt ?? row.capturedAt
        ),
        safetyLabel: 'No recommendation, live feed, or brokerage connection',
        safetyMeta: { ...watchlistSafetyMeta }
      }))
    };
  } catch {
    return cloneFixture();
  }
}
