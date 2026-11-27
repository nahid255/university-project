import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS } from '../../data/initialData';

export const AdminLoginPage: React.FC = () => {
  const { login, setDemoUser, isFirebase } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, 'admin');
      navigate('/admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Administration authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDemo = () => {
    if (isFirebase) return;
    const target = INITIAL_USERS.find((u) => u.role === 'admin');
    if (target) {
      setDemoUser(target);
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#0B1120] text-slate-100">
      <div className="w-full max-w-[460px]">
        {/* Institutional Administration Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-sm mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            JSTU <span className="text-indigo-400">Campus</span>
          </h1>
          <p className="mt-1.5 text-sm font-semibold uppercase tracking-wider text-indigo-300">
            University Administration Portal
          </p>
        </div>

        {/* Admin Login Card */}
        <div className="bg-[#111827] rounded-2xl p-7 sm:p-9 border border-slate-800 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-white leading-snug">
              Authorized Staff &amp; Administration Sign In
            </h2>
            <p className="text-[15px] text-slate-400 mt-1.5 leading-relaxed">
              Sign in with your provisioned university administrative credentials.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/70 text-sm text-rose-200 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Official Administration Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-xl text-[15px] bg-[#0F172A] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-200">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-indigo-400 hover:underline"
                >
                  Reset credentials?
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
                  className="w-full min-h-[44px] pl-11 pr-11 py-2.5 rounded-xl text-[15px] bg-[#0F172A] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 focus:border-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Clearance...' : 'Sign In to Administration Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-300 flex items-start gap-3 leading-relaxed">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Public self-registration is disabled for University Administration. Accounts are provisioned strictly by authorized JSTU systems governance.
            </span>
          </div>

          {!isFirebase && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
                Preview Demo Administration Access
              </p>
              <button
                type="button"
                onClick={handleAdminDemo}
                className="w-full min-h-[44px] flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/60 text-indigo-200 text-[15px] font-semibold transition-colors border border-indigo-800/60"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Sign in as Preview Officer (Dr. Sarah Mitchell)</span>
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:underline"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Are you a Student? Sign in via Student Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
