'use client';

import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes
} from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';

/**
 * CreatorModelDraftForm captures the required InvestmentModel draft metadata.
 * It submits to the mock-safe creator API and never uploads model files or creates live public models.
 */

type CreatorModelDraftFormCopy = {
  labels: {
    name: string;
    shortDescription: string;
    targetMarkets: string;
    allowedAssetClasses: string;
    assetUniverseSummary: string;
    strategySummary: string;
    leverageAllowed: string;
    derivativesAllowed: string;
    rebalancePolicy: string;
    primaryDataInputs: string;
    forbiddenAssets: string;
    riskSummary: string;
    performanceSource: string;
    disclosurePlaceholder: string;
  };
  placeholders: {
    commaList: string;
    optionalCommaList: string;
  };
  helper: {
    commaList: string;
    noFileUpload: string;
    mockOnly: string;
  };
  actions: {
    submit: string;
    submitting: string;
  };
  result: {
    successTitle: string;
    errorTitle: string;
    draftStatus: string;
    privateVisibility: string;
    metadataOnly: string;
  };
};

type CreatorModelDraftFormProps = {
  copy: CreatorModelDraftFormCopy;
};

type SubmitState =
  | {
      status: 'idle';
    }
  | {
      status: 'success';
      message: string;
      modelPublicId: string;
    }
  | {
      status: 'error';
      message: string;
    };

const defaultValues = {
  name: '',
  shortDescription: '',
  targetMarkets: '',
  allowedAssetClasses: '',
  assetUniverseSummary: '',
  strategySummary: '',
  leverageAllowed: false,
  derivativesAllowed: false,
  rebalancePolicy: '',
  primaryDataInputs: '',
  forbiddenAssets: '',
  riskSummary: '',
  performanceSource: '',
  disclosurePlaceholder: ''
};

