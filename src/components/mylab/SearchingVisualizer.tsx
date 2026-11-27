import React from 'react';
import { CheckCircle2, Eye, MinusCircle, Search } from 'lucide-react';
import { SearchingStep } from '../../types/mylab';

interface SearchingVisualizerProps {
  step: SearchingStep;
  stepIndex: number;
  totalSteps: number;
  isBinarySearch: boolean;
  wasAutoSorted?: boolean;
}

const STATE_LABELS: Record<
  SearchingStep['executionState'],
  { label: string; colorClass: string }
> = {
  ready: { label: 'Ready', colorClass: 'text-slate-700 dark:text-slate-200' },
  checking: { label: 'Inspecting', colorClass: 'text-amber-600 dark:text-amber-400' },
  narrowing: { label: 'Narrowing Window', colorClass: 'text-blue-600 dark:text-blue-400' },
  found: { label: 'Target Found', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  not_found: { label: 'Not Found (-1)', colorClass: 'text-rose-600 dark:text-rose-400' },
};

export const SearchingVisualizer: React.FC<SearchingVisualizerProps> = ({
  step,
  stepIndex,
  totalSteps,
  isBinarySearch,
  wasAutoSorted = false,
}) => {
  const stateInfo = STATE_LABELS[step.executionState];

  return (
    <div className="jstu-surface p-5 sm:p-6 space-y-5">
      {/* Live Execution Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="jstu-meta font-medium">Target Value</p>
          <p className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {step.target}
          </p>
        </div>
        <div>
          <p className="jstu-meta font-medium">Comparisons</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {step.comparisons}
          </p>
        </div>
        <div>
          <p className="jstu-meta font-medium">
            {isBinarySearch ? 'Search Window' : 'Scan Pointer'}
          </p>
          <p className="text-[15px] font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {isBinarySearch
              ? step.low !== undefined && step.high !== undefined && step.low <= step.high
                ? `[${step.low} .. ${step.high}]`
                : 'Closed'
              : step.currentIndex !== null
              ? `Index ${step.currentIndex}`
              : 'Idle'}
          </p>
        </div>
        <div>
          <p className="jstu-meta font-medium">Trace Step</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {stepIndex + 1}/{totalSteps}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="jstu-meta font-medium">Execution State</p>
          <p className={`text-[15px] font-bold mt-0.5 ${stateInfo.colorClass}`}>
            {stateInfo.label}
          </p>
        </div>
      </div>

      {isBinarySearch && wasAutoSorted && (
        <p className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl px-4 py-2.5">
          Your custom input was automatically sorted in ascending order because Binary Search requires a sorted array.
        </p>
      )}

      {/* Indexed Array Cell Stage */}
      <div className="rounded-xl bg-slate-50 dark:bg-[#080F1F] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-3 py-4">
          {step.array.map((val, idx) => {
            const isFound = step.foundIndex === idx;
            const isCurrent = step.currentIndex === idx;
            const isEliminated = step.eliminatedIndices.includes(idx);
            const isChecked = step.checkedIndices.includes(idx);

            const pointers: string[] = [];
            if (isBinarySearch) {
              if (step.low === idx) pointers.push('LOW');
              if (step.mid === idx) pointers.push('MID');
              if (step.high === idx) pointers.push('HIGH');
            } else if (isCurrent) {
              pointers.push('PTR');
            }

            let boxClasses =
              'bg-white dark:bg-[#111827] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white';
            if (isFound) {
              boxClasses =
                'bg-emerald-600 border-emerald-700 text-white shadow-md -translate-y-1';
            } else if (isCurrent) {
              boxClasses =
                'bg-amber-500 border-amber-600 text-white shadow-md -translate-y-1';
            } else if (isEliminated) {
              boxClasses =
                'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
            } else if (isChecked) {
              boxClasses =
                'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300';
            }

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[58px]">
                <div className="h-6 flex items-center justify-center gap-1">
                  {pointers.map((p) => (
                    <span
                      key={p}
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        p === 'MID' || p === 'PTR'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${boxClasses}`}
                  aria-label={`Index ${idx}, value ${val}${isFound ? ', found' : isCurrent ? ', checking' : isEliminated ? ', eliminated' : ''}`}
                >
                  <span className="text-lg font-bold font-mono tabular-nums">
                    {val}
                  </span>
                </div>

                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  [{idx}]
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explicit Accessible Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-amber-500" />
          <span>Active Comparison</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Target Matched</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Search className="w-4 h-4 text-blue-600" />
          <span>Active Candidate Pool</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MinusCircle className="w-4 h-4 text-slate-400" />
          <span>Checked / Eliminated</span>
        </span>
      </div>
    </div>
  );
};
