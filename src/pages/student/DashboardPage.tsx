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
  Sparkles,
  Users,
  CalendarHeart,
  ShoppingBag,
  BookCopy,
  Award,
  MessageSquare,
  Globe,
  SlidersHorizontal,
  BellRing,
  Heart,
  MessageCircle,
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

  // Customizable Widget Visibility
  const [widgets, setWidgets] = useState<DashboardWidgetsConfig>(DEFAULT_WIDGETS);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Quick Assignment Modal
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-lg shadow-blue-500/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              {currentUser?.department} &bull; Student ID:{' '}
              <span className="font-mono font-bold text-white">{currentUser?.studentId}</span>{' '}
              &bull; {currentUser?.batch}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddAssignmentOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
            <Link
              to="/academic/routine"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white text-xs font-bold backdrop-blur-sm border border-white/20 transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              <span>View Routine</span>
            </Link>
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-sm border border-white/20 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Overview KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Classes
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {todayClasses.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {currentDayOfWeek} Schedule
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {pendingAssignments.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {overdueAssignments.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {overdueAssignments.length} overdue
              </span>
            ) : (
              'All on schedule'
            )}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming Events
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CalendarHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {upcomingEvents.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Campus events open
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unread Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {unreadNotifCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Notifications &amp; replies
          </p>
        </div>
      </div>

      {/* Expanded Quick Access Hub */}
      <div className="bg-white dark:bg-[#111C32] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
          CampusMate Quick Access Hub
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              to: '/community',
              icon: Users,
              color: 'text-blue-600 dark:text-blue-400',
              title: 'Community',
              sub: 'Posts & Q&A',
            },
            {
              to: '/marketplace',
              icon: ShoppingBag,
              color: 'text-indigo-500',
              title: 'Marketplace',
              sub: 'Buy & sell gear',
            },
            {
              to: '/books',
              icon: BookCopy,
              color: 'text-emerald-500',
              title: 'Book Exchange',
              sub: 'Trade textbooks',
            },
            {
              to: '/events',
              icon: CalendarHeart,
              color: 'text-purple-500',
              title: 'Campus Events',
              sub: 'RSVP & workshops',
            },
            {
              to: '/clubs',
              icon: Award,
              color: 'text-amber-500',
              title: 'Student Clubs',
              sub: 'Organizations',
            },
            {
              to: '/messages',
              icon: MessageSquare,
              color: 'text-sky-500',
              title: 'Messages',
              sub: 'Peer 1-to-1 chat',
            },
            {
              to: '/academic/routine',
              icon: CalendarDays,
              color: 'text-blue-500',
              title: 'Class Routine',
              sub: 'Weekly timetable',
            },
            {
              to: '/academic/assignments',
              icon: CheckSquare,
              color: 'text-amber-600',
              title: 'Assignments',
              sub: 'Deadlines & tasks',
            },
            {
              to: '/notices',
              icon: Bell,
              color: 'text-emerald-600',
              title: 'Notice Board',
              sub: 'Official circulars',
            },
            {
              to: '/lost-found',
              icon: Search,
              color: 'text-rose-500',
              title: 'Lost & Found',
              sub: 'Report & claim',
            },
            {
              to: '/resources',
              icon: BookOpen,
              color: 'text-indigo-600',
              title: 'Resources',
              sub: 'Study notes',
            },
            {
              to: '/search',
              icon: Globe,
              color: 'text-cyan-500',
              title: 'Global Search',
              sub: 'Find anything',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-center transition-colors group"
              >
                <Icon
                  className={`w-5 h-5 ${item.color} mb-1.5 group-hover:scale-110 transition-transform`}
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-400">{item.sub}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {widgets.showClasses && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Today&apos;s Classes ({currentDayOfWeek})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your daily course lectures and laboratory sessions
                  </p>
                </div>
                <Link
                  to="/academic/routine"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Full Timetable</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {todayClasses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No classes scheduled for today! Enjoy your study or revision time.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {item.courseCode}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.courseName}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Instructor:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.instructorName}
                          </span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-600 dark:text-slate-300 gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
                        <div className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span>{item.roomNumber}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {widgets.showExams && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>Upcoming Examination Schedule</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Stay prepared for upcoming midterms and finals
                  </p>
                </div>
                <Link
                  to="/academic/exams"
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>All Exams</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900/60 dark:to-purple-950/20 border border-slate-200/70 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        {exam.courseCode}
                      </span>
                      <Badge variant="purple" size="sm">
                        {exam.examType}
                      </Badge>
                    </div>
                    <h4
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                      title={exam.courseName}
                    >
                      {exam.courseName}
                    </h4>
                    <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(exam.examDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        {exam.startTime} &bull; {exam.roomNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* V2: Recent Community Posts */}
          {widgets.showCommunity && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Recent Community Discussions</span>
                </h3>
                <Link
                  to="/community"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Explore Feed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No community posts yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      to="/community"
                      className="block p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="primary" size="sm">
                          {post.category}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {post.authorName} &bull; {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500" /> {post.likesCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-blue-500" /> {post.commentsCount}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* V2: Marketplace Highlights */}
          {widgets.showMarketplace && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-500" />
                  <span>Marketplace Highlights</span>
                </h3>
                <Link
                  to="/marketplace"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Browse All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {marketplaceHighlights.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No active listings right now.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {marketplaceHighlights.map((item) => (
                    <Link
                      key={item.id}
                      to="/marketplace"
                      className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 transition-all group"
                    >
                      {item.imageUrl && isSafeUrl(item.imageUrl) && (
                        <div className="h-24 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <img
                            src={sanitizeUrl(item.imageUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            ${item.price}
                          </span>
                          <Badge variant="info" size="sm">
                            {item.condition}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {widgets.showNotifications && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-blue-600" />
                  <span>Notification Overview</span>
                </h3>
                <Link
                  to="/notifications"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  All caught up!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.slice(0, 4).map((n) => (
                    <Link
                      key={n.id}
                      to={n.link && n.link.startsWith('/') ? n.link : '/notifications'}
                      className={`block p-3 rounded-xl border transition-colors ${
                        !n.isRead
                          ? 'bg-blue-50/50 dark:bg-blue-950/25 border-blue-200/70 dark:border-blue-900/50'
                          : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {n.message}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {widgets.showAssignments && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                  <span>My Assignments</span>
                </h3>
                <Link
                  to="/academic/assignments"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>

              {assignments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No assignments recorded yet. Click &quot;New Assignment&quot; to add one!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {assignments.slice(0, 4).map((asg) => {
                    const isOverdue = asg.status === 'overdue';
                    const isCompleted = asg.status === 'completed';

                    return (
                      <div
                        key={asg.id}
                        className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
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
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{asg.courseCode}</span>
                          <span>Due: {new Date(asg.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {widgets.showEvents && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarHeart className="w-5 h-5 text-purple-600" />
                  <span>Upcoming Campus Events</span>
                </h3>
                <Link
                  to="/events"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  All Events
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/events"
                    className="block p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="purple" size="sm">
                        {ev.category}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ev.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {ev.location} &bull; {ev.registeredCount}/{ev.capacity} seats
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {widgets.showNotices && (
            <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <span>Recent University Notices</span>
                </h3>
                <Link
                  to="/notices"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Board
                </Link>
              </div>

              <div className="space-y-3">
                {notices.map((n) => (
                  <Link
                    key={n.id}
                    to={`/notices/${n.id}`}
                    className="block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={n.category === 'Emergency' ? 'danger' : 'info'} size="sm">
                        {n.category}
                      </Badge>
                      {n.isPinned && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          PINNED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {n.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.publishedAt).toLocaleDateString()} &bull;{' '}
                      {n.department || 'Administration'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customize Dashboard Modal */}
      <Modal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title="Customize Student Dashboard"
        description="Choose which campus widgets are displayed on your personal dashboard"
        maxWidth="sm"
      >
        <div className="space-y-2.5">
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
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={widgets[k]}
                  onChange={() => toggleWidget(k)}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>
            );
          })}
          <div className="pt-3 flex justify-end">
            <button
              onClick={() => setIsCustomizeOpen(false)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
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
        <form onSubmit={handleQuickAddAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Graph Algorithms Implementation Report"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course Name
            </label>
            <input
              type="text"
              required
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Submission Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description &amp; Requirements
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Key deliverables, formatting requirements, file attachments to prepare..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddAssignmentOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
