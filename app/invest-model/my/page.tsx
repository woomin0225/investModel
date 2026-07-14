import { Bell, Bookmark, MessageCircle, ShieldCheck, UserRound } from 'lucide-react';
import {
  investMotionClass,
  MetricCard,
  MobileShell,
  ModelSelectionReadStatus,
  modelSelectionReadStatusCopy,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { resolveInvestModelLocale } from '@/lib/i18n/invest-model';
import { cn } from '@/lib/utils';

type InvestModelMyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const myPageCopy = {
  ko: {
    eyebrow: '내 정보',
    title: 'My Page',
    alertLabel: '내 알림',
    bannerEyebrow: '회원 상태',
    bannerTitle: '사용자 1의 앱 활동',
    bannerDescription:
      '모델 선택, 저장 글, 댓글 같은 앱 안의 활동만 보여줍니다. 실계좌, 실입금, 실주문 정보는 연결하지 않습니다.',
    summary: {
      saved: '저장 글',
      savedValue: '0개',
      savedDescription: '피드 저장 기능 연결 전',
      comments: '댓글',
      commentsValue: '0개',
      commentsDescription: '댓글 API 연결 전',
      notices: '알림',
      noticesValue: '준비 중',
      noticesDescription: '실제 push/email/SMS 아님'
    },
    selectedSectionTitle: '선택한 InvestmentModel',
    selectedSectionDescription:
      'DB에 저장된 active UserModelSelection을 읽습니다. 투자 성향이나 주문 설정이 아닙니다.',
    activityTitle: '활동 read model',
    activityDescription:
      'My Page는 앞으로 저장, 댓글, 알림 상태를 DB read model로 묶어 보여줍니다.',
    activityItems: [
      {
        icon: Bookmark,
        title: '저장 글',
        description: 'FeedPost 저장 토글이 연결되면 최근 저장한 글을 표시합니다.',
        badge: '준비 중'
      },
      {
        icon: MessageCircle,
        title: '댓글',
        description: '댓글/대댓글 API가 연결되면 최근 작성한 댓글을 표시합니다.',
        badge: '준비 중'
      },
      {
        icon: Bell,
        title: '알림',
        description: '모델 선택, 신호 변화, 피드 반응 알림을 mock-safe 상태로 표시합니다.',
        badge: '실제 발송 없음'
      }
    ],
    footer:
      'My Page의 모든 값은 회원 1의 앱 내 read model 또는 준비 중인 mock-safe 상태입니다. 실제 계좌 잔고, 은행 연결, 브로커 주문, 법률 판단을 표시하지 않습니다.'
  },
  en: {
    eyebrow: 'Member',
    title: 'My Page',
    alertLabel: 'My notifications',
    bannerEyebrow: 'Member state',
    bannerTitle: 'User 1 app activity',
    bannerDescription:
      'Shows only in-app activity such as model selection, saved posts, and comments. No real account, deposit, or order data is connected.',
    summary: {
      saved: 'Saved',
      savedValue: '0',
      savedDescription: 'Feed save action pending',
      comments: 'Comments',
      commentsValue: '0',
      commentsDescription: 'Comment API pending',
      notices: 'Alerts',
      noticesValue: 'Pending',
      noticesDescription: 'No real push/email/SMS'
    },
    selectedSectionTitle: 'Selected InvestmentModel',
    selectedSectionDescription:
      'Reads the active UserModelSelection persisted in DB. It is not a suitability or order setting.',
    activityTitle: 'Activity read model',
    activityDescription:
      'My Page will collect saved, comment, and notification states through DB read models.',
    activityItems: [
      {
        icon: Bookmark,
        title: 'Saved posts',
        description: 'Recent saved FeedPosts will appear after the save toggle is connected.',
        badge: 'Pending'
      },
      {
        icon: MessageCircle,
        title: 'Comments',
        description: 'Recent comments will appear after comment and reply APIs are connected.',
        badge: 'Pending'
      },
      {
        icon: Bell,
        title: 'Notifications',
        description: 'Model, signal, and feed reaction notices will appear as mock-safe state.',
        badge: 'No delivery'
      }
    ],
    footer:
      'Every My Page value is either an in-app read model for user 1 or a pending mock-safe state. It never displays real account balances, bank links, brokerage orders, or legal judgments.'
  }
} as const;

export default async function InvestModelMyPage({
  searchParams
}: InvestModelMyPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = myPageCopy[locale];

  return (
    <MobileShell
      activeTab="home"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/my"
      trailing={
        <button
          type="button"
          aria-label={copy.alertLabel}
          className={cn(
            'group relative grid size-invest-touch-target place-items-center overflow-hidden rounded-invest-control border border-invest-primary/20 bg-invest-primary-soft text-invest-primary shadow-invest-card focus-visible:ring-2 focus-visible:ring-invest-primary/30',
            investMotionClass.interactiveControl
          )}
        >
          <Bell
            aria-hidden
            className="size-5 transition-transform duration-200 ease-out group-hover:-rotate-6 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100"
          />
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-invest-warning ring-2 ring-invest-primary-soft"
          />
          <span
            aria-hidden
            className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-invest-primary opacity-70 transition-[opacity,transform] duration-200 ease-out group-active:scale-x-75 motion-reduce:transition-none motion-reduce:group-active:scale-x-100"
          />
        </button>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={UserRound}
        />

        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label={copy.summary.saved}
            value={copy.summary.savedValue}
            description={copy.summary.savedDescription}
            trend={locale === 'ko' ? '대기' : 'pending'}
            className="p-3"
          />
          <MetricCard
            label={copy.summary.comments}
            value={copy.summary.commentsValue}
            description={copy.summary.commentsDescription}
            trend={locale === 'ko' ? '대기' : 'pending'}
            className="p-3"
          />
          <MetricCard
            label={copy.summary.notices}
            value={copy.summary.noticesValue}
            description={copy.summary.noticesDescription}
            trend={locale === 'ko' ? 'mock' : 'mock'}
            tone="risk"
            className="p-3"
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.selectedSectionTitle}
            description={copy.selectedSectionDescription}
          />
          <ModelSelectionReadStatus copy={modelSelectionReadStatusCopy[locale]} />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.activityTitle}
            description={copy.activityDescription}
          />
          <div
            role="list"
            aria-label={copy.activityTitle}
            className="space-y-2.5 rounded-invest-card bg-invest-bg-soft p-1.5"
          >
            {copy.activityItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  role="listitem"
                  className={cn(
                    'group rounded-invest-card border border-invest-border bg-invest-surface p-4 shadow-invest-card',
                    investMotionClass.interactiveCard
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary transition-[background-color,transform] duration-200 ease-out group-hover:scale-[1.03] group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100">
                      <Icon aria-hidden className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-[16px] font-bold leading-6 text-invest-text">
                          {item.title}
                        </h2>
                        <RiskBadge tone="medium">{item.badge}</RiskBadge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex flex-wrap gap-2">
            <RiskBadge tone="blocked">
              {locale === 'ko' ? '실계좌 없음' : 'No real account'}
            </RiskBadge>
            <RiskBadge tone="blocked">
              {locale === 'ko' ? '실주문 없음' : 'No real orders'}
            </RiskBadge>
            <RiskBadge>
              <ShieldCheck aria-hidden className="mr-1 inline size-3" />
              {locale === 'ko' ? 'DB read model' : 'DB read model'}
            </RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {copy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
