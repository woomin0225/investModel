import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  modelSignalEvents,
  signalScoreInputs,
  signalScoreSnapshots
} from '@/lib/db/schema';

type ScoreSourceType =
  | 'news_traffic'
  | 'search_traffic'
  | 'price_trend'
  | 'ai_attention'
  | 'model_inclusion';

type ScoreInputDraft = {
  sourceType: ScoreSourceType;
  rawValue: number;
  normalizedScore: number;
  weight: number;
  sourceLabel: string;
};

type ScoreInputOverride = {
  rawValue: number;
  normalizedScore: number;
  weight: number;
  sourceLabel: string;
};

export type MockSignalScoreResult = {
  signalPublicId: string;
  snapshotId: number;
  totalScore: number;
  rankValue: number;
  rankDelta: number | null;
  inputCount: number;
  calculationContext: 'mock_seed';
};

const signalTypeWeights: Record<string, Partial<Record<ScoreSourceType, number>>> = {
  news_traffic: {
    news_traffic: 0.45,
    search_traffic: 0.2,
    ai_attention: 0.25,
    model_inclusion: 0.1
  },
  price_trend: {
    price_trend: 0.45,
    news_traffic: 0.15,
    ai_attention: 0.25,
    model_inclusion: 0.15
  },
  risk: {
    news_traffic: 0.25,
    search_traffic: 0.2,
    price_trend: 0.25,
    ai_attention: 0.2,
    model_inclusion: 0.1
  },
  macro: {
    news_traffic: 0.25,
    search_traffic: 0.2,
    price_trend: 0.2,
    ai_attention: 0.25,
    model_inclusion: 0.1
  }
};

