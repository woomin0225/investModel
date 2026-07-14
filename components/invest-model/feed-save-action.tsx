'use client';

import { useState } from 'react';
import { AlertCircle, Bookmark, Loader2 } from 'lucide-react';

import { investMotionClass } from '@/components/invest-model/ui';
import type { FeedReactionStateDto } from '@/lib/domain/feed/feed-post';
import { cn } from '@/lib/utils';

type FeedSaveActionProps = {
  postPublicId: string;
  userPublicId: string;
  initialState: FeedReactionStateDto;
  locale: 'ko' | 'en';
};

type FeedSaveResponse = {
  data?: FeedReactionStateDto;
  meta?: {
    privateReadingShortcutOnly?: boolean;
    modelSelectionSignal?: boolean;
    allocationSignal?: boolean;
    orderIntentSignal?: boolean;
    realOrder?: boolean;
    brokerageConnection?: boolean;
    financialAdvice?: boolean;
  };
  error?: {
    message?: string;
  };
};

function formatSavedAt(value: string | undefined, locale: 'ko' | 'en') {
  if (!value) {
    return locale === 'ko' ? '저장 안됨' : 'Not saved';
  }

  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

/**
 * FeedSaveAction changes only private user-scoped FeedPost bookmark state.
 * It does not select models, allocate portfolios, create orders, or provide advice.
 */
export function FeedSaveAction({
  postPublicId,
  userPublicId,
  initialState,
  locale
}: FeedSaveActionProps) {
  const [reactionState, setReactionState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isKorean = locale === 'ko';

  async function handleToggleSave() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/feed/${encodeURIComponent(postPublicId)}/saves`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-invest-model-role': 'user'
          },
          body: JSON.stringify({
            userPublicId,
            desiredState: !reactionState.saved
          })
        }
      );
      const body = (await response.json()) as FeedSaveResponse;

      if (!response.ok || !body.data) {
        setErrorMessage(
          body.error?.message ??
            (isKorean
              ? '저장 상태를 바꾸지 못했습니다.'
              : 'Could not update the saved state.')
        );
        return;
      }

      setReactionState(body.data);
    } catch {
      setErrorMessage(
        isKorean
          ? '저장 상태를 바꾸지 못했습니다.'
          : 'Could not update the saved state.'
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-invest-card border bg-invest-surface p-3 shadow-invest-card',
        reactionState.saved
          ? 'border-invest-primary/45'
          : 'border-invest-border'
      )}
    >
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={isPending}
        aria-pressed={reactionState.saved}
        aria-live="polite"
        className={cn(
          'flex min-h-invest-touch-target w-full items-start justify-between gap-2 rounded-invest-control text-left disabled:cursor-wait disabled:opacity-80',
          investMotionClass.interactiveControl
        )}
      >
        <span className="min-w-0">
          <span className="block text-[12px] font-bold leading-4 text-invest-text-muted">
            {isKorean ? '저장' : 'Save'}
          </span>
          <span className="mt-2 block text-xl font-bold leading-6 text-invest-text">
            {reactionState.saved
              ? isKorean
                ? '저장됨'
                : 'Saved'
              : isKorean
                ? '미저장'
                : 'Off'}
          </span>
          <span className="mt-1 block text-[11px] font-semibold leading-4 text-invest-text-muted">
            {formatSavedAt(reactionState.savedAt, locale)}
          </span>
        </span>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-invest-control',
            reactionState.saved
              ? 'bg-invest-primary text-white'
              : 'bg-invest-primary-soft text-invest-primary'
          )}
        >
          {isPending ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Bookmark
              aria-hidden
              className={cn('size-4', reactionState.saved && 'fill-current')}
            />
          )}
        </span>
      </button>

      {errorMessage ? (
        <p className="mt-2 flex gap-1.5 text-[11px] font-semibold leading-4 text-invest-risk">
          <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      ) : (
        <p className="mt-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
          {isKorean
            ? '개인 읽기 shortcut이며 모델 선택·배분·주문 신호가 아닙니다.'
            : 'A private reading shortcut, not model selection, allocation, or order intent.'}
        </p>
      )}
    </div>
  );
}
