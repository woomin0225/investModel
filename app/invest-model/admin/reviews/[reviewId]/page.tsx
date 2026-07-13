import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ClipboardCheck, FileWarning } from 'lucide-react';
import {
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  resolveInvestModelLocale,
  type InvestModelLocale,
  withInvestModelLocale
} from '@/lib/i18n/invest-model';
import {
  getPendingAdminReviewModelById,
  pendingAdminReviewModels
} from '@/lib/mock/invest-model-admin-review';

const riskToneByModel = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

const copy = {
  ko: {
    eyebrow: '운영자',
    title: '심사 상세',
    back: '심사 목록으로',
    bannerTitle: '읽기 전용 상세 검토',
    bannerDescription:
      '이 화면은 pending_review mock 모델의 필수 검토 정보를 확인하기 위한 관리자 화면입니다. 승인, 반려, 중지, 실제 모델 실행은 연결하지 않습니다.',
    summary: '제출 요약',
    modelContext: '모델 운용 맥락',
    riskAndLimits: '위험 및 제한',
    requiredChecks: '필수 확인 항목',
    reviewNotes: '운영자 검토 메모',
    creator: '제작자',
    submittedAt: '제출 시각',
    version: '버전',
    performanceSource: '성과 근거',
    disclosure: '공시 문구',
    strategy: '전략 요약',
    mandate: '모델 운용 범위',
    dataInputs: '입력 데이터',
    forbiddenAssets: '금지 자산/동작',
    actionsDisabled: '상태 변경 비활성화',
    footer:
      '이 상세 화면은 심사 판단을 돕는 mock 관리자 UI입니다. 법률/금융 문구를 확정하거나 모델을 공개 상태로 전환하지 않습니다.'
  },
  en: {
    eyebrow: 'Admin',
    title: 'Review Detail',
    back: 'Back to queue',
    bannerTitle: 'Read-only detailed review',
    bannerDescription:
      'This screen helps administrators inspect required information for a pending_review mock model. Approval, rejection, suspension, and model execution are not connected.',
    summary: 'Submission summary',
    modelContext: 'Model context',
    riskAndLimits: 'Risk and limits',
    requiredChecks: 'Required checks',
    reviewNotes: 'Operator review notes',
    creator: 'Creator',
    submittedAt: 'Submitted',
    version: 'Version',
    performanceSource: 'Performance source',
    disclosure: 'Disclosure wording',
    strategy: 'Strategy summary',
    mandate: 'Model mandate',
    dataInputs: 'Data inputs',
    forbiddenAssets: 'Forbidden assets/actions',
    actionsDisabled: 'Status transition disabled',
    footer:
      'This detail screen is a mock admin UI for review context. It does not finalize legal or financial copy or publish the model.'
  }
} as const;

type AdminReviewDetailPageProps = {
  params: Promise<{ reviewId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return pendingAdminReviewModels.map((model) => ({ reviewId: model.id }));
}

export default async function AdminReviewDetailPage({
  params,
  searchParams
}: AdminReviewDetailPageProps) {
  const [{ reviewId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const model = getPendingAdminReviewModelById(reviewId);

  if (!model) {
    notFound();
  }

  const t = copy[locale];

  return (
    <MobileShell
      activeTab="models"
      eyebrow={t.eyebrow}
      title={t.title}
      locale={locale}
      currentPath={`/invest-model/admin/reviews/${model.id}`}
    >
      <section className="space-y-invest-section-gap">
        <Link
          href={withInvestModelLocale('/invest-model/admin/reviews', locale)}
          className="inline-flex min-h-invest-touch-target items-center rounded-invest-control px-1 text-sm font-bold text-invest-primary"
        >
          {t.back}
        </Link>

        <SoftBanner
          eyebrow="pending_review"
          title={t.bannerTitle}
          description={t.bannerDescription}
          icon={ClipboardCheck}
        />

        <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-bold leading-8 text-invest-text">
                {model.modelName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                {model.strategySummary}
              </p>
            </div>
            <RiskBadge tone="medium">pending_review</RiskBadge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge>{model.marketLabel}</RiskBadge>
            <RiskBadge tone={riskToneByModel[model.riskTone]}>
              {model.riskLabel}
            </RiskBadge>
            <RiskBadge tone="medium">{model.leverageLabel}</RiskBadge>
            <RiskBadge tone="blocked">{t.actionsDisabled}</RiskBadge>
          </div>
        </article>

        <DetailSection title={t.summary}>
          <DetailGrid
            items={[
              [t.creator, model.creatorName],
              [t.submittedAt, model.submittedAtLabel],
              [t.version, model.versionLabel],
              [t.performanceSource, model.performanceSourceLabel],
              [t.disclosure, model.disclosureStatusLabel]
            ]}
          />
        </DetailSection>

        <DetailSection title={t.modelContext}>
          <DetailText label={t.strategy} value={model.strategySummary} />
          <DetailText label={t.mandate} value={model.mandateSummary} />
          <DetailList title={t.dataInputs} items={model.dataInputs} />
        </DetailSection>

        <DetailSection title={t.riskAndLimits} iconTone="risk">
          <DetailText label={t.forbiddenAssets} value={model.assetScopeLabel} />
          <DetailList items={model.forbiddenAssets} />
        </DetailSection>

        <DetailSection title={t.requiredChecks}>
          <DetailList items={model.requiredReviewItems} />
        </DetailSection>

        <DetailSection title={t.reviewNotes} iconTone="risk">
          <DetailList items={model.reviewNotes} />
        </DetailSection>

        <p className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding text-sm leading-6 text-invest-text-muted">
          {t.footer}
        </p>
      </section>
    </MobileShell>
  );
}

function DetailSection({
  title,
  children,
  iconTone = 'neutral'
}: {
  title: string;
  children: ReactNode;
  iconTone?: 'neutral' | 'risk';
}) {
  return (
    <section className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
          <FileWarning
            aria-hidden
            className={
              iconTone === 'risk'
                ? 'size-5 text-invest-risk'
                : 'size-5 text-invest-primary'
            }
          />
        </div>
        <SectionHeader title={title} />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function DetailGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-3 rounded-invest-control bg-invest-surface-muted p-3">
      {items.map(([label, value]) => (
        <div key={label} className="grid gap-1">
          <dt className="text-xs font-medium text-invest-text-muted">{label}</dt>
          <dd className="text-sm font-semibold leading-5 text-invest-text">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold leading-5 text-invest-text">
        {label}
      </h3>
      <p className="mt-1 text-sm leading-6 text-invest-text-muted">{value}</p>
    </div>
  );
}

function DetailList({ title, items }: { title?: string; items: string[] }) {
  return (
    <div>
      {title ? (
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {title}
        </h3>
      ) : null}
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6">
            <span
              aria-hidden
              className="mt-2 size-1.5 shrink-0 rounded-full bg-invest-primary"
            />
            <span className="min-w-0 text-invest-text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
