import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  Check,
  BookOpen,
  Terminal,
  Trophy,
  Info,
} from 'lucide-react';
import {
  LabExperimentDefinition,
  LabExperimentProgress,
  SortingStep,
  SearchingStep,
} from '../../types/mylab';
import { SortingVisualizer } from './SortingVisualizer';
import { SearchingVisualizer } from './SearchingVisualizer';
import { VisualizationControls } from './VisualizationControls';

interface ExperimentWorkspaceProps {
  experiment: LabExperimentDefinition;
  progress: LabExperimentProgress | null;
  // Simulation state
  isPlaying: boolean;
  stepIndex: number;
  totalSteps: number;
  speed: number;
  inputSize: number;
  currentArray: number[];
  sortingStep?: SortingStep;
  searchingStep?: SearchingStep;
  wasAutoSorted?: boolean;
  targetValue?: number;
  // Handlers
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSeekStep: (index: number) => void;
  onReset: () => void;
  onRandomize: () => void;
  onSpeedChange: (speed: number) => void;
  onInputSizeChange: (size: number) => void;
  onApplyCustomInput: (raw: string) => string | null;
  onTargetChange?: (target: number) => void;
  onSaveSettings: () => Promise<void>;
  onToggleComplete: () => Promise<void>;
  onSolveChallenge: (challengeId: string) => Promise<void>;
}

type DeckTab = 'pseudocode' | 'source' | 'complexity';

