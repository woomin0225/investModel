'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AlertCircle, Loader2, MessageCircle, Reply, Send } from 'lucide-react';

import {
  investMotionClass,
  RiskBadge,
  SectionHeader
} from '@/components/invest-model/ui';
import type {
  FeedCommentDto,
  FeedPostDetailDto,
  FeedReactionStateDto
} from '@/lib/domain/feed/feed-post';
import { cn } from '@/lib/utils';

type FeedCommentActionProps = {
  postPublicId: string;
  initialComments: FeedCommentDto[];
  initialState: FeedReactionStateDto;
  locale: 'ko' | 'en';
};

type FeedCommentResponse = {
  data?: FeedPostDetailDto;
  meta?: {
    informationalOnly?: boolean;
    discussionOnly?: boolean;
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

const maxCommentLength = 600;

function formatPublishedAt(value: string | undefined, locale: 'ko' | 'en') {
  if (!value) {
    return locale === 'ko' ? 'Time pending' : 'Time pending';
  }

  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function feedCommentVisibleBoundaries(locale: 'ko' | 'en') {
  return locale === 'ko'
    ? [
        'DB comment thread',
        '사용자 반응',
        '정보성 토론',
        '추천 아님',
        '주문 아님'
      ]
    : [
        'DB comment thread',
        'user interaction',
        'informational discussion',
        'not advice',
        'not an order'
      ];
}

function CommentItem({
  comment,
  postPublicId,
  locale,
  depth = 0,
  onThreadUpdated
}: {
  comment: FeedCommentDto;
  postPublicId: string;
  locale: 'ko' | 'en';
  depth?: number;
  onThreadUpdated: (detail: FeedPostDetailDto) => void;
}) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [isReplyPending, setIsReplyPending] = useState(false);
  const [replyErrorMessage, setReplyErrorMessage] = useState<string | null>(
    null
  );
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(
    null
  );
  const isKorean = locale === 'ko';
  const replyRemainingCount = maxCommentLength - replyDraft.length;
  const canSubmitReply =
    replyDraft.trim().length > 0 &&
    replyDraft.trim().length <= maxCommentLength;
  const replyHelperId = `feed-reply-helper-${comment.commentPublicId}`;
  const replyErrorId = `feed-reply-error-${comment.commentPublicId}`;
  const replySuccessId = `feed-reply-success-${comment.commentPublicId}`;
  const replyDescriptionIds = [
    replyHelperId,
    replyErrorMessage ? replyErrorId : null,
    replySuccessMessage ? replySuccessId : null
  ]
    .filter(Boolean)
    .join(' ');
  const replyToggleTitle = isReplyOpen
    ? 'Close informational reply form. No advice, order, or approval is created.'
    : 'Open informational reply form. Replies are discussion-only and do not create advice, orders, or approvals.';
  const replySubmitLabel = isReplyPending
    ? 'Posting informational reply. No order, brokerage action, advice, or approval is created.'
    : canSubmitReply
      ? 'Post informational reply. No order, brokerage action, advice, or approval is created.'
      : 'Enter an informational reply within 600 characters before posting.';

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDraft = replyDraft.trim();

    if (isReplyPending || trimmedDraft.length === 0) {
      return;
    }

    if (trimmedDraft.length > maxCommentLength) {
      setReplyErrorMessage(
        isKorean
          ? 'Reply must be 600 characters or fewer.'
          : 'Reply must be 600 characters or fewer.'
      );
      return;
    }

    setIsReplyPending(true);
    setReplyErrorMessage(null);
    setReplySuccessMessage(null);

    try {
      const response = await fetch(
        `/api/feed/${encodeURIComponent(postPublicId)}/comments/${encodeURIComponent(
          comment.commentPublicId
        )}/replies`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-invest-model-role': 'user'
          },
          body: JSON.stringify({
            body: trimmedDraft
          })
        }
      );
      const body = (await response.json()) as FeedCommentResponse;

      if (!response.ok || !body.data) {
        setReplyErrorMessage(
          body.error?.message ??
            (isKorean
              ? 'Could not add this informational reply.'
              : 'Could not add this informational reply.')
        );
        return;
      }

      onThreadUpdated(body.data);
      setReplyDraft('');
      setIsReplyOpen(false);
      setReplySuccessMessage(
        isKorean
          ? 'Reply added to the discussion.'
          : 'Reply added to the discussion.'
      );
    } catch {
      setReplyErrorMessage(
        isKorean
          ? 'Could not add this informational reply.'
          : 'Could not add this informational reply.'
      );
    } finally {
      setIsReplyPending(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card',
        depth > 0 && 'ml-5 border-invest-primary/15 bg-invest-primary-soft/25'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-5 text-invest-text">
            {comment.authorDisplayName}
          </p>
          <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
            {formatPublishedAt(comment.createdAt, locale)}
          </p>
        </div>
        {comment.replyCount > 0 ? (
          <RiskBadge tone="neutral">
            {locale === 'ko'
              ? `Replies ${comment.replyCount}`
              : `${comment.replyCount} replies`}
          </RiskBadge>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-invest-text-muted">
        {comment.body}
      </p>
      <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-2 py-2 text-[11px] font-semibold leading-5 text-invest-text-muted">
        {feedCommentVisibleBoundaries(locale).join(' / ')}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsReplyOpen((current) => !current);
            setReplyErrorMessage(null);
            setReplySuccessMessage(null);
          }}
          className={cn(
            'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 text-[12px] font-bold text-invest-text hover:border-invest-primary hover:text-invest-primary focus:border-invest-primary focus:outline-none disabled:cursor-wait disabled:opacity-70',
            isReplyOpen && 'border-invest-primary text-invest-primary',
            investMotionClass.interactiveControl
          )}
          aria-expanded={isReplyOpen}
          title={replyToggleTitle}
        >
          <Reply aria-hidden className="size-3.5" />
          {isKorean ? 'Reply' : 'Reply'}
        </button>
        {replySuccessMessage ? (
          <span
            id={replySuccessId}
            role="status"
            className="text-[11px] font-semibold leading-4 text-invest-primary"
          >
            {replySuccessMessage}
          </span>
        ) : null}
      </div>

      {isReplyOpen ? (
        <form
          onSubmit={handleReplySubmit}
          className="mt-3 rounded-invest-control border border-invest-border bg-invest-bg-soft p-2.5"
        >
          <p className="mb-2 rounded-invest-control bg-invest-surface px-2 py-2 text-[11px] font-semibold leading-5 text-invest-text-muted">
            {feedCommentVisibleBoundaries(locale).join(' / ')}
          </p>
          <textarea
            value={replyDraft}
            onChange={(event) => {
              setReplyDraft(event.target.value);
              setReplyErrorMessage(null);
              setReplySuccessMessage(null);
            }}
            disabled={isReplyPending}
            rows={3}
            maxLength={maxCommentLength + 20}
            placeholder={
              isKorean
                ? 'Add an informational reply.'
                : 'Add an informational reply.'
            }
            className={cn(
              'min-h-20 w-full resize-none rounded-invest-control border border-invest-border bg-invest-surface px-3 py-2 text-sm font-semibold leading-6 text-invest-text outline-none placeholder:text-invest-text-muted/70 focus:border-invest-primary disabled:cursor-wait disabled:opacity-75',
              investMotionClass.interactiveControl
            )}
            aria-label={
              isKorean ? 'Informational reply body' : 'Informational reply body'
            }
            aria-describedby={replyDescriptionIds}
            title="Informational reply only. This does not create advice, orders, brokerage actions, or approvals."
          />
          <div className="mt-2 flex items-start justify-between gap-3">
            <p
              id={replyHelperId}
              className={cn(
                'text-[11px] font-semibold leading-4',
                replyRemainingCount < 0
                  ? 'text-invest-risk'
                  : 'text-invest-text-muted'
              )}
            >
              {replyRemainingCount < 0
                ? isKorean
                  ? 'Reply is over the 600 character limit.'
                  : 'Reply is over the 600 character limit.'
                : isKorean
                  ? 'Informational reply only. No advice, order, or approval is created.'
                  : 'Informational reply only. No advice, order, or approval is created.'}
            </p>
            <span
              className={cn(
                'shrink-0 text-[11px] font-bold leading-4 tabular-nums',
                replyRemainingCount < 0
                  ? 'text-invest-risk'
                  : 'text-invest-text-muted'
              )}
            >
              {replyRemainingCount}
            </span>
          </div>
          <button
            type="submit"
            disabled={!canSubmitReply || isReplyPending}
            className={cn(
              'mt-2 inline-flex min-h-invest-touch-target w-full items-center justify-center gap-2 rounded-invest-control bg-invest-primary px-4 text-sm font-bold text-white shadow-invest-card disabled:cursor-not-allowed disabled:bg-invest-text-muted/40',
              investMotionClass.interactiveControl
            )}
            aria-label={replySubmitLabel}
            title={replySubmitLabel}
          >
            {isReplyPending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Send aria-hidden className="size-4" />
            )}
            {isKorean ? 'Post reply' : 'Post reply'}
          </button>
          {replyErrorMessage ? (
            <p
              id={replyErrorId}
              role="alert"
              className="mt-2 flex gap-1.5 text-[11px] font-semibold leading-4 text-invest-risk"
            >
              <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>{replyErrorMessage}</span>
            </p>
          ) : null}
        </form>
      ) : null}

      {comment.replies?.length ? (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.commentPublicId}
              comment={reply}
              postPublicId={postPublicId}
              locale={locale}
              depth={depth + 1}
              onThreadUpdated={onThreadUpdated}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * FeedCommentAction creates informational FeedPost comments only.
 * It does not create recommendations, orders, broker actions, or approvals.
 */
export function FeedCommentAction({
  postPublicId,
  initialComments,
  initialState,
  locale
}: FeedCommentActionProps) {
  const [comments, setComments] = useState(initialComments);
  const [reactionState, setReactionState] = useState(initialState);
  const [draft, setDraft] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isKorean = locale === 'ko';
  const remainingCount = maxCommentLength - draft.length;
  const canSubmit =
    draft.trim().length > 0 && draft.trim().length <= maxCommentLength;
  const commentHelperId = 'feed-comment-helper';
  const commentErrorId = 'feed-comment-error';
  const commentSuccessId = 'feed-comment-success';
  const commentDescriptionIds = [
    commentHelperId,
    errorMessage ? commentErrorId : null,
    successMessage ? commentSuccessId : null
  ]
    .filter(Boolean)
    .join(' ');
  const commentSubmitLabel = isPending
    ? 'Posting informational comment. No order, brokerage action, advice, or approval is created.'
    : canSubmit
      ? 'Post informational comment. No order, brokerage action, advice, or approval is created.'
      : 'Enter an informational comment within 600 characters before posting.';

  const helperText = useMemo(() => {
    if (remainingCount < 0) {
      return isKorean
        ? 'Comment is over the 600 character limit.'
        : 'Comment is over the 600 character limit.';
    }

    return isKorean
      ? 'Informational discussion only. No advice, order, or approval is created.'
      : 'Informational discussion only. No advice, order, or approval is created.';
  }, [isKorean, remainingCount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (isPending || trimmedDraft.length === 0) {
      return;
    }

    if (trimmedDraft.length > maxCommentLength) {
      setErrorMessage(
        isKorean
          ? 'Comment must be 600 characters or fewer.'
          : 'Comment must be 600 characters or fewer.'
      );
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/feed/${encodeURIComponent(postPublicId)}/comments`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-invest-model-role': 'user'
          },
          body: JSON.stringify({
            body: trimmedDraft
          })
        }
      );
      const body = (await response.json()) as FeedCommentResponse;

      if (!response.ok || !body.data) {
        setErrorMessage(
          body.error?.message ??
            (isKorean
              ? 'Could not add this informational comment.'
              : 'Could not add this informational comment.')
        );
        return;
      }

      setComments(body.data.comments);
      setReactionState(body.data.userState);
      setDraft('');
      setSuccessMessage(
        isKorean
          ? 'Comment added to the discussion.'
          : 'Comment added to the discussion.'
      );
    } catch {
      setErrorMessage(
        isKorean
          ? 'Could not add this informational comment.'
          : 'Could not add this informational comment.'
      );
    } finally {
      setIsPending(false);
    }
  }

  function handleThreadUpdated(detail: FeedPostDetailDto) {
    setComments(detail.comments);
    setReactionState(detail.userState);
  }

  return (
    <div className="space-y-invest-card-gap">
      <SectionHeader
        title={isKorean ? 'Comments' : 'Comments'}
        description={
          isKorean
            ? `${reactionState.commentCount} DB-backed discussion comments.`
            : `${reactionState.commentCount} DB-backed discussion comments.`
        }
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card"
      >
        <label
          htmlFor="feed-comment-body"
          className="flex items-center gap-2 text-[12px] font-bold leading-4 text-invest-text"
        >
          <MessageCircle aria-hidden className="size-4 text-invest-primary" />
          {isKorean ? 'Add comment' : 'Add comment'}
        </label>
        <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-2 py-2 text-[11px] font-semibold leading-5 text-invest-text-muted">
          {feedCommentVisibleBoundaries(locale).join(' / ')}
        </p>
        <textarea
          id="feed-comment-body"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          disabled={isPending}
          rows={4}
          maxLength={maxCommentLength + 20}
          placeholder={
            isKorean
              ? 'Share an informational market or model note.'
              : 'Share an informational market or model note.'
          }
          className={cn(
            'mt-3 min-h-28 w-full resize-none rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 py-2 text-sm font-semibold leading-6 text-invest-text outline-none placeholder:text-invest-text-muted/70 focus:border-invest-primary focus:bg-invest-surface disabled:cursor-wait disabled:opacity-75',
            investMotionClass.interactiveControl
          )}
          aria-describedby={commentDescriptionIds}
          title="Informational discussion only. This does not create advice, orders, brokerage actions, or approvals."
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <p
            id={commentHelperId}
            className={cn(
              'text-[11px] font-semibold leading-4',
              remainingCount < 0 ? 'text-invest-risk' : 'text-invest-text-muted'
            )}
          >
            {helperText}
          </p>
          <span
            className={cn(
              'shrink-0 text-[11px] font-bold leading-4 tabular-nums',
              remainingCount < 0 ? 'text-invest-risk' : 'text-invest-text-muted'
            )}
          >
            {remainingCount}
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className={cn(
            'mt-3 inline-flex min-h-invest-touch-target w-full items-center justify-center gap-2 rounded-invest-control bg-invest-primary px-4 text-sm font-bold text-white shadow-invest-card disabled:cursor-not-allowed disabled:bg-invest-text-muted/40',
            investMotionClass.interactiveControl
          )}
          aria-label={commentSubmitLabel}
          title={commentSubmitLabel}
        >
          {isPending ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Send aria-hidden className="size-4" />
          )}
          {isKorean ? 'Post comment' : 'Post comment'}
        </button>

        {errorMessage ? (
          <p
            id={commentErrorId}
            role="alert"
            className="mt-3 flex gap-1.5 text-[11px] font-semibold leading-4 text-invest-risk"
          >
            <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        ) : null}
        {successMessage ? (
          <p
            id={commentSuccessId}
            role="status"
            className="mt-3 text-[11px] font-semibold leading-4 text-invest-primary"
          >
            {successMessage}
          </p>
        ) : null}
      </form>

      <div className="space-y-2.5" aria-live="polite">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentPublicId}
              comment={comment}
              postPublicId={postPublicId}
              locale={locale}
              onThreadUpdated={handleThreadUpdated}
            />
          ))
        ) : (
          <div className="rounded-invest-card border border-dashed border-invest-border bg-invest-surface p-5 text-sm font-semibold leading-6 text-invest-text-muted">
            {isKorean ? 'No comments yet.' : 'There are no comments yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
