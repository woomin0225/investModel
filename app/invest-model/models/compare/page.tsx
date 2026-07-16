import { BarChart3 } from 'lucide-react';
import {
  DetailBackLink,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  resolveInvestModelLocale,
  withInvestModelLocale,
  type InvestModelLocale
} from '@/lib/i18n/invest-model';

type ComparisonModel = {
  id: string;
  name: string;
  market: string;
  mandate: string;
  risk: string;
  riskTone: 'low' | 'medium' | 'high';
  backtestReturn: string;
  volatility: string;
  drawdown: string;
  leverage: string;
  reviewState: string;
  caution: string;
};

const comparisonCopy = {
  ko: {
    eyebrow: '비교',
    title: '모델 비교',
    bannerEyebrow: '모의 비교표',
    bannerTitle: '성과와 위험을 함께 보기',
    bannerDescription:
      '이 화면은 승인된 모의 모델의 시장, 위험, 변동성, 손실 구간을 나란히 보여줍니다. 수익률은 백테스트 임시 값이며 실제 투자 조언이나 주문 실행이 아닙니다.',
    sectionTitle: '승인 모델 3개',
    sectionDescription: '모바일 390px에서 가로 스크롤 없이 핵심 지표를 세로로 비교합니다.',
    tableTitle: '핵심 지표',
    labels: {
      market: '시장',
      mandate: '운용 범위',
      return: '백테스트',
      volatility: '변동성',
      drawdown: '최대 손실',
      leverage: '레버리지',
      review: '심사 상태'
    },
    footer:
      '비교표는 모델 선택을 돕는 정보 구조입니다. 사용자가 직접 투자성향을 설정하거나 실제 계좌, 입금, 주문을 연결하지 않습니다.',
    backToModels: '모델 목록으로'
  },
  en: {
    eyebrow: 'Compare',
    title: 'Model Compare',
    bannerEyebrow: 'Mock comparison',
    bannerTitle: 'Returns stay next to risk',
    bannerDescription:
      'This view compares market, risk, volatility, and drawdown context for approved mock models. Return figures are backtest placeholders, not investment advice or order execution.',
    sectionTitle: '3 approved models',
    sectionDescription: 'Core model metrics are stacked for a 390px mobile viewport.',
    tableTitle: 'Core metrics',
    labels: {
      market: 'Market',
      mandate: 'Mandate',
      return: 'Backtest',
      volatility: 'Volatility',
      drawdown: 'Max drawdown',
      leverage: 'Leverage',
      review: 'Review state'
    },
    footer:
      'The comparison table is an information structure for model selection. It does not let users set investment preferences or connect real accounts, deposits, or orders.',
    backToModels: 'Back to models'
  }
} as const;

const comparisonModels: Record<InvestModelLocale, ComparisonModel[]> = {
  ko: [
    {
      id: 'quant-us-leverage-alpha',
      name: 'Quant US Leverage Alpha',
      market: '미국 주식',
      mandate: '레버리지 ETF 포함',
      risk: '고위험',
      riskTone: 'high',
      backtestReturn: '+18.4%',
      volatility: '높음',
      drawdown: '-24.1%',
      leverage: '허용',
      reviewState: '승인 mock',
      caution: '큰 손실 구간과 높은 회전율을 함께 확인해야 합니다.'
    },
    {
      id: 'macro-etf-balance',
      name: 'Macro ETF Balance',
      market: '글로벌 ETF',
      mandate: '주식/채권 혼합',
      risk: '중위험',
      riskTone: 'medium',
      backtestReturn: '+9.7%',
      volatility: '중간',
      drawdown: '-11.8%',
      leverage: '비허용',
      reviewState: '승인 mock',
      caution: '매크로 입력과 리밸런싱 주기가 성과보다 먼저 검토됩니다.'
    },
    {
      id: 'defensive-income-rotation',
      name: 'Defensive Income Rotation',
      market: '미국 인컴',
      mandate: '배당/단기채 중심',
      risk: '저위험',
      riskTone: 'low',
      backtestReturn: '+5.2%',
      volatility: '낮음',
      drawdown: '-6.4%',
      leverage: '비허용',
      reviewState: '승인 mock',
      caution: '낮은 변동성 모델도 손실 가능성이 사라지지 않습니다.'
    }
  ],
  en: [
    {
      id: 'quant-us-leverage-alpha',
      name: 'Quant US Leverage Alpha',
      market: 'US equities',
      mandate: 'Leveraged ETF allowed',
      risk: 'High risk',
      riskTone: 'high',
      backtestReturn: '+18.4%',
      volatility: 'High',
      drawdown: '-24.1%',
      leverage: 'Allowed',
      reviewState: 'Approved mock',
      caution: 'High turnover and large drawdown windows must be reviewed together.'
    },
    {
      id: 'macro-etf-balance',
      name: 'Macro ETF Balance',
      market: 'Global ETF',
      mandate: 'Stock/Bond mix',
      risk: 'Medium risk',
      riskTone: 'medium',
      backtestReturn: '+9.7%',
      volatility: 'Medium',
      drawdown: '-11.8%',
      leverage: 'Not allowed',
      reviewState: 'Approved mock',
      caution: 'Macro inputs and rebalance cadence sit next to performance.'
    },
    {
      id: 'defensive-income-rotation',
      name: 'Defensive Income Rotation',
      market: 'US income',
      mandate: 'Dividend and short bond tilt',
      risk: 'Low risk',
      riskTone: 'low',
      backtestReturn: '+5.2%',
      volatility: 'Low',
      drawdown: '-6.4%',
      leverage: 'Not allowed',
      reviewState: 'Approved mock',
      caution: 'Lower volatility does not remove the possibility of losses.'
    }
  ]
};

