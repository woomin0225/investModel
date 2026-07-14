import { and, desc, eq, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  investmentModels,
  marketInstruments,
  modelSignalEvents,
  modelVersions
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

export async function readSignalEventDtos({
  signalType,
  limit
}: ReadSignalEventDtosInput): Promise<SignalEventDto[]> {
  const filters: SQL[] = [];

  if (signalType) {
    filters.push(eq(modelSignalEvents.signalType, signalType));
  }

  const rows = await db
    .select({
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
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(modelSignalEvents.score), desc(modelSignalEvents.createdAt))
    .limit(limit);

  return rows.map(buildSignalEventDto);
}
