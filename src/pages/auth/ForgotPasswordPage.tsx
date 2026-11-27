import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not process password reset.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F6F8FB] dark:bg-[#0B1120]">
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-sm mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Reset Password
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
            We will send recovery instructions to your registered JSTU university email.
          </p>
        </div>

        <div className="jstu-surface p-7 sm:p-9">
          {submitted ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                Reset Link Dispatched
              </h3>
              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                If an account exists for <strong className="text-slate-900 dark:text-slate-100">{email}</strong>, check your university inbox for instructions to reset your password.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="jstu-btn-primary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="jstu-label">
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="jstu-input pl-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="jstu-btn-primary w-full min-h-[46px]"
              >
                <span>{loading ? 'Sending instructions...' : 'Send Recovery Instructions'}</span>
                <Send className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
