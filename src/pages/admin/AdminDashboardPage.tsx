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
  Bus,
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
    <div className="space-y-8">
      {/* Institutional Administration Header */}
      <section className="rounded-2xl bg-[#0F172A] text-white p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>JSTU Campus &middot; University Administration</span>
            </div>
            <h1 className="jstu-page-title !text-white">
              University Operations &amp; Administration
            </h1>
            <p className="text-[15px] text-slate-300 max-w-2xl leading-relaxed">
              Manage official university transportation, notices, academic schedules, student directory, events, verified clubs, and campus safety moderation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/transportation"
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[15px] font-semibold transition-colors tabular-nums"
            >
              <Bus className="w-4 h-4" />
              <span>Transportation ({stats.activeTransportRoutes ?? 0}/{stats.totalTransportRoutes ?? 0})</span>
            </Link>
            <Link
              to="/admin/moderation"
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[15px] font-semibold transition-colors tabular-nums"
            >
              <Flag className="w-4 h-4" />
              <span>Pending Reports ({stats.pendingReportsCount || 0})</span>
            </Link>
            <Link
              to="/admin/notices"
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[15px] font-semibold transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Publish Notice</span>
            </Link>
            <Link
              to="/admin/lost-found"
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-[15px] font-semibold border border-slate-700 transition-colors tabular-nums"
            >
              <Search className="w-4 h-4" />
              <span>Claims ({stats.pendingClaimRequests})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="jstu-surface p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Students</span>
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {stats.totalStudents}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Enrolled accounts</p>
        </div>

        <div className="jstu-surface p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Community</span>
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {stats.totalCommunityPosts || 0}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Active posts</p>
        </div>

        <div className="jstu-surface p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Exchange</span>
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {(stats.activeMarketplaceListings || 0) + (stats.activeBookListings || 0)}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.activeMarketplaceListings || 0} items &middot; {stats.activeBookListings || 0} books
          </p>
        </div>

        <div className="jstu-surface p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Events &amp; Clubs</span>
            <CalendarHeart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {(stats.upcomingEventsCount || 0) + (stats.totalClubs || 0)}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.upcomingEventsCount || 0} events &middot; {stats.totalClubs || 0} clubs
          </p>
        </div>

        <div className="jstu-surface p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Resources</span>
            <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {stats.totalStudyResources}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.totalPublishedNotices} published notices
          </p>
        </div>

        <div className="jstu-surface p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Moderation</span>
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {(stats.pendingClaimRequests || 0) + (stats.pendingReportsCount || 0)}
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.pendingReportsCount || 0} reports &middot; {stats.pendingClaimRequests} claims
          </p>
        </div>
      </section>

      {/* Campus Analytics Section */}
      <section className="jstu-surface p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="jstu-section-title flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Campus Analytics ({analytics.rangeLabel})</span>
            </h2>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
              Aggregated directly from live campus records
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
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
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === opt.value
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'New Students', value: analytics.summary.newStudents },
            { label: 'Posts & Comments', value: analytics.summary.communityPosts + analytics.summary.totalComments },
            { label: 'Event Registrations', value: analytics.summary.eventRegistrations },
            { label: 'Resource Downloads', value: analytics.summary.resourceDownloads },
            { label: 'Published Notices', value: analytics.summary.publishedNotices },
          ].map((m) => (
            <div key={m.label} className="jstu-inset p-4">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{m.label}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white mt-1.5 tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="jstu-inset p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Students by Department
            </h3>
            <div className="space-y-3">
              {analytics.departmentDistribution.map((dept) => (
                <div key={dept.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {dept.label}
                    </span>
                    <span className="font-semibold text-slate-950 dark:text-white tabular-nums">
                      {dept.count}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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

          <div className="jstu-inset p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Event Registration Fill Rate
            </h3>
            {analytics.eventAttendance.length === 0 ? (
              <p className="text-[15px] text-slate-500 dark:text-slate-400">No published events yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.eventAttendance.map((ev) => {
                  const pct =
                    ev.capacity > 0
                      ? Math.min(100, Math.round((ev.registered / ev.capacity) * 100))
                      : 0;
                  return (
                    <div key={ev.title} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                          {ev.title}
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {ev.registered}/{ev.capacity}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="jstu-inset p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Resource Downloads by Subject
            </h3>
            <div className="space-y-3">
              {analytics.resourceByCategory.map((res) => (
                <div key={res.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {res.label}
                    </span>
                    <span className="font-semibold text-slate-950 dark:text-white tabular-nums">
                      {res.count}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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
      </section>

      {/* Main Admin Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <section className="lg:col-span-2 jstu-surface p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="jstu-section-title">
              Administrative Modules
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">Role-governed operations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                to: '/admin/transportation',
                icon: Bus,
                bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
                title: 'Transportation & Bus Routes',
                desc: 'Create, publish, reorder stops, and suspend or activate official JSTU Campus bus schedules.',
              },
              {
                to: '/admin/moderation',
                icon: Flag,
                bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
                title: 'Community & Reports',
                desc: 'Review content/abuse reports, hide or remove posts, and maintain campus safety.',
              },
              {
                to: '/admin/marketplace',
                icon: ShoppingBag,
                bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                title: 'Marketplace & Books',
                desc: 'Moderate marketplace items and textbook exchange listings across departments.',
              },
              {
                to: '/admin/events',
                icon: CalendarHeart,
                bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
                title: 'Events & Registrations',
                desc: 'Create, publish, cancel campus events, and manage seat capacities & waitlists.',
              },
              {
                to: '/admin/clubs',
                icon: Award,
                bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
                title: 'Clubs & Memberships',
                desc: 'Register verified official university clubs, assign managers, and review applications.',
              },
              {
                to: '/admin/students',
                icon: Users,
                bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
                title: 'Student Directory & Roles',
                desc: 'Search registered student records, inspect departments, and manage permissions.',
              },
              {
                to: '/admin/notices',
                icon: Bell,
                bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
                title: 'Official Notice Management',
                desc: 'Publish circulars, pin emergency notices, and attach PDF documentation.',
              },
              {
                to: '/admin/academic',
                icon: CalendarDays,
                bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                title: 'Academic Schedules & Exams',
                desc: 'Configure weekly class timetables, rooms, and midterm examination dates.',
              },
              {
                to: '/admin/lost-found',
                icon: Search,
                bg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400',
                title: 'Lost & Found Moderation',
                desc: 'Review and approve claim requests, verify claimant proof, or remove resolved items.',
              },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-4 group"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${mod.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Right Column: Audit Activity Log */}
        <section className="jstu-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Campus Activity Log</span>
            </h2>
            <span className="text-[13px] text-slate-500 dark:text-slate-400 font-mono">Audit</span>
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {activities.slice(0, 8).map((act) => (
              <div key={act.id} className="py-3.5 first:pt-2 last:pb-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {act.userName}
                  </span>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                  {act.action}{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    &quot;{act.target}&quot;
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
