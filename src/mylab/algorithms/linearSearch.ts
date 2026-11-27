import { SearchingStep } from '../../types/mylab';

/**
 * Generates an immutable step-by-step execution trace for Linear Search.
 * Pseudocode line mapping (1-indexed):
 * 1: procedure linearSearch(arr, target)
 * 2:   for i <- 0 to n - 1 do
 * 3:     if arr[i] == target then
 * 4:       return i
 * 5:   return -1
 * 6: end procedure
 */
export function generateLinearSearchTrace(input: number[], target: number): SearchingStep[] {
  const arr = [...input];
  const steps: SearchingStep[] = [];
  const checkedIndices: number[] = [];
  let comparisons = 0;

  steps.push({
    array: arr,
    target,
    currentIndex: null,
    checkedIndices: [],
    eliminatedIndices: [],
    foundIndex: null,
    comparisons: 0,
    activeLine: 1,
    explanation: `Ready to run Linear Search for target ${target} across ${arr.length} elements.`,
    executionState: 'ready',
  });

  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    const match = arr[i] === target;

    steps.push({
      array: arr,
      target,
      currentIndex: i,
      checkedIndices: [...checkedIndices],
      eliminatedIndices: [...checkedIndices],
      foundIndex: null,
      comparisons,
      activeLine: 3,
      explanation: `Checking index ${i} (value ${arr[i]}) against target ${target}: ${
        match ? 'Match found!' : `${arr[i]} != ${target}, moving to next index.`
      }`,
      executionState: 'checking',
    });

    if (match) {
      steps.push({
        array: arr,
        target,
        currentIndex: i,
        checkedIndices: [...checkedIndices, i],
        eliminatedIndices: [...checkedIndices],
        foundIndex: i,
        comparisons,
        activeLine: 4,
        explanation: `Target ${target} found at index ${i} after ${comparisons} comparison${
          comparisons === 1 ? '' : 's'
        }.`,
        executionState: 'found',
      });
      return steps;
    }

    checkedIndices.push(i);
  }

  steps.push({
    array: arr,
    target,
    currentIndex: null,
    checkedIndices: [...checkedIndices],
    eliminatedIndices: [...checkedIndices],
    foundIndex: null,
    comparisons,
    activeLine: 5,
    explanation: `Scanned all ${arr.length} elements (${comparisons} comparisons). Target ${target} is not in the array (returned -1).`,
    executionState: 'not_found',
  });

  return steps;
}
