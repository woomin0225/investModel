'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, Loader2 } from 'lucide-react';
import { investMotionClass } from '@/components/invest-model/ui';
import type { ModelSelectionReadStatusCopy } from './model-selection-read-status-copy';
import { cn } from '@/lib/utils';

type ModelSelectionReadStatusProps = {
  copy: ModelSelectionReadStatusCopy;
};

type UserResponse = {
  publicId?: string;
};

type ModelSelectionReadResponse = {
  data?: {
    publicId?: string;
    modelPublicId?: string;
    modelVersionPublicId?: string;
    riskAcknowledgedAt?: string;
  } | null;
  meta?: {
    activeSelectionFound?: boolean;
    realDeposit?: boolean;
    realOrder?: boolean;
    brokerageConnection?: boolean;
  };
  error?: {
    message?: string;
  };
};

type ReadState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | {
      status: 'ready';
      selectionPublicId: string;
      modelPublicId: string;
      modelVersionPublicId: string;
      riskAcknowledgedAt: string;
    }
  | { status: 'error'; message: string };

/**
 * ModelSelectionReadStatus reads the user's selected ModelVersion from the DB-backed API.
 * It never reads or displays real cash, orders, brokerage accounts, or suitability settings.
 */
export function ModelSelectionReadStatus({
  copy
}: ModelSelectionReadStatusProps) {
  const [readState, setReadState] = useState<ReadState>({
    status: 'loading'
  });

  useEffect(() => {
    let isMounted = true;

    async function readSelection() {
      try {
        const userResponse = await fetch('/api/user', {
          headers: {
            accept: 'application/json'
          }
        });
        const user = (await userResponse.json()) as UserResponse | null;

        if (!userResponse.ok || !user?.publicId) {
          if (isMounted) {
            setReadState({ status: 'empty', message: copy.signedOut });
          }
          return;
        }

        const response = await fetch('/api/model-selections', {
          headers: {
            accept: 'application/json',
            'x-invest-model-role': 'user'
          }
        });
        const body = (await response.json()) as ModelSelectionReadResponse;

        if (!response.ok) {
          if (isMounted) {
            setReadState({
              status: 'error',
              message: body.error?.message ?? copy.error
            });
          }
          return;
        }

        if (!body.data || body.meta?.activeSelectionFound === false) {
          if (isMounted) {
            setReadState({ status: 'empty', message: copy.empty });
          }
          return;
        }

        if (isMounted) {
          setReadState({
            status: 'ready',
            selectionPublicId:
              body.data.publicId ?? 'model_selection_db_persisted',
            modelPublicId: body.data.modelPublicId ?? 'model_db_public_id',
            modelVersionPublicId:
              body.data.modelVersionPublicId ?? 'model_version_db_public_id',
            riskAcknowledgedAt:
              body.data.riskAcknowledgedAt ?? new Date().toISOString()
          });
        }
      } catch {
        if (isMounted) {
          setReadState({ status: 'error', message: copy.error });
        }
      }
    }

    readSelection();

    return () => {
      isMounted = false;
    };
  }, [copy]);

  const isReady = readState.status === 'ready';
  const boundaryLine = [isReady ? copy.persisted : null, copy.noRealAction]
    .filter((item): item is string => Boolean(item))
    .join(' / ');

  return (
    <aside
      aria-live="polite"
      className={cn(
        'mt-3 rounded-invest-control border border-invest-primary/15 bg-invest-primary-soft/45 p-3',
        investMotionClass.interactiveCard
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-invest-control bg-invest-surface text-invest-primary shadow-invest-card">
          {readState.status === 'loading' ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : isReady ? (
            <CheckCircle2 aria-hidden className="size-4" />
          ) : readState.status === 'error' ? (
            <AlertCircle aria-hidden className="size-4 text-invest-risk" />
          ) : (
            <Database aria-hidden className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-5 text-invest-text">
            {copy.title}
          </p>

          {readState.status === 'loading' ? (
            <p className="mt-1 text-xs font-semibold leading-5 text-invest-text-muted">
              {copy.loading}
            </p>
          ) : null}

          {readState.status === 'empty' || readState.status === 'error' ? (
            <p
              className={cn(
                'mt-1 text-xs font-semibold leading-5',
                readState.status === 'error'
                  ? 'text-invest-risk'
                  : 'text-invest-text-muted'
              )}
            >
              {readState.message}
            </p>
          ) : null}

          {isReady ? (
            <dl className="mt-2 grid gap-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
              <div className="grid gap-0.5 rounded-invest-control bg-invest-surface/75 px-2 py-1.5">
                <dt className="text-invest-text">{copy.selectionLabel}</dt>
                <dd className="break-all">{readState.selectionPublicId}</dd>
              </div>
              <div className="grid gap-0.5 rounded-invest-control bg-invest-surface/75 px-2 py-1.5">
                <dt className="text-invest-text">{copy.modelLabel}</dt>
                <dd className="break-all">{readState.modelPublicId}</dd>
              </div>
              <div className="grid gap-0.5 rounded-invest-control bg-invest-surface/75 px-2 py-1.5">
                <dt className="text-invest-text">{copy.versionLabel}</dt>
                <dd className="break-all">{readState.modelVersionPublicId}</dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-2 rounded-invest-control bg-invest-surface/75 px-2 py-1.5 text-[11px] font-semibold leading-4 text-invest-text-muted">
            {boundaryLine}
          </div>
        </div>
      </div>
    </aside>
  );
}
