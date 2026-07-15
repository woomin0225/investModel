/**
 * investModel frontend copy registry keeps Korean and English UI text in one place.
 * Korean is the default locale so the mobile PWA opens in the user's primary language first.
 */

export type InvestModelLocale = 'ko' | 'en';
export type InvestmentModelPublicationStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'rejected'
  | 'approved'
  | 'live'
  | 'paused'
  | 'suspended'
  | 'retired';
export type InvestModelDiscoveryFilterId =
  | 'all'
  | 'us-equities'
  | 'etf-blend'
  | 'high-risk'
  | 'low-turnover';

type SearchParams = Record<string, string | string[] | undefined>;
type InvestModelFilterable = {
  id: string;
  riskTone: string;
  status: InvestmentModelPublicationStatus;
};

type InvestmentModelStatusDisplay = {
  label: string;
  tone: 'neutral' | 'low' | 'medium' | 'high' | 'blocked';
  isSelectionDisabled: boolean;
};

export function resolveInvestModelLocale(
  searchParams?: SearchParams | null
): InvestModelLocale {
  const rawLang = Array.isArray(searchParams?.lang)
    ? searchParams?.lang[0]
    : searchParams?.lang;

  return rawLang === 'en' ? 'en' : 'ko';
}

export function withInvestModelLocale(
  path: string,
  locale: InvestModelLocale
) {
  return locale === 'en' ? `${path}?lang=en` : path;
}

export function isPublicDiscoverableInvestmentModel(model: {
  status: InvestmentModelPublicationStatus;
}) {
  return model.status === 'approved' || model.status === 'live';
}

export function getInvestmentModelStatusDisplay(
  status: InvestmentModelPublicationStatus,
  locale: InvestModelLocale
): InvestmentModelStatusDisplay {
  const labels = {
    ko: {
      draft: '초안',
      pending_review: '심사 대기',
      changes_requested: '수정 요청',
      rejected: '반려',
      approved: '검토 완료',
      live: '운용 중',
      paused: '일시 중지',
      suspended: '운영 중지',
      retired: '종료'
    },
    en: {
      draft: 'Draft',
      pending_review: 'Pending review',
      changes_requested: 'Changes requested',
      rejected: 'Rejected',
      approved: 'Reviewed',
      live: 'Live',
      paused: 'Paused',
      suspended: 'Suspended',
      retired: 'Retired'
    }
  } as const;

  const disabledStatuses = new Set<InvestmentModelPublicationStatus>([
    'draft',
    'pending_review',
    'changes_requested',
    'rejected',
    'paused',
    'suspended',
    'retired'
  ]);

  const toneByStatus: Record<
    InvestmentModelPublicationStatus,
    InvestmentModelStatusDisplay['tone']
  > = {
    draft: 'neutral',
    pending_review: 'medium',
    changes_requested: 'medium',
    rejected: 'blocked',
    approved: 'low',
    live: 'low',
    paused: 'medium',
    suspended: 'blocked',
    retired: 'neutral'
  };

  return {
    label: labels[locale][status],
    tone: toneByStatus[status],
    isSelectionDisabled: disabledStatuses.has(status)
  };
}

export const investModelDiscoveryFilterIds = [
  'all',
  'us-equities',
  'etf-blend',
  'high-risk',
  'low-turnover'
] as const satisfies InvestModelDiscoveryFilterId[];

export function resolveInvestModelDiscoveryFilter(
  rawFilter?: string | string[]
): InvestModelDiscoveryFilterId {
  const filter = Array.isArray(rawFilter) ? rawFilter[0] : rawFilter;

  return investModelDiscoveryFilterIds.includes(
    filter as InvestModelDiscoveryFilterId
  )
    ? (filter as InvestModelDiscoveryFilterId)
    : 'all';
}

