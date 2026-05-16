export type ClassificationMethod = 'equalInterval' | 'quantile';

export interface AttributeStats {
  min: number;
  max: number;
  count: number;
  uniqueCount: number;
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const coerceNumber = (v: unknown): number | null => {
  if (isFiniteNumber(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const getNumericValues = (
  features: any[],
  attribute: string,
): number[] => {
  const out: number[] = [];
  for (const f of features) {
    const raw = f?.properties?.[attribute];
    const n = coerceNumber(raw);
    if (n !== null) out.push(n);
  }
  return out;
};

export const extractNumericAttributes = (
  features: any[],
): Record<string, AttributeStats> => {
  if (!Array.isArray(features) || features.length === 0) return {};

  const candidateKeys = new Set<string>();
  const sampleLimit = Math.min(features.length, 50);
  for (let i = 0; i < sampleLimit; i++) {
    const props = features[i]?.properties;
    if (props && typeof props === 'object') {
      for (const k of Object.keys(props)) candidateKeys.add(k);
    }
  }

  const result: Record<string, AttributeStats> = {};
  for (const key of candidateKeys) {
    let min = Infinity;
    let max = -Infinity;
    let count = 0;
    const seen = new Set<number>();
    let nonNumeric = 0;

    for (const f of features) {
      const raw = f?.properties?.[key];
      if (raw === null || raw === undefined || raw === '') continue;
      const n = coerceNumber(raw);
      if (n === null) {
        nonNumeric++;
        if (nonNumeric > 3) break;
        continue;
      }
      if (n < min) min = n;
      if (n > max) max = n;
      count++;
      if (seen.size < 32) seen.add(n);
    }

    if (nonNumeric > 3) continue;
    if (count < 1) continue;
    if (seen.size < 3) continue;

    result[key] = { min, max, count, uniqueCount: seen.size };
  }

  return result;
};

export const equalInterval = (values: number[], n: number): number[] => {
  if (values.length === 0 || n < 1) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    return Array.from({ length: n + 1 }, () => min);
  }
  const step = (max - min) / n;
  const breaks: number[] = [];
  for (let i = 0; i <= n; i++) breaks.push(min + step * i);
  breaks[n] = max;
  return breaks;
};

export const quantile = (values: number[], n: number): number[] => {
  if (values.length === 0 || n < 1) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) {
    return Array.from({ length: n + 1 }, () => min);
  }
  const breaks: number[] = [min];
  for (let i = 1; i < n; i++) {
    const pos = (i / n) * (sorted.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const frac = pos - lo;
    const interp = sorted[lo] + (sorted[hi] - sorted[lo]) * frac;
    breaks.push(interp);
  }
  breaks.push(max);
  return breaks;
};

export const computeBreaks = (
  values: number[],
  method: ClassificationMethod,
  classCount: number,
): number[] =>
  method === 'quantile'
    ? quantile(values, classCount)
    : equalInterval(values, classCount);
