import { FileText } from 'lucide-react';
import {
  MobileShell,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { CreatorModelDraftForm } from '@/components/invest-model/creator-model-draft-form';
import {
  resolveInvestModelLocale,
  type InvestModelLocale
} from '@/lib/i18n/invest-model';

/**
 * CreatorNewModelPage gives model creators a mobile-first draft form.
 * It collects metadata only and keeps every new InvestmentModel private until review.
 */

const creatorDraftCopy = {
  ko: {
    eyebrow: '제작자',
    title: '모델 등록',
    bannerEyebrow: '초안 전용',
    bannerTitle: 'AI 모델 설명을 먼저 등록합니다',
    bannerDescription:
      '이 화면은 모델 파일 실행, 실제 주문, 실제 입금 없이 설명과 위험 정보를 초안으로 제출하는 모바일 폼입니다.',
    sectionTitle: '필수 등록 정보',
    sectionDescription:
      '모델의 시장, 자산군, 레버리지, 리밸런싱, 위험 설명을 제작자가 미리 정의합니다. 사용자가 나중에 투자 성향을 직접 바꾸는 구조가 아닙니다.',
    form: {
      labels: {
        name: '모델 이름',
        shortDescription: '짧은 설명',
        targetMarkets: '대상 시장',
        allowedAssetClasses: '허용 자산군',
        assetUniverseSummary: '자산 universe 요약',
        strategySummary: '전략 설명',
        leverageAllowed: '레버리지 사용 가능',
        derivativesAllowed: '파생상품 사용 가능',
        rebalancePolicy: '리밸런싱 정책',
        primaryDataInputs: '주요 입력 데이터',
        forbiddenAssets: '금지 자산',
        riskSummary: '위험 설명',
        performanceSource: '성과 근거 출처',
        disclosurePlaceholder: '법률/위험 고지 임시 문구'
      },
      placeholders: {
        commaList: '예: 미국 주식, ETF',
        optionalCommaList: '선택 입력, 쉼표로 구분'
      },
      helper: {
        commaList: '여러 값은 쉼표로 구분합니다.',
        noFileUpload: '모델 파일 업로드 없음',
        mockOnly:
          '제출 결과는 초안, 비공개, 설명 정보 전용 상태입니다. 공개 탐색, 모델 실행, 실제 주문과 연결되지 않습니다.'
      },
      actions: {
        submit: '초안 생성',
        submitting: '초안 생성 중'
      },
      result: {
        successTitle: '모델 초안이 생성되었습니다.',
        errorTitle: '필수 입력값을 다시 확인해 주세요.',
        draftStatus: '초안',
        privateVisibility: '비공개',
        metadataOnly: '설명 정보 전용'
      }
    }
  },
  en: {
    eyebrow: 'Creator',
    title: 'Register Model',
    bannerEyebrow: 'Draft only',
    bannerTitle: 'Register the AI model description first',
    bannerDescription:
      'This mobile form submits description and risk metadata only. It does not execute model files, place orders, or move funds.',
    sectionTitle: 'Required model information',
    sectionDescription:
      'The creator defines market scope, asset classes, leverage, rebalancing, and risk. Users do not directly tune investment preferences later.',
    form: {
      labels: {
        name: 'Model name',
        shortDescription: 'Short description',
        targetMarkets: 'Target markets',
        allowedAssetClasses: 'Allowed asset classes',
        assetUniverseSummary: 'Asset universe summary',
        strategySummary: 'Strategy summary',
        leverageAllowed: 'Leverage allowed',
        derivativesAllowed: 'Derivatives allowed',
        rebalancePolicy: 'Rebalance policy',
        primaryDataInputs: 'Primary data inputs',
        forbiddenAssets: 'Forbidden assets',
        riskSummary: 'Risk summary',
        performanceSource: 'Performance source',
        disclosurePlaceholder: 'Legal/risk disclosure placeholder'
      },
      placeholders: {
        commaList: 'Example: US equities, ETF',
        optionalCommaList: 'Optional, comma separated'
      },
      helper: {
        commaList: 'Separate multiple values with commas.',
        noFileUpload: 'No model file upload',
        mockOnly:
          'The submitted result remains draft/private/metadata_only. It is not public discovery, model execution, or live trading.'
      },
      actions: {
        submit: 'Create draft',
        submitting: 'Creating draft'
      },
      result: {
        successTitle: 'Model draft created.',
        errorTitle: 'Please check the required fields.',
        draftStatus: 'draft',
        privateVisibility: 'private',
        metadataOnly: 'metadata_only'
      }
    }
  }
} as const;

type CreatorNewModelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreatorNewModelPage({
  searchParams
}: CreatorNewModelPageProps) {
  const locale: InvestModelLocale = resolveInvestModelLocale(await searchParams);
  const copy = creatorDraftCopy[locale];

  return (
    <MobileShell
      activeTab="models"
      eyebrow={copy.eyebrow}
      title={copy.title}
      locale={locale}
      currentPath="/invest-model/creator/models/new"
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={copy.bannerEyebrow}
          title={copy.bannerTitle}
          description={copy.bannerDescription}
          icon={FileText}
        />

        <SectionHeader
          title={copy.sectionTitle}
          description={copy.sectionDescription}
        />

        <CreatorModelDraftForm copy={copy.form} />
      </section>
    </MobileShell>
  );
}
