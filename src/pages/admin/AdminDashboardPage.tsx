import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Bell,
  Search,
  BookOpen,
  CalendarDays,
  AlertTriangle,
  Activity,
  Flag,
  ShoppingBag,
  CalendarHeart,
  Award,
  BarChart3,
} from 'lucide-react';
import {
  getAdminStats,
  getAuditActivities,
  getAnalyticsData,
  AnalyticsDateRange,
  AdminAnalyticsData,
} from '../../services/adminService';
import { AdminStats, ActivityLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [s, acts, an] = await Promise.all([
          getAdminStats(),
          getAuditActivities(),
          getAnalyticsData(dateRange),
        ]);
        setStats(s);
        setActivities(acts);
        setAnalytics(an);
      } catch (e) {
        console.error('Failed to load admin stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [dateRange]);

  if (loading || !stats || !analytics) {
    return <LoadingSpinner label="Loading administrator console..." />;
  }

  const maxDeptCount = Math.max(1, ...analytics.departmentDistribution.map((d) => d.count));
  const maxResDownloads = Math.max(1, ...analytics.resourceByCategory.map((r) => r.count));

  return (
    <div className="space-y-6">
      {/* Admin Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 backdrop-blur-sm text-xs font-bold text-purple-200 border border-purple-400/30">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Campus Administrator Control Center v2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              University Ecosystem Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time analytics and governance across students, notices, schedules, community moderation, marketplace, events, and verified clubs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/moderation"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Flag className="w-4 h-4" />
              <span>Pending Reports ({stats.pendingReportsCount || 0})</span>
            </Link>
            <Link
              to="/admin/notices"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span>Publish Notice</span>
            </Link>
            <Link
              to="/admin/lost-found"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/20 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Claims ({stats.pendingClaimRequests})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (V1 + V2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalStudents}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Enrolled accounts</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Community</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalCommunityPosts || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Active posts</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Exchange</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {(stats.activeMarketplaceListings || 0) + (stats.activeBookListings || 0)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.activeMarketplaceListings || 0} items &bull; {stats.activeBookListings || 0} books
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Events &amp; Clubs</span>
            <CalendarHeart className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {(stats.upcomingEventsCount || 0) + (stats.totalClubs || 0)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.upcomingEventsCount || 0} events &bull; {stats.totalClubs || 0} clubs
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Resources</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalStudyResources}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.totalPublishedNotices} published notices
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Moderation</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {(stats.pendingClaimRequests || 0) + (stats.pendingReportsCount || 0)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {stats.pendingReportsCount || 0} reports &bull; {stats.pendingClaimRequests} claims
          </p>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span>Campus Analytics ({analytics.rangeLabel})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated directly from live Firestore/local campus records
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {(
              [
                { value: '7d', label: '7D' },
                { value: '30d', label: '30D' },
                { value: '90d', label: '90D' },
                { value: 'all', label: 'All Time' },
              ] as { value: AnalyticsDateRange; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === opt.value
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Metrics Strip for Date Range */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'New Students', value: analytics.summary.newStudents },
            { label: 'Posts & Comments', value: analytics.summary.communityPosts + analytics.summary.totalComments },
            { label: 'Event Registrations', value: analytics.summary.eventRegistrations },
            { label: 'Resource Downloads', value: analytics.summary.resourceDownloads },
            { label: 'Published Notices', value: analytics.summary.publishedNotices },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800"
            >
              <p className="text-[11px] font-bold text-slate-400 uppercase">{m.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Students by Department */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Students by Department
            </h3>
            <div className="space-y-2.5">
              {analytics.departmentDistribution.map((dept) => (
                <div key={dept.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {dept.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{dept.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((dept.count / maxDeptCount) * 100)}%`,
                        backgroundColor: dept.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Event Capacity & Registrations */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Event Registration Fill Rate
            </h3>
            {analytics.eventAttendance.length === 0 ? (
              <p className="text-xs text-slate-400">No published events yet.</p>
            ) : (
              <div className="space-y-2.5">
                {analytics.eventAttendance.map((ev) => {
                  const pct = ev.capacity > 0 ? Math.min(100, Math.round((ev.registered / ev.capacity) * 100)) : 0;
                  return (
                    <div key={ev.title} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[165px]">
                          {ev.title}
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {ev.registered}/{ev.capacity}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chart 3: Study Resource Downloads by Subject */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Resource Downloads by Subject
            </h3>
            <div className="space-y-2.5">
              {analytics.resourceByCategory.map((res) => (
                <div key={res.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {res.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{res.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((res.count / maxResDownloads) * 100)}%`,
                        backgroundColor: res.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Administrative Modules (V1 &amp; V2)
            </h3>
            <span className="text-xs text-slate-400">Role-governed operations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                to: '/admin/moderation',
                icon: Flag,
                bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600',
                title: 'Community & Reports',
                desc: 'Review content/abuse reports, hide or remove posts, and maintain campus safety.',
              },
              {
                to: '/admin/marketplace',
                icon: ShoppingBag,
                bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600',
                title: 'Marketplace & Books',
                desc: 'Moderate marketplace items and textbook exchange listings across departments.',
              },
              {
                to: '/admin/events',
                icon: CalendarHeart,
                bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600',
                title: 'Events & Registrations',
                desc: 'Create, publish, cancel campus events, and manage seat capacities & waitlists.',
              },
              {
                to: '/admin/clubs',
                icon: Award,
                bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600',
                title: 'Clubs & Memberships',
                desc: 'Register verified official university clubs, assign managers, and review applications.',
              },
              {
                to: '/admin/students',
                icon: Users,
                bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600',
                title: 'Student Directory & Roles',
                desc: 'Search registered student records, inspect departments, and manage permissions.',
              },
              {
                to: '/admin/notices',
                icon: Bell,
                bg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-600',
                title: 'Official Notice Management',
                desc: 'Publish circulars, pin emergency notices, and attach PDF documentation.',
              },
              {
                to: '/admin/academic',
                icon: CalendarDays,
                bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600',
                title: 'Academic Schedules & Exams',
                desc: 'Configure weekly class timetables, rooms, and midterm examination dates.',
              },
              {
                to: '/admin/lost-found',
                icon: Search,
                bg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600',
                title: 'Lost & Found Moderation',
                desc: 'Review and approve claim requests, verify claimant proof, or remove resolved items.',
              },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-start gap-3.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {mod.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column: Audit Activity Log */}
        <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Campus Activity Log</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Audit Stream</span>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {act.userName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {act.action}{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    &quot;{act.target}&quot;
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
