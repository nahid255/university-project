import { SortingStep } from '../../types/mylab';

/**
 * Generates an immutable step-by-step execution trace for Selection Sort.
 * Pseudocode line mapping (1-indexed):
 * 1: procedure selectionSort(arr)
 * 2:   for i <- 0 to n - 2 do
 * 3:     minIdx <- i
 * 4:     for j <- i + 1 to n - 1 do
 * 5:       if arr[j] < arr[minIdx] then
 * 6:         minIdx <- j
 * 7:     if minIdx != i then swap(arr[i], arr[minIdx])
 * 8: end procedure
 */
export function generateSelectionSortTrace(input: number[]): SortingStep[] {
  const arr = [...input];
  const n = arr.length;
  const steps: SortingStep[] = [];
  const sortedIndices: number[] = [];
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
    explanation: `Initialized Selection Sort with ${n} elements: [${arr.join(', ')}].`,
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
    let minIdx = i;
    const passNumber = i + 1;

    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: [...sortedIndices],
      specialIndices: { label: 'Min', indices: [minIdx] },
      comparisons,
      swaps,
      passNumber,
      activeLine: 3,
      explanation: `Pass ${passNumber}: assuming index ${i} (${arr[i]}) is the minimum in the unsorted suffix [${i}..${n - 1}].`,
      executionState: 'ready',
    });

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        array: [...arr],
        comparing: [j, minIdx],
        swapping: [],
        sortedIndices: [...sortedIndices],
        specialIndices: { label: 'Min', indices: [minIdx] },
        comparisons,
        swaps,
        passNumber,
        activeLine: 5,
        explanation: `Scanning index ${j} (${arr[j]}) against current minimum at index ${minIdx} (${arr[minIdx]}).`,
        executionState: 'comparing',
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [],
          sortedIndices: [...sortedIndices],
          specialIndices: { label: 'Min', indices: [minIdx] },
          comparisons,
          swaps,
          passNumber,
          activeLine: 6,
          explanation: `Found new minimum: ${arr[minIdx]} at index ${minIdx}.`,
          executionState: 'comparing',
        });
      }
    }

    if (minIdx !== i) {
      const prevI = arr[i];
      const minVal = arr[minIdx];
      arr[i] = minVal;
      arr[minIdx] = prevI;
      swaps++;

      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [i, minIdx],
        sortedIndices: [...sortedIndices],
        comparisons,
        swaps,
        passNumber,
        activeLine: 7,
        explanation: `Swapped minimum value ${minVal} (index ${minIdx}) into index ${i} (replacing ${prevI}).`,
        executionState: 'swapping',
      });
    }

    sortedIndices.push(i);
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: [...sortedIndices],
      comparisons,
      swaps,
      passNumber,
      activeLine: 2,
      explanation: `Pass ${passNumber} complete: ${arr[i]} is locked at index ${i}.`,
      executionState: 'sorted',
    });
  }

  sortedIndices.push(n - 1);
  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sortedIndices: [...sortedIndices],
    comparisons,
    swaps,
    passNumber: n - 1,
    activeLine: 8,
    explanation: `Selection Sort complete in ${comparisons} comparisons and ${swaps} swaps.`,
    executionState: 'done',
  });

  return steps;
}
