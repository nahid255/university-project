import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS } from '../../data/initialData';

export const LoginPage: React.FC = () => {
  const { login, setDemoUser, isFirebase } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, 'student');
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your student credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDemo = () => {
    if (isFirebase) return;
    const target = INITIAL_USERS.find((u) => u.role === 'student');
    if (target) {
      setDemoUser(target);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F6F8FB] dark:bg-[#0B1120]">
      <div className="w-full max-w-[460px]">
        {/* Official JSTU Campus Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-sm mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            JSTU <span className="text-blue-600 dark:text-blue-400">Campus</span>
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-400">
            Official University Student Portal
          </p>
        </div>

        {/* Student Login Card */}
        <div className="jstu-surface p-7 sm:p-9">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Student Sign In
            </h2>
            <p className="text-[15px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Access your courses, campus transport, notices, My Lab, and student services.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="jstu-label">
                University Student Email
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="jstu-input pl-11 pr-11"
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

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2.5 text-[15px] text-slate-600 dark:text-slate-300 select-none cursor-pointer"
              >
                Remember this device session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="jstu-btn-primary w-full min-h-[46px]"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {!isFirebase && (
            <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center mb-3">
                Preview Demo Student Access
              </p>
              <button
                type="button"
                onClick={handleStudentDemo}
                className="jstu-btn-secondary w-full"
              >
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Sign in as Preview Student (Alex Rivera)</span>
              </button>
            </div>
          )}

          <div className="mt-7 text-center text-[15px] text-slate-600 dark:text-slate-400 space-y-4">
            <div>
              New JSTU student?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Register your student account
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>University Administration? Go to Administration Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
