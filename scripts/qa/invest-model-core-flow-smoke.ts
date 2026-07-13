/**
 * 이 스모크 테스트는 핵심 사용자 흐름이 mock-only 모바일 MVP 경계를 지키는지 확인한다.
 * 모델 탐색 -> 상세 -> 위험 확인 -> 선택 전 확인 흐름을 데이터/카피 수준에서 검증하며 실제 주문이나 입금은 만들지 않는다.
 */

import {
  getInvestmentModelStatusDisplay,
  investModelCopy,
  isPublicDiscoverableInvestmentModel,
  type InvestModelLocale,
  type InvestmentModelPublicationStatus
} from '../../lib/i18n/invest-model';
import { findMockInvestmentModelDetail } from '../../lib/mock/invest-model-model-detail';

type FlowResult = {
  locale: InvestModelLocale;
  discoverableCount: number;
  checkedModelId: string;
  statusLabel: string;
  selectionDisabledLabel: string;
};

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function runLocaleFlow(locale: InvestModelLocale): FlowResult {
  const copy = investModelCopy[locale];
  const publicModels = copy.models.models.filter(
    isPublicDiscoverableInvestmentModel
  );

  assertCondition(publicModels.length > 0, `${locale}: no public models found`);
  assertCondition(
    publicModels.every((model) => {
      const statusDisplay = getInvestmentModelStatusDisplay(
        model.status,
        locale
      );

      return !statusDisplay.isSelectionDisabled;
    }),
    `${locale}: a public discovery model is marked as selection-disabled`
  );

  const targetModel =
    publicModels.find((model) => model.riskTone === 'high') ?? publicModels[0];
  const detail = findMockInvestmentModelDetail(locale, targetModel.id);

  assertCondition(
    detail,
    `${locale}: detail data missing for ${targetModel.id}`
  );
  assertCondition(
    detail.riskItems.length > 0,
    `${locale}: model detail has no risk items`
  );
  assertCondition(
    detail.limitationItems.length > 0,
    `${locale}: model detail has no MVP limitation items`
  );
  assertCondition(
    detail.metrics.some((metric) => metric.tone === 'risk'),
    `${locale}: model detail has no risk-toned metric`
  );
  assertCondition(
    copy.models.footerBadges.noLiveTrading.length > 0,
    `${locale}: discovery footer lacks no-live-trading label`
  );

  const pausedStatus = getInvestmentModelStatusDisplay('paused', locale);
  const suspendedStatus = getInvestmentModelStatusDisplay('suspended', locale);
  const retiredStatus = getInvestmentModelStatusDisplay('retired', locale);

  assertCondition(
    pausedStatus.isSelectionDisabled &&
      suspendedStatus.isSelectionDisabled &&
      retiredStatus.isSelectionDisabled,
    `${locale}: inactive model statuses are not all selection-disabled`
  );

  return {
    locale,
    discoverableCount: publicModels.length,
    checkedModelId: targetModel.id,
    statusLabel: getInvestmentModelStatusDisplay(
      targetModel.status as InvestmentModelPublicationStatus,
      locale
    ).label,
    selectionDisabledLabel: copy.models.footerBadges.noLiveTrading
  };
}

const results = [runLocaleFlow('ko'), runLocaleFlow('en')];

console.log(
  JSON.stringify(
    {
      status: 'pass',
      flow: 'discover -> detail -> risk review -> selection precheck',
      results
    },
    null,
    2
  )
);
