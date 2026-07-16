import { MobileShell } from '@/components/invest-model';
import { investModelCopy } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type SkeletonBlockProps = {
  className?: string;
};

function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-invest-control bg-invest-surface-muted motion-safe:animate-pulse',
        className
      )}
    />
  );
}

function HomeMetricSkeleton() {
  return (
    <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="mt-3 h-8 w-24" />
        </div>
        <SkeletonBlock className="h-6 w-14 rounded-invest-badge" />
      </div>
      <SkeletonBlock className="mt-3 h-5 w-full" />
      <SkeletonBlock className="mt-2 h-5 w-4/5" />
    </article>
  );
}

function HomeTimelineSkeleton({ index }: { index: number }) {
  return (
    <article
      role="listitem"
      className="rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card"
    >
      <SkeletonBlock
        className={cn(
          'mb-3 h-1.5 origin-left rounded-full',
          index === 0 ? 'w-11/12' : 'w-3/4'
        )}
      />
      <div className="flex items-start gap-3">
        <SkeletonBlock className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-2 h-5 w-full" />
            </div>
            <div className="shrink-0">
              <SkeletonBlock className="h-3 w-10" />
              <SkeletonBlock className="ml-auto mt-2 h-4 w-16" />
            </div>
          </div>
          <SkeletonBlock className="mt-3 h-5 w-full" />
          <SkeletonBlock className="mt-2 h-5 w-10/12" />
          <SkeletonBlock className="mt-3 h-8 w-full" />
        </div>
      </div>
    </article>
  );
}

export default function InvestModelHomeLoading() {
  const copy = investModelCopy.ko.home;

  return (
    <MobileShell
      activeTab="home"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale="ko"
      currentPath="/invest-model"
    >
      <section
        aria-busy="true"
        aria-label="Loading DB and mock-only home summary. No live account, deposit, order, brokerage connection, or external realtime fetch is running."
        data-home-loading-skeleton="mock-only"
        className="space-y-invest-section-gap"
      >
        <span className="sr-only">
          Loading DB and mock-only home summary. No live account, deposit,
          order, brokerage connection, or external realtime fetch is running.
        </span>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">
          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <div className="min-w-0">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-2 h-6 w-44 max-w-full" />
              <SkeletonBlock className="mt-2 h-4 w-28" />
            </div>
            <div className="min-w-[104px] rounded-invest-control bg-invest-bg-soft px-3 py-2">
              <SkeletonBlock className="ml-auto h-3 w-16" />
              <SkeletonBlock className="ml-auto mt-2 h-5 w-20" />
            </div>
          </div>
          <div className="mt-3 flex min-w-0 items-start gap-2 rounded-invest-control bg-invest-surface-muted px-3 py-2">
            <SkeletonBlock className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="mt-2 h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-10/12" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <HomeMetricSkeleton />
          <HomeMetricSkeleton />
        </div>

        <div className="grid gap-2 rounded-invest-card border border-invest-border bg-invest-surface-muted p-2.5 min-[360px]:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex min-w-0 items-center gap-2 rounded-invest-control bg-invest-surface px-2 py-2 shadow-invest-card"
            >
              <SkeletonBlock className="size-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-3 w-14" />
                <SkeletonBlock className="mt-1.5 h-4 w-16" />
                <SkeletonBlock className="mt-1.5 h-3 w-12" />
              </div>
            </div>
          ))}
        </div>

        <HomeMetricSkeleton />

        <div className="space-y-invest-card-gap">
          <div className="space-y-1">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-9/12" />
          </div>
          <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="mt-3 h-5 w-full" />
            <SkeletonBlock className="mt-2 h-5 w-10/12" />
            <div className="mt-4 flex flex-wrap gap-2">
              <SkeletonBlock className="h-6 w-20 rounded-invest-badge" />
              <SkeletonBlock className="h-6 w-24 rounded-invest-badge" />
              <SkeletonBlock className="h-6 w-16 rounded-invest-badge" />
            </div>
          </article>
        </div>

        <div className="space-y-invest-card-gap">
          <div className="space-y-1">
            <SkeletonBlock className="h-6 w-36" />
            <SkeletonBlock className="h-4 w-11/12" />
          </div>
          <div
            role="list"
            aria-label="Loading mock-only home activity"
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {[0, 1].map((item) => (
              <HomeTimelineSkeleton key={item} index={item} />
            ))}
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