function modelCompareVisibleBoundaries(locale: InvestModelLocale) {
  return locale === 'ko'
    ? [
        '승인된 모의 비교',
        '모델 버전 맥락',
        '모델 위험 프로필',
        '백테스트 참고',
        '추천 아님',
        '주문 아님',
        '브로커 미연결'
      ]
    : [
        'approved mock comparison',
        'ModelVersion context',
        'ModelRiskProfile',
        'backtest placeholder',
        'not advice',
        'not an order',
        'no brokerage'
      ];
}

type ModelComparePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ModelComparePage({
  searchParams
}: ModelComparePageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = resolveInvestModelLocale(resolvedSearchParams);
  const copy = comparisonCopy[locale];
  const models = comparisonModels[locale];
  const visibleBoundaries = modelCompareVisibleBoundaries(locale);

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/models/compare"
      trailing={
        <DetailBackLink
          href={withInvestModelLocale('/invest-model/models', locale)}
          label={copy.backToModels}
          variant="icon"
        />
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={BarChart3}
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={copy.sectionTitle}
            description={copy.sectionDescription}
          />

          <div className="space-y-invest-card-gap">
            {models.map((model) => (
              <article
                key={model.id}
                className="group rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-invest-primary/30 hover:shadow-invest-nav active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[18px] font-bold leading-7 text-invest-text">
                      {model.name}
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-invest-text-muted">
                      {model.caution}
                    </p>
                  </div>
                  <RiskBadge tone={model.riskTone}>{model.risk}</RiskBadge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Metric label={copy.labels.return} value={model.backtestReturn} tone="positive" />
                  <Metric label={copy.labels.drawdown} value={model.drawdown} tone="risk" />
                  <Metric label={copy.labels.volatility} value={model.volatility} />
                  <Metric label={copy.labels.market} value={model.market} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <RiskBadge>{model.mandate}</RiskBadge>
                  <RiskBadge tone={model.leverage === '허용' || model.leverage === 'Allowed' ? 'medium' : 'neutral'}>
                    {copy.labels.leverage}: {model.leverage}
                  </RiskBadge>
                  <RiskBadge tone="low">
                    {copy.labels.review}: {model.reviewState}
                  </RiskBadge>
                </div>

                <p className="mt-3 rounded-invest-control bg-invest-surface-muted px-3 py-2 text-xs font-semibold leading-5 text-invest-text-muted">
                  {visibleBoundaries.join(' / ')}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <p className="text-xs font-semibold leading-5 text-invest-text-muted">
            No live orders / Approved mock only / Backtest placeholder
          </p>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {copy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
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
    <div className="min-h-24 rounded-invest-control bg-invest-surface-muted p-3 transition-[background-color,transform] duration-200 ease-out group-hover:bg-invest-primary-soft/60 group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100">
      <p className="text-[11px] font-semibold leading-4 text-invest-text-muted">
        {label}
      </p>
      <p className={`mt-2 break-words text-[18px] font-bold leading-6 ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
