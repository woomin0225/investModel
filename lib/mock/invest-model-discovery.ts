/**
 * investModel discovery mock data feeds the mobile model marketplace before any real model execution or trading exists.
 * Only approved live mock models should be rendered in the public discovery screen.
 */

import { isPublicDiscoverableInvestmentModel } from '@/lib/i18n/invest-model';

export type MockInvestmentModel = {
  id: string;
  name: string;
  summary: string;
  market: string;
  riskLabel: string;
  riskTone: 'low' | 'medium' | 'high';
  performanceLabel: string;
  mandateLabel: string;
  status: 'draft' | 'pending_review' | 'approved' | 'live' | 'paused';
  tags: string[];
  reviewLabel: string;
  simulatedAumLabel: string;
};

export const investModelDiscoveryMock = {
  filters: ['All live', 'US equities', 'ETF blend', 'High risk', 'Low turnover'],
  notice: {
    title: 'Approved mock models only',
    description:
      'Discovery currently shows live/approved mock models for mobile UI development. Backtest returns are placeholders and do not trigger deposits, orders, or model execution.'
  },
  models: [
    {
      id: 'quant-us-leverage-alpha',
      name: 'Quant US Leverage Alpha',
      summary:
          'Models US large-cap momentum and leveraged ETFs from a model-defined aggressive mandate.',
      market: 'US equities',
      riskLabel: 'High risk',
      riskTone: 'high',
      performanceLabel: '+18.4% backtest',
      mandateLabel: 'Leveraged ETF',
      status: 'live',
      tags: ['NASDAQ focus', 'High turnover', 'No bonds'],
      reviewLabel: 'Approved mock',
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
      reviewLabel: 'Approved mock',
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
      reviewLabel: 'Approved mock',
      simulatedAumLabel: '$1.1M simulated'
    },
    {
      id: 'review-only-prototype',
      name: 'Review Only Prototype',
      summary:
        'Pending review sample kept in mock data to verify that discovery excludes unapproved models.',
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
  ] satisfies MockInvestmentModel[]
};

export const discoverableInvestmentModels =
  investModelDiscoveryMock.models.filter(isPublicDiscoverableInvestmentModel);
