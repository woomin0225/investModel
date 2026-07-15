import { Flag, History, ShieldAlert } from 'lucide-react';
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
  adminModelReports,
  type MockAdminReport
} from '@/lib/mock/invest-model-admin-report';

const copy = {
  ko: {
    eyebrow: '운영자',
    title: '신고 처리',
    bannerTitle: '읽기 전용 신고 처리 대기열',
    bannerDescription:
      '사용자가 제출한 모델 신고를 운영자가 확인하는 mock 관리자 화면입니다. 실제 상태 저장, 법률 판단, 보상 결정, 주문 중단은 아직 연결하지 않습니다.',
    sectionTitle: '모델 신고 목록',
    sectionDescription:
      '신고 요약, 현재 처리 상태, 처리 이력을 함께 확인합니다.',
    reportId: '신고 ID',
    creator: '제작자',
    reporter: '신고자',
    reportType: '신고 유형',
    submittedAt: '접수 시각',
    summary: '신고 요약',
    history: '처리 이력',
    availableStates: '가능 상태',
    disabledAction: '상태 변경 비활성화',
    footer:
      '이 화면은 BK-053의 신고 접수 계약을 바탕으로 한 관리자 mock UI입니다. 실제 처리는 AuditLog, 권한 검증, 영속 저장소가 연결된 뒤에만 활성화합니다.',
    stateLabels: ['접수됨', '검토 중', '처리됨']
  },
  en: {
    eyebrow: 'Admin',
    title: 'Report Handling',
    bannerTitle: 'Read-only report handling queue',
    bannerDescription:
      'This mock admin screen lets operators inspect user-submitted model reports. Real status persistence, legal judgment, compensation decisions, and trading stops are not connected.',
    sectionTitle: 'Model reports',
    sectionDescription:
      'Each report shows the concern summary, current handling status, and operator history together.',
    reportId: 'Report ID',
    creator: 'Creator',
    reporter: 'Reporter',
    reportType: 'Report type',
    submittedAt: 'Submitted',
    summary: 'Report summary',
    history: 'Handling history',
    availableStates: 'Available states',
    disabledAction: 'Status change disabled',
    footer:
      'This screen is a mock admin UI based on the BK-053 report intake contract. Real handling requires AuditLog, permission checks, and persistent storage first.',
    stateLabels: ['Received', 'In review', 'Handled']
  }
} as const;

type AdminReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReportsPage({
  searchParams
}: AdminReportsPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const t = copy[locale];

  return (
    <MobileShell
      activeTab="models"
      eyebrow={t.eyebrow}
      title={t.title}
      locale={locale}
      currentPath="/invest-model/admin/reports"
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow="ModelReport"
          title={t.bannerTitle}
          description={t.bannerDescription}
          icon={ShieldAlert}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={t.sectionTitle}
            description={t.sectionDescription}
          />
          <div className="space-y-invest-card-gap">
            {adminModelReports.map((report) => (
              <AdminReportCard
                key={report.id}
                report={report}
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

function AdminReportCard({
  report,
  locale
}: {
  report: MockAdminReport;
  locale: InvestModelLocale;
}) {
  const t = copy[locale];

  return (
    <article className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-invest-primary">
            {report.reportPublicId}
          </p>
          <h2 className="mt-1 text-[18px] font-bold leading-7 text-invest-text">
            {report.modelName}
          </h2>
          <p className="mt-1 text-sm leading-5 text-invest-text-muted">
            {t.creator}: {report.creatorName}
          </p>
        </div>
        <RiskBadge tone={report.statusTone}>{report.statusLabel}</RiskBadge>
      </div>

      <dl className="mt-4 grid gap-3 rounded-invest-control bg-invest-surface-muted p-3 text-sm leading-5">
        <ReportDetail label={t.reporter} value={report.reporterLabel} />
        <ReportDetail label={t.reportType} value={report.reportTypeLabel} />
        <ReportDetail label={t.submittedAt} value={report.submittedAtLabel} />
      </dl>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold leading-5 text-invest-text">
          <Flag aria-hidden className="size-4 text-invest-risk" />
          {t.summary}
        </h3>
        <p className="mt-2 text-sm leading-6 text-invest-text-muted">
          {report.summary}
        </p>
      </section>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold leading-5 text-invest-text">
          <History aria-hidden className="size-4 text-invest-primary" />
          {t.history}
        </h3>
        <ol className="mt-3 space-y-3">
          {report.operatorHistory.map((item) => (
            <li key={`${report.id}-${item.timeLabel}-${item.title}`} className="flex gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-invest-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-invest-text-muted">
                  {item.timeLabel}
                </p>
                <p className="mt-1 text-sm font-semibold leading-5 text-invest-text">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4">
        <p className="text-sm font-semibold leading-5 text-invest-text">
          {t.availableStates}
        </p>
        <p className="mt-2 text-xs leading-5 text-invest-text-muted">
          {t.stateLabels.join(' / ')}
        </p>
        <p className="mt-1 text-xs font-medium leading-5 text-invest-danger">
          {t.disabledAction}
        </p>
        <p className="mt-2 text-xs leading-5 text-invest-text-muted">
          {report.blockedActionLabel}
        </p>
      </section>
    </article>
  );
}

function ReportDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium text-invest-text-muted">{label}</dt>
      <dd className="font-semibold text-invest-text">{value}</dd>
    </div>
  );
}
