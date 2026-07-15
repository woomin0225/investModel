'use client';

import { useState } from 'react';
import { AlertCircle, Heart, Loader2 } from 'lucide-react';

import { investMotionClass } from '@/components/invest-model/ui';
import type { FeedReactionStateDto } from '@/lib/domain/feed/feed-post';
import { cn } from '@/lib/utils';

type FeedLikeActionProps = {
  postPublicId: string;
  initialState: FeedReactionStateDto;
  locale: 'ko' | 'en';
};

type FeedLikeResponse = {
  data?: FeedReactionStateDto;
  meta?: {
    recommendationSignal?: boolean;
    modelQualitySignal?: boolean;
    expectedReturnSignal?: boolean;
    realOrder?: boolean;
    brokerageConnection?: boolean;
    financialAdvice?: boolean;
  };
  error?: {
    message?: string;
  };
};

/**
 * FeedLikeAction changes only user-scoped FeedPost engagement state.
 * It does not create recommendations, order intent, broker actions, or portfolio changes.
 */
export function FeedLikeAction({
  postPublicId,
  initialState,
  locale
}: FeedLikeActionProps) {
  const [reactionState, setReactionState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isKorean = locale === 'ko';
  const actionTitle = reactionState.liked
    ? 'Liked by you. Popularity context only; not advice, return, or order signal.'
    : 'Not liked by you. Popularity context only; not advice, return, or order signal.';

  async function handleToggleLike() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/feed/${encodeURIComponent(postPublicId)}/likes`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-invest-model-role': 'user'
          },
          body: JSON.stringify({
            desiredState: !reactionState.liked
          })
        }
      );
      const body = (await response.json()) as FeedLikeResponse;

      if (!response.ok || !body.data) {
        setErrorMessage(
          body.error?.message ??
            (isKorean
              ? '좋아요 상태를 저장하지 못했습니다.'
              : 'Could not save the like state.')
        );
        return;
      }

      setReactionState(body.data);
    } catch {
      setErrorMessage(
        isKorean
          ? '좋아요 상태를 저장하지 못했습니다.'
          : 'Could not save the like state.'
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-invest-card border bg-invest-surface p-3 shadow-invest-card',
        reactionState.liked
          ? 'border-invest-primary/45'
          : 'border-invest-border'
      )}
    >
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isPending}
        aria-pressed={reactionState.liked}
        aria-live="polite"
        title={actionTitle}
        className={cn(
          'flex min-h-invest-touch-target w-full items-start justify-between gap-2 rounded-invest-control text-left disabled:cursor-wait disabled:opacity-80',
          investMotionClass.interactiveControl
        )}
      >
        <span className="min-w-0">
          <span className="block text-[12px] font-bold leading-4 text-invest-text-muted">
            {isKorean ? '좋아요' : 'Likes'}
          </span>
          <span className="mt-2 block text-xl font-bold leading-6 text-invest-text tabular-nums">
            {reactionState.likeCount}
          </span>
          <span className="mt-1 block text-[11px] font-semibold leading-4 text-invest-text-muted">
            {reactionState.liked
              ? isKorean
                ? '내가 누름'
                : 'Liked by you'
              : isKorean
                ? '인기 맥락'
                : 'Popularity context'}
          </span>
        </span>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-invest-control',
            reactionState.liked
              ? 'bg-invest-primary text-white'
              : 'bg-invest-primary-soft text-invest-primary'
          )}
        >
          {isPending ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Heart
              aria-hidden
              className={cn('size-4', reactionState.liked && 'fill-current')}
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
            ? '추천·수익·주문 신호가 아닌 참여 상태입니다.'
            : 'Engagement only; not advice, return, or order signal.'}
        </p>
      )}
    </div>
  );
}
