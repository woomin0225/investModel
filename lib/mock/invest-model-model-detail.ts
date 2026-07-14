/**
 * investModel model detail mock data describes each AI model's mandate, risks, and backtest context before real model execution exists.
 * It keeps Korean and English screen copy together so the mobile detail page can default to Korean and switch to English with ?lang=en.
 */

import type { InvestModelLocale } from '@/lib/i18n/invest-model';

export type MockInvestmentModelDetail = {
  id: string;
  modelPublicId: string;
  modelVersionPublicId: string;
  name: string;
  summary: string;
  marketLabel: string;
  riskLabel: string;
  riskTone: 'low' | 'medium' | 'high';
  leverageLabel: string;
  statusLabel: string;
  statusTone: 'low' | 'medium' | 'high' | 'blocked';
  mandateLabel: string;
  reviewLabel: string;
  updatedLabel: string;
  metrics: Array<{
    label: string;
    value: string;
    description: string;
    tone?: 'neutral' | 'positive' | 'risk';
  }>;
  mandateTitle: string;
  mandateItems: string[];
  riskTitle: string;
  riskItems: string[];
  limitationTitle: string;
  limitationItems: string[];
  disclosureTitle: string;
  disclosureDescription: string;
  actionLabel: string;
};

export const investModelDetailCopy = {
  ko: {
    eyebrow: '모델 상세',
    notFoundTitle: '모델을 찾을 수 없음',
    notFoundDescription:
      '공개 가능한 live 또는 approved mock 모델 상세만 표시합니다.',
    backLabel: '목록',
    mockOnlyLabel: 'Mock 상세',
    noLiveTradingLabel: '실거래 없음',
    reviewPlaceholderLabel: '고지 문구 검토 필요',
    performanceGroupTitle: '성과와 위험 지표',
    performanceGroupDescription:
      '수익률 샘플은 변동성, 최대 손실 구간과 함께 확인해야 합니다.',
    performanceGroupSourceLabel: '백테스트 placeholder',
    selectionReviewTitle: '선택 전 확인',
    selectionReviewDescription:
      '이 모델을 선택하기 전에 모델이 정한 운용 범위, 손실 가능성, 금지된 동작을 먼저 확인해야 합니다. 현재 버튼은 mock 확인용이며 실제 선택 저장은 아직 연결하지 않습니다.',
    highRiskNotice:
      '고위험 모델입니다. 레버리지, 집중 투자, 큰 손실 가능성을 추가로 확인해야 합니다.',
    highRiskConfirmLabel: '고위험 모델 확인 필요',
    highRiskConfirmDescription:
      '레버리지, 집중 투자, 큰 손실 가능성 확인은 mock 확인 단계이며 실제 투자 동의가 아닙니다.',
    selectionDisabledLabel: '선택 저장은 다음 단계에서 연결',
    models: [
      {
        id: 'quant-us-leverage-alpha',
        modelPublicId: 'model_quant_us_alpha',
        modelVersionPublicId: 'model_version_quant_us_v0_9',
        name: 'Quant US 레버리지 알파',
        summary:
          '미국 대형주 모멘텀과 레버리지 ETF를 모델이 미리 정의한 공격적 운용 원칙 안에서만 다루는 mock 모델입니다.',
        marketLabel: '미국 주식',
        riskLabel: '고위험',
        riskTone: 'high',
        leverageLabel: '레버리지 ETF 포함',
        statusLabel: 'Live mock',
        statusTone: 'high',
        mandateLabel: '공격형 모델 mandate',
        reviewLabel: '운영자 승인 mock',
        updatedLabel: '샘플 업데이트 12분 전',
        metrics: [
          {
            label: 'Backtest',
            value: '+18.4%',
            description: '샘플 과거 구간 기준이며 미래 수익을 의미하지 않습니다.',
            tone: 'positive'
          },
          {
            label: 'Max drawdown',
            value: '-31.2%',
            description: '레버리지 노출로 손실 구간이 크게 확대될 수 있습니다.',
            tone: 'risk'
          },
          {
            label: 'Volatility',
            value: 'High',
            description: '잦은 교체와 레버리지 노출은 변동성을 키울 수 있습니다.'
          }
        ],
        mandateTitle: '모델 운용 원칙',
        mandateItems: [
          '미국 대형 기술주와 NASDAQ 관련 ETF를 중심으로 관찰합니다.',
          '사용자가 주식/채권 비율이나 레버리지 선호를 직접 바꾸지 않습니다.',
          '뉴스 트래픽과 가격 모멘텀 입력을 모델 내부 원칙으로 해석합니다.'
        ],
        riskTitle: '위험 및 제한',
        riskItems: [
          '레버리지 ETF는 손실과 변동성이 빠르게 커질 수 있습니다.',
          '채권, 현금성 자산, 방어형 자산 배분을 기본으로 포함하지 않습니다.',
          '현재 화면은 mock 데이터이며 실제 주문, 입금, 모델 파일 실행을 하지 않습니다.'
        ],
        limitationTitle: 'MVP에서 금지된 동작',
        limitationItems: [
          '실제 증권 매수/매도 주문을 만들지 않습니다.',
          '실제 계좌 연결이나 자금 이동을 수행하지 않습니다.',
          '최종 법률/금융 고지 문구는 자격 있는 검토자가 제공해야 합니다.'
        ],
        disclosureTitle: '검토용 고지 placeholder',
        disclosureDescription:
          '이 상세 화면의 성과, 손실, 위험 문구는 모바일 UI 개발을 위한 placeholder입니다. 투자 조언, 수익 보장, 매수/매도 권유로 사용하지 않습니다.',
        actionLabel: '모델 선택 전 확인'
      },
      {
        id: 'macro-etf-balance',
        modelPublicId: 'model_macro_etf_balance',
        modelVersionPublicId: 'model_version_macro_etf_v1_0',
        name: 'Macro ETF 밸런스',
        summary:
          '거시 추세, 뉴스 트래픽, 손실 제한 규칙을 바탕으로 주식 ETF와 채권 ETF를 모델 원칙대로 배분하는 mock 모델입니다.',
        marketLabel: '글로벌 ETF',
        riskLabel: '중위험',
        riskTone: 'medium',
        leverageLabel: '레버리지 없음',
        statusLabel: 'Approved mock',
        statusTone: 'low',
        mandateLabel: '주식/채권 혼합',
        reviewLabel: '운영자 승인 mock',
        updatedLabel: '샘플 업데이트 22분 전',
        metrics: [
          {
            label: 'Backtest',
            value: '+9.7%',
            description: '샘플 과거 구간 기준이며 미래 수익을 의미하지 않습니다.',
            tone: 'positive'
          },
          {
            label: 'Max drawdown',
            value: '-12.8%',
            description: 'ETF 혼합 전략도 시장 급락 시 손실이 발생할 수 있습니다.',
            tone: 'risk'
          },
          {
            label: 'Volatility',
            value: 'Medium',
            description: '주식/채권 ETF 혼합도 시장 급락기에는 변동성을 가질 수 있습니다.'
          }
        ],
        mandateTitle: '모델 운용 원칙',
        mandateItems: [
          '주식 ETF와 채권 ETF의 비중은 사용자 설정이 아니라 모델 정의입니다.',
          '거시 지표와 가격 추세가 약해지면 방어적 ETF 비중을 높이는 mock 원칙을 사용합니다.',
          '월간 리밸런싱을 기본으로 하며 단기 매매를 핵심 가치로 두지 않습니다.'
        ],
        riskTitle: '위험 및 제한',
        riskItems: [
          '채권 ETF도 금리 변동과 시장 유동성에 따라 손실이 발생할 수 있습니다.',
          '모델 설명은 투자 성향 설정 화면을 대신하지 않습니다.',
          '현재 화면은 mock 데이터이며 실제 주문, 입금, 모델 파일 실행을 하지 않습니다.'
        ],
        limitationTitle: 'MVP에서 금지된 동작',
        limitationItems: [
          '실제 증권 매수/매도 주문을 만들지 않습니다.',
          '실제 계좌 연결이나 자금 이동을 수행하지 않습니다.',
          '최종 법률/금융 고지 문구는 자격 있는 검토자가 제공해야 합니다.'
        ],
        disclosureTitle: '검토용 고지 placeholder',
        disclosureDescription:
          '이 상세 화면의 성과, 손실, 위험 문구는 모바일 UI 개발을 위한 placeholder입니다. 투자 조언, 수익 보장, 매수/매도 권유로 사용하지 않습니다.',
        actionLabel: '모델 선택 전 확인'
      },
      {
        id: 'defensive-income-rotation',
        modelPublicId: 'model_defensive_income_rotation',
        modelVersionPublicId: 'model_version_defensive_income_v1_0',
        name: 'Defensive Income 로테이션',
        summary:
          '위험 회피 신호가 커지면 배당주, 단기 채권 ETF, 현금성 노출로 회전하는 방어형 mock 모델입니다.',
        marketLabel: '미국 인컴',
        riskLabel: '저위험',
        riskTone: 'low',
        leverageLabel: '레버리지 없음',
        statusLabel: 'Live mock',
        statusTone: 'low',
        mandateLabel: '인컴 중심',
        reviewLabel: '운영자 승인 mock',
        updatedLabel: '샘플 업데이트 31분 전',
        metrics: [
          {
            label: 'Backtest',
            value: '+5.2%',
            description: '샘플 과거 구간 기준이며 미래 수익을 의미하지 않습니다.',
            tone: 'positive'
          },
          {
            label: 'Max drawdown',
            value: '-7.4%',
            description: '방어형 전략도 손실 가능성이 남아 있습니다.',
            tone: 'risk'
          },
          {
            label: 'Volatility',
            value: 'Lower',
            description: 'mock 비교군 대비 낮은 변동성을 목표로 둡니다.'
          }
        ],
        mandateTitle: '모델 운용 원칙',
        mandateItems: [
          '배당주와 단기 채권 ETF를 중심으로 위험 회피 구간을 관찰합니다.',
          '레버리지 상품과 고회전 모멘텀 매매를 기본 운용 범위에서 제외합니다.',
          '인컴 중심 전략이지만 원금 보장이나 수익 보장을 의미하지 않습니다.'
        ],
        riskTitle: '위험 및 제한',
        riskItems: [
          '저위험 라벨은 상대적 mock 분류이며 손실 가능성을 제거하지 않습니다.',
          '배당주와 채권 ETF 모두 가격 변동과 유동성 위험이 있습니다.',
          '현재 화면은 mock 데이터이며 실제 주문, 입금, 모델 파일 실행을 하지 않습니다.'
        ],
        limitationTitle: 'MVP에서 금지된 동작',
        limitationItems: [
          '실제 증권 매수/매도 주문을 만들지 않습니다.',
          '실제 계좌 연결이나 자금 이동을 수행하지 않습니다.',
          '최종 법률/금융 고지 문구는 자격 있는 검토자가 제공해야 합니다.'
        ],
        disclosureTitle: '검토용 고지 placeholder',
        disclosureDescription:
          '이 상세 화면의 성과, 손실, 위험 문구는 모바일 UI 개발을 위한 placeholder입니다. 투자 조언, 수익 보장, 매수/매도 권유로 사용하지 않습니다.',
        actionLabel: '모델 선택 전 확인'
      }
    ] satisfies MockInvestmentModelDetail[]
  },
  en: {
    eyebrow: 'Model detail',
    notFoundTitle: 'Model not found',
    notFoundDescription:
      'Only public live or approved mock model details are shown.',
    backLabel: 'Models',
    mockOnlyLabel: 'Mock detail',
    noLiveTradingLabel: 'No live trading',
    reviewPlaceholderLabel: 'Disclosure review needed',
    performanceGroupTitle: 'Performance and risk metrics',
    performanceGroupDescription:
      'Sample return is shown with volatility and maximum drawdown context.',
    performanceGroupSourceLabel: 'Backtest placeholder',
    selectionReviewTitle: 'Review before selection',
    selectionReviewDescription:
      'Before choosing this model, review its model-defined mandate, loss possibility, and forbidden actions. This button is mock confirmation only; model selection persistence is not connected yet.',
    highRiskNotice:
      'This is a high-risk model. Additional review is required for leverage, concentration, and large loss possibility.',
    highRiskConfirmLabel: 'High-risk model confirmation required',
    highRiskConfirmDescription:
      'Reviewing leverage, concentration, and large loss possibility is a mock confirmation step, not real investment consent.',
    selectionDisabledLabel: 'Selection persistence comes next',
    models: [
      {
        id: 'quant-us-leverage-alpha',
        modelPublicId: 'model_quant_us_alpha',
        modelVersionPublicId: 'model_version_quant_us_v0_9',
        name: 'Quant US Leverage Alpha',
        summary:
          'A mock model that trades US large-cap momentum and leveraged ETFs only within its predefined aggressive mandate.',
        marketLabel: 'US equities',
        riskLabel: 'High risk',
        riskTone: 'high',
        leverageLabel: 'Leveraged ETF included',
        statusLabel: 'Live mock',
        statusTone: 'high',
        mandateLabel: 'Aggressive mandate',
        reviewLabel: 'Operator-approved mock',
        updatedLabel: 'Sample updated 12m ago',
        metrics: [
          {
            label: 'Backtest',
            value: '+18.4%',
            description: 'Sample historical range, not a future return claim.',
            tone: 'positive'
          },
          {
            label: 'Max drawdown',
            value: '-31.2%',
            description: 'Leveraged exposure can amplify losses and volatility.',
            tone: 'risk'
          },
          {
            label: 'Volatility',
            value: 'High',
            description:
              'Frequent rotation and leveraged exposure can raise volatility.'
          }
        ],
        mandateTitle: 'Model mandate',
        mandateItems: [
          'Observes US large-cap technology stocks and NASDAQ-related ETFs.',
          'Users cannot directly adjust stock/bond ratio or leverage preference.',
          'News traffic and price momentum are interpreted by model-defined rules.'
        ],
        riskTitle: 'Risks and limits',
        riskItems: [
          'Leveraged ETFs can increase losses and volatility quickly.',
          'Bonds, cash-like assets, and defensive allocation are not included by default.',
          'This screen uses mock data and does not execute orders, deposits, or model files.'
        ],
        limitationTitle: 'MVP forbidden actions',
        limitationItems: [
          'No real securities buy/sell orders are created.',
          'No real account connection or fund movement is performed.',
          'Final legal and financial disclosure copy must come from a qualified reviewer.'
        ],
        disclosureTitle: 'Review placeholder disclosure',
        disclosureDescription:
          'Performance, loss, and risk copy on this detail screen is placeholder content for mobile UI development. It is not investment advice, a return guarantee, or a buy/sell recommendation.',
        actionLabel: 'Review before selection'
      },
      {
        id: 'macro-etf-balance',
        modelPublicId: 'model_macro_etf_balance',
        modelVersionPublicId: 'model_version_macro_etf_v1_0',
        name: 'Macro ETF Balance',
        summary:
          'A mock model that allocates stock and bond ETFs by model-defined macro trend, news traffic, and drawdown rules.',
        marketLabel: 'Global ETF',
        riskLabel: 'Medium risk',
        riskTone: 'medium',
        leverageLabel: 'No leverage',
        statusLabel: 'Approved mock',
        statusTone: 'low',
        mandateLabel: 'Stock/Bond mix',
        reviewLabel: 'Operator-approved mock',
        updatedLabel: 'Sample updated 22m ago',
        metrics: [
          {
            label: 'Backtest',
            value: '+9.7%',
            description: 'Sample historical range, not a future return claim.',
            tone: 'positive'
          },
          {
            label: 'Max drawdown',
            value: '-12.8%',
            description: 'ETF blend strategies can still lose value during selloffs.',
            tone: 'risk'
          },
          {
            label: 'Volatility',
            value: 'Medium',
            description:
              'A stock and bond ETF blend can still become volatile during selloffs.'
          }
        ],
        mandateTitle: 'Model mandate',
        mandateItems: [
          'Stock and bond ETF weights are model-defined, not user preferences.',
          'The mock mandate raises defensive ETF exposure when macro and trend inputs weaken.',
          'Monthly rebalancing is the default; short-term trading is not the core premise.'
        ],
        riskTitle: 'Risks and limits',
        riskItems: [
          'Bond ETFs can lose value due to interest-rate moves and market liquidity.',
          'Model descriptions do not replace a user investment preference control.',
          'This screen uses mock data and does not execute orders, deposits, or model files.'
        ],
        limitationTitle: 'MVP forbidden actions',
        limitationItems: [
          'No real securities buy/sell orders are created.',
          'No real account connection or fund movement is performed.',
          'Final legal and financial disclosure copy must come from a qualified reviewer.'
        ],
        disclosureTitle: 'Review placeholder disclosure',
        disclosureDescription:
          'Performance, loss, and risk copy on this detail screen is placeholder content for mobile UI development. It is not investment advice, a return guarantee, or a buy/sell recommendation.',
        actionLabel: 'Review before selection'
      },
      {
        id: 'defensive-income-rotation',
        modelPublicId: 'model_defensive_income_rotation',
        modelVersionPublicId: 'model_version_defensive_income_v1_0',
        name: 'Defensive Income Rotation',
        summary:
          'A defensive mock model that rotates dividend equities, short-duration bond ETFs, and cash-like exposure during risk-off signals.',
        marketLabel: 'US income',
        riskLabel: 'Low risk',
        riskTone: 'low',
        leverageLabel: 'No leverage',
        statusLabel: 'Live mock',
        statusTone: 'low',
        mandateLabel: 'Income tilt',
        reviewLabel: 'Operator-approved mock',
        updatedLabel: 'Sample updated 31m ago',
        metrics: [
          {
            label: 'Backtest',
            value: '+5.2%',
            description: 'Sample historical range, not a future return claim.',
            tone: 'positive'
          },
          {
            label: 'Max drawdown',
            value: '-7.4%',
            description: 'Defensive strategies can still lose value.',
            tone: 'risk'
          },
          {
            label: 'Volatility',
            value: 'Lower',
            description: 'Targets lower volatility versus the mock comparison set.'
          }
        ],
        mandateTitle: 'Model mandate',
        mandateItems: [
          'Observes dividend equities and short-duration bond ETFs during risk-off periods.',
          'Excludes leveraged products and high-turnover momentum trading by default.',
          'Income focus does not imply principal protection or guaranteed return.'
        ],
        riskTitle: 'Risks and limits',
        riskItems: [
          'Low risk is a relative mock label and does not remove loss possibility.',
          'Dividend equities and bond ETFs still carry price and liquidity risk.',
          'This screen uses mock data and does not execute orders, deposits, or model files.'
        ],
        limitationTitle: 'MVP forbidden actions',
        limitationItems: [
          'No real securities buy/sell orders are created.',
          'No real account connection or fund movement is performed.',
          'Final legal and financial disclosure copy must come from a qualified reviewer.'
        ],
        disclosureTitle: 'Review placeholder disclosure',
        disclosureDescription:
          'Performance, loss, and risk copy on this detail screen is placeholder content for mobile UI development. It is not investment advice, a return guarantee, or a buy/sell recommendation.',
        actionLabel: 'Review before selection'
      }
    ] satisfies MockInvestmentModelDetail[]
  }
} satisfies Record<
  InvestModelLocale,
  {
    eyebrow: string;
    notFoundTitle: string;
    notFoundDescription: string;
    backLabel: string;
    mockOnlyLabel: string;
    noLiveTradingLabel: string;
    reviewPlaceholderLabel: string;
    performanceGroupTitle: string;
    performanceGroupDescription: string;
    performanceGroupSourceLabel: string;
    selectionReviewTitle: string;
    selectionReviewDescription: string;
    highRiskNotice: string;
    highRiskConfirmLabel: string;
    highRiskConfirmDescription: string;
    selectionDisabledLabel: string;
    models: MockInvestmentModelDetail[];
  }
>;

export function findMockInvestmentModelDetail(
  locale: InvestModelLocale,
  id: string
) {
  return investModelDetailCopy[locale].models.find((model) => model.id === id);
}
