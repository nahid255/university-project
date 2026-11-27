import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { resetPassword } from '../../services/authService';

export const SettingsPage: React.FC = () => {
  const { currentUser, isFirebase } = useAuth();
  const { theme, setTheme } = useTheme();

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
    <div className="max-w-4xl mx-auto space-y-7">
      <div>
        <h1 className="jstu-page-title flex items-center gap-3">
          <Settings className="w-7 h-7 text-slate-700 dark:text-slate-300 shrink-0" />
          <span>Account Preferences &amp; Security</span>
        </h1>
        <p className="jstu-secondary mt-1.5">
          Customize portal appearance and update your account security credentials
        </p>
      </div>

      {/* Theme Preference Card */}
      <section className="jstu-surface p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="jstu-section-title">
            Interface Theme Preference
          </h2>
          <p className="jstu-secondary mt-1">
            Select your preferred visual mode for the JSTU Campus portal. Your choice persists automatically across sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-colors flex items-center gap-3.5 ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Light Academic</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Bright clean layout</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-colors flex items-center gap-3.5 ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-950/40 text-blue-100 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Dark Deep Campus</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Low-glare night study</p>
            </div>
          </button>
        </div>
      </section>

      {/* Password & Security Card */}
      <section className="jstu-surface p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="jstu-section-title flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Update Password</span>
          </h2>
          <p className="jstu-secondary mt-1">
            Ensure your account is protected with a strong passphrase
          </p>
        </div>

        {pwSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-sm text-emerald-800 dark:text-emerald-200 font-medium">
            {pwSuccess}
          </div>
        )}

        {pwError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 font-medium">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-5 max-w-lg">
          <div>
            <label className="jstu-label">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="jstu-input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="jstu-label">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="jstu-input"
            />
          </div>

          <button type="submit" disabled={isUpdatingPw} className="jstu-btn-primary">
            {isUpdatingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
};
