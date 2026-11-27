import { LabCategory, LabCategoryId, LabExperimentDefinition } from '../types/mylab';

export const LAB_CATEGORIES: LabCategory[] = [
  {
    id: 'algorithm',
    title: 'Algorithm Lab',
    subtitle: 'Sorting & Searching Mechanics',
    description:
      'Trace comparisons, swaps, shifts, and divide-and-conquer search windows step by step with live complexity counters.',
    subject: 'Data Structures & Algorithms',
    plannedTopics: ['Merge Sort', 'Quick Sort', 'Heap Sort'],
  },
  {
    id: 'data-structure',
    title: 'Data Structure Lab',
    subtitle: 'Linear & Hierarchical Memory',
    description:
      'Manipulate stacks, queues, linked lists, trees, heaps, and hash tables with pointer and bucket visualizations.',
    subject: 'Data Structures',
    plannedTopics: [
      'Stack (LIFO)',
      'Queue (FIFO)',
      'Linked List',
      'Binary Tree',
      'Binary Search Tree',
      'Binary Heap',
      'Hash Table',
    ],
  },
  {
    id: 'graph',
    title: 'Graph Lab',
    subtitle: 'Traversals & Shortest Paths',
    description:
      'Explore breadth-first, depth-first, Dijkstra, A* heuristic pathfinding, and minimum spanning tree construction.',
    subject: 'Algorithms & Graph Theory',
    plannedTopics: [
      'Breadth-First Search (BFS)',
      'Depth-First Search (DFS)',
      'Dijkstra Shortest Path',
      'A* Search',
      'Minimum Spanning Tree (MST)',
      'Graph Traversal Explorer',
    ],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning Lab',
    subtitle: 'Local Numerical Simulations',
    description:
      'Experiment with linear regression gradient descent, k-means clustering centroids, decision boundaries, and evaluation splits.',
    subject: 'Machine Learning Foundations',
    plannedTopics: [
      'Linear Regression',
      'Logistic Regression',
      'K-Means Clustering',
      'K-Nearest Neighbors',
      'Decision Tree',
      'Train / Test Split',
      'Model Evaluation',
    ],
  },
  {
    id: 'digital-logic',
    title: 'Digital Logic Lab',
    subtitle: 'Boolean Algebra & Gates',
    description:
      'Wire interactive AND, OR, NOT, NAND, NOR, XOR, and XNOR logic gates and inspect live truth tables.',
    subject: 'Digital Logic Design',
    plannedTopics: [
      'AND / OR / NOT Gates',
      'NAND / NOR Universal Gates',
      'XOR / XNOR Gates',
      'Truth Table Builder',
      'Interactive Logic Circuits',
    ],
  },
  {
    id: 'computer-architecture',
    title: 'Computer Architecture Lab',
    subtitle: 'CPU, Cache & Scheduling',
    description:
      'Simulate CPU registers, fetch-decode-execute cycles, cache hit/miss policies, and OS process scheduling.',
    subject: 'Computer Organization & OS',
    plannedTopics: [
      'CPU Registers',
      'Instruction Execution Cycle',
      'Memory Simulation',
      'Cache Simulation',
      'CPU Scheduling',
    ],
  },
];