export const ExperimentWorkspace: React.FC<ExperimentWorkspaceProps> = ({
  experiment,
  progress,
  isPlaying,
  stepIndex,
  totalSteps,
  speed,
  inputSize,
  currentArray,
  sortingStep,
  searchingStep,
  wasAutoSorted,
  targetValue,
  onPlayPause,
  onStepBack,
  onStepForward,
  onSeekStep,
  onReset,
  onRandomize,
  onSpeedChange,
  onInputSizeChange,
  onApplyCustomInput,
  onTargetChange,
  onSaveSettings,
  onToggleComplete,
  onSolveChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<DeckTab>('pseudocode');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [togglingComplete, setTogglingComplete] = useState(false);

  const isCompleted = progress?.status === 'completed';
  const solvedIds = progress?.challengesSolved || [];
  const activeLine = sortingStep?.activeLine ?? searchingStep?.activeLine ?? 1;
  const explanation =
    sortingStep?.explanation ??
    searchingStep?.explanation ??
    'Use Play or Step Forward to inspect each operation.';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(experiment.sourceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  const handleAnswerSelect = async (challengeId: string, optionIdx: number, correctIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [challengeId]: optionIdx }));
    if (optionIdx === correctIdx && !solvedIds.includes(challengeId)) {
      await onSolveChallenge(challengeId);
    }
  };

  const handleToggleCompleteClick = async () => {
    try {
      setTogglingComplete(true);
      await onToggleComplete();
    } finally {
      setTogglingComplete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Progress Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Link
            to="/mylab"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Lab</span>
          </Link>
          <h1 className="jstu-page-title">{experiment.title}</h1>
          <div className="flex flex-wrap items-center gap-2 jstu-meta">
            <span>{experiment.subject}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{experiment.difficulty}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="tabular-nums">~{experiment.estimatedMinutes} min</span>
            <span aria-hidden="true">&middot;</span>
            <span
              className={`font-semibold ${
                isCompleted
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {isCompleted ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleCompleteClick}
          disabled={togglingComplete}
          className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-xl text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCompleted ? 'Completed' : 'Mark as Completed'}</span>
        </button>
      </div>

      {/* Main Two-Zone Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Interactive Visualization Stage & Controls */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {experiment.runnerType === 'sorting' && sortingStep && (
            <SortingVisualizer
              step={sortingStep}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
            />
          )}

          {experiment.runnerType === 'searching' && searchingStep && (
            <SearchingVisualizer
              step={searchingStep}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              isBinarySearch={experiment.algorithmKey === 'binary-search'}
              wasAutoSorted={wasAutoSorted}
            />
          )}

          {/* Step-by-Step Narration Callout */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Step-by-Step Explanation
              </p>
              <p className="jstu-body">{explanation}</p>
            </div>
          </div>

          {/* Playback & Input Controls */}
          <VisualizationControls
            isPlaying={isPlaying}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            speed={speed}
            inputSize={inputSize}
            currentArray={currentArray}
            isSearching={experiment.runnerType === 'searching'}
            targetValue={targetValue}
            onPlayPause={onPlayPause}
            onStepBack={onStepBack}
            onStepForward={onStepForward}
            onSeekStep={onSeekStep}
            onReset={onReset}
            onRandomize={onRandomize}
            onSpeedChange={onSpeedChange}
            onInputSizeChange={onInputSizeChange}
            onApplyCustomInput={onApplyCustomInput}
            onTargetChange={onTargetChange}
            onSaveSettings={onSaveSettings}
          />
        </div>

        {/* Right Zone: Tabbed Learning & Code Deck */}
        <div className="lg:col-span-5 xl:col-span-4 jstu-surface overflow-hidden">
          <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('pseudocode')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 min-h-[38px] py-2 px-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'pseudocode'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Pseudocode</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 min-h-[38px] py-2 px-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'source'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Source Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complexity')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 min-h-[38px] py-2 px-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'complexity'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Concepts</span>
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'pseudocode' && (
              <div className="space-y-3">
                <p className="jstu-meta">
                  The highlighted line tracks the current operation inside the simulation.
                </p>
                <div className="rounded-xl bg-slate-950 text-slate-100 p-3.5 font-mono text-[13px] overflow-x-auto space-y-1">
                  {experiment.pseudocode.map((line, index) => {
                    const lineNumber = index + 1;
                    const isActive = activeLine === lineNumber;
                    return (
                      <div
                        key={lineNumber}
                        className={`flex items-start gap-3 px-2.5 py-1 rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-600/35 text-blue-100 ring-1 ring-blue-400/50'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="w-5 text-right text-slate-500 select-none tabular-nums shrink-0">
                          {lineNumber}
                        </span>
                        <span className="whitespace-pre">{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'source' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    TypeScript Reference Implementation
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 font-mono text-[13px] overflow-x-auto leading-relaxed">
                  <code>{experiment.sourceCode}</code>
                </pre>
              </div>
            )}

            {activeTab === 'complexity' && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h2 className="jstu-card-title">Experiment Overview</h2>
                  <p className="jstu-secondary">{experiment.overview}</p>
                </div>

                <div className="space-y-2">
                  <h2 className="jstu-card-title">Learning Objectives</h2>
                  <ul className="space-y-2.5">
                    {experiment.learningObjectives.map((obj, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 jstu-secondary"
                      >
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                          0{idx + 1}.
                        </span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {experiment.complexity && (
                  <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h2 className="jstu-card-title">Complexity Analysis</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="jstu-inset p-3">
                        <p className="jstu-meta">Best Case Time</p>
                        <p className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {experiment.complexity.best}
                        </p>
                      </div>
                      <div className="jstu-inset p-3">
                        <p className="jstu-meta">Average Time</p>
                        <p className="text-base font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">
                          {experiment.complexity.average}
                        </p>
                      </div>
                      <div className="jstu-inset p-3">
                        <p className="jstu-meta">Worst Case Time</p>
                        <p className="text-base font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-0.5">
                          {experiment.complexity.worst}
                        </p>
                      </div>
                      <div className="jstu-inset p-3">
                        <p className="jstu-meta">Auxiliary Space</p>
                        <p className="text-base font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-0.5">
                          {experiment.complexity.space}
                        </p>
                      </div>
                    </div>
                    <p className="jstu-meta">{experiment.complexity.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenge & Verification Section */}
      <section className="jstu-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="jstu-section-title">Lab Verification Challenges</h2>
              <p className="jstu-secondary">
                Test your understanding using the simulation above to verify algorithm behavior.
              </p>
            </div>
          </div>
          <span className="text-sm font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            {solvedIds.length} / {experiment.challenges.length} solved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {experiment.challenges.map((challenge, idx) => {
            const chosen = selectedAnswers[challenge.id];
            const isPreviouslySolved = solvedIds.includes(challenge.id);
            const hasAnswered = chosen !== undefined;
            const isCorrect =
              hasAnswered ? chosen === challenge.correctIndex : isPreviouslySolved;

            return (
              <div key={challenge.id} className="jstu-inset p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {idx + 1}. {challenge.prompt}
                  </p>
                  {isPreviouslySolved && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Solved</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {challenge.options.map((option, optIdx) => {
                    const selectedThis = chosen === optIdx;
                    const showCorrect =
                      (hasAnswered || isPreviouslySolved) &&
                      optIdx === challenge.correctIndex;
                    const showWrong =
                      hasAnswered && selectedThis && optIdx !== challenge.correctIndex;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() =>
                          handleAnswerSelect(
                            challenge.id,
                            optIdx,
                            challenge.correctIndex
                          )
                        }
                        className={`w-full text-left min-h-[42px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                          showCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                            : showWrong
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                            : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {(hasAnswered || isPreviouslySolved) && (
                  <p
                    className={`text-sm leading-relaxed pt-1 ${
                      isCorrect
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isCorrect ? 'Correct: ' : 'Try again: '}
                    {challenge.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
