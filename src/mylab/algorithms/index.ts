export { generateBubbleSortTrace } from './bubbleSort';
export { generateSelectionSortTrace } from './selectionSort';
export { generateInsertionSortTrace } from './insertionSort';
export { generateLinearSearchTrace } from './linearSearch';
export { generateBinarySearchTrace } from './binarySearch';

export const MIN_ARRAY_SIZE = 4;
export const MAX_ARRAY_SIZE = 20;

export function generateRandomArray(size: number, sorted: boolean = false): number[] {
  const clamped = Math.max(MIN_ARRAY_SIZE, Math.min(MAX_ARRAY_SIZE, Math.round(size)));
  const arr: number[] = [];
  for (let i = 0; i < clamped; i++) {
    arr.push(Math.floor(Math.random() * 88) + 10); // 10..97 for clean bar scaling
  }
  return sorted ? arr.sort((a, b) => a - b) : arr;
}

export function parseNumberArrayInput(raw: string): {
  valid: boolean;
  values: number[];
  error?: string;
} {
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length < MIN_ARRAY_SIZE) {
    return {
      valid: false,
      values: [],
      error: `Please enter at least ${MIN_ARRAY_SIZE} integers separated by commas or spaces.`,
    };
  }

  if (tokens.length > MAX_ARRAY_SIZE) {
    return {
      valid: false,
      values: [],
      error: `Maximum ${MAX_ARRAY_SIZE} integers allowed for clear visualization.`,
    };
  }

  const parsed: number[] = [];
  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      return {
        valid: false,
        values: [],
        error: `"${token}" is not a valid integer.`,
      };
    }
    const num = Number(token);
    if (num < 1 || num > 999) {
      return {
        valid: false,
        values: [],
        error: `Values must be between 1 and 999 (found ${num}).`,
      };
    }
    parsed.push(num);
  }

  return { valid: true, values: parsed };
}
