'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Loader2 } from 'lucide-react';

import type { FeedReactionStateDto } from '@/lib/domain/feed/feed-post';
import { cn } from '@/lib/utils';

type FeedReadActionProps = {
  postPublicId: string;
  userPublicId: string;
  initialState: FeedReactionStateDto;
  locale: 'ko' | 'en';
};

type FeedReadResponse = {
  data?: FeedReactionStateDto;
  meta?: {
    privateReadingStateOnly?: boolean;
    recommendationSignal?: boolean;
    orderIntentSignal?: boolean;
    realOrder?: boolean;
    brokerageConnection?: boolean;
    financialAdvice?: boolean;
    complianceApproval?: boolean;
  };
  error?: {
    message?: string;
  };
};

function formatReadAt(value: string | undefined, locale: 'ko' | 'en') {
  if (!value) {
    return locale === 'ko' ? '읽음 기록 전' : 'Not marked yet';
  }

  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

/**
 * FeedReadAction marks private user-scoped FeedPost read state on detail view.
 * It is UI history only, not recommendation, compliance approval, or order intent.
 */
export function FeedReadAction({
  postPublicId,
  userPublicId,
  initialState,
  locale
}: FeedReadActionProps) {
  const [reactionState, setReactionState] = useState(initialState);
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>(
    initialState.read ? 'done' : 'pending'
  );
  const hasRequestedRef = useRef(false);
  const isKorean = locale === 'ko';

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    const controller = new AbortController();

    async function markAsRead() {
      setStatus('pending');

      try {
        const response = await fetch(
          `/api/feed/${encodeURIComponent(postPublicId)}/reads`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-invest-model-role': 'user'
            },
            body: JSON.stringify({
              userPublicId
            }),
            signal: controller.signal
          }
        );
        const body = (await response.json()) as FeedReadResponse;

        if (!response.ok || !body.data) {
          setStatus('error');
          return;
        }

        setReactionState(body.data);
        setStatus('done');
      } catch {
        if (!controller.signal.aborted) {
          setStatus('error');
        }
      }
    }

    void markAsRead();

    return () => {
      controller.abort();
    };
  }, [postPublicId, userPublicId]);

  const isDone = status === 'done' && reactionState.read;
  const isPending = status === 'pending';

  return (
    <div
      className={cn(
        'rounded-invest-card border bg-invest-surface p-3 shadow-invest-card',
        isDone ? 'border-invest-primary/35' : 'border-invest-border'
      )}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-[12px] font-bold leading-4 text-invest-text-muted">
            {isKorean ? '읽음' : 'Read'}
          </span>
          <span className="mt-2 block text-xl font-bold leading-6 text-invest-text">
            {isDone
              ? isKorean
                ? '완료'
                : 'Done'
              : isPending
                ? isKorean
                  ? '처리중'
                  : 'Marking'
                : isKorean
                  ? '대기'
                  : 'Pending'}
          </span>
          <span className="mt-1 block text-[11px] font-semibold leading-4 text-invest-text-muted">
            {formatReadAt(reactionState.readAt, locale)}
          </span>
        </span>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-invest-control',
            isDone
              ? 'bg-invest-primary text-white'
              : 'bg-invest-primary-soft text-invest-primary'
          )}
        >
          {isPending ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : isDone ? (
            <CheckCircle2 aria-hidden className="size-4" />
          ) : (
            <Eye aria-hidden className="size-4" />
          )}
        </span>
      </div>

      {status === 'error' ? (
        <p className="mt-2 flex gap-1.5 text-[11px] font-semibold leading-4 text-invest-risk">
          <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {isKorean
              ? '읽음 기록을 저장하지 못했습니다.'
              : 'Could not update read state.'}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-[11px] font-semibold leading-4 text-invest-text-muted">
          {isKorean
            ? '개인 읽기 기록이며 추천·주문·승인 신호가 아닙니다.'
            : 'Private reading history, not advice, order, or approval signal.'}
        </p>
      )}
    </div>
  );
}
