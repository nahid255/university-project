import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  IdCard,
  Building2,
  Calendar,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [batch, setBatch] = useState('Batch 2024');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Electrical & Electronic Engineering',
    'Software Engineering',
    'Civil & Environmental Engineering',
    'Mechanical Engineering',
    'Business Administration (BBA)',
    'Physics & Mathematics',
    'Biomedical Engineering',
  ];

  const batches = [
    'Batch 2021 (Year 4)',
    'Batch 2022 (Year 3)',
    'Batch 2023 (Year 2)',
    'Batch 2024 (Year 1)',
    'Batch 2025 (Freshman)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        email,
        studentId,
        department,
        batch,
        password,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration could not be completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F6F8FB] dark:bg-[#0B1120]">
      <div className="w-full max-w-[560px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-sm mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            JSTU Campus &mdash; Student Registration
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-400">
            Register your official JSTU student portal account
          </p>
        </div>

        {/* Form Card */}
        <div className="jstu-surface p-7 sm:p-9">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="jstu-label">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Lee"
                    className="jstu-input pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="jstu-label">
                  Student ID
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="ST-2024-5510"
                    className="jstu-input pl-11 font-mono"
                  />
                </div>
              </div>
            </div>

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
                  placeholder="jordan.lee@university.edu"
                  className="jstu-input pl-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="jstu-label">
                  Academic Department
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="jstu-select pl-11"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="jstu-label">
                  Batch / Academic Year
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="jstu-select pl-11"
                  >
                    {batches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="jstu-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
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

              <div>
                <label className="jstu-label">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="jstu-input pl-11"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/35 rounded-xl border border-blue-200/70 dark:border-blue-900/40 text-sm text-blue-900 dark:text-blue-200 flex items-start gap-3 leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                All self-registered accounts are automatically assigned the <strong>Student</strong> role. University Administration accounts cannot be selected or created during student registration.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="jstu-btn-primary w-full min-h-[46px]"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Student Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-7 text-center text-[15px] text-slate-600 dark:text-slate-400">
            Already have a student account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in via Student Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
