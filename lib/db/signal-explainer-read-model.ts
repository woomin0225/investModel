/**
 * Signal explainer read-model fixture for mobile "why it moved" cards.
 * It explains seeded SignalEvent score inputs only; it is not advice, an
 * order signal, a TradeIntent, or live market data.
 */

import { desc, eq } from 'drizzle-orm';

import {
  investmentModels,
  marketInstruments,
  modelSignalEvents,
  modelVersions,
  signalScoreInputs,
  signalScoreSnapshots
} from '@/lib/db/schema';

type SignalExplainerDriver = {
  sourceType:
    | 'news_traffic'
    | 'search_traffic'
    | 'price_trend'
    | 'ai_attention'
    | 'model_inclusion'
    | 'mock_context';
  label: string;
  evidenceLabel: string;
  normalizedScore: number;
  weight: number;
  contributionLabel: string;
};

export type SignalExplainerReadModel = {
  generatedFrom: 'deterministic_fixture' | 'db_seed_projection';
  signalPublicId: string;
  title: string;
  linkedModelName: string;
  signalType: string;
  sourceLabel: string;
  capturedAtLabel: string;
  explanationTitle: string;
  explanationSummary: string;
  drivers: SignalExplainerDriver[];
  scoreSnapshot: {
    totalScoreLabel: string;
    rankLabel: string;
    rankDeltaLabel: string;
    calculationContext: 'mock_seed';
  };
  safetyMeta: {
    mockOnly: true;
    simulated: true;
    observedInputsOnly: true;
    liveMarketData: false;
    externalPaidApi: false;
    tradeIntentCreated: false;
    realOrder: false;
    brokerageConnection: false;
    financialAdvice: false;
  };
  safetySummary: string;
};

const signalExplainerSafetyMeta = {
  mockOnly: true,
  simulated: true,
  observedInputsOnly: true,
  liveMarketData: false,
  externalPaidApi: false,
  tradeIntentCreated: false,
  realOrder: false,
  brokerageConnection: false,
  financialAdvice: false
} as const;

const fallbackDrivers: SignalExplainerDriver[] = [
  {
    sourceType: 'news_traffic',
    label: 'Seeded news traffic',
    evidenceLabel: 'Sample headline attention rose in the tracked mock basket.',
    normalizedScore: 86,
    weight: 0.45,
    contributionLabel: '38.70 weighted mock points'
  },
  {
    sourceType: 'ai_attention',
    label: 'Seeded model attention',
    evidenceLabel: 'Demo model notes referenced the same theme in the seed set.',
    normalizedScore: 82,
    weight: 0.25,
    contributionLabel: '20.50 weighted mock points'
  },
  {
    sourceType: 'model_inclusion',
    label: 'Seeded model inclusion',
    evidenceLabel: 'The SignalEvent is linked to a public mock ModelVersion.',
    normalizedScore: 74,
    weight: 0.1,
    contributionLabel: '7.40 weighted mock points'
  }
];

export const signalExplainerSeedFixture: SignalExplainerReadModel = {
  generatedFrom: 'deterministic_fixture',
  signalPublicId: 'sig_mock_news_traffic_001',
  title: 'AI chip headline traffic acceleration',
  linkedModelName: 'Demo Signal Observer',
  signalType: 'news_traffic',
  sourceLabel: 'Sample AI Infrastructure Basket (SAMPLE_AI_BASKET)',
  capturedAtLabel: '2026-07-14 seed',
  explanationTitle: 'Why this mock signal moved',
  explanationSummary:
    'This explainer combines seeded news traffic, model attention, and model inclusion inputs. It is observation context for the prototype and does not create advice, allocation, orders, or brokerage actions.',
  drivers: fallbackDrivers,
  scoreSnapshot: {
    totalScoreLabel: '84.75 mock score',
    rankLabel: '#1 seeded rank',
    rankDeltaLabel: 'New seeded rank snapshot',
    calculationContext: 'mock_seed'
  },
  safetyMeta: signalExplainerSafetyMeta,
  safetySummary:
    'Seeded SignalEvent explainer only: no live market data, external paid API, TradeIntent, real order, brokerage connection, or financial advice.'
};

