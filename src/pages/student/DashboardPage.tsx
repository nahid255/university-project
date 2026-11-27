import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  FileCheck2,
  CheckSquare,
  Bell,
  Search,
  BookOpen,
  PlusCircle,
  Clock,
  ArrowRight,
  MapPin,
  Users,
  CalendarHeart,
  ShoppingBag,
  BookCopy,
  Award,
  MessageSquare,
  SlidersHorizontal,
  BellRing,
  Heart,
  MessageCircle,
  FlaskConical,
  Bus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoutines, getExams, getAssignments, createAssignment } from '../../services/academicService';
import { getNotices } from '../../services/noticeService';
import { getPosts } from '../../services/communityService';
import { getEvents } from '../../services/eventService';
import { getMarketplaceListings } from '../../services/marketplaceService';
import { getNotifications } from '../../services/notificationService';
import {
  ClassRoutine,
  ExamSchedule,
  Assignment,
  Notice,
  DayOfWeek,
  CommunityPost,
  CampusEvent,
  MarketplaceListing,
  AppNotification,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

interface DashboardWidgetsConfig {
  showClasses: boolean;
  showExams: boolean;
  showAssignments: boolean;
  showNotices: boolean;
  showCommunity: boolean;
  showEvents: boolean;
  showMarketplace: boolean;
  showNotifications: boolean;
}

const DEFAULT_WIDGETS: DashboardWidgetsConfig = {
  showClasses: true,
  showExams: true,
  showAssignments: true,
  showNotices: true,
  showCommunity: true,
  showEvents: true,
  showMarketplace: true,
  showNotifications: true,
};

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CampusEvent[]>([]);
  const [marketplaceHighlights, setMarketplaceHighlights] = useState<MarketplaceListing[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [widgets, setWidgets] = useState<DashboardWidgetsConfig>(DEFAULT_WIDGETS);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('CSE 301');
  const [newCourseName, setNewCourseName] = useState('Algorithms & Complexity');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDescription, setNewDescription] = useState('');

  const daysMap: Record<number, DayOfWeek> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    0: 'Monday',
  };

  const currentDayOfWeek: DayOfWeek = daysMap[new Date().getDay()] || 'Monday';

  useEffect(() => {
    if (!currentUser) return;
    try {
      const saved = localStorage.getItem(`campusmate_dashboard_prefs_${currentUser.uid}`);
      if (saved) {
        setWidgets({ ...DEFAULT_WIDGETS, ...JSON.parse(saved) });
      }
    } catch {
      setWidgets(DEFAULT_WIDGETS);
    }
  }, [currentUser]);

  const toggleWidget = (key: keyof DashboardWidgetsConfig) => {
    setWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (currentUser) {
        localStorage.setItem(
          `campusmate_dashboard_prefs_${currentUser.uid}`,
          JSON.stringify(next)
        );
      }
      return next;
    });
  };

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [
        allRoutines,
        allExams,
        userAssignments,
        pubNotices,
        posts,
        events,
        listings,
        notifs,
      ] = await Promise.all([
        getRoutines(),
        getExams(),
        getAssignments(currentUser.uid),
        getNotices(false),
        getPosts({ limitCount: 4 }),
        getEvents(false),
        getMarketplaceListings(6),
        getNotifications(currentUser.uid, 5),
      ]);

      setRoutines(allRoutines);
      setExams(allExams);
      setAssignments(userAssignments);
      setNotices(pubNotices.slice(0, 4));
      setRecentPosts(posts.slice(0, 3));
      setUpcomingEvents(events.slice(0, 3));
      setMarketplaceHighlights(listings.filter((l) => l.status === 'Available').slice(0, 3));
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleQuickAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newDeadline) return;

    await createAssignment({
      userId: currentUser.uid,
      title: newTitle.trim(),
      courseCode: newCourseCode,
      courseName: newCourseName,
      deadline: newDeadline,
      priority: newPriority,
      status: 'pending',
      description: newDescription.trim() || 'Class assignment created via quick dashboard action.',
    });

    setIsAddAssignmentOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewDeadline('');
    await loadData();
  };

  if (loading) {
    return <LoadingSpinner label="Loading student dashboard..." fullPage={false} />;
  }

  const todayClasses = routines.filter((r) => r.dayOfWeek === currentDayOfWeek);
  const pendingAssignments = assignments.filter(
    (a) => a.status === 'pending' || a.status === 'in_progress'
  );
  const overdueAssignments = assignments.filter((a) => a.status === 'overdue');
  const upcomingExams = exams.slice(0, 3);
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const quickServices = [
    {
      to: '/transportation',
      icon: Bus,
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
      title: 'Transportation',
      sub: 'Bus routes & times',
    },
    {
      to: '/mylab',
      icon: FlaskConical,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      title: 'My Lab',
      sub: 'CS virtual lab',
    },
    {
      to: '/academic/routine',
      icon: CalendarDays,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      title: 'Class Routine',
      sub: 'Weekly timetable',
    },
    {
      to: '/academic/assignments',
      icon: CheckSquare,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      title: 'Assignments',
      sub: 'Deadlines & tasks',
    },
    {
      to: '/notices',
      icon: Bell,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      title: 'Notice Board',
      sub: 'Official circulars',
    },
    {
      to: '/resources',
      icon: BookOpen,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      title: 'Study Resources',
      sub: 'Notes & past papers',
    },
    {
      to: '/community',
      icon: Users,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      title: 'Community',
      sub: 'Discussions & Q&A',
    },
    {
      to: '/messages',
      icon: MessageSquare,
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400',
      title: 'Messages',
      sub: 'Peer direct chat',
    },
    {
      to: '/events',
      icon: CalendarHeart,
      iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400',
      title: 'Campus Events',
      sub: 'RSVP & workshops',
    },
    {
      to: '/clubs',
      icon: Award,
      iconBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400',
      title: 'Student Clubs',
      sub: 'Campus societies',
    },
    {
      to: '/marketplace',
      icon: ShoppingBag,
      iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
      title: 'Marketplace',
      sub: 'Student buy & sell',
    },
    {
      to: '/books',
      icon: BookCopy,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      title: 'Book Exchange',
      sub: 'Trade textbooks',
    },
    {
      to: '/lost-found',
      icon: Search,
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
      title: 'Lost & Found',
      sub: 'Report & claim',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Clean Institutional Welcome Header */}
      <section className="jstu-surface p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {formattedDate}
            </p>
            <h1 className="jstu-page-title">
              Welcome back, {currentUser?.fullName}
            </h1>
            <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentUser?.department} &middot;{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {currentUser?.studentId}
              </span>{' '}
              &middot; {currentUser?.batch}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddAssignmentOpen(true)}
              className="jstu-btn-primary"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
            <Link to="/academic/routine" className="jstu-btn-secondary">
              <CalendarDays className="w-4 h-4" />
              <span>View Routine</span>
            </Link>
            <Link to="/mylab" className="jstu-btn-secondary">
              <FlaskConical className="w-4 h-4" />
              <span>Open My Lab</span>
            </Link>
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="jstu-btn-secondary"
              aria-label="Customize dashboard widgets"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Customize</span>
            </button>
          </div>
        </div>
      </section>

      {/* Overview KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="jstu-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Today&apos;s Classes
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {todayClasses.length}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {currentDayOfWeek} Schedule
          </p>
        </div>

        <div className="jstu-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Pending Tasks
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {pendingAssignments.length}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {overdueAssignments.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                {overdueAssignments.length} overdue
              </span>
            ) : (
              'All on schedule'
            )}
          </p>
        </div>

        <div className="jstu-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Upcoming Events
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CalendarHeart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {upcomingEvents.length}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Campus events open
          </p>
        </div>

        <div className="jstu-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Unread Alerts
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
            {unreadNotifCount}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Notifications &amp; replies
          </p>
        </div>
      </section>

      {/* Clean Campus Services Directory */}
      <section className="jstu-surface p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="jstu-section-title">Campus Services &amp; Tools</h2>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">
              Direct shortcuts across academics, transport, labs, and community
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {quickServices.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate">
                    {item.sub}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-7">
          {widgets.showClasses && (
            <section className="jstu-surface p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h2 className="jstu-section-title flex items-center gap-2.5">
                    <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Today&apos;s Classes ({currentDayOfWeek})</span>
                  </h2>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
                    Your scheduled lectures and laboratory sessions
                  </p>
                </div>
                <Link
                  to="/academic/routine"
                  className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Full Timetable</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {todayClasses.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-[15px]">
                  No classes scheduled for today. Enjoy your independent study time.
                </div>
              ) : (
                <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {todayClasses.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-5 last:pb-1 gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200/70 dark:border-blue-800/70">
                            {item.courseCode}
                          </span>
                          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                            {item.courseName}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Instructor: <span className="font-medium text-slate-800 dark:text-slate-200">{item.instructorName}</span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                        <div className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          <Clock className="w-4 h-4" />
                          <span>
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{item.roomNumber}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {widgets.showExams && (
            <section className="jstu-surface p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-5">
                <div>
                  <h2 className="jstu-section-title flex items-center gap-2.5">
                    <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Upcoming Examination Schedule</span>
                  </h2>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
                    Midterm and final examination dates and venues
                  </p>
                </div>
                <Link
                  to="/academic/exams"
                  className="text-[15px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>All Exams</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="jstu-inset p-4 sm:p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {exam.courseCode}
                      </span>
                      <Badge variant="purple" size="sm">
                        {exam.examType}
                      </Badge>
                    </div>
                    <h3
                      className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug"
                      title={exam.courseName}
                    >
                      {exam.courseName}
                    </h3>
                    <div className="pt-1 text-sm text-slate-600 dark:text-slate-400 space-y-1 tabular-nums">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(exam.examDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        {exam.startTime} &middot; {exam.roomNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {widgets.showCommunity && (
            <section className="jstu-surface p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="jstu-section-title flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Recent Community Discussions</span>
                </h2>
                <Link
                  to="/community"
                  className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Explore Feed</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <p className="text-[15px] text-slate-500 dark:text-slate-400 text-center py-8">
                  No community posts yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      to="/community"
                      className="block py-4 first:pt-5 last:pb-1 group space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {post.category}
                        </span>
                        <span className="tabular-nums">
                          {post.authorName} &middot; {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-500" /> {post.likesCount}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-blue-500" /> {post.commentsCount}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {widgets.showMarketplace && (
            <section className="jstu-surface p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-5">
                <h2 className="jstu-section-title flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Marketplace Highlights</span>
                </h2>
                <Link
                  to="/marketplace"
                  className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Browse All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {marketplaceHighlights.length === 0 ? (
                <p className="text-[15px] text-slate-500 dark:text-slate-400 text-center py-8">
                  No active listings right now.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {marketplaceHighlights.map((item) => (
                    <Link
                      key={item.id}
                      to="/marketplace"
                      className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                    >
                      {item.imageUrl && isSafeUrl(item.imageUrl) && (
                        <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <img
                            src={sanitizeUrl(item.imageUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            ${item.price}
                          </span>
                          <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                            {item.condition}
                          </span>
                        </div>
                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-7">
          {widgets.showNotifications && (
            <section className="jstu-surface p-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Notifications</span>
                </h2>
                <Link
                  to="/notifications"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-[15px] text-slate-500 dark:text-slate-400 text-center py-6">
                  All caught up!
                </p>
              ) : (
                <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {notifications.slice(0, 4).map((n) => (
                    <Link
                      key={n.id}
                      to={n.link && n.link.startsWith('/') ? n.link : '/notifications'}
                      className="block py-3.5 first:pt-4 last:pb-1 group"
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                            {n.title}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {widgets.showAssignments && (
            <section className="jstu-surface p-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                  <span>My Assignments</span>
                </h2>
                <Link
                  to="/academic/assignments"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>

              {assignments.length === 0 ? (
                <p className="text-[15px] text-slate-500 dark:text-slate-400 text-center py-6">
                  No assignments recorded yet. Click &quot;New Assignment&quot; to add one.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {assignments.slice(0, 4).map((asg) => {
                    const isOverdue = asg.status === 'overdue';
                    const isCompleted = asg.status === 'completed';

                    return (
                      <div key={asg.id} className="py-3.5 first:pt-4 last:pb-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {asg.title}
                          </span>
                          <Badge
                            variant={
                              isCompleted
                                ? 'success'
                                : isOverdue
                                ? 'danger'
                                : asg.priority === 'high'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {asg.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                          <span className="font-mono">{asg.courseCode}</span>
                          <span>Due {new Date(asg.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {widgets.showEvents && (
            <section className="jstu-surface p-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <CalendarHeart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Upcoming Events</span>
                </h2>
                <Link
                  to="/events"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  All Events
                </Link>
              </div>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {upcomingEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/events"
                    className="block py-3.5 first:pt-4 last:pb-1 group space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {ev.category}
                      </span>
                      <span className="tabular-nums">{new Date(ev.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                      {ev.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate tabular-nums">
                      {ev.location} &middot; {ev.registeredCount}/{ev.capacity} seats
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {widgets.showNotices && (
            <section className="jstu-surface p-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>University Notices</span>
                </h2>
                <Link
                  to="/notices"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Board
                </Link>
              </div>

              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {notices.map((n) => (
                  <Link
                    key={n.id}
                    to={`/notices/${n.id}`}
                    className="block py-3.5 first:pt-4 last:pb-1 group space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`font-semibold ${
                          n.category === 'Emergency'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {n.category}
                      </span>
                      {n.isPinned && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Pinned
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {n.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                      {new Date(n.publishedAt).toLocaleDateString()} &middot;{' '}
                      {n.department || 'Administration'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Customize Dashboard Modal */}
      <Modal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title="Customize Student Dashboard"
        description="Choose which campus widgets are displayed on your personal dashboard"
        maxWidth="md"
      >
        <div className="space-y-3">
          {[
            { key: 'showClasses', label: "Today's Classes Schedule" },
            { key: 'showExams', label: 'Upcoming Examination Schedule' },
            { key: 'showAssignments', label: 'My Assignment Deadlines' },
            { key: 'showNotices', label: 'Recent University Notices' },
            { key: 'showCommunity', label: 'Recent Community Posts' },
            { key: 'showEvents', label: 'Upcoming Campus Events' },
            { key: 'showMarketplace', label: 'Marketplace Highlights' },
            { key: 'showNotifications', label: 'Notification Overview' },
          ].map((item) => {
            const k = item.key as keyof DashboardWidgetsConfig;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer"
              >
                <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={widgets[k]}
                  onChange={() => toggleWidget(k)}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>
            );
          })}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setIsCustomizeOpen(false)}
              className="jstu-btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Add Assignment Modal */}
      <Modal
        isOpen={isAddAssignmentOpen}
        onClose={() => setIsAddAssignmentOpen(false)}
        title="Create Academic Assignment"
        description="Add a new assignment deadline to keep track of your coursework"
      >
        <form onSubmit={handleQuickAddAssignment} className="space-y-5">
          <div>
            <label className="jstu-label">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Graph Algorithms Implementation Report"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="jstu-label">
                Course Code
              </label>
              <input
                type="text"
                required
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="jstu-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">
              Course Name
            </label>
            <input
              type="text"
              required
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">
              Submission Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">
              Description &amp; Requirements
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Key deliverables, formatting requirements, file attachments to prepare..."
              className="jstu-textarea"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddAssignmentOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="jstu-btn-primary"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
