import React from 'react';
import { ArrowLeftRight, CheckCircle2, Eye, Layers, Sparkles } from 'lucide-react';
import { SortingStep } from '../../types/mylab';

interface SortingVisualizerProps {
  step: SortingStep;
  stepIndex: number;
  totalSteps: number;
}

const STATE_LABELS: Record<
  SortingStep['executionState'],
  { label: string; colorClass: string }
> = {
  ready: {
    label: 'Ready',
    colorClass: 'text-slate-700 dark:text-slate-200',
  },
  comparing: {
    label: 'Comparing',
    colorClass: 'text-amber-600 dark:text-amber-400',
  },
  swapping: {
    label: 'Swapping / Shifting',
    colorClass: 'text-rose-600 dark:text-rose-400',
  },
  sorted: {
    label: 'Element Locked',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  done: {
    label: 'Sorted Complete',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const SortingVisualizer: React.FC<SortingVisualizerProps> = ({
  step,
  stepIndex,
  totalSteps,
}) => {
  const maxVal = Math.max(...step.array, 10);
  const stateInfo = STATE_LABELS[step.executionState];

  return (
    <div className="jstu-surface p-5 sm:p-6 space-y-5">
      {/* Live Execution Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="jstu-meta font-medium">Comparisons</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {step.comparisons}
          </p>
        </div>
        <div>
          <p className="jstu-meta font-medium">Swaps / Shifts</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {step.swaps}
          </p>
        </div>
        <div>
          <p className="jstu-meta font-medium">Outer Pass</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {step.passNumber}
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

      {/* Bar Chart Stage */}
      <div className="rounded-xl bg-slate-50 dark:bg-[#080F1F] border border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 pt-8 pb-4">
        <div className="h-56 sm:h-64 flex items-end justify-center gap-1.5 sm:gap-2.5">
          {step.array.map((val, idx) => {
            const isSwapping = step.swapping.includes(idx);
            const isComparing = step.comparing.includes(idx);
            const isSorted = step.sortedIndices.includes(idx);
            const isSpecial = step.specialIndices?.indices.includes(idx);

            const heightPct = Math.max(14, Math.round((val / maxVal) * 100));

            let barColor = 'bg-blue-600 dark:bg-blue-500';
            let statusTag = '';

            if (isSwapping) {
              barColor = 'bg-rose-500 dark:bg-rose-500';
              statusTag = 'SWP';
            } else if (isComparing) {
              barColor = 'bg-amber-500 dark:bg-amber-400';
              statusTag = 'CMP';
            } else if (isSpecial) {
              barColor = 'bg-indigo-600 dark:bg-indigo-400';
              statusTag = (step.specialIndices?.label || 'KEY').toUpperCase();
            } else if (isSorted) {
              barColor = 'bg-emerald-600 dark:bg-emerald-500';
              statusTag = 'OK';
            }

            return (
              <div
                key={idx}
                className="flex-1 max-w-[48px] h-full flex flex-col items-center justify-end gap-1.5 min-w-0"
              >
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 h-4 flex items-center">
                  {statusTag}
                </span>
                <span className="text-xs font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100">
                  {val}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-lg transition-all duration-200 ease-out ${barColor} ${
                    isSwapping || isComparing ? '-translate-y-1 shadow-md' : ''
                  }`}
                  aria-label={`Index ${idx}: value ${val}${statusTag ? `, ${statusTag}` : ''}`}
                />
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 pt-0.5">
                  {idx}
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
          <span>Comparing (CMP)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ArrowLeftRight className="w-4 h-4 text-rose-500" />
          <span>Swapping / Shifting (SWP)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Active Marker (MIN / KEY)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Sorted Position (OK)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Unsorted Pool</span>
        </span>
      </div>
    </div>
  );
};
