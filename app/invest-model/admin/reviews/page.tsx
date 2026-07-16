import { ClipboardCheck, FileWarning } from 'lucide-react';
import Link from 'next/link';

import {
  MobileFilterRail,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner,
  investCardClass,
  investMotionClass
} from '@/components/invest-model';
import {
  readAdminReviewQueueSeedFixture,
  type AdminReviewQueueItem,
  type AdminReviewQueueStatus,
  type AdminReviewQueueTone
} from '@/lib/db/admin-review-queue-read-model';
import {
  resolveInvestModelLocale,
  type InvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

const queueStatusFilters = [
  { id: 'all', label: 'All', shortLabel: 'All' },
  { id: 'pending_review', label: 'Pending review', shortLabel: 'Pending' },
  { id: 'rejected', label: 'Rejected', shortLabel: 'Rejected' },
  { id: 'paused', label: 'Paused', shortLabel: 'Paused' }
] as const;

type QueueFilterId = (typeof queueStatusFilters)[number]['id'];

const queueCopy = {
  ko: {
    eyebrow: 'Admin',
    title: 'Review Queue',
    noticeEyebrow: 'metadata only',
    noticeTitle: 'Admin review queue',
    noticeDescription:
      'Read-only model review metadata from the admin queue API contract. No legal judgment, final suitability approval, order, broker connection, or deposit movement is created here.',
    sectionTitle: 'Queue items',
    sectionDescription:
      'Filter pending, rejected, and paused review rows without changing model status.',
    filtersLabel: 'Admin review queue filters',
    countLabel: 'items',
    sourceLabel: 'Source',
    statusLabel: 'Queue status',
    modelStatusLabel: 'Model',
    reviewStatusLabel: 'Review',
    modelPublicIdLabel: 'Model public ID',
    versionPublicIdLabel: 'Version public ID',
    reviewTypeLabel: 'Review type',
    submittedLabel: 'Submitted',
    reviewedLabel: 'Reviewed',
    actorLabel: 'Actor',
    reasonLabel: 'Reason placeholder',
    safetyLabel: 'Safety boundary',
    noReviewedAt: 'Not reviewed yet',
    actionDisabled:
      'Metadata review only. Status transitions, publication, and notifications stay disabled.',
    emptyTitle: 'No queue items',
    emptyDescription:
      'Seed or mock ComplianceReview rows are required before this filter shows items.',
    footer:
      'This queue mirrors /api/admin/reviews/queue fields for operators. It does not finalize disclosures, execute models, create TradeIntent rows, place real orders, connect brokerage accounts, or move deposits.'
  },
  en: {
    eyebrow: 'Admin',
    title: 'Review Queue',
    noticeEyebrow: 'metadata only',
    noticeTitle: 'Admin review queue',
    noticeDescription:
      'Read-only model review metadata from the admin queue API contract. No legal judgment, final suitability approval, order, broker connection, or deposit movement is created here.',
    sectionTitle: 'Queue items',
    sectionDescription:
      'Filter pending, rejected, and paused review rows without changing model status.',
    filtersLabel: 'Admin review queue filters',
    countLabel: 'items',
    sourceLabel: 'Source',
    statusLabel: 'Queue status',
    modelStatusLabel: 'Model',
    reviewStatusLabel: 'Review',
    modelPublicIdLabel: 'Model public ID',
    versionPublicIdLabel: 'Version public ID',
    reviewTypeLabel: 'Review type',
    submittedLabel: 'Submitted',
    reviewedLabel: 'Reviewed',
    actorLabel: 'Actor',
    reasonLabel: 'Reason placeholder',
    safetyLabel: 'Safety boundary',
    noReviewedAt: 'Not reviewed yet',
    actionDisabled:
      'Metadata review only. Status transitions, publication, and notifications stay disabled.',
    emptyTitle: 'No queue items',
    emptyDescription:
      'Seed or mock ComplianceReview rows are required before this filter shows items.',
    footer:
      'This queue mirrors /api/admin/reviews/queue fields for operators. It does not finalize disclosures, execute models, create TradeIntent rows, place real orders, connect brokerage accounts, or move deposits.'
  }
} as const;

const statusTone: Record<AdminReviewQueueStatus, 'medium' | 'high' | 'neutral'> = {
  pending_review: 'medium',
  rejected: 'high',
  paused: 'neutral'
};

const cardAccentClass: Record<AdminReviewQueueTone, string> = {
  attention: 'border-l-invest-warning',
  risk: 'border-l-invest-risk',
  muted: 'border-l-invest-border'
};

type AdminModelReviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminModelReviewsPage({
  searchParams
}: AdminModelReviewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const activeFilter = resolveQueueFilter(resolvedSearchParams?.status);
  const items = await readAdminReviewQueueSeedFixture();
  const visibleItems =
    activeFilter === 'all'
      ? items
      : items.filter((item) => item.queueStatus === activeFilter);
  const counts = countQueueStatuses(items);
  const copy = queueCopy[locale];

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/admin/reviews"
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.noticeEyebrow}
          title={copy.noticeTitle}
          description={copy.noticeDescription}
          icon={ClipboardCheck}
        />

        <section className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.sectionTitle}
            description={copy.sectionDescription}
          />

          <MobileFilterRail ariaLabel={copy.filtersLabel}>
            {queueStatusFilters.map((filter) => {
              const isActive = filter.id === activeFilter;
              const count =
                filter.id === 'all' ? items.length : counts[filter.id];

              return (
                <Link
                  key={filter.id}
                  href={buildFilterHref(locale, filter.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-invest-touch-target min-w-0 items-center justify-between gap-2 rounded-invest-control px-3 py-2 text-left text-sm font-bold leading-5',
                    investMotionClass.interactiveControl,
                    isActive
                      ? 'bg-invest-primary text-invest-surface'
                      : 'bg-invest-surface text-invest-text'
                  )}
                >
                  <span className="min-w-0 truncate">{filter.shortLabel}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded-invest-badge px-2 py-0.5 text-[11px] leading-4',
                      isActive
                        ? 'bg-invest-surface/20 text-invest-surface'
                        : 'bg-invest-surface-muted text-invest-text-muted'
                    )}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </MobileFilterRail>

          <div className="space-y-invest-card-gap">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => (
                <AdminReviewQueueCard
                  key={item.reviewPublicId}
                  item={item}
                  locale={locale}
                />
              ))
            ) : (
              <EmptyQueueMessage locale={locale} />
            )}
          </div>
        </section>

        <p className={cn(investCardClass.mutedPanel, 'text-sm leading-6 text-invest-text-muted')}>
          {copy.footer}
        </p>
      </section>
    </MobileShell>
  );
}

