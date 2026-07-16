import { and, desc, eq, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  investmentModels,
  marketInstruments,
  modelSignalEvents,
  modelVersions,
  signalScoreInputs,
  signalScoreSnapshots
} from '@/lib/db/schema';
import {
  buildSignalEventDto,
  type SignalObservedDriverDto,
  type SignalEventDto,
  type SignalEventType
} from '@/lib/domain/signals/signal-event';

interface ReadSignalEventDtosInput {
  signalType?: SignalEventType | null;
  limit: number;
}

function signalEventSelectFields() {
  return {
    signalEventId: modelSignalEvents.id,
    signalPublicId: modelSignalEvents.publicId,
    modelVersionPublicId: modelVersions.publicId,
    linkedModelName: investmentModels.name,
    signalType: modelSignalEvents.signalType,
    title: modelSignalEvents.title,
    summary: modelSignalEvents.summary,
    score: modelSignalEvents.score,
    sourceInstrumentSymbol: marketInstruments.symbol,
    sourceInstrumentName: marketInstruments.name,
    capturedAt: modelSignalEvents.createdAt
  };
}

type SignalEventReadRow = Awaited<
  ReturnType<ReturnType<typeof signalEventBaseQuery>['limit']>
>[number];

function scoreSnapshotSelectFields() {
  return {
    snapshotId: signalScoreSnapshots.id,
    snapshotTotalScore: signalScoreSnapshots.totalScore,
    snapshotRankValue: signalScoreSnapshots.rankValue,
    snapshotRankDelta: signalScoreSnapshots.rankDelta,
    snapshotCapturedAt: signalScoreSnapshots.capturedAt,
    snapshotCalculationContext: signalScoreSnapshots.calculationContext
  };
}

async function readLatestScoreSnapshot(signalEventId: number) {
  const rows = await db
    .select(scoreSnapshotSelectFields())
    .from(signalScoreSnapshots)
    .where(eq(signalScoreSnapshots.signalEventId, signalEventId))
    .orderBy(desc(signalScoreSnapshots.capturedAt))
    .limit(1);

  return rows[0] ?? null;
}

async function readLatestScoreSnapshotWithInputs(signalEventId: number) {
  const rows = await db
    .select({
      ...scoreSnapshotSelectFields(),
      inputId: signalScoreInputs.id
    })
    .from(signalScoreSnapshots)
    .innerJoin(
      signalScoreInputs,
      eq(signalScoreInputs.scoreSnapshotId, signalScoreSnapshots.id)
    )
    .where(eq(signalScoreSnapshots.signalEventId, signalEventId))
    .orderBy(desc(signalScoreSnapshots.capturedAt))
    .limit(1);

  return rows[0] ?? null;
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function observedOnlyEvidenceLabel(sourceLabel: string | null) {
  const label =
    sourceLabel ?? 'Seeded observed driver context; not advice or order evidence.';

  return label.includes('Observed-only')
    ? label
    : `Observed-only mock driver: ${label}`;
}

async function readLatestScoreInputs(
  snapshotId: number
): Promise<SignalObservedDriverDto[]> {
  const rows = await db
    .select({
      sourceType: signalScoreInputs.sourceType,
      sourceLabel: signalScoreInputs.sourceLabel,
      normalizedScore: signalScoreInputs.normalizedScore,
      weight: signalScoreInputs.weight
    })
    .from(signalScoreInputs)
    .where(eq(signalScoreInputs.scoreSnapshotId, snapshotId))
    .orderBy(desc(signalScoreInputs.normalizedScore));

  return rows.map((row) => {
    const normalizedScore = toFiniteNumber(row.normalizedScore);
    const weight = toFiniteNumber(row.weight);
    const contribution = normalizedScore * weight;

    return {
      sourceType: row.sourceType,
      evidenceLabel: observedOnlyEvidenceLabel(row.sourceLabel),
      normalizedScore,
      weight,
      contributionDisplay: `${contribution.toFixed(2)} weighted mock points`,
      evidenceContext: 'mock'
    };
  });
}

async function attachLatestScoreSnapshots(
  rows: SignalEventReadRow[],
  options: { includeDrivers?: boolean } = {}
) {
  return Promise.all(
    rows.map(async (row) => {
      const snapshot =
        options.includeDrivers
          ? (await readLatestScoreSnapshotWithInputs(row.signalEventId)) ??
            (await readLatestScoreSnapshot(row.signalEventId))
          : await readLatestScoreSnapshot(row.signalEventId);
      const observedDrivers =
        options.includeDrivers && snapshot?.snapshotId
          ? await readLatestScoreInputs(snapshot.snapshotId)
          : undefined;

      return {
        ...row,
        ...snapshot,
        observedDrivers
      };
    })
  );
}

function signalEventBaseQuery() {
  return db
    .select(signalEventSelectFields())
    .from(modelSignalEvents)
    .innerJoin(
      modelVersions,
      eq(modelSignalEvents.modelVersionId, modelVersions.id)
    )
    .innerJoin(investmentModels, eq(modelVersions.modelId, investmentModels.id))
    .leftJoin(
      marketInstruments,
      eq(modelSignalEvents.sourceInstrumentId, marketInstruments.id)
    );
}

export async function readSignalEventDtos({
  signalType,
  limit
}: ReadSignalEventDtosInput): Promise<SignalEventDto[]> {
  const filters: SQL[] = [];

  if (signalType) {
    filters.push(eq(modelSignalEvents.signalType, signalType));
  }

  const rows = await signalEventBaseQuery()
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(modelSignalEvents.score), desc(modelSignalEvents.createdAt))
    .limit(limit);

  const rowsWithSnapshots = await attachLatestScoreSnapshots(rows);

  return rowsWithSnapshots.map(buildSignalEventDto);
}

export async function readSignalEventDtoByPublicId(
  signalPublicId: string
): Promise<SignalEventDto | null> {
  const rows = await signalEventBaseQuery()
    .where(eq(modelSignalEvents.publicId, signalPublicId))
    .limit(1);

  const rowsWithSnapshots = await attachLatestScoreSnapshots(rows, {
    includeDrivers: true
  });

  return rowsWithSnapshots[0] ? buildSignalEventDto(rowsWithSnapshots[0]) : null;
}
