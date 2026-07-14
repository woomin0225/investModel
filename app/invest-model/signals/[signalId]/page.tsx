import { ArrowLeft, Activity, Radio, Search, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  MetricCard,
  MobileShell,
  NotificationAction,
  RiskBadge,
  SoftBanner,
  investMotionClass
} from '@/components/invest-model';
import { readSignalEventDtoByPublicId } from '@/lib/db/signal-read-model';
import type {
  SignalEventDto,
  SignalEventType
} from '@/lib/domain/signals/signal-event';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { readInvestModelNotificationUnreadLabel } from '@/lib/server/invest-model-notifications';
import { cn } from '@/lib/utils';

type SignalDetailPageProps = {
  params: Promise<{
    signalId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SignalLocale = 'ko' | 'en';
type SignalTone = 'low' | 'medium' | 'high';

const signalToneClass = {
  low: 'bg-invest-positive-soft text-invest-positive',
  medium: 'bg-invest-warning-soft text-[#966300]',
  high: 'bg-invest-risk-soft text-invest-risk'
} as const;

const scoreBarClass = {
  low: 'bg-invest-positive',
  medium: 'bg-invest-warning',
  high: 'bg-invest-risk'
} as const;

const badgeToneByScore = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

function scoreToneFromScore(score: number): SignalTone {
  if (score >= 80) {
    return 'high';
  }

  if (score >= 65) {
    return 'medium';
  }

  return 'low';
}

function signalTypeLabel(locale: SignalLocale, signalType: SignalEventType) {
  const labels = {
    ko: {
      news_traffic: '뉴스 트래픽',
      price_trend: '가격 추세',
      macro: '시장 맥락',
      risk: '위험 알림'
    },
    en: {
      news_traffic: 'News traffic',
      price_trend: 'Price trend',
      macro: 'Market context',
      risk: 'Risk alert'
    }
  } as const;

  return labels[locale][signalType];
}

function formatCapturedAt(value: string, locale: SignalLocale) {
  const capturedAt = new Date(value);

  if (Number.isNaN(capturedAt.getTime())) {
    return locale === 'ko' ? '시점 확인 중' : 'Time pending';
  }

  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(capturedAt);
}

function scoreWidth(score: number) {
  return `${Math.min(Math.max(Math.round(score), 0), 100)}%`;
}

function relatedFeedSearchHref(locale: SignalLocale, signal: SignalEventDto) {
  const params = new URLSearchParams({
    lang: locale,
    q: signal.linkedModelName || signal.title
  });

  return `/invest-model/search?${params.toString()}`;
}

function signalDetailAccessibleLabel(
  locale: SignalLocale,
  signal: SignalEventDto,
  signalTypeText: string
) {
  return locale === 'ko'
    ? `${signal.title}. ${signalTypeText}. ${signal.scoreDisplay}. DB seed/mock 관찰 입력 상세입니다. 추천, 주문, TradeIntent 또는 실시간 외부 데이터 연결이 아닙니다.`
    : `${signal.title}. ${signalTypeText}. ${signal.scoreDisplay}. DB seed/mock observation detail. This is not a recommendation, order, TradeIntent, or realtime external data connection.`;
}

function signalBackAccessibleLabel(locale: SignalLocale) {
  return locale === 'ko'
    ? 'DB seed/mock 신호 목록으로 돌아가기'
    : 'Back to the DB seed/mock signal list';
}

function signalRelatedSearchAccessibleLabel(
  locale: SignalLocale,
  signal: SignalEventDto
) {
  return locale === 'ko'
    ? `${signal.linkedModelName} 관련 DB FeedPost 검색. 참고용 읽기 자료이며 주문이나 추천 근거가 아닙니다.`
    : `Search DB-backed FeedPosts for ${signal.linkedModelName}. Reference reading only, not evidence for an order or recommendation.`;
}

function signalSafetyDescription(locale: SignalLocale, signal: SignalEventDto) {
  if (signal.signalType === 'risk') {
    return locale === 'ko'
      ? '이 화면은 위험 관찰 입력값을 보여줍니다. 매수, 매도, 보유, 주문 신호가 아닙니다.'
      : 'This screen shows a risk observation input. It is not a buy, sell, hold, or order signal.';
  }

  return locale === 'ko'
    ? '이 화면은 모델 참고용 관찰 입력값을 보여줍니다. 투자 조언이나 주문 생성이 아닙니다.'
    : 'This screen shows an observed input for model context. It is not investment advice or order creation.';
}

function signalDetailVisibleBoundaries(locale: SignalLocale) {
  return locale === 'ko'
    ? ['DB 관찰 입력', '정보성 신호', '추천 아님', 'TradeIntent 없음', '외부 실시간 미연결']
    : [
        'DB observed input',
        'informational signal',
        'not advice',
        'no TradeIntent',
        'no realtime external data'
      ];
}

function signalRelatedVisibleBoundaries(locale: SignalLocale) {
  return locale === 'ko'
    ? ['DB FeedPost', '참고 읽기', '주문 근거 아님']
    : ['DB FeedPost', 'reference reading', 'not order evidence'];
}

function signalScoreSnapshotVisibleBoundaries(locale: SignalLocale) {
  return locale === 'ko'
    ? [
        '점수 스냅샷',
        'DB SignalEvent',
        'seed/mock 관찰',
        '외부 실시간 미연결',
        '주문 아님'
      ]
    : [
        'score snapshot',
        'DB SignalEvent',
        'seed/mock observation',
        'no realtime external data',
        'not an order'
      ];
}

function signalEvidenceVisibleBoundaries(locale: SignalLocale) {
  return locale === 'ko'
    ? [
        'DB source rows',
        '관찰 시점 표시',
        'mock/seed 근거',
        '추천 근거 아님',
        '주문 근거 아님'
      ]
    : [
        'DB source rows',
        'captured timestamp',
        'mock/seed evidence',
        'not advice evidence',
        'not order evidence'
      ];
}

export default async function InvestModelSignalDetailPage({
  params,
  searchParams
}: SignalDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = investModelCopy[locale];
  const unreadLabel = await readInvestModelNotificationUnreadLabel();
  const signal = await readSignalEventDtoByPublicId(resolvedParams.signalId);

  if (!signal) {
    notFound();
  }

  const scoreTone = scoreToneFromScore(signal.score);
  const currentPath = `/invest-model/signals/${resolvedParams.signalId}`;
  const backHref = `/invest-model/signals?lang=${locale}`;
  const relatedSearchHref = relatedFeedSearchHref(locale, signal);
  const signalTypeText = signalTypeLabel(locale, signal.signalType);
  const detailAccessibleLabel = signalDetailAccessibleLabel(
    locale,
    signal,
    signalTypeText
  );
  const backAccessibleLabel = signalBackAccessibleLabel(locale);
  const relatedSearchAccessibleLabel = signalRelatedSearchAccessibleLabel(
    locale,
    signal
  );
  const safetyAccessibleLabel = signalSafetyDescription(locale, signal);
  const sourceRows = [
    {
      label: locale === 'ko' ? '관찰 유형' : 'Observation type',
      value: signalTypeLabel(locale, signal.signalType)
    },
    {
      label: locale === 'ko' ? '연결 모델' : 'Linked model',
      value: signal.linkedModelName
    },
    {
      label: locale === 'ko' ? '소스' : 'Source',
      value: signal.sourceLabel
    },
    {
      label: locale === 'ko' ? '관찰 시점' : 'Captured at',
      value: formatCapturedAt(signal.capturedAt, locale)
    }
  ];

  return (
    <MobileShell
      activeTab="signals"
      eyebrow={locale === 'ko' ? 'Signal Detail' : 'Signal Detail'}
      title={locale === 'ko' ? '신호 상세' : 'Signal Detail'}
      locale={locale}
      currentPath={currentPath}
      trailing={
        <NotificationAction
          locale={locale}
          label={copy.actions.signalAlerts}
          unreadLabel={unreadLabel}
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <Link
          href={backHref}
          aria-label={backAccessibleLabel}
          title={backAccessibleLabel}
          className={cn(
            'inline-flex min-h-invest-touch-target items-center gap-2 rounded-invest-control border border-invest-border bg-invest-surface px-3 text-sm font-bold text-invest-text shadow-invest-card',
            investMotionClass.interactiveControl
          )}
        >
          <ArrowLeft aria-hidden className="size-4" />
          {locale === 'ko' ? '신호 목록으로 돌아가기' : 'Back to signals'}
        </Link>

        <SoftBanner
          eyebrow={signalTypeText}
          title={signal.title}
          description={signal.summary}
          icon={Radio}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={locale === 'ko' ? '관찰 점수' : 'Observation score'}
            value={signal.scoreDisplay}
            description={
              locale === 'ko' ? 'DB seed/mock 기반' : 'DB seed/mock based'
            }
            trend={locale === 'ko' ? '관찰값' : 'Observed'}
            tone={scoreTone === 'high' ? 'risk' : undefined}
          />
          <MetricCard
            label={locale === 'ko' ? '외부 실시간' : 'Realtime external'}
            value={locale === 'ko' ? '미연결' : 'Not connected'}
            description={
              locale === 'ko'
                ? 'IS-004 해결 전까지 seed/mock만 사용'
                : 'Seed/mock only until IS-004 is resolved'
            }
            trend={locale === 'ko' ? '안전 경계' : 'Safety boundary'}
          />
        </div>

        <article
          aria-label={detailAccessibleLabel}
          title={detailAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'grid size-12 shrink-0 place-items-center rounded-invest-control text-lg font-bold',
                signalToneClass[scoreTone]
              )}
            >
              {Math.round(signal.score)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone={badgeToneByScore[scoreTone]}>
                  {signal.scoreDisplay}
                </RiskBadge>
                <RiskBadge tone="neutral">
                  {signal.dataContext === 'mock'
                    ? locale === 'ko'
                      ? 'Seed/mock'
                      : 'Seed/mock'
                    : signal.dataContext}
                </RiskBadge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-2">
                {signalDetailVisibleBoundaries(locale).map((boundary) => (
                  <RiskBadge key={boundary} tone="neutral">
                    {boundary}
                  </RiskBadge>
                ))}
              </div>
              <h2 className="mt-3 text-[22px] font-bold leading-7 text-invest-text">
                {signal.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                {signal.summary}
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-invest-surface-muted">
            <div
              className={cn('h-full rounded-full', scoreBarClass[scoreTone])}
              style={{ width: scoreWidth(signal.score) }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-2">
            {signalScoreSnapshotVisibleBoundaries(locale).map((boundary) => (
              <RiskBadge key={boundary} tone="neutral">
                {boundary}
              </RiskBadge>
            ))}
          </div>

          <div className="mt-5 grid gap-2">
            <div className="flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-2">
              {signalEvidenceVisibleBoundaries(locale).map((boundary) => (
                <RiskBadge key={boundary} tone="neutral">
                  {boundary}
                </RiskBadge>
              ))}
            </div>
            {sourceRows.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 rounded-invest-control bg-invest-bg-soft p-3 min-[360px]:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)]"
              >
                <p className="text-[12px] font-bold leading-4 text-invest-text-muted">
                  {row.label}
                </p>
                <p className="min-w-0 text-sm font-semibold leading-5 text-invest-text">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </article>

        <div
          aria-label={safetyAccessibleLabel}
          title={safetyAccessibleLabel}
          className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-risk"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="blocked">
                  {locale === 'ko' ? '추천 아님' : 'No recommendation'}
                </RiskBadge>
                <RiskBadge tone="medium">
                  {locale === 'ko' ? '주문 없음' : 'No order'}
                </RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                {safetyAccessibleLabel}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={relatedSearchHref}
          aria-label={relatedSearchAccessibleLabel}
          title={relatedSearchAccessibleLabel}
          className={cn(
            'group block rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card focus:outline-none focus:ring-2 focus:ring-invest-primary focus:ring-offset-2 focus:ring-offset-invest-bg',
            investMotionClass.interactiveCard
          )}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-invest-control bg-invest-primary-soft text-invest-primary">
              <Search aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="neutral">DB FeedPost</RiskBadge>
                <RiskBadge tone="medium">
                  {locale === 'ko' ? '참고용' : 'Reference only'}
                </RiskBadge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 rounded-invest-control bg-invest-surface-muted px-2 py-2">
                {signalRelatedVisibleBoundaries(locale).map((boundary) => (
                  <RiskBadge key={boundary} tone="neutral">
                    {boundary}
                  </RiskBadge>
                ))}
              </div>
              <h2 className="mt-2 text-[16px] font-bold leading-6 text-invest-text">
                {locale === 'ko'
                  ? '관련 Feed 검색'
                  : 'Related Feed search'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                {locale === 'ko'
                  ? `${signal.linkedModelName} 관련 DB 기반 FeedPost를 검색합니다. 주문이나 추천의 근거가 아니라 참고용 읽기 자료입니다.`
                  : `Search DB-backed FeedPosts for ${signal.linkedModelName}. This is supporting reading, not evidence for an order or recommendation.`}
              </p>
            </div>
          </div>
        </Link>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface p-3 shadow-invest-card">
          <div className="flex items-start gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-invest-primary-soft text-invest-primary">
              <Activity aria-hidden className="size-4" />
            </span>
            <p className="text-sm font-semibold leading-6 text-invest-text-muted">
              {locale === 'ko'
                ? '이 상세 화면은 DB에 저장된 SignalEvent public id를 읽어 표시합니다. 실시간 검색량, 브라우저 트래픽, 유료 외부 데이터는 아직 연결하지 않았습니다.'
                : 'This detail screen reads a stored SignalEvent public id from the DB. Realtime search volume, browser traffic, and paid external sources are not connected yet.'}
            </p>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
