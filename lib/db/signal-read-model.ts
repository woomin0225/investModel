import { and, desc, eq, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  investmentModels,
  marketInstruments,
  modelSignalEvents,
  modelVersions,
  signalScoreSnapshots
} from '@/lib/db/schema';
import {
  buildSignalEventDto,
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

async function readLatestScoreSnapshot(signalEventId: number) {
  const rows = await db
    .select({
      snapshotTotalScore: signalScoreSnapshots.totalScore,
      snapshotRankValue: signalScoreSnapshots.rankValue,
      snapshotRankDelta: signalScoreSnapshots.rankDelta,
      snapshotCapturedAt: signalScoreSnapshots.capturedAt,
      snapshotCalculationContext: signalScoreSnapshots.calculationContext
    })
    .from(signalScoreSnapshots)
    .where(eq(signalScoreSnapshots.signalEventId, signalEventId))
    .orderBy(desc(signalScoreSnapshots.capturedAt))
    .limit(1);

  return rows[0] ?? null;
}

async function attachLatestScoreSnapshots(rows: SignalEventReadRow[]) {
  return Promise.all(
    rows.map(async (row) => {
      const snapshot = await readLatestScoreSnapshot(row.signalEventId);

      return {
        ...row,
        ...snapshot
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

  const rowsWithSnapshots = await attachLatestScoreSnapshots(rows);

  return rowsWithSnapshots[0] ? buildSignalEventDto(rowsWithSnapshots[0]) : null;
}
