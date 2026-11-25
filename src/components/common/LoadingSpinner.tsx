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
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className={`${iconSizes[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
      {label && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FF] dark:bg-[#080F1F]">
        {content}
      </div>
    );
  }

  return content;
};
