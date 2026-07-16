import { Bookmark, BookmarkCheck, CircleDashed, ShieldCheck, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { investMotionClass, RiskBadge } from './ui';

export type InterestSaveItemType =
  | 'feed_post'
  | 'signal_event'
  | 'investment_model';

export type InterestSaveItemState = 'saved' | 'unsaved' | 'pending' | 'error';

type InterestSaveStateRailProps = {
  locale: 'ko' | 'en';
  itemType: InterestSaveItemType;
  itemPublicId: string;
  displayState?: InterestSaveItemState;
  sourceSurface?: 'Feed' | 'Signals' | 'Models';
  safetyLabel?: string;
  className?: string;
};

const stateTone = {
  saved: 'low',
  unsaved: 'neutral',
  pending: 'medium',
  error: 'high',
  read_only: 'neutral'
} as const;

const stateIcon = {
  saved: BookmarkCheck,
  unsaved: Bookmark,
  pending: CircleDashed,
  error: XCircle,
  read_only: ShieldCheck
} as const;

function stateCopy(locale: 'ko' | 'en', state: keyof typeof stateTone) {
  const copy = {
    ko: {
      saved: '관심 저장됨',
      unsaved: '관심 없음',
      pending: '관심 확인 중',
      error: '관심 상태 오류',
      read_only: '읽기 전용',
      privateState: '개인 mock 관심 상태',
      readOnlySafety:
        '관심 표시는 개인 읽기 바로가기일 뿐이며 모델 선택, 매수, 입금, 알림 구독, 브로커 연결이 아닙니다.'
    },
    en: {
      saved: 'Saved interest',
      unsaved: 'Not saved',
      pending: 'Interest pending',
      error: 'Interest state error',
      read_only: 'Read-only',
      privateState: 'Private mock interest state',
      readOnlySafety:
        'Interest state is only a private reading shortcut, not model selection, buying, deposits, alert subscription, or brokerage connection.'
    }
  } as const;

  return {
    label: copy[locale][state],
    privateState: copy[locale].privateState,
    readOnlySafety: copy[locale].readOnlySafety
  };
}

/**
 * Shows interest/save state as read-only UI state, never as a model selection,
 * order, deposit, alert subscription, push delivery, or brokerage CTA.
 */
export function InterestSaveStateRail({
  locale,
  itemType,
  itemPublicId,
  displayState,
  sourceSurface,
  safetyLabel,
  className
}: InterestSaveStateRailProps) {
  const visibleState = displayState ?? 'read_only';
  const copy = stateCopy(locale, visibleState);
  const Icon = stateIcon[visibleState];
  const sourceLabel = sourceSurface ?? itemType;
  const safeLabel = safetyLabel ?? copy.readOnlySafety;
  const ariaLabel = `${copy.privateState}. ${copy.label}. ${safeLabel}`;

  return (
    <div
      data-interest-save-state-rail={itemType}
      data-item-public-id={itemPublicId}
      data-state={visibleState}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'group/interest-save grid min-w-0 gap-2 rounded-invest-control border border-invest-border bg-invest-bg-soft p-2.5 text-left',
        investMotionClass.interactiveCard,
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-invest-control bg-invest-surface text-invest-primary">
            <Icon aria-hidden className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-bold leading-4 text-invest-text">
              {copy.privateState}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-semibold leading-4 text-invest-text-muted">
              {sourceLabel}
            </span>
          </span>
        </div>
        <RiskBadge tone={stateTone[visibleState]}>{copy.label}</RiskBadge>
      </div>
      <p className="min-w-0 break-words rounded-invest-control bg-invest-surface px-2 py-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted [overflow-wrap:anywhere]">
        {safeLabel}
      </p>
    </div>
  );
}
