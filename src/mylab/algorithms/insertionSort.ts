import { SortingStep } from '../../types/mylab';

/**
 * Generates an immutable step-by-step execution trace for Insertion Sort.
 * Pseudocode line mapping (1-indexed):
 * 1: procedure insertionSort(arr)
 * 2:   for i <- 1 to n - 1 do
 * 3:     key <- arr[i]; j <- i - 1
 * 4:     while j >= 0 and arr[j] > key do
 * 5:       arr[j + 1] <- arr[j]; j <- j - 1
 * 6:     arr[j + 1] <- key
 * 7: end procedure
 */
export function generateInsertionSortTrace(input: number[]): SortingStep[] {
  const arr = [...input];
  const n = arr.length;
  const steps: SortingStep[] = [];
  let comparisons = 0;
  let swaps = 0; // Counts element shifts / placements

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sortedIndices: n > 0 ? [0] : [],
    comparisons: 0,
    swaps: 0,
    passNumber: 0,
    activeLine: 1,
    explanation: `Initialized Insertion Sort. Index 0 (${arr[0] ?? 'empty'}) forms the initial 1-element sorted prefix.`,
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
      activeLine: 7,
      explanation: 'Array has fewer than 2 elements and is already sorted.',
      executionState: 'done',
    });
    return steps;
  }

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    const passNumber = i;
    const prefixSorted = Array.from({ length: i }, (_, idx) => idx);

    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: prefixSorted,
      specialIndices: { label: 'Key', indices: [i] },
      comparisons,
      swaps,
      passNumber,
      activeLine: 3,
      explanation: `Pass ${passNumber}: selected key = ${key} at index ${i} to insert into the sorted prefix [0..${i - 1}].`,
      executionState: 'ready',
    });

    while (j >= 0) {
      comparisons++;
      steps.push({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: [],
        sortedIndices: prefixSorted.filter((idx) => idx !== j + 1),
        specialIndices: { label: 'Key', indices: [j + 1] },
        comparisons,
        swaps,
        passNumber,
        activeLine: 4,
        explanation: `Comparing sorted element arr[${j}] (${arr[j]}) with key (${key}): ${
          arr[j] > key
            ? `${arr[j]} > ${key}, shifting ${arr[j]} right.`
            : `${arr[j]} <= ${key}, stopping shifts here.`
        }`,
        executionState: 'comparing',
      });

      if (arr[j] > key) {
        arr[j + 1] = arr[j];
        arr[j] = key; // Visualize key moving left cleanly without losing value on bar chart
        swaps++;

        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sortedIndices: [],
          specialIndices: { label: 'Key', indices: [j] },
          comparisons,
          swaps,
          passNumber,
          activeLine: 5,
          explanation: `Shifted ${arr[j + 1]} from index ${j} to index ${j + 1}.`,
          executionState: 'swapping',
        });

        j--;
      } else {
        break;
      }
    }

    arr[j + 1] = key;
    const updatedPrefix = Array.from({ length: i + 1 }, (_, idx) => idx);
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sortedIndices: updatedPrefix,
      specialIndices: { label: 'Key', indices: [j + 1] },
      comparisons,
      swaps,
      passNumber,
      activeLine: 6,
      explanation: `Placed key ${key} at index ${j + 1}. Prefix [0..${i}] is now sorted.`,
      executionState: 'sorted',
    });
  }

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
    passNumber: n - 1,
    activeLine: 7,
    explanation: `Insertion Sort complete in ${comparisons} comparisons and ${swaps} element shifts.`,
    executionState: 'done',
  });

  return steps;
}
