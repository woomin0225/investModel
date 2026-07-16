export function finiteNumber(
  value: string | number | null | undefined,
  fallback = 0
) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function nullableFiniteNumber(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = finiteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizedZero(value: number) {
  return Object.is(value, -0) ? 0 : value;
}

export function formatModelPercent(
  value: string | number | null | undefined,
  fallback = 'N/A'
) {
  const parsed = nullableFiniteNumber(value);

  if (parsed === null) {
    return fallback;
  }

  const safeValue = normalizedZero(parsed);
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(safeValue);

  return `${safeValue > 0 ? '+' : ''}${formatted}%`;
}

export function formatMockMoney(
  value: string | number | null | undefined,
  currency = 'USD'
) {
  const safeAmount = Math.max(finiteNumber(value, 0), 0);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(safeAmount);
  }
}

export function formatAllocationWeight(
  value: string | number | null | undefined,
  total: string | number | null | undefined
) {
  const amount = finiteNumber(value, 0);
  const safeTotal = finiteNumber(total, 0);

  if (amount <= 0 || safeTotal <= 0) {
    return '0% target';
  }

  const percent = Math.min(Math.max(Math.round((amount / safeTotal) * 100), 0), 100);
  return `${percent}% target`;
}

export function formatSimulatedQuantity(
  value: string | number | null | undefined
) {
  const quantity = Math.max(finiteNumber(value, 0), 0);

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8
  }).format(quantity)} simulated units`;
}

export function formatScoreLabel(
  value: string | number | null | undefined,
  suffix: string
) {
  const score = Math.min(Math.max(Math.round(finiteNumber(value, 0)), 0), 100);
  return `${score} ${suffix}`;
}

export function formatScoreWidth(value: string | number | null | undefined) {
  return `${Math.min(Math.max(Math.round(finiteNumber(value, 0)), 0), 100)}%`;
}
