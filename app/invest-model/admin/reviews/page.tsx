import { ClipboardCheck } from 'lucide-react';
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
  pendingAdminReviewModels,
  type MockAdminReviewModel
} from '@/lib/mock/invest-model-admin-review';

const riskToneByModel = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

const adminReviewCopy = {
  ko: {
    eyebrow: '운영자',
    title: '모델 심사',
    noticeTitle: '읽기 전용 심사 대기열',
    noticeDescription:
      '이 화면은 pending_review mock 모델의 필수 정보를 확인하기 위한 모바일 관리자 화면입니다. 승인, 반려, 중지, 실제 모델 실행은 아직 연결하지 않습니다.',
    sectionTitle: '심사 대기 모델',
    sectionDescription: '승인 또는 반려 전 확인해야 하는 모델 설명과 위험 정보를 함께 표시합니다.',
    submittedAt: '제출 시각',
    creator: '제작자',
    version: '버전',
    assetScope: '운용 자산 범위',
    mandate: '모델 운용 범위',
    requiredChecks: '필수 확인 항목',
    disclosure: '공시/위험 문구',
    blocked: '상태 변경 비활성',
    footer:
      '운영자 액션은 BK-018 승인 상태 변경 API와 AuditLog 연결 후에만 활성화합니다.'
  },
  en: {
    eyebrow: 'Admin',
    title: 'Model Review',
    noticeTitle: 'Read-only review queue',
    noticeDescription:
      'This mobile admin screen shows required information for pending_review mock models. Approval, rejection, suspension, and model execution are not connected yet.',
    sectionTitle: 'Pending review models',
    sectionDescription:
      'Model explanation and risk details are shown together before approval or rejection.',
    submittedAt: 'Submitted',
    creator: 'Creator',
    version: 'Version',
    assetScope: 'Asset scope',
    mandate: 'Model mandate',
    requiredChecks: 'Required checks',
    disclosure: 'Disclosure wording',
    blocked: 'Status transition disabled',
    footer:
      'Admin actions stay disabled until BK-018 connects status transition APIs and AuditLog.'
  }
} as const;

type AdminModelReviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminModelReviewsPage({
  searchParams
}: AdminModelReviewsPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = adminReviewCopy[locale];

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
          eyebrow="pending_review"
          title={copy.noticeTitle}
          description={copy.noticeDescription}
          icon={ClipboardCheck}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.sectionTitle}
            description={copy.sectionDescription}
          />
          <div className="space-y-invest-card-gap">
            {pendingAdminReviewModels.map((model) => (
              <AdminReviewModelCard
                key={model.id}
                model={model}
                locale={locale}
              />
            ))}
          </div>
        </div>

        <p className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding text-sm leading-6 text-invest-text-muted">
          {copy.footer}
        </p>
      </section>
    </MobileShell>
  );
}

function AdminReviewModelCard({
  model,
  locale
}: {
  model: MockAdminReviewModel;
  locale: InvestModelLocale;
}) {
  const copy = adminReviewCopy[locale];

  return (
    <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold leading-7 text-invest-text">
            {model.modelName}
          </h2>
          <p className="mt-1 text-sm leading-5 text-invest-text-muted">
            {copy.creator}: {model.creatorName}
          </p>
        </div>
        <RiskBadge tone="medium">pending_review</RiskBadge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <RiskBadge>{model.marketLabel}</RiskBadge>
        <RiskBadge tone={riskToneByModel[model.riskTone]}>
          {model.riskLabel}
        </RiskBadge>
        <RiskBadge tone="medium">{model.leverageLabel}</RiskBadge>
      </div>

      <dl className="mt-4 grid gap-3 rounded-invest-control bg-invest-surface-muted p-3 text-sm leading-5">
        <ReviewDetail label={copy.submittedAt} value={model.submittedAtLabel} />
        <ReviewDetail label={copy.version} value={model.versionLabel} />
        <ReviewDetail label={copy.assetScope} value={model.assetScopeLabel} />
        <ReviewDetail label={copy.disclosure} value={model.disclosureStatusLabel} />
      </dl>

      <section className="mt-4">
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {copy.mandate}
        </h3>
        <p className="mt-1 text-sm leading-6 text-invest-text-muted">
          {model.mandateSummary}
        </p>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {copy.requiredChecks}
        </h3>
        <ul className="mt-2 space-y-2">
          {model.requiredReviewItems.map((item) => (
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

      <div className="mt-4 flex flex-wrap gap-2">
        <RiskBadge tone="blocked">{copy.blocked}</RiskBadge>
        <RiskBadge>{model.blockedActionLabel}</RiskBadge>
      </div>
    </article>
  );
}

function ReviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium text-invest-text-muted">{label}</dt>
      <dd className="font-semibold text-invest-text">{value}</dd>
    </div>
  );
}
