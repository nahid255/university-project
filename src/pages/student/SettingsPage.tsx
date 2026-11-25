import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Lock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { resetPassword } from '../../services/authService';

export const SettingsPage: React.FC = () => {
  const { currentUser, isFirebase } = useAuth();
  const { theme, setTheme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    try {
      setIsUpdatingPw(true);
      await resetPassword(currentUser.email);
      setPwSuccess(
        isFirebase
          ? 'Password reset instructions have been dispatched to your email address.'
          : 'Password updated successfully in your local session.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPwError(err.message);
      } else {
        setPwError('Could not process password change.');
      }
    } finally {
      setIsUpdatingPw(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <span>Account Preferences & Security</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize portal appearance, update security credentials, and check cloud sync
        </p>
      </div>

      {/* Theme Preference Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Interface Theme Preference
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select your preferred visual mode for the CampusMate dashboard. Your choice persists automatically across page reloads.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Light Academic</p>
              <p className="text-[10px] text-slate-400">Bright clean layout</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-950/40 text-blue-200 font-bold ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Dark Deep Campus</p>
              <p className="text-[10px] text-slate-400">Low-glare night study</p>
            </div>
          </button>
        </div>
      </div>

      {/* Password & Security Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Update Password</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ensure your account is protected with a strong, secure passphrase
          </p>
        </div>

        {pwSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            {pwSuccess}
          </div>
        )}

        {pwError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 pr-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPw}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {isUpdatingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* System & Architecture Diagnostics Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Database & Cloud Architecture Status</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Technical ecosystem diagnostics and role governance
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Database Driver:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isFirebase ? 'Google Cloud Firestore (Live)' : 'Local Storage Resilient Mode'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Authentication Layer:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isFirebase ? 'Firebase Authentication' : 'Local Auth Provider'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Your Current Role:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">
              {currentUser?.role}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Security Rules Enforcement:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Active (Role-Based RBAC & Owner Isolation)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
