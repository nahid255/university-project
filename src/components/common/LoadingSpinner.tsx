import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading data...',
  size = 'md',
  fullPage = false,
}) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3.5 p-10">
      <Loader2 className={`${iconSizes[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
      {label && (
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] dark:bg-[#0B1120]">
        {content}
      </div>
    );
  }

  return content;
};