function AdminReviewQueueCard({
  item,
  locale
}: {
  item: AdminReviewQueueItem;
  locale: InvestModelLocale;
}) {
  const copy = queueCopy[locale];

  return (
    <article
      className={cn(
        investCardClass.surface,
        'border-l-4',
        cardAccentClass[item.tone]
      )}
      data-review-public-id={item.reviewPublicId}
      data-review-metadata-only={item.sourceMeta.reviewMetadataOnly}
      data-legal-judgment={item.sourceMeta.legalJudgment}
      data-suitability-approval={item.sourceMeta.suitabilityApproval}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold leading-4 text-invest-text-muted">
            {item.reviewPublicId}
          </p>
          <h2 className="mt-1 break-words text-[18px] font-bold leading-7 text-invest-text [overflow-wrap:anywhere]">
            {item.modelName}
          </h2>
          <p className="mt-1 text-sm leading-5 text-invest-text-muted">
            {item.creatorName} / {item.versionLabel}
          </p>
        </div>
        <RiskBadge tone={statusTone[item.queueStatus]}>
          {formatQueueStatus(item.queueStatus)}
        </RiskBadge>
      </div>

      <p className="mt-3 text-sm leading-6 text-invest-text-muted">
        {item.summary}
      </p>

      <dl className="mt-4 grid gap-3 rounded-invest-control bg-invest-surface-muted p-3 text-sm leading-5">
        <ReviewDetail label={copy.sourceLabel} value={formatSource(item.generatedFrom)} />
        <ReviewDetail label={copy.modelPublicIdLabel} value={item.modelPublicId} />
        <ReviewDetail
          label={copy.versionPublicIdLabel}
          value={item.modelVersionPublicId}
        />
        <ReviewDetail label={copy.reviewTypeLabel} value={item.reviewType} />
        <ReviewDetail label={copy.modelStatusLabel} value={item.modelStatus} />
        <ReviewDetail
          label={copy.reviewStatusLabel}
          value={item.complianceReviewStatus}
        />
        <ReviewDetail label={copy.submittedLabel} value={formatDateTime(item.submittedAt)} />
        <ReviewDetail
          label={copy.reviewedLabel}
          value={item.reviewedAt ? formatDateTime(item.reviewedAt) : copy.noReviewedAt}
        />
        <ReviewDetail label={copy.actorLabel} value={item.actorLabel} />
      </dl>

      <section className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {copy.reasonLabel}
        </h3>
        <p className="text-sm leading-6 text-invest-text-muted">
          {item.reasonPlaceholder}
        </p>
      </section>

      <section className="mt-4 rounded-invest-control border border-invest-border bg-invest-bg-soft p-3">
        <div className="flex items-start gap-2">
          <FileWarning
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-invest-risk"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-5 text-invest-text">
              {copy.safetyLabel}
            </h3>
            <p className="mt-1 text-xs font-medium leading-5 text-invest-text-muted">
              {item.safetyLabel}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-4 rounded-invest-control bg-invest-primary-soft px-3 py-2 text-xs font-bold leading-5 text-invest-primary">
        {copy.actionDisabled}
      </p>
    </article>
  );
}

