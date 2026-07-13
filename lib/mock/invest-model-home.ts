/**
 * investModel 홈 화면 mock 데이터는 실제 자금, 주문, 투자 성과가 아닌 모바일 UI 개발용 샘플입니다.
 * 실제 DB/API 연결 전까지 화면 구조와 고지 위치를 검증하는 데만 사용합니다.
 */
export const investModelHomeMock = {
  account: {
    mockBalanceLabel: '$24,800',
    balanceDescription: 'Simulated balance only',
    backtestReturnLabel: '+2.4%',
    returnDescription: 'Sample backtest movement',
    policyStatusLabel: 'Review',
    policyDescription: 'No live trading enabled'
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
  signal: {
    title: 'Today signal is ready',
    description:
      'Mock news traffic and price trend inputs suggest the model should review exposure before any simulated allocation.',
    source: 'News traffic mock',
    status: 'Policy check'
  },
  timeline: [
    {
      time: '09:10',
      title: 'Market traffic snapshot',
      description: 'Mock article volume increased around US mega-cap earnings.'
    },
    {
      time: '09:16',
      title: 'TradeIntent blocked',
      description: 'Simulation stayed below live order stage because leverage policy is not approved.'
    }
  ]
} as const;
