'use client';

import { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';

import { investMotionClass } from '@/components/invest-model/ui';
import type { FeedReactionStateDto } from '@/lib/domain/feed/feed-post';
import { cn } from '@/lib/utils';

type FeedCardSaveActionProps = {
  postPublicId: string;
  label: string;
  ariaLabel: string;
  locale: 'ko' | 'en';
};

type FeedCardSaveResponse = {
  data?: FeedReactionStateDto;
  error?: {
    message?: string;
  };
};

/**
 * Toggles only user-scoped FeedPost saved state from the feed list.
 * It is a private reading shortcut, not model selection, allocation, or order intent.
 */
export function FeedCardSaveAction({
  postPublicId,
  label,
  ariaLabel,
  locale
}: FeedCardSaveActionProps) {
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isKorean = locale === 'ko';
  const fallbackErrorMessage = isKorean
    ? '저장 상태를 업데이트하지 못했습니다.'
    : 'Could not update saved state.';
  const failureAriaSuffix = isKorean
    ? '마지막 업데이트에 실패했습니다.'
    : 'Last update failed.';
  const savedTitle = isKorean
    ? '비공개 읽기 바로가기로 저장되었습니다. 모델 선택, 배분, 주문 의도가 아닙니다.'
    : 'Saved as a private reading shortcut. Not model selection, allocation, or order intent.';

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
          body: JSON.stringify({})
        }
      );
      const body = (await response.json()) as FeedCardSaveResponse;

      if (!response.ok || !body.data) {
        setErrorMessage(body.error?.message ?? fallbackErrorMessage);
        return;
      }

      setSaved(body.data.saved);
    } catch {
      setErrorMessage(fallbackErrorMessage);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggleSave}
      disabled={isPending}
      aria-label={
        errorMessage ? `${ariaLabel} ${failureAriaSuffix}` : ariaLabel
      }
      aria-pressed={saved}
      title={saved ? savedTitle : ariaLabel}
      className={cn(
        'relative z-20 group inline-flex min-h-9 items-center justify-center gap-1.5 rounded-invest-control border px-2 text-[12px] font-semibold leading-4 disabled:cursor-wait disabled:opacity-80',
        saved
          ? 'border-invest-primary/20 bg-invest-primary-soft text-invest-primary'
          : 'border-transparent bg-invest-bg-soft text-invest-text-muted hover:text-invest-primary',
        investMotionClass.interactiveControl
      )}
    >
      {isPending ? (
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
      ) : (
        <Bookmark
          aria-hidden
          className={cn(
            'size-3.5 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100',
            saved && 'fill-current'
          )}
        />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
