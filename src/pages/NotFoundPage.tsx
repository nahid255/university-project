import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F6F8FB] dark:bg-[#0B1120] text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 border border-blue-200/80 dark:border-blue-800/70">
        <GraduationCap className="w-8 h-8" />
      </div>

      <h1 className="text-5xl sm:text-6xl font-bold text-slate-950 dark:text-white tracking-tight tabular-nums">
        404
      </h1>
      <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-3">
        Page Not Found on Campus
      </h2>
      <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mt-2.5 mb-8 leading-relaxed">
        The university portal page you requested does not exist or may have been relocated.
      </p>

      <Link to="/dashboard" className="jstu-btn-primary">
        <Home className="w-4 h-4" />
        <span>Go to Student Dashboard</span>
      </Link>
    </div>
  );
};
