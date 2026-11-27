import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getExperimentById } from '../../mylab/registry';
import {
  generateBubbleSortTrace,
  generateSelectionSortTrace,
  generateInsertionSortTrace,
  generateLinearSearchTrace,
  generateBinarySearchTrace,
  generateRandomArray,
  parseNumberArrayInput,
} from '../../mylab/algorithms';
import {
  getUserLabProgress,
  recordExperimentOpened,
  saveExperimentSettings,
  markExperimentCompleted,
  markChallengeSolved,
} from '../../services/labService';
import {
  LabExperimentProgress,
  SortingStep,
  SearchingStep,
} from '../../types/mylab';
import { ExperimentWorkspace } from '../../components/mylab/ExperimentWorkspace';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const MyLabExperimentPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const { currentUser } = useAuth();

  const experiment = experimentId ? getExperimentById(experimentId) : undefined;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<LabExperimentProgress | null>(null);

  // Simulation parameters
  const [arrayInput, setArrayInput] = useState<number[]>(
    experiment?.defaultInput || [58, 23, 74, 15, 42, 67, 19]
  );
  const [targetValue, setTargetValue] = useState<number>(
    experiment?.defaultTarget ?? 42
  );
  const [inputSize, setInputSize] = useState<number>(
    experiment?.defaultInput?.length || 8
  );
  const [speed, setSpeed] = useState<number>(1);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize progress & restore saved settings when experiment changes
  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!experiment) {
        setLoading(false);
        return;
      }

      setIsPlaying(false);
      setStepIndex(0);

      const defaultArr = experiment.defaultInput || [58, 23, 74, 15, 42, 67, 19];
      let nextArr = defaultArr;
      let nextSpeed = 1;
      let nextSize = defaultArr.length;
      let nextTarget = experiment.defaultTarget ?? defaultArr[0] ?? 42;

      if (currentUser) {
        try {
          setLoading(true);
          const allProgress = await getUserLabProgress(currentUser.uid);
          const existing = allProgress.find((p) => p.experimentId === experiment.id);

          if (existing?.settings) {
            if (existing.settings.speed) nextSpeed = existing.settings.speed;
            if (existing.settings.customInput) {
              const parsed = parseNumberArrayInput(existing.settings.customInput);
              if (parsed.valid) {
                nextArr = parsed.values;
                nextSize = parsed.values.length;
              }
            } else if (existing.settings.inputSize) {
              nextSize = existing.settings.inputSize;
            }
            if (existing.settings.targetValue !== undefined) {
              nextTarget = existing.settings.targetValue;
            }
          }

          const updated = await recordExperimentOpened(
            currentUser.uid,
            experiment.id,
            experiment.categoryId
          );
          if (active) setProgress(updated);
        } catch (err) {
          console.error('Failed to initialize My Lab experiment:', err);
        }
      }

      if (active) {
        setArrayInput(nextArr);
        setSpeed(nextSpeed);
        setInputSize(nextSize);
        setTargetValue(nextTarget);
        setLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [experiment, currentUser]);

  // Compute deterministic step-by-step execution trace
  const traceResult = useMemo<{
    sortingSteps?: SortingStep[];
    searchingSteps?: SearchingStep[];
    wasAutoSorted?: boolean;
  }>(() => {
    if (!experiment) return {};

    switch (experiment.algorithmKey) {
      case 'bubble-sort':
        return { sortingSteps: generateBubbleSortTrace(arrayInput) };
      case 'selection-sort':
        return { sortingSteps: generateSelectionSortTrace(arrayInput) };
      case 'insertion-sort':
        return { sortingSteps: generateInsertionSortTrace(arrayInput) };
      case 'linear-search':
        return { searchingSteps: generateLinearSearchTrace(arrayInput, targetValue) };
      case 'binary-search': {
        const res = generateBinarySearchTrace(arrayInput, targetValue);
        return {
          searchingSteps: res.steps,
          wasAutoSorted: res.wasAutoSorted,
        };
      }
      default:
        return {};
    }
  }, [experiment, arrayInput, targetValue]);

  const totalSteps =
    traceResult.sortingSteps?.length ?? traceResult.searchingSteps?.length ?? 1;

  // Clamp stepIndex when trace length changes
  useEffect(() => {
    if (stepIndex >= totalSteps) {
      setStepIndex(0);
    }
  }, [totalSteps, stepIndex]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const delayMs = Math.max(120, Math.round(650 / speed));
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delayMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, stepIndex, totalSteps]);

  if (loading) {
    return <LoadingSpinner label="Preparing laboratory workbench..." fullPage={false} />;
  }

  if (!experiment || experiment.availability !== 'available') {
    return (
      <div className="jstu-surface p-8 text-center space-y-4 max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="jstu-section-title">Experiment Not Found</h1>
        <p className="jstu-secondary">
          The requested laboratory module is unavailable or not yet enabled. Return to My Lab to select an interactive experiment.
        </p>
        <Link to="/mylab" className="jstu-btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Lab</span>
        </Link>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (stepIndex >= totalSteps - 1) {
      setStepIndex(0);
    }
    setIsPlaying(true);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleSeekStep = (index: number) => {
    setIsPlaying(false);
    setStepIndex(Math.max(0, Math.min(totalSteps - 1, index)));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleRandomize = () => {
    setIsPlaying(false);
    setStepIndex(0);
    const shouldSort = experiment.algorithmKey === 'binary-search';
    const nextArr = generateRandomArray(inputSize, shouldSort);
    setArrayInput(nextArr);
    if (experiment.runnerType === 'searching') {
      const randomExisting = nextArr[Math.floor(Math.random() * nextArr.length)];
      setTargetValue(randomExisting);
    }
  };

  const handleInputSizeChange = (newSize: number) => {
    setIsPlaying(false);
    setStepIndex(0);
    setInputSize(newSize);
    const shouldSort = experiment.algorithmKey === 'binary-search';
    const nextArr = generateRandomArray(newSize, shouldSort);
    setArrayInput(nextArr);
    if (experiment.runnerType === 'searching') {
      setTargetValue(nextArr[Math.floor(nextArr.length / 2)] ?? nextArr[0]);
    }
  };

  const handleApplyCustomInput = (raw: string): string | null => {
    const parsed = parseNumberArrayInput(raw);
    if (!parsed.valid) {
      return parsed.error || 'Invalid array input.';
    }
    setIsPlaying(false);
    setStepIndex(0);
    setArrayInput(parsed.values);
    setInputSize(parsed.values.length);
    return null;
  };

  const handleTargetChange = (nextTarget: number) => {
    setIsPlaying(false);
    setStepIndex(0);
    setTargetValue(nextTarget);
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    const updated = await saveExperimentSettings(
      currentUser.uid,
      experiment.id,
      experiment.categoryId,
      {
        speed,
        inputSize,
        customInput: arrayInput.join(', '),
        targetValue:
          experiment.runnerType === 'searching' ? targetValue : undefined,
      }
    );
    setProgress(updated);
  };

  const handleToggleComplete = async () => {
    if (!currentUser) return;
    const nextCompleted = progress?.status !== 'completed';
    const updated = await markExperimentCompleted(
      currentUser.uid,
      experiment.id,
      experiment.categoryId,
      nextCompleted
    );
    setProgress(updated);
  };

  const handleSolveChallenge = async (challengeId: string) => {
    if (!currentUser) return;
    const updated = await markChallengeSolved(
      currentUser.uid,
      experiment.id,
      experiment.categoryId,
      challengeId
    );
    setProgress(updated);
  };

  const currentSortingStep = traceResult.sortingSteps?.[stepIndex] ?? traceResult.sortingSteps?.[0];
  const currentSearchingStep =
    traceResult.searchingSteps?.[stepIndex] ?? traceResult.searchingSteps?.[0];

  return (
    <ExperimentWorkspace
      experiment={experiment}
      progress={progress}
      isPlaying={isPlaying}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      speed={speed}
      inputSize={inputSize}
      currentArray={arrayInput}
      sortingStep={currentSortingStep}
      searchingStep={currentSearchingStep}
      wasAutoSorted={traceResult.wasAutoSorted}
      targetValue={targetValue}
      onPlayPause={handlePlayPause}
      onStepBack={handleStepBack}
      onStepForward={handleStepForward}
      onSeekStep={handleSeekStep}
      onReset={handleReset}
      onRandomize={handleRandomize}
      onSpeedChange={setSpeed}
      onInputSizeChange={handleInputSizeChange}
      onApplyCustomInput={handleApplyCustomInput}
      onTargetChange={handleTargetChange}
      onSaveSettings={handleSaveSettings}
      onToggleComplete={handleToggleComplete}
      onSolveChallenge={handleSolveChallenge}
    />
  );
};
