import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Shuffle,
  Save,
  Check,
  Target,
} from 'lucide-react';
import { MAX_ARRAY_SIZE, MIN_ARRAY_SIZE } from '../../mylab/algorithms';

interface VisualizationControlsProps {
  isPlaying: boolean;
  stepIndex: number;
  totalSteps: number;
  speed: number;
  inputSize: number;
  currentArray: number[];
  isSearching?: boolean;
  targetValue?: number;
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
  onSaveSettings?: () => Promise<void>;
}

export const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  isPlaying,
  stepIndex,
  totalSteps,
  speed,
  inputSize,
  currentArray,
  isSearching = false,
  targetValue = 0,
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
}) => {
  const [customText, setCustomText] = useState(currentArray.join(', '));
  const [inputError, setInputError] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState(String(targetValue));
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setCustomText(currentArray.join(', '));
  }, [currentArray]);

  useEffect(() => {
    setTargetInput(String(targetValue));
  }, [targetValue]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = onApplyCustomInput(customText);
    setInputError(err);
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTargetChange) return;
    const num = Number(targetInput.trim());
    if (!Number.isInteger(num) || num < 1 || num > 999) {
      setInputError('Target value must be an integer between 1 and 999.');
      return;
    }
    setInputError(null);
    onTargetChange(num);
  };

  const handlePickPresent = () => {
    if (!onTargetChange || currentArray.length === 0) return;
    const randomPresent =
      currentArray[Math.floor(Math.random() * currentArray.length)];
    setInputError(null);
    onTargetChange(randomPresent);
  };

  const handlePickMissing = () => {
    if (!onTargetChange) return;
    let candidate = 99;
    while (currentArray.includes(candidate) && candidate > 1) {
      candidate -= 1;
    }
    setInputError(null);
    onTargetChange(candidate);
  };

  const handleSave = async () => {
    if (!onSaveSettings) return;
    await onSaveSettings();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  };

  const speedDelayMs = Math.round(650 / speed);

  return (
    <div className="jstu-surface p-5 space-y-5">
      {/* Primary Transport Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPlayPause}
            className="jstu-btn-primary"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{stepIndex >= totalSteps - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepBack}
            disabled={stepIndex <= 0 || isPlaying}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Step Backward"
          >
            <SkipBack className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onStepForward}
            disabled={stepIndex >= totalSteps - 1 || isPlaying}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Step Forward"
          >
            <span>Forward</span>
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="jstu-btn-secondary"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onRandomize}
            className="jstu-btn-secondary"
          >
            <Shuffle className="w-4 h-4" />
            <span>Randomize</span>
          </button>
        </div>

        {onSaveSettings && (
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Step Timeline Scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label
            htmlFor="lab-step-scrubber"
            className="font-semibold text-slate-700 dark:text-slate-200"
          >
            Execution Timeline
          </label>
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <input
          id="lab-step-scrubber"
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={stepIndex}
          onChange={(e) => onSeekStep(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
      </div>

      {/* Sliders: Speed & Array Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label
              htmlFor="lab-speed-slider"
              className="font-semibold text-slate-700 dark:text-slate-200"
            >
              Playback Speed
            </label>
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
              {speed}x ({speedDelayMs} ms/step)
            </span>
          </div>
          <input
            id="lab-speed-slider"
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label
              htmlFor="lab-size-slider"
              className="font-semibold text-slate-700 dark:text-slate-200"
            >
              Input Size
            </label>
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
              {inputSize} elements
            </span>
          </div>
          <input
            id="lab-size-slider"
            type="range"
            min={MIN_ARRAY_SIZE}
            max={MAX_ARRAY_SIZE}
            step={1}
            value={inputSize}
            onChange={(e) => onInputSizeChange(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Custom Input & Optional Search Target */}
      <div className="space-y-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
        <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <label htmlFor="lab-custom-array" className="jstu-label">
              Custom Array Input ({MIN_ARRAY_SIZE}–{MAX_ARRAY_SIZE} integers, range 1–999)
            </label>
            <input
              id="lab-custom-array"
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. 58, 23, 74, 15, 42"
              className="jstu-input font-mono"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="jstu-btn-primary w-full sm:w-auto shrink-0">
              Apply Input
            </button>
          </div>
        </form>

        {isSearching && onTargetChange && (
          <form
            onSubmit={handleTargetSubmit}
            className="flex flex-col sm:flex-row sm:items-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800"
          >
            <div className="w-full sm:w-44">
              <label htmlFor="lab-target-value" className="jstu-label">
                Search Target
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="lab-target-value"
                  type="number"
                  min={1}
                  max={999}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="jstu-input pl-10 font-mono tabular-nums"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className="jstu-btn-primary">
                Set Target
              </button>
              <button
                type="button"
                onClick={handlePickPresent}
                className="jstu-btn-secondary"
              >
                Pick Present Value
              </button>
              <button
                type="button"
                onClick={handlePickMissing}
                className="jstu-btn-secondary"
              >
                Pick Missing Value
              </button>
            </div>
          </form>
        )}

        {inputError && (
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {inputError}
          </p>
        )}
      </div>
    </div>
  );
};
