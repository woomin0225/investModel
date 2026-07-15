import { ClipboardCheck, FileSearch } from 'lucide-react';
import {
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  resolveInvestModelLocale,
  type InvestModelLocale
} from '@/lib/i18n/invest-model';
import {
  adminPerformanceSubmissions,
  type MockAdminPerformanceSubmission
} from '@/lib/mock/invest-model-admin-performance';

const copy = {
  ko: {
    eyebrow: '운영자',
    title: '성과 검토',
    bannerTitle: '성과 자료 검토 대기열',
    bannerDescription:
      '제작자가 제출한 성과 자료를 공개 전 검토하는 mock 관리자 화면입니다. 승인, 반려, 법률 판단, 실제 공개 상태 변경은 아직 연결하지 않습니다.',
    sectionTitle: '검토 대기 성과 자료',
    sectionDescription:
      '수익률은 변동성, 최대 손실, 출처, 공개 상태와 함께 확인합니다.',
    creator: '제작자',
    version: '버전',
    submitted: '제출',
    period: '측정 기간',
    source: '측정 출처',
    returnMetric: '수익률',
    volatility: '변동성',
    drawdown: '최대 손실',
    methodology: '방법론 요약',
    files: '비공개 증빙',
    checklist: '검토 체크리스트',
    exposure: '공개 상태',
    disabled: '상태 변경 비활성화',
    footer:
      '이 화면은 BK-083 성과 제출 흐름을 읽기 전용으로 시각화합니다. public DTO는 approved_placeholder 전까지 성과 자료를 노출하지 않아야 합니다.'
  },
  en: {
    eyebrow: 'Admin',
    title: 'Performance Review',
    bannerTitle: 'Performance evidence review queue',
    bannerDescription:
      'This mock admin screen reviews creator-submitted performance material before public exposure. Approval, rejection, legal judgment, and public status changes are not connected.',
    sectionTitle: 'Performance submissions',
    sectionDescription:
      'Return values are reviewed next to volatility, max drawdown, source, and exposure state.',
    creator: 'Creator',
    version: 'Version',
    submitted: 'Submitted',
    period: 'Measurement period',
    source: 'Measurement source',
    returnMetric: 'Return',
    volatility: 'Volatility',
    drawdown: 'Max drawdown',
    methodology: 'Methodology summary',
    files: 'Private evidence',
    checklist: 'Review checklist',
    exposure: 'Exposure state',
    disabled: 'Status change disabled',
    footer:
      'This screen visualizes the BK-083 performance submission flow as read-only. Public DTOs must omit performance material until approved_placeholder review passes.'
  }
} as const;

type AdminPerformancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPerformancePage({
  searchParams
}: AdminPerformancePageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const t = copy[locale];

  return (
    <MobileShell
      activeTab="models"
      eyebrow={t.eyebrow}
      title={t.title}
      locale={locale}
      currentPath="/invest-model/admin/performance"
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow="PerformanceSubmission"
          title={t.bannerTitle}
          description={t.bannerDescription}
          icon={FileSearch}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={t.sectionTitle}
            description={t.sectionDescription}
          />
          <div className="space-y-invest-card-gap">
            {adminPerformanceSubmissions.map((submission) => (
              <PerformanceSubmissionCard
                key={submission.id}
                submission={submission}
                locale={locale}
              />
            ))}
          </div>
        </div>

        <p className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding text-sm leading-6 text-invest-text-muted">
          {t.footer}
        </p>
      </section>
    </MobileShell>
  );
}

function PerformanceSubmissionCard({
  submission,
  locale
}: {
  submission: MockAdminPerformanceSubmission;
  locale: InvestModelLocale;
}) {
  const t = copy[locale];

  return (
    <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-invest-primary">
            {submission.submissionPublicId}
          </p>
          <h2 className="mt-1 text-[18px] font-bold leading-7 text-invest-text">
            {submission.modelName}
          </h2>
          <p className="mt-1 text-sm leading-5 text-invest-text-muted">
            {t.creator}: {submission.creatorName}
          </p>
        </div>
        <RiskBadge tone={submission.statusTone}>
          {submission.statusLabel}
        </RiskBadge>
      </div>

      <dl className="mt-4 grid gap-3 rounded-invest-control bg-invest-surface-muted p-3 text-sm leading-5">
        <Detail label={t.version} value={submission.versionLabel} />
        <Detail label={t.submitted} value={submission.submittedAtLabel} />
        <Detail label={t.period} value={submission.performancePeriodLabel} />
        <Detail label={t.source} value={submission.measurementSourceLabel} />
      </dl>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label={t.returnMetric} value={submission.returnMetricLabel} tone="positive" />
        <Metric label={t.volatility} value={submission.volatilityMetricLabel} />
        <Metric label={t.drawdown} value={submission.maxDrawdownMetricLabel} tone="risk" />
      </div>

      <section className="mt-4">
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {t.methodology}
        </h3>
        <p className="mt-2 text-sm leading-6 text-invest-text-muted">
          {submission.methodologySummary}
        </p>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {t.files}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {submission.fileEvidenceLabels.map((fileLabel) => (
            <RiskBadge key={fileLabel}>{fileLabel}</RiskBadge>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold leading-5 text-invest-text">
          <ClipboardCheck aria-hidden className="size-4 text-invest-primary" />
          {t.checklist}
        </h3>
        <ul className="mt-2 space-y-2">
          {submission.reviewChecklist.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6">
              <span
                aria-hidden
                className="mt-2 size-1.5 shrink-0 rounded-full bg-invest-primary"
              />
              <span className="min-w-0 text-invest-text-muted">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 text-xs font-medium leading-5 text-invest-danger">
        {t.exposure}: {submission.exposureLabel}; {t.disabled}
      </p>
      <p className="mt-2 text-xs leading-5 text-invest-text-muted">
        {submission.blockedActionLabel}
      </p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium text-invest-text-muted">{label}</dt>
      <dd className="font-semibold text-invest-text">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'risk';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-invest-positive'
      : tone === 'risk'
        ? 'text-invest-risk'
        : 'text-invest-text';

  return (
    <div className="min-h-20 rounded-invest-control bg-invest-surface-muted p-2">
      <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
        {label}
      </p>
      <p className={`mt-2 break-words text-[16px] font-bold leading-6 ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
