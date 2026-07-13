/**
 * Creator dashboard mock data is scoped to one ModelCreator so the UI can show ownership boundaries.
 * It never exposes another creator's models, real assets, broker accounts, or executable model files.
 */

export type MockCreatorDashboardModel = {
  id: string;
  modelName: string;
  versionLabel: string;
  status: 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'live';
  statusLabel: {
    ko: string;
    en: string;
  };
  statusTone: 'neutral' | 'low' | 'medium' | 'high' | 'blocked';
  marketLabel: string;
  riskLabel: string;
  riskTone: 'low' | 'medium' | 'high';
  submittedAtLabel: string;
  reviewResultLabel: {
    ko: string;
    en: string;
  };
  nextActionLabel: {
    ko: string;
    en: string;
  };
  reviewNotes: {
    ko: string[];
    en: string[];
  };
};

export type MockCreatorDashboard = {
  creatorPublicId: string;
  creatorName: string;
  verificationLabel: {
    ko: string;
    en: string;
  };
  ownershipScopeLabel: {
    ko: string;
    en: string;
  };
  summary: {
    totalModels: number;
    liveModels: number;
    pendingReviews: number;
    changesRequested: number;
  };
  models: MockCreatorDashboardModel[];
};

export const mockCreatorDashboard: MockCreatorDashboard = {
  creatorPublicId: 'creator_northstar_quant_lab',
  creatorName: 'Northstar Quant Lab',
  verificationLabel: {
    ko: '검증된 제작자 mock',
    en: 'Verified creator mock'
  },
  ownershipScopeLabel: {
    ko: '현재 로그인한 제작자의 모델만 표시',
    en: 'Only models owned by the current creator are shown'
  },
  summary: {
    totalModels: 4,
    liveModels: 1,
    pendingReviews: 1,
    changesRequested: 1
  },
  models: [
    {
      id: 'creator-quant-us-leverage-alpha-live',
      modelName: 'Quant US Leverage Alpha',
      versionLabel: 'ModelVersion 1.8.0',
      status: 'live',
      statusLabel: {
        ko: 'Live mock',
        en: 'Live mock'
      },
      statusTone: 'low',
      marketLabel: 'US equities',
      riskLabel: 'High risk',
      riskTone: 'high',
      submittedAtLabel: '2026-07-10 14:20',
      reviewResultLabel: {
        ko: '승인 완료',
        en: 'Approved'
      },
      nextActionLabel: {
        ko: '읽기 전용 상태',
        en: 'Read-only status'
      },
      reviewNotes: {
        ko: [
          '레버리지 문구는 고위험 고지와 함께 표시',
          '성과는 backtest placeholder로만 표시'
        ],
        en: [
          'Leverage wording must stay paired with high-risk disclosure',
          'Performance remains a backtest placeholder'
        ]
      }
    },
    {
      id: 'creator-quant-us-leverage-alpha-v2',
      modelName: 'Quant US Leverage Alpha v2',
      versionLabel: 'ModelVersion 2.0.0',
      status: 'pending_review',
      statusLabel: {
        ko: '심사 대기',
        en: 'Pending review'
      },
      statusTone: 'medium',
      marketLabel: 'US equities',
      riskLabel: 'High risk',
      riskTone: 'high',
      submittedAtLabel: '2026-07-13 09:20',
      reviewResultLabel: {
        ko: '운영자 검토 중',
        en: 'Operator review'
      },
      nextActionLabel: {
        ko: '심사 결과 대기',
        en: 'Wait for review result'
      },
      reviewNotes: {
        ko: [
          'drawdown 설명과 backtest 출처 확인 필요',
          '승인 전 공개 탐색에 노출되지 않음'
        ],
        en: [
          'Drawdown explanation and backtest source need review',
          'Not visible in public discovery before approval'
        ]
      }
    },
    {
      id: 'creator-sector-rotation-income',
      modelName: 'Sector Rotation Income',
      versionLabel: 'ModelVersion 0.9.2',
      status: 'changes_requested',
      statusLabel: {
        ko: '수정 요청',
        en: 'Changes requested'
      },
      statusTone: 'medium',
      marketLabel: 'US sectors',
      riskLabel: 'Medium risk',
      riskTone: 'medium',
      submittedAtLabel: '2026-07-12 16:45',
      reviewResultLabel: {
        ko: '보완 필요',
        en: 'Needs revision'
      },
      nextActionLabel: {
        ko: '설명 수정 요청 작성',
        en: 'Prepare description revision'
      },
      reviewNotes: {
        ko: [
          '섹터 ETF universe를 더 구체적으로 작성',
          '뉴스 트래픽 데이터가 mock 출처임을 명시'
        ],
        en: [
          'Clarify the sector ETF universe',
          'Label news traffic inputs as mock sources'
        ]
      }
    },
    {
      id: 'creator-defensive-draft',
      modelName: 'Defensive Cash Guard',
      versionLabel: 'ModelVersion draft',
      status: 'draft',
      statusLabel: {
        ko: '초안',
        en: 'Draft'
      },
      statusTone: 'neutral',
      marketLabel: 'US income',
      riskLabel: 'Low risk',
      riskTone: 'low',
      submittedAtLabel: 'Not submitted',
      reviewResultLabel: {
        ko: '심사 전',
        en: 'Before review'
      },
      nextActionLabel: {
        ko: '필수 설명 작성',
        en: 'Complete required description'
      },
      reviewNotes: {
        ko: [
          'PortfolioMandate와 금지 자산을 먼저 작성',
          '모델 파일 실행 없이 metadata_only로 유지'
        ],
        en: [
          'Define PortfolioMandate and prohibited assets first',
          'Keep metadata_only without model file execution'
        ]
      }
    }
  ]
};
