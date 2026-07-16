type ModelSelectionReadStatusCopy = {
  title: string;
  loading: string;
  empty: string;
  signedOut: string;
  error: string;
  persisted: string;
  noRealAction: string;
  modelLabel: string;
  versionLabel: string;
  selectionLabel: string;
};

export const modelSelectionReadStatusCopy = {
  ko: {
    title: '저장된 선택 기록',
    loading: '저장된 선택 기록을 확인하는 중입니다.',
    empty: '아직 DB에 활성 선택 기록이 없습니다.',
    signedOut: '로그인 사용자 식별자를 찾지 못했습니다.',
    error: '선택 기록을 불러오지 못했습니다.',
    persisted: 'DB 저장됨',
    noRealAction: '읽기 전용 상태 / 실입금·실주문·브로커 미연결',
    modelLabel: '투자 모델 식별자',
    versionLabel: '모델 버전 식별자',
    selectionLabel: '선택 기록 식별자'
  },
  en: {
    title: 'DB selection record',
    loading: 'Checking the persisted selection record.',
    empty: 'No active DB selection record yet.',
    signedOut: 'Could not find a signed-in user public id.',
    error: 'Could not load the selection record.',
    persisted: 'DB persisted',
    noRealAction: 'Read-only status / No real deposit, order, or brokerage',
    modelLabel: 'InvestmentModel public id',
    versionLabel: 'ModelVersion public id',
    selectionLabel: 'Selection public id'
  }
} as const satisfies Record<'ko' | 'en', ModelSelectionReadStatusCopy>;

export type { ModelSelectionReadStatusCopy };
