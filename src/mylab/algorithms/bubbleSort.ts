import { SortingStep } from '../../types/mylab';

/**
 * Generates an immutable step-by-step execution trace for Bubble Sort.
 * Pseudocode line mapping (1-indexed):
 * 1: procedure bubbleSort(arr)
 * 2:   for i <- 0 to n - 2 do
 * 3:     swapped <- false
 * 4:     for j <- 0 to n - i - 2 do
 * 5:       if arr[j] > arr[j + 1] then
 * 6:         swap(arr[j], arr[j + 1]); swapped <- true
 * 7:     if not swapped then break
 * 8: end procedure
 */
export function generateBubbleSortTrace(input: number[]): SortingStep[] {
  const arr = [...input];
  const n = arr.length;
  const steps: SortingStep[] = [];
  const sortedSet = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sortedIndices: [],
    comparisons: 0,
    swaps: 0,
    passNumber: 0,
    activeLine: 1,
    explanation: `Initialized Bubble Sort with ${n} elements: [${arr.join(', ')}].`,
    executionState: 'ready',
  });

  if (n <= 1) {
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: n === 1 ? [0] : [],
      comparisons: 0,
      swaps: 0,
      passNumber: 0,
      activeLine: 8,
      explanation: 'Array has fewer than 2 elements and is already sorted.',
      executionState: 'done',
    });
    return steps;
  }

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    const passNumber = i + 1;

    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: Array.from(sortedSet),
      comparisons,
      swaps,
      passNumber,
      activeLine: 3,
      explanation: `Starting Pass ${passNumber}: bubbling the largest unsorted value toward index ${n - 1 - i}.`,
      executionState: 'ready',
    });

    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      const leftVal = arr[j];
      const rightVal = arr[j + 1];

      steps.push({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: [],
        sortedIndices: Array.from(sortedSet),
        comparisons,
        swaps,
        passNumber,
        activeLine: 5,
        explanation: `Comparing index ${j} (${leftVal}) and index ${j + 1} (${rightVal}): ${
          leftVal > rightVal
            ? `${leftVal} > ${rightVal}, so a swap is required.`
            : `${leftVal} <= ${rightVal}, keeping current order.`
        }`,
        executionState: 'comparing',
      });

      if (leftVal > rightVal) {
        arr[j] = rightVal;
        arr[j + 1] = leftVal;
        swaps++;
        swapped = true;

        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sortedIndices: Array.from(sortedSet),
          comparisons,
          swaps,
          passNumber,
          activeLine: 6,
          explanation: `Swapped ${leftVal} and ${rightVal} at indices ${j} and ${j + 1}.`,
          executionState: 'swapping',
        });
      }
    }

    sortedSet.add(n - 1 - i);

    if (!swapped) {
      for (let k = 0; k < n; k++) sortedSet.add(k);
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [],
        sortedIndices: Array.from(sortedSet).sort((a, b) => a - b),
        comparisons,
        swaps,
        passNumber,
        activeLine: 7,
        explanation: `No swaps occurred during Pass ${passNumber}. Early exit triggered — the array is fully sorted!`,
        executionState: 'done',
      });
      return steps;
    }

    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: Array.from(sortedSet).sort((a, b) => a - b),
      comparisons,
      swaps,
      passNumber,
      activeLine: 2,
      explanation: `Pass ${passNumber} complete: value ${arr[n - 1 - i]} is locked in its sorted position at index ${n - 1 - i}.`,
      executionState: 'sorted',
    });
  }

  for (let k = 0; k < n; k++) sortedSet.add(k);
  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sortedIndices: Array.from(sortedSet).sort((a, b) => a - b),
    comparisons,
    swaps,
    passNumber: n - 1,
    activeLine: 8,
    explanation: `Bubble Sort finished in ${comparisons} comparisons and ${swaps} swaps.`,
    executionState: 'done',
  });

  return steps;
}
