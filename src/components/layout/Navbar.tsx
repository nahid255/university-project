import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ShieldCheck,
  Menu,
  ChevronDown,
  Bell,
  Search,
  MessageSquare,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../common/Badge';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationService';
import { getUserConversations } from '../../services/messagingService';
import { AppNotification } from '../../types';
import { sanitizeUrl } from '../../utils/url';

interface NavbarProps {
  onToggleSidebar: () => void;
  isAdminArea?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isAdminArea = false }) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [quickSearch, setQuickSearch] = useState('');

  const refreshCounts = useCallback(async () => {
    if (!currentUser || isAdminArea || currentUser.role === 'admin') return;
    try {
      const [notifs, convs] = await Promise.all([
        getNotifications(currentUser.uid, 12),
        getUserConversations(currentUser.uid),
      ]);
      setNotifications(notifs);
      const msgUnread = convs.reduce(
        (sum, c) => sum + (c.unreadCounts?.[currentUser.uid] || 0),
        0
      );
      setUnreadMessagesCount(msgUnread);
    } catch (e) {
      console.warn('Navbar count refresh skipped:', e);
    }
  }, [currentUser, isAdminArea]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, location.pathname]);

  useEffect(() => {
    if (isAdminArea) return;
    const onFocus = () => {
      refreshCounts();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshCounts, isAdminArea]);

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate(isAdminArea ? '/admin/login' : '/login');
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickSearch.trim();
    if (!q) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuickSearch('');
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setNotifOpen(false);
    const target = notif.link && notif.link.startsWith('/') ? notif.link : '/notifications';
    navigate(target);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-[70px] flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to={isAdminArea ? '/admin' : '/dashboard'}
            className="flex items-center gap-3 group"
          >
            <div
              className={`w-10 h-10 rounded-xl text-white flex items-center justify-center transition-transform group-hover:scale-[1.03] ${
                isAdminArea ? 'bg-indigo-600' : 'bg-blue-600'
              }`}
            >
              {isAdminArea ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-tight text-slate-950 dark:text-white">
                  JSTU{' '}
                  <span
                    className={
                      isAdminArea
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }
                  >
                    Campus
                  </span>
                </span>
                {isAdminArea && (
                  <Badge variant="purple" size="sm">
                    Administration
                  </Badge>
                )}
              </div>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block leading-tight">
                {isAdminArea ? 'University Administration Portal' : 'Official Student Portal'}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Quick Global Search (Student Portal Only) & Date */}
        {!isAdminArea ? (
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-lg mx-2">
            <form onSubmit={handleQuickSearch} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search notices, books, events, clubs, buses..."
                className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl text-[15px] bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </form>
            <span className="hidden xl:inline-flex text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
              {todayFormatted}
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2.5 text-[15px] text-slate-600 dark:text-slate-300 font-medium">
            <span>JSTU Campus Operations</span>
            <span className="text-slate-400" aria-hidden="true">&middot;</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{todayFormatted}</span>
          </div>
        )}

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {!isAdminArea && (
            <>
              <Link
                to="/search"
                className="md:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Global Search"
              >
                <Search className="w-5 h-5" />
              </Link>

              {currentUser && (
                <Link
                  to="/messages"
                  className="relative min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Campus Messages"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center tabular-nums">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
              )}

              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setDropdownOpen(false);
                    }}
                    className="relative min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[12px] font-bold flex items-center justify-center tabular-nums">
                        {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setNotifOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 sm:w-[400px] rounded-2xl bg-white dark:bg-[#111827] shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                              Notifications
                            </h4>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {unreadNotifCount} unread updates
                            </p>
                          </div>
                          {unreadNotifCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <CheckCheck className="w-4 h-4" />
                              <span>Mark all read</span>
                            </button>
                          )}
                        </div>

                        <div className="max-h-88 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-[15px] text-slate-500 dark:text-slate-400">
                              You are all caught up!
                            </div>
                          ) : (
                            notifications.slice(0, 6).map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 ${
                                  !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/25' : ''
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                    !n.isRead ? 'bg-blue-600' : 'bg-transparent'
                                  }`}
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {n.title}
                                  </p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug">
                                    {n.message}
                                  </p>
                                  <p className="text-[13px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5 tabular-nums">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-center">
                          <Link
                            to="/notifications"
                            onClick={() => setNotifOpen(false)}
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Open Notification Center
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark/light theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* User Profile Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[42px]"
              >
                <img
                  src={sanitizeUrl(
                    currentUser.avatarUrl,
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      currentUser.fullName
                    )}`
                  )}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div className="text-left hidden lg:block leading-tight">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[140px] truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400 font-mono">
                    {currentUser.role === 'admin' ? 'Administration' : currentUser.studentId}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#111827] p-2 shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-3 border-b border-slate-200/80 dark:border-slate-800 mb-1.5">
                      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                      <div className="mt-2">
                        <Badge
                          variant={currentUser.role === 'admin' ? 'purple' : 'primary'}
                          size="sm"
                        >
                          {currentUser.role === 'admin' ? 'University Administration' : 'Student'}
                        </Badge>
                      </div>
                    </div>

                    {!isAdminArea ? (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Student Profile</span>
                        </Link>

                        <Link
                          to="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Notification Center</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Preferences &amp; Security</span>
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/admin/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Preferences &amp; Security</span>
                      </Link>
                    )}

                    <div className="my-1.5 border-t border-slate-200/80 dark:border-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
