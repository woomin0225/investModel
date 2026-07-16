'use client';

import { RotateCcw, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { investMotionClass } from '@/components/invest-model';
import { cn } from '@/lib/utils';

export default function InvestModelError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const searchParams = useSearchParams();
  const locale = searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const copy =
    locale === 'ko'
      ? {
          eyebrow: '읽기 오류',
          title: 'mock 화면을 다시 읽을 수 있습니다',
          description:
            '로컬 DB 샘플과 mock 상태만 다시 읽습니다. 실제 계좌, 브로커, 입금, 주문, 외부 실시간 데이터 연결은 만들지 않습니다.',
          retry: '다시 읽기'
        }
      : {
          eyebrow: 'Read error',
          title: 'The mock screen can be retried',
          description:
            'Retries only local DB samples and mock state. It does not connect a real account, brokerage, deposit, orders, or realtime external data.',
          retry: 'Retry read'
        };

  return (
    <main className="min-h-dvh bg-invest-bg px-4 py-[calc(env(safe-area-inset-top)+24px)] text-invest-text">
      <section
        role="alert"
        aria-live="assertive"
        className="mx-auto flex min-h-[calc(100dvh-96px)] w-full max-w-[430px] flex-col justify-center"
      >
        <div className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-invest-control bg-invest-danger-soft text-invest-danger">
              <ShieldAlert aria-hidden className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase leading-5 text-invest-danger">
                {copy.eyebrow}
              </p>
              <h1 className="mt-1 text-[20px] font-bold leading-7">
                {copy.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                {copy.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            aria-label={`${copy.retry}. ${copy.description}`}
            title={`${copy.retry}. ${copy.description}`}
            className={cn(
              'mt-5 inline-flex min-h-invest-touch-target w-full items-center justify-center gap-2 rounded-invest-control border border-invest-border bg-invest-bg-soft px-3 text-sm font-bold text-invest-primary focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
              investMotionClass.interactiveControl
            )}
          >
            <RotateCcw aria-hidden className="size-4" />
            <span>{copy.retry}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
