'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, SquareCheckBig } from 'lucide-react';
import { cn } from '@/lib/utils';
import { investMotionClass } from '@/components/invest-model/ui';

type ModelSelectionCtaCopy = {
  confirmLabel: string;
  confirmDescription: string;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  duplicateTitle: string;
  errorTitle: string;
  signedOutMessage: string;
  safetyLabel: string;
  persistedLabel: string;
  noLiveTradingLabel: string;
};

type SubmitState =
  | {
      status: 'idle';
    }
  | {
      status: 'success';
      message: string;
      selectionPublicId: string;
      duplicateActiveSelection: boolean;
    }
  | {
      status: 'error';
      message: string;
    };

type ModelSelectionCtaProps = {
  modelPublicId: string;
  modelVersionPublicId: string;
  copy: ModelSelectionCtaCopy;
};

type UserResponse = {
  publicId?: string;
};

type ModelSelectionResponse = {
  data?: {
    publicId?: string;
  };
  meta?: {
    duplicateActiveSelection?: boolean;
    persistence?: 'persisted' | 'not_persisted';
    realDeposit?: boolean;
    realOrder?: boolean;
    brokerageConnection?: boolean;
  };
  error?: {
    message?: string;
  };
};

/**
 * ModelSelectionCta records only a selected ModelVersion.
 * It does not move funds, create orders, connect brokerage accounts, or edit user investment preferences.
 */
export function ModelSelectionCta({
  modelPublicId,
  modelVersionPublicId,
  copy
}: ModelSelectionCtaProps) {
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: 'idle'
  });
  const successMetaLine =
    submitState.status === 'success'
      ? [
          copy.persistedLabel,
          copy.safetyLabel,
          submitState.selectionPublicId
        ].join(' / ')
      : '';
  const submitAccessibleLabel = `${copy.submitLabel}. ${copy.noLiveTradingLabel}`;

  async function handleSubmit() {
    if (!riskAcknowledged || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ status: 'idle' });

    try {
      const userResponse = await fetch('/api/user', {
        method: 'GET',
        headers: {
          accept: 'application/json'
        }
      });
      const user = (await userResponse.json()) as UserResponse | null;

      if (!userResponse.ok || !user?.publicId) {
        setSubmitState({
          status: 'error',
          message: copy.signedOutMessage
        });
        return;
      }

      const response = await fetch('/api/model-selections', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-invest-model-role': 'user'
        },
        body: JSON.stringify({
          modelPublicId,
          modelVersionPublicId,
          riskAcknowledgedAt: new Date().toISOString()
        })
      });
      const body = (await response.json()) as ModelSelectionResponse;

      if (!response.ok) {
        setSubmitState({
          status: 'error',
          message: body.error?.message ?? copy.errorTitle
        });
        return;
      }

      setSubmitState({
        status: 'success',
        message: body.meta?.duplicateActiveSelection
          ? copy.duplicateTitle
          : copy.successTitle,
        selectionPublicId: body.data?.publicId ?? 'model_selection_persisted',
        duplicateActiveSelection: Boolean(body.meta?.duplicateActiveSelection)
      });
    } catch {
      setSubmitState({
        status: 'error',
        message: copy.errorTitle
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <label
        className={cn(
          'flex min-h-invest-touch-target items-start gap-3 rounded-invest-control border bg-invest-bg-soft p-3',
          riskAcknowledged
            ? 'border-invest-primary/35 text-invest-text'
            : 'border-invest-border text-invest-text-muted',
          investMotionClass.interactiveCard
        )}
      >
        <input
          type="checkbox"
          checked={riskAcknowledged}
          onChange={(event) => setRiskAcknowledged(event.currentTarget.checked)}
          className="mt-0.5 size-5 shrink-0 rounded border-invest-border text-invest-primary"
        />
        <span className="min-w-0">
          <span className="block text-sm font-bold leading-5">
            {copy.confirmLabel}
          </span>
          <span className="mt-1 block text-xs leading-5 text-invest-text-muted">
            {copy.confirmDescription}
          </span>
        </span>
      </label>

      <button
        type="button"
        disabled={!riskAcknowledged || isSubmitting}
        aria-label={submitAccessibleLabel}
        aria-describedby="model-selection-review-status"
        title={submitAccessibleLabel}
        onClick={handleSubmit}
        className={cn(
          'relative inline-flex min-h-invest-touch-target w-full items-center justify-center gap-2 overflow-hidden rounded-invest-control border px-4 text-sm font-bold shadow-invest-card-strong',
          'border-invest-primary bg-invest-primary text-invest-surface disabled:cursor-not-allowed disabled:border-invest-text/10 disabled:bg-invest-text/55 disabled:opacity-80',
          investMotionClass.interactiveControl
        )}
      >
        {isSubmitting ? (
          <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />
        ) : (
          <SquareCheckBig aria-hidden className="size-4 shrink-0" />
        )}
        {isSubmitting ? copy.submittingLabel : copy.submitLabel}
        <span className="absolute inset-x-4 bottom-1.5 h-0.5 rounded-full bg-invest-surface/70" />
      </button>

      <p
        id="model-selection-review-status"
        className="text-center text-[12px] font-semibold leading-5 text-invest-text-muted"
      >
        {copy.noLiveTradingLabel}
      </p>

      {submitState.status !== 'idle' ? (
        <div className="rounded-invest-control border border-invest-border bg-invest-surface p-3 shadow-invest-card">
          <div className="flex gap-2.5">
            {submitState.status === 'success' ? (
              <CheckCircle2
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-invest-positive"
              />
            ) : (
              <AlertCircle
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-invest-risk"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold leading-5 text-invest-text">
                {submitState.message}
              </p>
              {submitState.status === 'success' ? (
                <div className="mt-2 rounded-invest-control bg-invest-bg-soft px-2 py-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
                  {successMetaLine}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