function cloneFixture(): SignalExplainerReadModel {
  return {
    ...signalExplainerSeedFixture,
    drivers: signalExplainerSeedFixture.drivers.map((driver) => ({
      ...driver
    })),
    scoreSnapshot: { ...signalExplainerSeedFixture.scoreSnapshot },
    safetyMeta: { ...signalExplainerSeedFixture.safetyMeta }
  };
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatScore(value: unknown) {
  return `${toNumber(value).toFixed(2)} mock score`;
}

function formatSeedDate(value: Date | string | null | undefined) {
  if (!value) {
    return 'DB seed snapshot';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'DB seed snapshot';
  }

  return `${date.toISOString().slice(0, 10)} seed`;
}

function sourceLabelFor(input: {
  signalType: string;
  instrumentName: string | null;
  instrumentSymbol: string | null;
}) {
  if (input.instrumentName && input.instrumentSymbol) {
    return `${input.instrumentName} (${input.instrumentSymbol})`;
  }

  if (input.instrumentName) {
    return input.instrumentName;
  }

  if (input.instrumentSymbol) {
    return input.instrumentSymbol;
  }

  return `Seeded ${input.signalType} context`;
}

function driverSourceType(value: string): SignalExplainerDriver['sourceType'] {
  if (
    value === 'news_traffic' ||
    value === 'search_traffic' ||
    value === 'price_trend' ||
    value === 'ai_attention' ||
    value === 'model_inclusion'
  ) {
    return value;
  }

  return 'mock_context';
}

function driverLabelFor(sourceType: SignalExplainerDriver['sourceType']) {
  switch (sourceType) {
    case 'news_traffic':
      return 'Seeded news traffic';
    case 'search_traffic':
      return 'Seeded search traffic';
    case 'price_trend':
      return 'Seeded price trend';
    case 'ai_attention':
      return 'Seeded model attention';
    case 'model_inclusion':
      return 'Seeded model inclusion';
    case 'mock_context':
      return 'Seeded mock context';
  }
}

function buildDriver(input: {
  sourceType: string;
  sourceLabel: string | null;
  normalizedScore: unknown;
  weight: unknown;
}): SignalExplainerDriver {
  const sourceType = driverSourceType(input.sourceType);
  const normalizedScore = toNumber(input.normalizedScore);
  const weight = toNumber(input.weight);
  const contribution = normalizedScore * weight;

  return {
    sourceType,
    label: driverLabelFor(sourceType),
    evidenceLabel:
      input.sourceLabel ?? `${driverLabelFor(sourceType)} mock evidence`,
    normalizedScore,
    weight,
    contributionLabel: `${contribution.toFixed(2)} weighted mock points`
  };
}

async function readDbProjection(
  signalPublicId: string
): Promise<SignalExplainerReadModel | null> {
  const { db } = await import('@/lib/db/drizzle');

  const signalRows = await db
    .select({
      signalEventId: modelSignalEvents.id,
      signalPublicId: modelSignalEvents.publicId,
      title: modelSignalEvents.title,
      summary: modelSignalEvents.summary,
      signalType: modelSignalEvents.signalType,
      capturedAt: modelSignalEvents.createdAt,
      linkedModelName: investmentModels.name,
      sourceInstrumentName: marketInstruments.name,
      sourceInstrumentSymbol: marketInstruments.symbol
    })
    .from(modelSignalEvents)
    .innerJoin(
      modelVersions,
      eq(modelSignalEvents.modelVersionId, modelVersions.id)
    )
    .innerJoin(investmentModels, eq(modelVersions.modelId, investmentModels.id))
    .leftJoin(
      marketInstruments,
      eq(modelSignalEvents.sourceInstrumentId, marketInstruments.id)
    )
    .where(eq(modelSignalEvents.publicId, signalPublicId))
    .limit(1);

  const signal = signalRows[0];

  if (!signal) {
    return null;
  }

  const snapshotRows = await db
    .select({
      snapshotId: signalScoreSnapshots.id,
      totalScore: signalScoreSnapshots.totalScore,
      rankValue: signalScoreSnapshots.rankValue,
      rankDelta: signalScoreSnapshots.rankDelta,
      calculationContext: signalScoreSnapshots.calculationContext,
      capturedAt: signalScoreSnapshots.capturedAt
    })
    .from(signalScoreSnapshots)
    .where(eq(signalScoreSnapshots.signalEventId, signal.signalEventId))
    .orderBy(desc(signalScoreSnapshots.capturedAt))
    .limit(1);

  const snapshot = snapshotRows[0];

  if (!snapshot || snapshot.calculationContext !== 'mock_seed') {
    return cloneFixture();
  }

  const inputRows = await db
    .select({
      sourceType: signalScoreInputs.sourceType,
      sourceLabel: signalScoreInputs.sourceLabel,
      normalizedScore: signalScoreInputs.normalizedScore,
      weight: signalScoreInputs.weight
    })
    .from(signalScoreInputs)
    .where(eq(signalScoreInputs.scoreSnapshotId, snapshot.snapshotId))
    .orderBy(desc(signalScoreInputs.normalizedScore));

  const drivers =
    inputRows.length > 0
      ? inputRows.map(buildDriver)
      : cloneFixture().drivers;

  return {
    generatedFrom: 'db_seed_projection',
    signalPublicId: signal.signalPublicId,
    title: signal.title,
    linkedModelName: signal.linkedModelName,
    signalType: signal.signalType,
    sourceLabel: sourceLabelFor({
      signalType: signal.signalType,
      instrumentName: signal.sourceInstrumentName,
      instrumentSymbol: signal.sourceInstrumentSymbol
    }),
    capturedAtLabel: formatSeedDate(signal.capturedAt),
    explanationTitle: 'Why this mock signal moved',
    explanationSummary:
      signal.summary ??
      'Seeded score inputs explain this observed SignalEvent without creating advice, allocation, orders, or brokerage actions.',
    drivers,
    scoreSnapshot: {
      totalScoreLabel: formatScore(snapshot.totalScore),
      rankLabel:
        snapshot.rankValue === null ? 'Unranked' : `#${snapshot.rankValue}`,
      rankDeltaLabel:
        snapshot.rankDelta === null
          ? 'New seeded rank snapshot'
          : `${snapshot.rankDelta} seeded rank delta`,
      calculationContext: 'mock_seed'
    },
    safetyMeta: { ...signalExplainerSafetyMeta },
    safetySummary: signalExplainerSeedFixture.safetySummary
  };
}

export async function readSignalExplainerSeedFixture(
  signalPublicId = signalExplainerSeedFixture.signalPublicId
): Promise<SignalExplainerReadModel> {
  if (!process.env.MYSQL_URL) {
    return cloneFixture();
  }

  try {
    const projection = await readDbProjection(signalPublicId);
    return projection ?? cloneFixture();
  } catch {
    return cloneFixture();
  }
}