function clampScore(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function decimalString(value: number, digits = 4) {
  return value.toFixed(digits);
}

function scoreToNumber(value: string | number | null) {
  if (value === null) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isScoreSourceType(value: string): value is ScoreSourceType {
  return (
    value === 'news_traffic' ||
    value === 'search_traffic' ||
    value === 'price_trend' ||
    value === 'ai_attention' ||
    value === 'model_inclusion'
  );
}

function buildScoreInputs(input: {
  baseScore: number;
  signalType: string;
  title: string;
  seededInputs?: Map<ScoreSourceType, ScoreInputOverride>;
}): ScoreInputDraft[] {
  const weights = signalTypeWeights[input.signalType] ?? signalTypeWeights.macro;

  return Object.entries(weights).map(([sourceType, weight], index) => {
    const typedSourceType = sourceType as ScoreSourceType;
    const seededInput = input.seededInputs?.get(typedSourceType);

    if (seededInput) {
      return {
        sourceType: typedSourceType,
        rawValue: seededInput.rawValue,
        normalizedScore: clampScore(seededInput.normalizedScore),
        weight: seededInput.weight,
        sourceLabel: seededInput.sourceLabel
      };
    }

    const normalizedScore = clampScore(input.baseScore - index * 3 + weight * 10);
    const rawValue = Math.round(normalizedScore * 1000) / 1000;

    return {
      sourceType: typedSourceType,
      rawValue,
      normalizedScore,
      weight,
      sourceLabel: `${input.title} ${sourceType} mock input`
    };
  });
}

function weightedTotal(inputs: ScoreInputDraft[]) {
  const totalWeight = inputs.reduce((sum, input) => sum + input.weight, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  const total = inputs.reduce(
    (sum, input) => sum + input.normalizedScore * input.weight,
    0
  );

  return Math.round((total / totalWeight) * 10000) / 10000;
}

async function readPreviousRank(signalEventId: number) {
  const rows = await db
    .select({ rankValue: signalScoreSnapshots.rankValue })
    .from(signalScoreSnapshots)
    .where(eq(signalScoreSnapshots.signalEventId, signalEventId))
    .orderBy(desc(signalScoreSnapshots.capturedAt))
    .limit(1);

  return rows[0]?.rankValue ?? null;
}

async function readSeededScoreInputs(signalEventId: number) {
  const inputRows = await db
    .select({
      sourceType: signalScoreInputs.sourceType,
      rawValue: signalScoreInputs.rawValue,
      normalizedScore: signalScoreInputs.normalizedScore,
      weight: signalScoreInputs.weight,
      sourceLabel: signalScoreInputs.sourceLabel
    })
    .from(signalScoreInputs)
    .innerJoin(
      signalScoreSnapshots,
      eq(signalScoreInputs.scoreSnapshotId, signalScoreSnapshots.id)
    )
    .where(eq(signalScoreSnapshots.signalEventId, signalEventId))
    .orderBy(desc(signalScoreInputs.capturedAt));
  const latestOverrides = new Map<ScoreSourceType, ScoreInputOverride>();
  const seededOverrides = new Map<ScoreSourceType, ScoreInputOverride>();

  for (const inputRow of inputRows) {
    if (!isScoreSourceType(inputRow.sourceType)) {
      continue;
    }

    const override = {
      rawValue: scoreToNumber(inputRow.rawValue),
      normalizedScore: scoreToNumber(inputRow.normalizedScore),
      weight: scoreToNumber(inputRow.weight),
      sourceLabel:
        inputRow.sourceLabel ??
        `Seeded ${inputRow.sourceType} mock score input`
    };

    if (!latestOverrides.has(inputRow.sourceType)) {
      latestOverrides.set(inputRow.sourceType, override);
    }

    if (
      inputRow.sourceLabel?.startsWith('Seeded ') &&
      !seededOverrides.has(inputRow.sourceType)
    ) {
      seededOverrides.set(inputRow.sourceType, override);
    }
  }

  return new Map([...latestOverrides, ...seededOverrides]);
}

/**
 * Calculates score snapshots from existing seed/mock SignalEvent rows.
 * It does not fetch external data, create TradeIntent rows, place orders, or alter portfolios.
 */
export async function calculateMockSignalScoreSnapshots({
  capturedAt = new Date()
}: {
  capturedAt?: Date;
} = {}): Promise<MockSignalScoreResult[]> {
  const signalRows = await db
    .select({
      id: modelSignalEvents.id,
      signalPublicId: modelSignalEvents.publicId,
      signalType: modelSignalEvents.signalType,
      title: modelSignalEvents.title,
      score: modelSignalEvents.score
    })
    .from(modelSignalEvents)
    .orderBy(desc(modelSignalEvents.score), desc(modelSignalEvents.createdAt));

  const scoredRows = await Promise.all(
    signalRows.map(async (signal) => {
      const seededInputs = await readSeededScoreInputs(signal.id);
      const inputs = buildScoreInputs({
        baseScore: scoreToNumber(signal.score),
        signalType: signal.signalType,
        title: signal.title,
        seededInputs
      });

      return {
        ...signal,
        inputs,
        totalScore: weightedTotal(inputs)
      };
    })
  );

  scoredRows.sort((left, right) => right.totalScore - left.totalScore);

  const results: MockSignalScoreResult[] = [];

  for (const [index, signal] of scoredRows.entries()) {
    const rankValue = index + 1;
    const previousRank = await readPreviousRank(signal.id);
    const rankDelta =
      typeof previousRank === 'number' ? previousRank - rankValue : null;
    const insertedSnapshotIds = await db
      .insert(signalScoreSnapshots)
      .values({
        signalEventId: signal.id,
        totalScore: decimalString(signal.totalScore),
        rankValue,
        rankDelta,
        calculationContext: 'mock_seed',
        capturedAt,
        createdAt: capturedAt
      })
      .$returningId();
    const snapshotId = insertedSnapshotIds[0]?.id;

    if (typeof snapshotId !== 'number') {
      throw new Error('Signal score snapshot id was not returned.');
    }

    await db.insert(signalScoreInputs).values(
      signal.inputs.map((scoreInput) => ({
        scoreSnapshotId: snapshotId,
        sourceType: scoreInput.sourceType,
        rawValue: decimalString(scoreInput.rawValue, 6),
        normalizedScore: decimalString(scoreInput.normalizedScore),
        weight: decimalString(scoreInput.weight),
        sourceLabel: scoreInput.sourceLabel,
        capturedAt,
        createdAt: capturedAt
      }))
    );

    results.push({
      signalPublicId: signal.signalPublicId,
      snapshotId,
      totalScore: signal.totalScore,
      rankValue,
      rankDelta,
      inputCount: signal.inputs.length,
      calculationContext: 'mock_seed'
    });
  }

  return results;
}