export const LAB_EXPERIMENTS: LabExperimentDefinition[] = [
  {
    id: 'bubble-sort',
    title: 'Bubble Sort Visualizer',
    categoryId: 'algorithm',
    subject: 'Data Structures & Algorithms',
    shortDescription:
      'Compare adjacent array pairs pass by pass and observe how the largest values bubble to the end with early-exit optimization.',
    overview:
      'Bubble Sort repeatedly steps through an array, compares adjacent elements, and swaps them when they are out of order. With an early-exit flag, it detects already-sorted inputs in a single pass.',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    featured: true,
    availability: 'available',
    runnerType: 'sorting',
    algorithmKey: 'bubble-sort',
    defaultInput: [58, 23, 74, 15, 42, 67, 19, 85, 31],
    learningObjectives: [
      'Trace adjacent element comparisons and swaps across outer and inner passes.',
      'Understand why each full pass guarantees one additional sorted element at the right boundary.',
      'Observe how tracking a swapped boolean achieves O(n) best-case performance on sorted arrays.',
    ],
    complexity: {
      best: 'O(n)',
      average: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      notes: 'Stable in-place comparison sort. Best case O(n) applies only with the early-exit flag.',
    },
    pseudocode: [
      'procedure bubbleSort(arr)',
      '  for i <- 0 to n - 2 do',
      '    swapped <- false',
      '    for j <- 0 to n - i - 2 do',
      '      if arr[j] > arr[j + 1] then',
      '        swap(arr[j], arr[j + 1]); swapped <- true',
      '    if not swapped then break',
      'end procedure',
    ],
    sourceCode: `export function bubbleSort(input: number[]): number[] {
  const arr = [...input];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }

  return arr;
}`,
    challenges: [
      {
        id: 'bs-c1',
        prompt:
          'If you enter the already-sorted array [10, 20, 30, 40, 50] into the visualizer above, how many swaps occur?',
        options: ['0 swaps (early exit after 1 pass)', '4 swaps', '10 swaps', '20 swaps'],
        correctIndex: 0,
        explanation:
          'During the very first pass, all 4 adjacent comparisons evaluate to false, swapped stays false, and the algorithm exits immediately with 0 swaps.',
      },
      {
        id: 'bs-c2',
        prompt: 'Which index becomes permanently sorted first at the end of Pass 1 in Bubble Sort?',
        options: [
          'Index 0 (smallest element)',
          'Index n - 1 (largest element)',
          'The middle index',
          'All even indices',
        ],
        correctIndex: 1,
        explanation:
          'Adjacent right-shifting pushes the maximum element all the way to the rightmost unsorted index (n - 1) on Pass 1.',
      },
    ],
  },
  {
    id: 'selection-sort',
    title: 'Selection Sort Explorer',
    categoryId: 'algorithm',
    subject: 'Data Structures & Algorithms',
    shortDescription:
      'Scan the unsorted suffix to locate the minimum element and perform at most one swap per pass.',
    overview:
      'Selection Sort partitions the array into a growing sorted prefix and a shrinking unsorted suffix. On every pass, it scans for the smallest remaining element and swaps it directly into the next prefix slot.',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    featured: true,
    availability: 'available',
    runnerType: 'sorting',
    algorithmKey: 'selection-sort',
    defaultInput: [64, 25, 12, 82, 34, 19, 51, 70],
    learningObjectives: [
      'Track the running minimum index pointer while scanning the unsorted subarray.',
      'Compare Selection Sort’s minimal O(n) write/swap count against Bubble Sort.',
      'Recognize why Selection Sort always performs O(n²) comparisons regardless of initial order.',
    ],
    complexity: {
      best: 'O(n²)',
      average: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      notes: 'In-place, not stable in standard swap form, performs at most n - 1 swaps total.',
    },
    pseudocode: [
      'procedure selectionSort(arr)',
      '  for i <- 0 to n - 2 do',
      '    minIdx <- i',
      '    for j <- i + 1 to n - 1 do',
      '      if arr[j] < arr[minIdx] then',
      '        minIdx <- j',
      '    if minIdx != i then swap(arr[i], arr[minIdx])',
      'end procedure',
    ],
    sourceCode: `export function selectionSort(input: number[]): number[] {
  const arr = [...input];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }

  return arr;
}`,
    challenges: [
      {
        id: 'ss-c1',
        prompt: 'What is the maximum number of swaps Selection Sort can ever perform on an array of 8 elements?',
        options: ['7 swaps', '28 swaps', '56 swaps', '64 swaps'],
        correctIndex: 0,
        explanation:
          'Selection Sort executes at most one swap per outer loop iteration (i from 0 to n - 2), giving at most n - 1 = 7 swaps.',
      },
      {
        id: 'ss-c2',
        prompt: 'Why is Selection Sort O(n²) even in the best case when the array is already sorted?',
        options: [
          'It must still scan the entire unsorted suffix to confirm no smaller element exists',
          'It always swaps every adjacent pair',
          'It allocates a recursive merge tree',
          'It sorts from right to left and then reverses',
        ],
        correctIndex: 0,
        explanation:
          'Without scanning every remaining element in the inner loop, Selection Sort cannot verify that arr[i] is indeed the minimum.',
      },
    ],
  },
  {
    id: 'insertion-sort',
    title: 'Insertion Sort Workbench',
    categoryId: 'algorithm',
    subject: 'Data Structures & Algorithms',
    shortDescription:
      'Pick each unsorted key and shift larger sorted elements rightward to insert it into its proper slot.',
    overview:
      'Insertion Sort builds the final sorted array one item at a time—much like sorting playing cards in your hand. It excels on small or nearly sorted datasets because the inner loop stops as soon as the key finds its place.',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    featured: true,
    availability: 'available',
    runnerType: 'sorting',
    algorithmKey: 'insertion-sort',
    defaultInput: [45, 18, 62, 29, 11, 77, 36, 53],
    learningObjectives: [
      'Differentiate between element comparisons and rightward element shifts.',
      'Understand why Insertion Sort adapts to nearly sorted inputs in O(n) time.',
      'Observe how the sorted prefix invariant holds at the end of every pass.',
    ],
    complexity: {
      best: 'O(n)',
      average: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      notes: 'Stable, adaptive, in-place sort. Often used as the base-case sort inside hybrid algorithms like Timsort.',
    },
    pseudocode: [
      'procedure insertionSort(arr)',
      '  for i <- 1 to n - 1 do',
      '    key <- arr[i]; j <- i - 1',
      '    while j >= 0 and arr[j] > key do',
      '      arr[j + 1] <- arr[j]; j <- j - 1',
      '    arr[j + 1] <- key',
      'end procedure',
    ],
    sourceCode: `export function insertionSort(input: number[]): number[] {
  const arr = [...input];
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
    challenges: [
      {
        id: 'is-c1',
        prompt: 'Which input ordering triggers the worst-case O(n²) behavior for Insertion Sort?',
        options: [
          'Strictly descending (reverse-sorted) order',
          'Strictly ascending order',
          'All identical values',
          'Only the last two elements swapped',
        ],
        correctIndex: 0,
        explanation:
          'When an array is reverse-sorted, each new key is smaller than every element before it, forcing j to shift all the way down to index 0.',
      },
      {
        id: 'is-c2',
        prompt: 'What invariant holds immediately after placing key at arr[j + 1] in iteration i?',
        options: [
          'Subarray arr[0..i] is sorted among those i + 1 elements',
          'The entire array arr[0..n-1] is globally partitioned',
          'arr[i] is guaranteed to be the global maximum',
          'No shifts occurred in iteration i',
        ],
        correctIndex: 0,
        explanation:
          'At the end of pass i, the first i + 1 elements are in sorted relative order, though smaller elements may still appear later in the array.',
      },
    ],
  },
  {
    id: 'linear-search',
    title: 'Linear Search Inspector',
    categoryId: 'algorithm',
    subject: 'Data Structures & Algorithms',
    shortDescription:
      'Sequentially inspect unsorted or sorted elements from index 0 until the target value matches or the array ends.',
    overview:
      'Linear Search checks each element one after another starting at index 0. Because it makes zero assumptions about ordering, it works on any array—including unsorted data—at the cost of O(n) worst-case comparisons.',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    featured: false,
    availability: 'available',
    runnerType: 'searching',
    algorithmKey: 'linear-search',
    defaultInput: [24, 67, 13, 89, 42, 55, 31, 76, 18, 60],
    defaultTarget: 42,
    learningObjectives: [
      'Trace sequential pointer traversal on unsorted arrays.',
      'Compare best-case (index 0), average-case (n/2), and worst-case (absent target) comparisons.',
      'Identify when Linear Search is preferred over Binary Search (unsorted or tiny arrays).',
    ],
    complexity: {
      best: 'O(1)',
      average: 'O(n)',
      worst: 'O(n)',
      space: 'O(1)',
      notes: 'Works on unsorted arrays with zero preprocessing overhead.',
    },
    pseudocode: [
      'procedure linearSearch(arr, target)',
      '  for i <- 0 to n - 1 do',
      '    if arr[i] == target then',
      '      return i',
      '  return -1',
      'end procedure',
    ],
    sourceCode: `export function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`,
    challenges: [
      {
        id: 'ls-c1',
        prompt: 'For an array of 10 unique numbers, how many comparisons does Linear Search make when the target is NOT in the array?',
        options: ['10 comparisons', '5 comparisons', '4 comparisons', '1 comparison'],
        correctIndex: 0,
        explanation:
          'Without ordering guarantees, Linear Search must inspect every single element (all 10) before safely returning -1.',
      },
      {
        id: 'ls-c2',
        prompt: 'Why might Linear Search still be chosen over Binary Search in practice?',
        options: [
          'When the dataset is unsorted and searched only once',
          'Because Linear Search is O(log n)',
          'Because Linear Search requires extra O(n) memory',
          'Because Binary Search cannot find negative numbers',
        ],
        correctIndex: 0,
        explanation:
          'Sorting an unsorted array takes O(n log n), which is slower than a single O(n) Linear Search pass.',
      },
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary Search Window Lab',
    categoryId: 'algorithm',
    subject: 'Data Structures & Algorithms',
    shortDescription:
      'Halve the sorted search interval with low, mid, and high pointers to locate targets in logarithmic time.',
    overview:
      'Binary Search exploits sorted order by comparing the target against the middle element (mid). Each comparison eliminates half of the remaining candidates, reducing 1,000,000 items to at most 20 checks.',
    difficulty: 'Intermediate',
    estimatedMinutes: 15,
    featured: true,
    availability: 'available',
    runnerType: 'searching',
    algorithmKey: 'binary-search',
    defaultInput: [11, 19, 25, 33, 42, 54, 61, 73, 84, 92],
    defaultTarget: 73,
    learningObjectives: [
      'Track low, mid, and high window boundaries across each halving iteration.',
      'Verify why sorted order is a strict precondition for safe half-elimination.',
      'Observe logarithmic O(log n) comparison growth compared to Linear Search.',
    ],
    complexity: {
      best: 'O(1)',
      average: 'O(log n)',
      worst: 'O(log n)',
      space: 'O(1)',
      notes: 'Iterative implementation uses O(1) space. Requires input array to be sorted in ascending order.',
    },
    pseudocode: [
      'procedure binarySearch(arr, target)',
      '  low <- 0; high <- n - 1',
      '  while low <= high do',
      '    mid <- floor((low + high) / 2)',
      '    if arr[mid] == target then return mid',
      '    else if arr[mid] < target then low <- mid + 1',
      '    else high <- mid - 1',
      '  return -1',
    ],
    sourceCode: `export function binarySearch(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
}`,
    challenges: [
      {
        id: 'bin-c1',
        prompt:
          'In the default 10-element array [11, 19, 25, 33, 42, 54, 61, 73, 84, 92], what is the first index checked as mid?',
        options: ['Index 4 (value 42)', 'Index 5 (value 54)', 'Index 0 (value 11)', 'Index 9 (value 92)'],
        correctIndex: 0,
        explanation:
          'With low = 0 and high = 9, floor((0 + 9) / 2) = 4, so arr[4] = 42 is inspected first.',
      },
      {
        id: 'bin-c2',
        prompt: 'Approximately how many comparisons at most does Binary Search need for a sorted array of 1,024 elements?',
        options: ['11 comparisons (log₂ 1024 + 1)', '512 comparisons', '100 comparisons', '1,024 comparisons'],
        correctIndex: 0,
        explanation:
          'Because each step halves the search space, 2¹⁰ = 1,024 implies at most 10–11 comparisons in the worst case.',
      },
    ],
  },
];

export const getCategoryById = (id: LabCategoryId): LabCategory | undefined =>
  LAB_CATEGORIES.find((c) => c.id === id);

export const getExperimentById = (id: string): LabExperimentDefinition | undefined =>
  LAB_EXPERIMENTS.find((e) => e.id === id);

export const getInteractiveExperiments = (): LabExperimentDefinition[] =>
  LAB_EXPERIMENTS.filter((e) => e.availability === 'available');
