import type { AccessRole, DomainPublicId } from '@/lib/domain/types';
import type { PolicyNoticeDto } from '@/lib/domain/feed/feed-post';

/**
 * SignalEvent DTO helpers keep observed signal rows separate from advice,
 * order creation, or broker activity.
 */

export type SignalEventType =
  | 'news_traffic'
  | 'price_trend'
  | 'macro'
  | 'risk';

export interface SignalEventDto {
  signalPublicId: DomainPublicId;
  modelVersionPublicId: DomainPublicId;
  linkedModelName: string;
  signalType: SignalEventType;
  title: string;
  summary: string;
  score: number;
  scoreDisplay: string;
  sourceLabel: string;
  sourceUrl?: string;
  capturedAt: string;
  dataContext: 'mock' | 'observed_placeholder';
  notices: PolicyNoticeDto[];
}

export const signalEventTypes = [
  'news_traffic',
  'price_trend',
  'macro',
  'risk'
] as const satisfies readonly SignalEventType[];

export function canReadSignals(role: AccessRole) {
  return role === 'user' || role === 'admin';
}

export function parseSignalEventType(
  value: string | null
): SignalEventType | null {
  if (!value) {
    return null;
  }

  if (value === 'risk_alert') {
    return 'risk';
  }

  return signalEventTypes.includes(value as SignalEventType)
    ? (value as SignalEventType)
    : null;
}

export function parseSignalLimit(value: string | null, fallback = 20) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

function signalPolicyNotices(): PolicyNoticeDto[] {
  return [
    {
      code: 'observed_signal_only',
      severity: 'info',
      message:
        'SignalEvent rows are observed inputs only, not buy, sell, hold, or rebalance recommendations.'
    },
    {
      code: 'no_real_order',
      severity: 'warning',
      message:
        'This API does not create TradeIntent rows, orders, broker actions, or portfolio allocations.'
    }
  ];
}

function scoreToNumber(score: number | string | null | undefined) {
  if (score === null || score === undefined) {
    return 0;
  }

  const parsed =
    typeof score === 'number' ? score : Number.parseFloat(score);

  return Number.isFinite(parsed) ? parsed : 0;
}

function sourceLabelFor(input: {
  signalType: SignalEventType;
  sourceInstrumentSymbol?: string | null;
  sourceInstrumentName?: string | null;
}) {
  if (input.sourceInstrumentName && input.sourceInstrumentSymbol) {
    return `${input.sourceInstrumentName} (${input.sourceInstrumentSymbol})`;
  }

  if (input.sourceInstrumentName) {
    return input.sourceInstrumentName;
  }

  if (input.sourceInstrumentSymbol) {
    return input.sourceInstrumentSymbol;
  }

  switch (input.signalType) {
    case 'news_traffic':
      return 'Seeded news traffic';
    case 'price_trend':
      return 'Seeded price trend';
    case 'macro':
      return 'Seeded macro context';
    case 'risk':
      return 'Seeded risk alert';
  }
}

export function buildSignalEventDto(input: {
  signalPublicId: string;
  modelVersionPublicId: string;
  linkedModelName?: string | null;
  signalType: string;
  title: string;
  summary?: string | null;
  score?: number | string | null;
  sourceInstrumentSymbol?: string | null;
  sourceInstrumentName?: string | null;
  capturedAt?: Date | string | null;
}): SignalEventDto {
  const signalType = parseSignalEventType(input.signalType) ?? 'macro';
  const score = scoreToNumber(input.score);
  const capturedAt =
    input.capturedAt instanceof Date
      ? input.capturedAt.toISOString()
      : input.capturedAt ?? new Date(0).toISOString();

  return {
    signalPublicId: input.signalPublicId as DomainPublicId,
    modelVersionPublicId: input.modelVersionPublicId as DomainPublicId,
    linkedModelName: input.linkedModelName ?? 'Unlinked InvestmentModel',
    signalType,
    title: input.title,
    summary: input.summary ?? '',
    score,
    scoreDisplay: `${Math.round(score)} score`,
    sourceLabel: sourceLabelFor({
      signalType,
      sourceInstrumentSymbol: input.sourceInstrumentSymbol,
      sourceInstrumentName: input.sourceInstrumentName
    }),
    capturedAt,
    dataContext: 'mock',
    notices: signalPolicyNotices()
  };
}
