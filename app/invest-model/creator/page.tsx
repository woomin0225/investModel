import Link from 'next/link';
import { LayoutDashboard, Plus, ShieldCheck } from 'lucide-react';
import {
  MobileShell,
  MetricCard,
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
  mockCreatorDashboard,
  type MockCreatorDashboardModel
} from '@/lib/mock/invest-model-creator-dashboard';

const riskToneByModel = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

const creatorDashboardCopy = {
  ko: {
    eyebrow: '제작자',
    title: '제작자 대시보드',
    bannerEyebrow: 'creator scope',
    bannerTitle: '내 모델 상태와 심사 결과',
    bannerDescription:
      '이 화면은 현재 로그인한 ModelCreator의 mock 모델만 보여줍니다. 다른 제작자 모델, 실제 자금, 브로커 계좌, 모델 파일 실행은 연결하지 않습니다.',
    newModel: '새 모델 초안',
    sectionTitle: '내 모델',
    sectionDescription:
      '상태, 심사 결과, 다음 조치만 읽기 전용으로 확인합니다.',
    metrics: {
      total: '내 모델',
      live: 'Live mock',
      pending: '심사 대기',
      changes: '수정 요청'
    },
    submittedAt: '제출 시각',
    reviewResult: '심사 결과',
    nextAction: '다음 조치',
    reviewNotes: '심사 메모',
    securityTitle: '권한 경계',
    securityDescription:
      'creatorPublicId 기준으로 필터링된 mock 데이터만 표시합니다. 운영자 심사, 상태 변경 저장, 다른 제작자 데이터 조회는 별도 RBAC/API 작업에서 다룹니다.',
    footer:
      '제작자 대시보드는 metadata_only 상태 확인용입니다. 실제 주문, 입금, 계좌 연결, 모델 파일 실행을 수행하지 않습니다.'
  },
  en: {
    eyebrow: 'Creator',
    title: 'Creator Dashboard',
    bannerEyebrow: 'creator scope',
    bannerTitle: 'My model status and review results',
    bannerDescription:
      'This screen shows only mock models owned by the current ModelCreator. It does not expose other creators, real funds, brokerage accounts, or executable model files.',
    newModel: 'New model draft',
    sectionTitle: 'My models',
    sectionDescription:
      'Review model status, review results, and next actions in read-only mode.',
    metrics: {
      total: 'My models',
      live: 'Live mock',
      pending: 'Pending review',
      changes: 'Changes requested'
    },
    submittedAt: 'Submitted',
    reviewResult: 'Review result',
    nextAction: 'Next action',
    reviewNotes: 'Review notes',
    securityTitle: 'Permission boundary',
    securityDescription:
      'Only mock data filtered by creatorPublicId is shown. Operator review, saved status transitions, and cross-creator access belong to later RBAC/API work.',
    footer:
      'The creator dashboard is for metadata_only status review. It does not place orders, move funds, connect accounts, or execute model files.'
  }
} as const;

type CreatorDashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreatorDashboardPage({
  searchParams
}: CreatorDashboardPageProps) {
  const locale: InvestModelLocale = resolveInvestModelLocale(await searchParams);
  const copy = creatorDashboardCopy[locale];
  const dashboard = mockCreatorDashboard;

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/creator"
      trailing={
        <Link
          href={withInvestModelLocale('/invest-model/creator/models/new', locale)}
          aria-label={copy.newModel}
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
        >
          <Plus aria-hidden className="size-5" />
        </Link>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={LayoutDashboard}
        />

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label={copy.metrics.total}
            value={String(dashboard.summary.totalModels)}
            description={dashboard.ownershipScopeLabel[locale]}
          />
          <MetricCard
            label={copy.metrics.live}
            value={String(dashboard.summary.liveModels)}
            description={dashboard.verificationLabel[locale]}
            tone="positive"
          />
          <MetricCard
            label={copy.metrics.pending}
            value={String(dashboard.summary.pendingReviews)}
            description="pending_review"
          />
          <MetricCard
            label={copy.metrics.changes}
            value={String(dashboard.summary.changesRequested)}
            description="changes_requested"
            tone="risk"
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.sectionTitle}
            description={copy.sectionDescription}
          />
          <div className="space-y-invest-card-gap">
            {dashboard.models.map((model) => (
              <CreatorDashboardModelCard
                key={model.id}
                model={model}
                locale={locale}
              />
            ))}
          </div>
        </div>

        <SoftBanner
          eyebrow={dashboard.creatorPublicId}
          title={copy.securityTitle}
          description={copy.securityDescription}
          icon={ShieldCheck}
        />

        <p className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding text-sm leading-6 text-invest-text-muted">
          {copy.footer}
        </p>
      </section>
    </MobileShell>
  );
}
function CreatorDashboardModelCard({
  model,
  locale
}: {
  model: MockCreatorDashboardModel;
  locale: InvestModelLocale;
}) {
  const copy = creatorDashboardCopy[locale];

  return (
    <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold leading-7 text-invest-text">
            {model.modelName}
          </h2>
          <p className="mt-1 text-sm leading-5 text-invest-text-muted">
            {model.versionLabel}
          </p>
        </div>
        <RiskBadge tone={model.statusTone}>{model.statusLabel[locale]}</RiskBadge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <RiskBadge>{model.marketLabel}</RiskBadge>
        <RiskBadge tone={riskToneByModel[model.riskTone]}>
          {model.riskLabel}
        </RiskBadge>
        <RiskBadge>{model.status}</RiskBadge>
      </div>

      <dl className="mt-4 grid gap-3 rounded-invest-control bg-invest-surface-muted p-3 text-sm leading-5">
        <DashboardDetail label={copy.submittedAt} value={model.submittedAtLabel} />
        <DashboardDetail
          label={copy.reviewResult}
          value={model.reviewResultLabel[locale]}
        />
        <DashboardDetail
          label={copy.nextAction}
          value={model.nextActionLabel[locale]}
        />
      </dl>

      <section className="mt-4">
        <h3 className="text-sm font-semibold leading-5 text-invest-text">
          {copy.reviewNotes}
        </h3>
        <ul className="mt-2 space-y-2">
          {model.reviewNotes[locale].map((note) => (
            <li key={note} className="flex gap-2 text-sm leading-6">
              <span
                aria-hidden
                className="mt-2 size-1.5 shrink-0 rounded-full bg-invest-primary"
              />
              <span className="min-w-0 text-invest-text-muted">{note}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function DashboardDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium text-invest-text-muted">{label}</dt>
      <dd className="font-semibold text-invest-text">{value}</dd>
    </div>
  );
}
