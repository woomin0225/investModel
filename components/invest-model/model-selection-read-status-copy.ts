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
    title: 'DB 선택 기록',
    loading: '저장된 선택 기록을 확인하는 중입니다.',
    empty: '아직 DB에 활성 선택 기록이 없습니다.',
    signedOut: '로그인 사용자 공개 ID를 찾지 못했습니다.',
    error: '선택 기록을 불러오지 못했습니다.',
    persisted: 'DB 저장됨',
    noRealAction: '실입금·실주문 아님',
    modelLabel: '투자 모델 공개 ID',
    versionLabel: '모델 버전 공개 ID',
    selectionLabel: '선택 기록 공개 ID'
  },
  en: {
    title: 'DB selection record',
    loading: 'Checking the persisted selection record.',
    empty: 'No active DB selection record yet.',
    signedOut: 'Could not find a signed-in user public id.',
    error: 'Could not load the selection record.',
    persisted: 'DB persisted',
    noRealAction: 'No deposit/order',
    modelLabel: 'InvestmentModel public id',
    versionLabel: 'ModelVersion public id',
    selectionLabel: 'Selection public id'
  }
} as const satisfies Record<'ko' | 'en', ModelSelectionReadStatusCopy>;

export type { ModelSelectionReadStatusCopy };