function EmptyQueueMessage({ locale }: { locale: InvestModelLocale }) {
  const copy = queueCopy[locale];

  return (
    <div className={cn(investCardClass.mutedPanel, 'text-sm leading-6')}>
      <p className="font-bold text-invest-text">{copy.emptyTitle}</p>
      <p className="mt-1 text-invest-text-muted">{copy.emptyDescription}</p>
    </div>
  );
}

function ReviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium text-invest-text-muted">{label}</dt>
      <dd className="break-words font-semibold text-invest-text [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

function resolveQueueFilter(
  value?: string | string[]
): QueueFilterId {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (
    rawValue === 'pending_review' ||
    rawValue === 'rejected' ||
    rawValue === 'paused'
  ) {
    return rawValue;
  }

  return 'all';
}

function buildFilterHref(locale: InvestModelLocale, filterId: QueueFilterId) {
  const basePath = withInvestModelLocale('/invest-model/admin/reviews', locale);

  if (filterId === 'all') {
    return basePath;
  }

  return `${basePath}${basePath.includes('?') ? '&' : '?'}status=${filterId}`;
}

function countQueueStatuses(items: AdminReviewQueueItem[]) {
  return items.reduce<Record<AdminReviewQueueStatus, number>>(
    (counts, item) => {
      counts[item.queueStatus] += 1;
      return counts;
    },
    {
      pending_review: 0,
      rejected: 0,
      paused: 0
    }
  );
}

function formatQueueStatus(status: AdminReviewQueueStatus) {
  return status.replace('_', ' ');
}

function formatSource(source: AdminReviewQueueItem['generatedFrom']) {
  return source === 'db_seed_projection'
    ? 'DB seed projection'
    : 'Deterministic fixture';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(value));
}
