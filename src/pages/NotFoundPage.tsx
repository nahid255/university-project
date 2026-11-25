import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F8FF] dark:bg-[#080F1F] text-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 ring-8 ring-blue-50/50 dark:ring-blue-950/20 shadow-md">
        <GraduationCap className="w-8 h-8" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
        404
      </h1>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-2">
        Page Not Found on Campus
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 mb-8 leading-relaxed">
        The university portal page you requested does not exist or may have been relocated.
      </p>

      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Go to Student Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
