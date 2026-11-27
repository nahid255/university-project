import { SearchingStep } from '../../types/mylab';

export interface BinarySearchTraceResult {
  sortedInput: number[];
  wasAutoSorted: boolean;
  steps: SearchingStep[];
}

/**
 * Generates an immutable step-by-step execution trace for Binary Search.
 * Automatically sorts unsorted inputs so the precondition holds visually.
 * Pseudocode line mapping (1-indexed):
 * 1: procedure binarySearch(arr, target)
 * 2:   low <- 0; high <- n - 1
 * 3:   while low <= high do
 * 4:     mid <- floor((low + high) / 2)
 * 5:     if arr[mid] == target then return mid
 * 6:     else if arr[mid] < target then low <- mid + 1
 * 7:     else high <- mid - 1
 * 8:   return -1
 */
export function generateBinarySearchTrace(
  input: number[],
  target: number
): BinarySearchTraceResult {
  const isAlreadySorted = input.every((v, idx) => idx === 0 || input[idx - 1] <= v);
  const arr = isAlreadySorted ? [...input] : [...input].sort((a, b) => a - b);
  const n = arr.length;
  const steps: SearchingStep[] = [];
  const checkedIndices: number[] = [];
  let comparisons = 0;

  let low = 0;
  let high = n - 1;

  const computeEliminated = (l: number, h: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i < l || i > h) out.push(i);
    }
    return out;
  };

  steps.push({
    array: arr,
    target,
    low: n > 0 ? low : undefined,
    high: n > 0 ? high : undefined,
    currentIndex: null,
    checkedIndices: [],
    eliminatedIndices: [],
    foundIndex: null,
    comparisons: 0,
    activeLine: 2,
    explanation: isAlreadySorted
      ? `Initialized Binary Search with range [0..${n - 1}] for target ${target}.`
      : `Input was sorted to [${arr.join(', ')}] to satisfy Binary Search's sorted-array requirement. Search range: [0..${n - 1}].`,
    executionState: 'ready',
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    const midVal = arr[mid];

    steps.push({
      array: arr,
      target,
      low,
      high,
      mid,
      currentIndex: mid,
      checkedIndices: [...checkedIndices],
      eliminatedIndices: computeEliminated(low, high),
      foundIndex: null,
      comparisons,
      activeLine: 4,
      explanation: `Computed mid = floor((${low} + ${high}) / 2) = ${mid}. Checking arr[${mid}] = ${midVal} against target ${target}.`,
      executionState: 'checking',
    });

    if (midVal === target) {
      steps.push({
        array: arr,
        target,
        low,
        high,
        mid,
        currentIndex: mid,
        checkedIndices: [...checkedIndices, mid],
        eliminatedIndices: computeEliminated(low, high),
        foundIndex: mid,
        comparisons,
        activeLine: 5,
        explanation: `arr[${mid}] == ${target}! Target found at index ${mid} in just ${comparisons} comparison${
          comparisons === 1 ? '' : 's'
        }.`,
        executionState: 'found',
      });
      return { sortedInput: arr, wasAutoSorted: !isAlreadySorted, steps };
    }

    checkedIndices.push(mid);

    if (midVal < target) {
      low = mid + 1;
      steps.push({
        array: arr,
        target,
        low,
        high,
        mid,
        currentIndex: null,
        checkedIndices: [...checkedIndices],
        eliminatedIndices: computeEliminated(low, high),
        foundIndex: null,
        comparisons,
        activeLine: 6,
        explanation: `${midVal} < ${target}: discarding left half [0..${mid}] and narrowing range to [${low}..${high}].`,
        executionState: 'narrowing',
      });
    } else {
      high = mid - 1;
      steps.push({
        array: arr,
        target,
        low,
        high,
        mid,
        currentIndex: null,
        checkedIndices: [...checkedIndices],
        eliminatedIndices: computeEliminated(low, high),
        foundIndex: null,
        comparisons,
        activeLine: 7,
        explanation: `${midVal} > ${target}: discarding right half [${mid}..${n - 1}] and narrowing range to [${low}..${high}].`,
        executionState: 'narrowing',
      });
    }
  }

  steps.push({
    array: arr,
    target,
    low,
    high,
    currentIndex: null,
    checkedIndices: [...checkedIndices],
    eliminatedIndices: Array.from({ length: n }, (_, idx) => idx),
    foundIndex: null,
    comparisons,
    activeLine: 8,
    explanation: `Search window collapsed (low=${low} > high=${high}). Target ${target} is not present (returned -1 after ${comparisons} comparisons).`,
    executionState: 'not_found',
  });

  return { sortedInput: arr, wasAutoSorted: !isAlreadySorted, steps };
}
