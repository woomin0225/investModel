import type { AccessRole, DomainPublicId } from '@/lib/domain/types';
import type { PolicyNoticeDto } from '@/lib/domain/feed/feed-post';
import {
  finiteNumber,
  formatScoreLabel
} from '@/lib/domain/formatting/invest-model-number';

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
  scoreSnapshot?: SignalScoreSnapshotDto;
  notices: PolicyNoticeDto[];
}

export interface SignalScoreSnapshotDto {
  totalScore: number;
  totalScoreDisplay: string;
  rankValue: number | null;
  rankLabel: string;
  rankDelta: number | null;
  rankDeltaDisplay: string;
  capturedAt: string;
  calculationContext:
    | 'mock_seed'
    | 'scheduled_mock'
    | 'external_review_required'
    | 'unknown';
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
  return finiteNumber(score, 0);
}

function nullableRankToNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed =
    typeof value === 'number' ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function snapshotContextFor(
  value: string | null | undefined
): SignalScoreSnapshotDto['calculationContext'] {
  if (
    value === 'mock_seed' ||
    value === 'scheduled_mock' ||
    value === 'external_review_required'
  ) {
    return value;
  }

  return 'unknown';
}

function rankDeltaDisplay(rankDelta: number | null) {
  if (rankDelta === null) {
    return 'New rank snapshot';
  }

  if (rankDelta > 0) {
    return `+${rankDelta} rank`;
  }

  return `${rankDelta} rank`;
}

function buildScoreSnapshotDto(input: {
  snapshotTotalScore?: number | string | null;
  snapshotRankValue?: number | string | null;
  snapshotRankDelta?: number | string | null;
  snapshotCapturedAt?: Date | string | null;
  snapshotCalculationContext?: string | null;
}): SignalScoreSnapshotDto | undefined {
  if (
    input.snapshotTotalScore === null ||
    input.snapshotTotalScore === undefined ||
    !input.snapshotCapturedAt
  ) {
    return undefined;
  }

  const totalScore = scoreToNumber(input.snapshotTotalScore);
  const rankValue = nullableRankToNumber(input.snapshotRankValue);
  const rankDelta = nullableRankToNumber(input.snapshotRankDelta);
  const capturedAt =
    input.snapshotCapturedAt instanceof Date
      ? input.snapshotCapturedAt.toISOString()
      : input.snapshotCapturedAt;

  return {
    totalScore,
    totalScoreDisplay: formatScoreLabel(totalScore, 'snapshot score'),
    rankValue,
    rankLabel: rankValue === null ? 'Unranked' : `#${rankValue}`,
    rankDelta,
    rankDeltaDisplay: rankDeltaDisplay(rankDelta),
    capturedAt,
    calculationContext: snapshotContextFor(input.snapshotCalculationContext)
  };
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
  snapshotTotalScore?: number | string | null;
  snapshotRankValue?: number | string | null;
  snapshotRankDelta?: number | string | null;
  snapshotCapturedAt?: Date | string | null;
  snapshotCalculationContext?: string | null;
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
    scoreDisplay: formatScoreLabel(score, 'score'),
    sourceLabel: sourceLabelFor({
      signalType,
      sourceInstrumentSymbol: input.sourceInstrumentSymbol,
      sourceInstrumentName: input.sourceInstrumentName
    }),
    capturedAt,
    dataContext: 'mock',
    scoreSnapshot: buildScoreSnapshotDto(input),
    notices: signalPolicyNotices()
  };
}
