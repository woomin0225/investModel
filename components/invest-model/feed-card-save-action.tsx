'use client';

import { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';

import { investMotionClass } from '@/components/invest-model/ui';
import type { FeedReactionStateDto } from '@/lib/domain/feed/feed-post';
import { cn } from '@/lib/utils';

type FeedCardSaveActionProps = {
  postPublicId: string;
  userPublicId: string;
  label: string;
  ariaLabel: string;
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
  userPublicId,
  label,
  ariaLabel
}: FeedCardSaveActionProps) {
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          body: JSON.stringify({ userPublicId })
        }
      );
      const body = (await response.json()) as FeedCardSaveResponse;

      if (!response.ok || !body.data) {
        setErrorMessage(body.error?.message ?? 'Could not update saved state.');
        return;
      }

      setSaved(body.data.saved);
    } catch {
      setErrorMessage('Could not update saved state.');
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
        errorMessage ? `${ariaLabel} Last update failed.` : ariaLabel
      }
      aria-pressed={saved}
      title={
        saved
          ? 'Saved as a private reading shortcut. Not model selection, allocation, or order intent.'
          : ariaLabel
      }
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
