export type LabCategoryId =
  | 'algorithm'
  | 'data-structure'
  | 'graph'
  | 'machine-learning'
  | 'digital-logic'
  | 'computer-architecture';

export type LabDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type LabStatus = 'not_started' | 'in_progress' | 'completed';

export type LabRunnerType = 'sorting' | 'searching' | 'planned';

export type AlgorithmKey =
  | 'bubble-sort'
  | 'selection-sort'
  | 'insertion-sort'
  | 'linear-search'
  | 'binary-search';

export interface LabCategory {
  id: LabCategoryId;
  title: string;
  subtitle: string;
  description: string;
  subject: string;
  plannedTopics: string[];
}

export interface LabComplexity {
  best: string;
  average: string;
  worst: string;
  space: string;
  notes: string;
}

export interface LabChallenge {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LabExperimentDefinition {
  id: string;
  title: string;
  categoryId: LabCategoryId;
  subject: string;
  shortDescription: string;
  overview: string;
  difficulty: LabDifficulty;
  estimatedMinutes: number;
  featured?: boolean;
  availability: 'available' | 'planned';
  runnerType: LabRunnerType;
  algorithmKey?: AlgorithmKey;
  learningObjectives: string[];
  complexity?: LabComplexity;
  pseudocode: string[];
  sourceCode: string;
  defaultInput?: number[];
  defaultTarget?: number;
  challenges: LabChallenge[];
}

export interface LabExperimentSettings {
  speed?: number;
  inputSize?: number;
  customInput?: string;
  targetValue?: number;
}

export interface LabExperimentProgress {
  id: string; // `${userId}_${experimentId}`
  userId: string;
  experimentId: string;
  categoryId: LabCategoryId;
  status: LabStatus;
  lastOpenedAt: string;
  completedAt?: string;
  challengesSolved: string[];
  settings?: LabExperimentSettings;
}

// Reusable Visualization Trace Step Contracts
export interface SortingStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sortedIndices: number[];
  specialIndices?: {
    label: string;
    indices: number[];
  };
  comparisons: number;
  swaps: number;
  passNumber: number;
  activeLine: number;
  explanation: string;
  executionState: 'ready' | 'comparing' | 'swapping' | 'sorted' | 'done';
}

export interface SearchingStep {
  array: number[];
  target: number;
  low?: number;
  high?: number;
  mid?: number;
  currentIndex: number | null;
  checkedIndices: number[];
  eliminatedIndices: number[];
  foundIndex: number | null;
  comparisons: number;
  activeLine: number;
  explanation: string;
  executionState: 'ready' | 'checking' | 'narrowing' | 'found' | 'not_found';
}