export function CreatorModelDraftForm({ copy }: CreatorModelDraftFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: 'idle'
  });
  const helperLine = [copy.helper.mockOnly, copy.helper.noFileUpload].join(
    ' / '
  );
  const successMetaLine =
    submitState.status === 'success'
      ? [
          copy.result.draftStatus,
          copy.result.privateVisibility,
          copy.result.metadataOnly,
          submitState.modelPublicId
        ].join(' / ')
      : '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ status: 'idle' });

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: textValue(formData, 'name'),
      shortDescription: textValue(formData, 'shortDescription'),
      targetMarkets: listValue(formData, 'targetMarkets'),
      allowedAssetClasses: listValue(formData, 'allowedAssetClasses'),
      assetUniverseSummary: textValue(formData, 'assetUniverseSummary'),
      strategySummary: textValue(formData, 'strategySummary'),
      leverageAllowed: formData.get('leverageAllowed') === 'on',
      derivativesAllowed: formData.get('derivativesAllowed') === 'on',
      rebalancePolicy: textValue(formData, 'rebalancePolicy'),
      primaryDataInputs: listValue(formData, 'primaryDataInputs'),
      forbiddenAssets: listValue(formData, 'forbiddenAssets'),
      riskSummary: textValue(formData, 'riskSummary'),
      performanceSource: textValue(formData, 'performanceSource'),
      disclosurePlaceholder: textValue(formData, 'disclosurePlaceholder')
    };

    try {
      const response = await fetch('/api/creator/models', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-invest-model-role': 'creator'
        },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      if (!response.ok) {
        setSubmitState({
          status: 'error',
          message: body?.error?.message ?? copy.result.errorTitle
        });
        return;
      }

      setSubmitState({
        status: 'success',
        message: copy.result.successTitle,
        modelPublicId: body.data.modelPublicId
      });
    } catch {
      setSubmitState({
        status: 'error',
        message: copy.result.errorTitle
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-invest-card-gap">
      <p className="rounded-invest-control bg-invest-bg-soft px-3 py-2 text-xs font-semibold leading-5 text-invest-text-muted">
        {helperLine}
      </p>

      <div className="space-y-4 rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
        <TextField
          name="name"
          label={copy.labels.name}
          minLength={2}
          maxLength={80}
          required
        />
        <TextArea
          name="shortDescription"
          label={copy.labels.shortDescription}
          minLength={12}
          maxLength={220}
          required
        />
        <TextField
          name="targetMarkets"
          label={copy.labels.targetMarkets}
          placeholder={copy.placeholders.commaList}
          helper={copy.helper.commaList}
          required
        />
        <TextField
          name="allowedAssetClasses"
          label={copy.labels.allowedAssetClasses}
          placeholder={copy.placeholders.commaList}
          helper={copy.helper.commaList}
          required
        />
        <TextArea
          name="assetUniverseSummary"
          label={copy.labels.assetUniverseSummary}
          minLength={12}
          maxLength={260}
          required
        />
        <TextArea
          name="strategySummary"
          label={copy.labels.strategySummary}
          minLength={20}
          maxLength={600}
          required
        />
      </div>

      <div className="space-y-4 rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card">
        <CheckboxField
          name="leverageAllowed"
          label={copy.labels.leverageAllowed}
        />
        <CheckboxField
          name="derivativesAllowed"
          label={copy.labels.derivativesAllowed}
        />
        <TextField
          name="rebalancePolicy"
          label={copy.labels.rebalancePolicy}
          minLength={4}
          maxLength={120}
          required
        />
        <TextField
          name="primaryDataInputs"
          label={copy.labels.primaryDataInputs}
          placeholder={copy.placeholders.commaList}
          helper={copy.helper.commaList}
          required
        />
        <TextField
          name="forbiddenAssets"
          label={copy.labels.forbiddenAssets}
          placeholder={copy.placeholders.optionalCommaList}
          helper={copy.helper.commaList}
        />
        <TextArea
          name="riskSummary"
          label={copy.labels.riskSummary}
          minLength={20}
          maxLength={600}
          required
        />
        <TextField
          name="performanceSource"
          label={copy.labels.performanceSource}
          minLength={8}
          maxLength={160}
          required
        />
        <TextArea
          name="disclosurePlaceholder"
          label={copy.labels.disclosurePlaceholder}
          minLength={12}
          maxLength={600}
          required
        />
      </div>

      <p className="rounded-invest-control bg-invest-primary-soft p-3 text-xs leading-5 text-invest-text-muted">
        {copy.helper.mockOnly}
      </p>

      {submitState.status !== 'idle' ? (
        <div className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding">
          <div className="flex gap-3">
            {submitState.status === 'success' ? (
              <CheckCircle2
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-invest-positive"
              />
            ) : (
              <AlertCircle
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-invest-risk"
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold leading-6 text-invest-text">
                {submitState.message}
              </p>
              {submitState.status === 'success' ? (
                <div className="mt-3 rounded-invest-control bg-invest-bg-soft px-3 py-2 text-xs font-semibold leading-5 text-invest-text-muted">
                  {successMetaLine}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-invest-touch-target w-full items-center justify-center gap-2 rounded-invest-control bg-invest-primary px-4 text-sm font-bold text-invest-surface shadow-invest-card disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send aria-hidden className="size-4" />
        <span>{isSubmitting ? copy.actions.submitting : copy.actions.submit}</span>
      </button>
    </form>
  );
}

function TextField({
  name,
  label,
  helper,
  ...props
}: {
  name: keyof typeof defaultValues;
  label: string;
  helper?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold leading-5 text-invest-text">
        {label}
      </span>
      <input
        name={name}
        className="mt-2 min-h-invest-touch-target w-full rounded-invest-control border border-invest-border bg-invest-bg px-3 text-sm leading-5 text-invest-text outline-none ring-invest-primary transition focus:ring-2"
        {...props}
      />
      {helper ? (
        <span className="mt-1 block text-xs leading-5 text-invest-text-muted">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function TextArea({
  name,
  label,
  ...props
}: {
  name: keyof typeof defaultValues;
  label: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold leading-5 text-invest-text">
        {label}
      </span>
      <textarea
        name={name}
        rows={4}
        className="mt-2 w-full resize-y rounded-invest-control border border-invest-border bg-invest-bg px-3 py-3 text-sm leading-6 text-invest-text outline-none ring-invest-primary transition focus:ring-2"
        {...props}
      />
    </label>
  );
}

function CheckboxField({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex min-h-invest-touch-target items-center gap-3 rounded-invest-control border border-invest-border bg-invest-bg px-3 py-2">
      <input
        type="checkbox"
        name={name}
        className="size-5 rounded border-invest-border text-invest-primary"
      />
      <span className="text-sm font-semibold leading-5 text-invest-text">
        {label}
      </span>
    </label>
  );
}

function textValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

function listValue(formData: FormData, name: string) {
  return textValue(formData, name)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