export function matchesInvestModelDiscoveryFilter(
  model: InvestModelFilterable,
  filterId: InvestModelDiscoveryFilterId
) {
  if (!isPublicDiscoverableInvestmentModel(model)) {
    return false;
  }

  switch (filterId) {
    case 'us-equities':
      return [
        'quant-us-leverage-alpha',
        'defensive-income-rotation'
      ].includes(model.id);
    case 'etf-blend':
      return model.id === 'macro-etf-balance';
    case 'high-risk':
      return model.riskTone === 'high';
    case 'low-turnover':
      return model.id === 'defensive-income-rotation';
    case 'all':
    default:
      return true;
  }
}

export const investModelNavLabels = {
  ko: {
    home: '홈',
    models: '모델',
    signals: '신호',
    feed: '피드',
    portfolio: '투자'
  },
  en: {
    home: 'Home',
    models: 'Models',
    signals: 'Signals',
    feed: 'Feed',
    portfolio: 'Invest'
  }
} as const;

export const investModelCopy = {
  ko: {
    language: {
      label: '언어 선택',
      ko: '한국어',
      en: 'EN'
    },
    actions: {
      searchModels: '모델 검색',
      notifications: '알림',
      searchApprovedModels: '승인 모델 검색',
      signalAlerts: '신호 알림',
      feedNotifications: '피드 알림',
      view: '보기'
    },
    home: {
      eyebrow: '내 모델 홈',
      title: '내 AI 투자',
      bannerEyebrow: '시뮬레이션',
      signal: {
        title: '오늘의 신호 준비됨',
        description:
          '뉴스 트래픽과 가격 추세 입력은 모델이 시뮬레이션 배분 전에 노출을 검토해야 함을 보여줍니다.',
        source: '뉴스 트래픽 관찰',
        status: '정책 검사'
      },
      metrics: {
        mockBalance: '시뮬레이션 운용금액',
        simulatedBalanceOnly: '실제 계좌와 분리',
        backtestMove: '백테스트 변동',
        sampleBacktestMovement: '백테스트 변동',
        policyStatus: '정책 상태',
        noLiveTrading: '실거래 비활성',
        review: '검토',
        mock: '시뮬레이션',
        sample: '참고',
        blocked: '차단'
      },
      activeModelSection: {
        title: '활성 모델',
        description: '사용자 성향이 아니라 모델이 정의한 운용 범위입니다.'
      },
      activeModel: {
        name: 'US 모멘텀 AI',
        summary:
          '미국 대형주 모멘텀을 추적하고, 시뮬레이션 정책 검사가 레버리지 노출을 차단하면 운용을 멈춥니다.',
        market: '미국 주식',
        riskLabel: '고위험',
        performanceLabel: '백테스트',
        mandateLabel: '모델 운용 범위'
      },
      activitySection: {
        title: '최근 활동',
        description: '모델 신호와 정책 이벤트입니다.'
      },
      timeline: [
        {
          time: '09:10',
          title: '시장 트래픽 스냅샷',
          description:
            '미국 초대형주 실적 발표 주변의 기사량이 증가했습니다.'
        },
        {
          time: '09:16',
          title: '시뮬레이션 차단',
          description:
            '레버리지 정책이 승인되지 않아 시뮬레이션은 실주문 단계 아래에서 멈췄습니다.'
        }
      ],
      footerBadges: {
        noLiveOrders: '실주문 없음'
      },
      footer:
        '표시된 입금, 포트폴리오 가치, 수익률, 신호, 주문 전 의도 상태는 실제 계좌나 주문과 연결되지 않은 시뮬레이션 정보입니다.'
    },
    models: {
      eyebrow: '탐색',
      title: 'AI 모델',
      bannerEyebrow: '모델 마켓플레이스',
      notice: {
        title: '검토된 모델만 표시',
        description:
          '탐색 화면은 검토된 모델만 보여줍니다. 백테스트 수익률은 참고 지표이며 입금, 주문, 모델 실행을 만들지 않습니다.'
      },
      sectionTitle: '모델 탐색',
      liveApprovedCount: '개의 검토된 모델',
      filters: ['전체 live', '미국 주식', 'ETF 혼합', '고위험', '낮은 회전율'],
      footer:
        '심사 중인 모델은 공개 탐색 화면에서 제외됩니다. 사용자는 여기서 투자 성향을 바꿀 수 없고, 각 모델이 자체 운용 범위를 가집니다.',
      footerBadges: {
        noLiveTrading: '실거래 없음',
        approvedOnly: '승인 모델만',
        backtestMock: '백테스트 참고'
      },
      models: [
        {
          id: 'quant-us-leverage-alpha',
          name: 'Quant US 레버리지 알파',
          summary:
            '모델이 정의한 공격형 운용 범위에 따라 미국 대형주 모멘텀과 레버리지 ETF 노출을 평가합니다.',
          market: '미국 주식',
          riskLabel: '고위험',
          riskTone: 'high',
          performanceLabel: '+18.4% 백테스트',
          mandateLabel: '레버리지 ETF',
          status: 'live',
          tags: ['NASDAQ 중심', '높은 회전율', '채권 없음'],
          reviewLabel: '검토 완료',
          simulatedAumLabel: '$2.4M 운용 시뮬레이션'
        },
        {
          id: 'macro-etf-balance',
          name: 'Macro ETF 밸런스',
          summary:
            '거시 추세, 뉴스 트래픽, 손실 제한 규칙을 바탕으로 주식/채권 ETF에 배분합니다.',
          market: '글로벌 ETF',
          riskLabel: '중위험',
          riskTone: 'medium',
          performanceLabel: '+9.7% 백테스트',
          mandateLabel: '주식/채권 혼합',
          status: 'approved',
          tags: ['ETF 전용', '손실 제한', '월간 리밸런싱'],
          reviewLabel: '검토 완료',
          simulatedAumLabel: '$890K 운용 시뮬레이션'
        },
        {
          id: 'defensive-income-rotation',
          name: 'Defensive Income 로테이션',
          summary:
            '위험 회피 신호가 나타나면 배당주, 단기 채권 ETF, 현금성 노출로 회전합니다.',
          market: '미국 인컴',
          riskLabel: '저위험',
          riskTone: 'low',
          performanceLabel: '+5.2% 백테스트',
          mandateLabel: '인컴 중심',
          status: 'live',
          tags: ['레버리지 없음', '인컴 중심', '낮은 변동성'],
          reviewLabel: '검토 완료',
          simulatedAumLabel: '$1.1M 운용 시뮬레이션'
        },
        {
          id: 'review-only-prototype',
          name: '심사용 모델',
          summary:
            '탐색 화면이 미승인 모델을 제외하는지 검증하기 위해 남긴 심사 대기 모델입니다.',
          market: '숨김',
          riskLabel: '차단',
          riskTone: 'high',
          performanceLabel: '비공개',
          mandateLabel: '심사 중',
          status: 'pending_review',
          tags: ['숨김'],
          reviewLabel: '심사 대기',
          simulatedAumLabel: '$0 시뮬레이션'
        }
      ]
    },
    signals: {
      eyebrow: '실시간',
      title: '신호',
      bannerEyebrow: '신호 모니터',
      summary: {
        title: '실시간 신호 모니터',
        description:
          '신호는 뉴스 트래픽, 가격 모멘텀, 모델 관심도를 결합합니다. 주문 전 의도나 실주문을 만들지 않습니다.',
        activeCountLabel: '관찰 신호 6개',
        latencyLabel: '관찰 지연 12초',
        blockedLabel: '실주문 0건'
      },
      filters: ['전체 신호', '뉴스 트래픽', '가격 추세', '위험 알림'],
      metrics: {
        activeFeed: '활성 피드',
        observedMockInputs: '관찰된 입력',
        latency: '지연',
        notLiveMarketFeed: '실시간 시장 피드 아님',
        executionStatus: '실행 상태',
        noTradeIntent:
          '신호는 주문을 실행하거나 활성 주문 전 의도 기록을 만들지 않습니다.',
        sample: '참고',
        mock: '관찰',
        blocked: '차단'
      },
      sectionTitle: '신호 순위',
      sectionDescription:
        '검토된 모델에 대한 뉴스, 추세, 위험 입력입니다.',
      signals: [
        {
          id: 'signal-ai-chip-news-traffic',
          rank: 1,
          title: 'AI 칩 헤드라인 가속',
          description:
            'Quant US 레버리지 알파가 관찰하는 반도체 리더 종목 주변의 뉴스 트래픽과 장전 언급량이 높아졌습니다.',
          sourceLabel: '뉴스 트래픽',
          scoreLabel: '92점',
          scoreTone: 'high',
          freshnessLabel: '2분 전',
          linkedModelName: 'Quant US 레버리지 알파',
          marketLabel: '미국 주식',
          statusLabel: '관찰 전용'
        },
        {
          id: 'signal-bond-yield-cooling',
          rank: 2,
          title: '단기 금리 둔화',
          description:
            '매크로 바스켓에서 채권 ETF 모멘텀이 개선되고 주식 변동성은 제한적이었습니다.',
          sourceLabel: '가격 추세',
          scoreLabel: '78점',
          scoreTone: 'medium',
          freshnessLabel: '7분 전',
          linkedModelName: 'Macro ETF 밸런스',
          marketLabel: '글로벌 ETF',
          statusLabel: '시뮬레이션 입력'
        },
        {
          id: 'signal-drawdown-guard',
          rank: 3,
          title: '손실 제한 임계값 근접',
          description:
            'Defensive Income 로테이션이 며칠간의 변동성 증가 이후 위험 회피 임계값에 가까워졌습니다.',
          sourceLabel: '위험 알림',
          scoreLabel: '71점',
          scoreTone: 'medium',
          freshnessLabel: '11분 전',
          linkedModelName: 'Defensive Income 로테이션',
          marketLabel: '미국 인컴',
          statusLabel: '정책 검사 전용'
        },
        {
          id: 'signal-consumer-traffic-fade',
          rank: 4,
          title: '소비 섹터 트래픽 둔화',
          description:
            '피드에서 리테일/경기소비재 주제량이 줄어 성장 편향 모델의 관심도가 낮아졌습니다.',
          sourceLabel: '뉴스 트래픽',
          scoreLabel: '58점',
          scoreTone: 'low',
          freshnessLabel: '19분 전',
          linkedModelName: 'Macro ETF 밸런스',
          marketLabel: '미국 섹터',
          statusLabel: '관찰 전용'
        }
      ],
      footerBadges: {
        noRecommendation: '추천 아님',
        mockData: '관찰 데이터'
      },
      footer:
        '신호 순위는 관찰값입니다. 투자 조언, 모델 성과 주장, 증권 매수/매도 지시가 아닙니다.'
    },
    feed: {
      eyebrow: '인사이트',
      title: '피드',
      bannerEyebrow: '인사이트 피드',
      summary: {
        title: '모델 인사이트 피드',
        description:
          '검토된 모델과 운영자의 코멘터리입니다. 게시글은 거래 추천 없이 관찰 신호와 운용 범위 맥락을 설명합니다.',
        postCountLabel: '인사이트 5개',
        sourceCountLabel: '모델 소스 3개',
        reviewLabel: '법률 문구 없음'
      },
      filters: ['전체 글', '모델 노트', '시장 맥락', '위험 노트'],
      metrics: {
        posts: '게시글',
        prototypeContent: '최근 업데이트',
        sources: '출처',
        approvedModelContext: '모델별 맥락',
        disclosureState: '고지 상태',
        legalCopy:
          '최종 법률/금융 고지 문구는 자격 있는 검토자가 제공해야 합니다.',
        mock: '활성',
        sample: '연결',
        review: '검토'
      },
      sectionTitle: '최신 인사이트',
      sectionDescription: '모델 노트와 시장 맥락입니다.',
      posts: [
        {
          id: 'feed-leverage-alpha-chip-context',
          title: '칩 모멘텀이 높아진 이유',
          excerpt:
            'Quant US 레버리지 알파는 반도체 관심도 상승을 표시하지만, 이 글은 관찰값이며 사용자 성향을 바꾸거나 주문을 실행하지 않습니다.',
          authorLabel: '모델 코멘터리',
          sourceLabel: '뉴스 트래픽',
          linkedModelName: 'Quant US 레버리지 알파',
          timeLabel: '4분 전',
          typeLabel: '모델 노트',
          tone: 'high',
          tags: ['AI 칩', '모멘텀', '고위험']
        },
        {
          id: 'feed-macro-etf-yield-context',
          title: 'ETF 혼합 모델이 단기 금리 둔화를 관찰',
          excerpt:
            'Macro ETF 밸런스는 금리 압력 완화를 기록하고, 조언이 아닌 배분 맥락 설명에 집중합니다.',
          authorLabel: '모델 코멘터리',
          sourceLabel: '가격 추세',
          linkedModelName: 'Macro ETF 밸런스',
          timeLabel: '12분 전',
          typeLabel: '시장 맥락',
          tone: 'medium',
          tags: ['채권 ETF', '매크로', '백테스트']
        },
        {
          id: 'feed-defensive-income-risk-note',
          title: '위험 회피 가드가 임계값 근처에 유지',
          excerpt:
            'Defensive Income 로테이션은 손실 제한 규칙을 설명하고 시뮬레이션 포트폴리오가 실제 자산이 아님을 강조합니다.',
          authorLabel: '운영자 검토',
          sourceLabel: '정책 검사',
          linkedModelName: 'Defensive Income 로테이션',
          timeLabel: '21분 전',
          typeLabel: '위험 노트',
          tone: 'medium',
          tags: ['손실 제한', '인컴', '포트폴리오']
        },
        {
          id: 'feed-review-queue-disclosure',
          title: '고지 검토 대기',
          excerpt:
            '법률/금융 고지 문구는 자격 있는 검토자가 최종 문구를 제공할 때까지 준비 중으로 남겨둡니다.',
          authorLabel: '컴플라이언스 검토',
          sourceLabel: '내부 검토',
          linkedModelName: '전체 모델',
          timeLabel: '38분 전',
          typeLabel: '검토 노트',
          tone: 'neutral',
          tags: ['고지', '검토 필요']
        },
        {
          id: 'feed-consumer-traffic-fade',
          title: '소비 주제량 감소',
          excerpt:
            '피드는 소비 섹터 관심도 하락을 기록하며, 해석을 주문 전 의도 생성과 분리합니다.',
          authorLabel: '시장 모니터',
          sourceLabel: '뉴스 트래픽',
          linkedModelName: 'Macro ETF 밸런스',
          timeLabel: '46분 전',
          typeLabel: '시장 맥락',
          tone: 'low',
          tags: ['소비', '트래픽', '관찰']
        }
      ],
      footerBadges: {
        noAdvice: '조언 아님',
        reviewPlaceholder: '검토 대기'
      },
      footer:
        '피드 게시글은 정보성 코멘터리입니다. 증권을 추천하거나 수익을 보장하거나 모델 파일, 입금, 주문을 실행하지 않습니다.'
    }
  },
  en: {
    language: {
      label: 'Choose language',
      ko: '한국어',
      en: 'EN'
    },
    actions: {
      searchModels: 'Search models',
      notifications: 'Notifications',
      searchApprovedModels: 'Search approved models',
      signalAlerts: 'Signal alerts',
      feedNotifications: 'Feed notifications',
      view: 'View'
    },
    home: {
      eyebrow: 'Model home',
      title: 'My AI Investment',
      bannerEyebrow: 'Simulation',
      signal: {
        title: 'Today signal is ready',
        description:
          'News traffic and price trend inputs suggest the model should review exposure before any simulated allocation.',
        source: 'Observed news traffic',
        status: 'Policy check'
      },
      metrics: {
        mockBalance: 'Simulated operating amount',
        simulatedBalanceOnly: 'Separated from real accounts',
        backtestMove: 'Backtest move',
        sampleBacktestMovement: 'Backtest movement',
        policyStatus: 'Policy status',
        noLiveTrading: 'No live trading enabled',
        review: 'Review',
        mock: 'simulation',
        sample: 'reference',
        blocked: 'blocked'
      },
      activeModelSection: {
        title: 'Active model',
        description: 'Model-defined mandate, not user preference.'
      },
      activeModel: {
        name: 'US Momentum AI',
        summary:
          'Tracks US large-cap momentum and pauses when the simulated policy check blocks leverage exposure.',
        market: 'US equities',
        riskLabel: 'High risk',
        performanceLabel: 'Backtest',
        mandateLabel: 'Model mandate'
      },
      activitySection: {
        title: 'Latest activity',
        description: 'Model signal and policy events.'
      },
      timeline: [
        {
          time: '09:10',
          title: 'Market traffic snapshot',
          description: 'Article volume increased around US mega-cap earnings.'
        },
        {
          time: '09:16',
          title: 'Simulation blocked',
          description:
            'Simulation stayed below live order stage because leverage policy is not approved.'
        }
      ],
      footerBadges: {
        noLiveOrders: 'No live orders'
      },
      footer:
        'Displayed deposits, portfolio values, returns, signals, and TradeIntent states are simulation information that is not connected to real accounts or orders.'
    },
    models: {
      eyebrow: 'Discover',
      title: 'AI Models',
      bannerEyebrow: 'Model marketplace',
      notice: {
        title: 'Reviewed models only',
        description:
          'Discovery shows reviewed models only. Backtest returns are reference metrics and do not trigger deposits, orders, or model execution.'
      },
      sectionTitle: 'Explore models',
      liveApprovedCount: 'reviewed models',
      filters: ['All live', 'US equities', 'ETF blend', 'High risk', 'Low turnover'],
      footer:
        'Hidden review models are filtered out of this public discovery screen. Users cannot change investment preferences here; each model carries its own mandate.',
      footerBadges: {
        noLiveTrading: 'No live trading',
        approvedOnly: 'Approved only',
        backtestMock: 'Backtest reference'
      },
      models: [
        {
          id: 'quant-us-leverage-alpha',
          name: 'Quant US Leverage Alpha',
          summary:
            'Trades US large-cap momentum and leveraged ETFs from a model-defined aggressive mandate.',
          market: 'US equities',
          riskLabel: 'High risk',
          riskTone: 'high',
          performanceLabel: '+18.4% backtest',
          mandateLabel: 'Leveraged ETF',
          status: 'live',
          tags: ['NASDAQ focus', 'High turnover', 'No bonds'],
          reviewLabel: 'Reviewed',
          simulatedAumLabel: '$2.4M simulated'
        },
        {
          id: 'macro-etf-balance',
          name: 'Macro ETF Balance',
          summary:
            'Allocates across equity and bond ETFs based on macro trend, news traffic, and drawdown rules.',
          market: 'Global ETF',
          riskLabel: 'Medium risk',
          riskTone: 'medium',
          performanceLabel: '+9.7% backtest',
          mandateLabel: 'Stock/Bond mix',
          status: 'approved',
          tags: ['ETF only', 'Drawdown guard', 'Monthly rebalance'],
          reviewLabel: 'Reviewed',
          simulatedAumLabel: '$890K simulated'
        },
        {
          id: 'defensive-income-rotation',
          name: 'Defensive Income Rotation',
          summary:
            'Rotates dividend equities, short-duration bond ETFs, and cash-like exposure during risk-off signals.',
          market: 'US income',
          riskLabel: 'Low risk',
          riskTone: 'low',
          performanceLabel: '+5.2% backtest',
          mandateLabel: 'Income tilt',
          status: 'live',
          tags: ['No leverage', 'Income focus', 'Lower volatility'],
          reviewLabel: 'Reviewed',
          simulatedAumLabel: '$1.1M simulated'
        },
        {
          id: 'review-only-prototype',
          name: 'Review Only Model',
          summary:
            'Pending review model kept to verify that discovery excludes unapproved models.',
          market: 'Hidden',
          riskLabel: 'Blocked',
          riskTone: 'high',
          performanceLabel: 'Not public',
          mandateLabel: 'Pending',
          status: 'pending_review',
          tags: ['Hidden'],
          reviewLabel: 'Pending review',
          simulatedAumLabel: '$0 simulated'
        }
      ]
    },
    signals: {
      eyebrow: 'Realtime',
      title: 'Signals',
      bannerEyebrow: 'Signal monitor',
      summary: {
        title: 'Realtime signal monitor',
        description:
          'Signals combine news traffic, price momentum, and model attention. They do not create TradeIntent or live orders.',
        activeCountLabel: '6 observed signals',
        latencyLabel: '12s observed lag',
        blockedLabel: '0 live orders'
      },
      filters: ['All signals', 'News traffic', 'Price trend', 'Risk alert'],
      metrics: {
        activeFeed: 'Active feed',
        observedMockInputs: 'Observed inputs',
        latency: 'Latency',
        notLiveMarketFeed: 'Not a live market feed',
        executionStatus: 'Execution status',
        noTradeIntent:
          'Signals do not execute orders or create live TradeIntent records.',
        sample: 'reference',
        mock: 'observed',
        blocked: 'blocked'
      },
      sectionTitle: 'Signal ranking',
      sectionDescription:
        'News, trend, and risk inputs for reviewed models.',
      signals: [
        {
          id: 'signal-ai-chip-news-traffic',
          rank: 1,
          title: 'AI chip headlines accelerating',
          description:
            'News traffic and pre-market mentions are elevated across semiconductor leaders watched by Quant US Leverage Alpha.',
          sourceLabel: 'News traffic',
          scoreLabel: '92 score',
          scoreTone: 'high',
          freshnessLabel: '2m ago',
          linkedModelName: 'Quant US Leverage Alpha',
          marketLabel: 'US equities',
          statusLabel: 'Observation only'
        },
        {
          id: 'signal-bond-yield-cooling',
          rank: 2,
          title: 'Short-term yields cooling',
          description:
            'Bond ETF momentum improved in the macro basket while equity volatility stayed contained.',
          sourceLabel: 'Price trend',
          scoreLabel: '78 score',
          scoreTone: 'medium',
          freshnessLabel: '7m ago',
          linkedModelName: 'Macro ETF Balance',
          marketLabel: 'Global ETF',
          statusLabel: 'Simulation input'
        },
        {
          id: 'signal-drawdown-guard',
          rank: 3,
          title: 'Drawdown guard near threshold',
          description:
            'Defensive Income Rotation is close to a risk-off threshold after a multi-day volatility pickup.',
          sourceLabel: 'Risk alert',
          scoreLabel: '71 score',
          scoreTone: 'medium',
          freshnessLabel: '11m ago',
          linkedModelName: 'Defensive Income Rotation',
          marketLabel: 'US income',
          statusLabel: 'Policy check only'
        },
        {
          id: 'signal-consumer-traffic-fade',
          rank: 4,
          title: 'Consumer traffic fading',
          description:
            'Retail and discretionary topic volume fell in the feed, lowering attention for growth-biased models.',
          sourceLabel: 'News traffic',
          scoreLabel: '58 score',
          scoreTone: 'low',
          freshnessLabel: '19m ago',
          linkedModelName: 'Macro ETF Balance',
          marketLabel: 'US sectors',
          statusLabel: 'Observation only'
        }
      ],
      footerBadges: {
        noRecommendation: 'No recommendation',
        mockData: 'Observed data'
      },
      footer:
        'Signal rankings are observations. They are not investment advice, model performance claims, or instructions to buy or sell securities.'
    },
    feed: {
      eyebrow: 'Insights',
      title: 'Feed',
      bannerEyebrow: 'Insight feed',
      summary: {
        title: 'Model insight feed',
        description:
          'Commentary from reviewed models and operators. Posts explain observed signals and mandate context without recommending trades.',
        postCountLabel: '5 insights',
        sourceCountLabel: '3 model sources',
        reviewLabel: 'No legal copy'
      },
      filters: ['All posts', 'Model notes', 'Market context', 'Risk notes'],
      metrics: {
        posts: 'Posts',
        prototypeContent: 'Recent updates',
        sources: 'Sources',
        approvedModelContext: 'Model context',
        disclosureState: 'Disclosure state',
        legalCopy:
          'Final legal and financial disclosure copy must be supplied by a qualified reviewer.',
        mock: 'active',
        sample: 'linked',
        review: 'review'
      },
      sectionTitle: 'Latest insights',
      sectionDescription: 'Model notes and market context.',
      posts: [
        {
          id: 'feed-leverage-alpha-chip-context',
          title: 'Why chip momentum is elevated',
          excerpt:
            'Quant US Leverage Alpha flags higher semiconductor attention, but the post remains an observation and does not change user preferences or place orders.',
          authorLabel: 'Model commentary',
          sourceLabel: 'News traffic',
          linkedModelName: 'Quant US Leverage Alpha',
          timeLabel: '4m ago',
          typeLabel: 'Model note',
          tone: 'high',
          tags: ['AI chips', 'Momentum', 'High risk']
        },
        {
          id: 'feed-macro-etf-yield-context',
          title: 'ETF blend watches cooling short-term yields',
          excerpt:
            'Macro ETF Balance records lower yield pressure and keeps its mandate explanation focused on allocation context, not advice.',
          authorLabel: 'Model commentary',
          sourceLabel: 'Price trend',
          linkedModelName: 'Macro ETF Balance',
          timeLabel: '12m ago',
          typeLabel: 'Market context',
          tone: 'medium',
          tags: ['Bond ETF', 'Macro', 'Backtest']
        },
        {
          id: 'feed-defensive-income-risk-note',
          title: 'Risk-off guard remains close to threshold',
          excerpt:
            'Defensive Income Rotation explains the drawdown guard and highlights that simulated portfolio states are not real assets.',
          authorLabel: 'Operator review',
          sourceLabel: 'Policy check',
          linkedModelName: 'Defensive Income Rotation',
          timeLabel: '21m ago',
          typeLabel: 'Risk note',
          tone: 'medium',
          tags: ['Drawdown', 'Income', 'Portfolio']
        },
        {
          id: 'feed-review-queue-disclosure',
          title: 'Disclosure review queue',
          excerpt:
            'Legal and financial disclosure language stays in review until a qualified reviewer supplies final wording.',
          authorLabel: 'Compliance review',
          sourceLabel: 'Internal review',
          linkedModelName: 'All models',
          timeLabel: '38m ago',
          typeLabel: 'Review note',
          tone: 'neutral',
          tags: ['Disclosure', 'Review required']
        },
        {
          id: 'feed-consumer-traffic-fade',
          title: 'Consumer topic volume fades',
          excerpt:
            'The feed records lower consumer-sector attention and keeps the interpretation separate from TradeIntent creation.',
          authorLabel: 'Market monitor',
          sourceLabel: 'News traffic',
          linkedModelName: 'Macro ETF Balance',
          timeLabel: '46m ago',
          typeLabel: 'Market context',
          tone: 'low',
          tags: ['Consumer', 'Traffic', 'Observation']
        }
      ],
      footerBadges: {
        noAdvice: 'No advice',
        reviewPlaceholder: 'Review pending'
      },
      footer:
        'Feed posts are informational commentary. They do not recommend securities, guarantee returns, or execute model files, deposits, or orders.'
    }
  }
} as const;
