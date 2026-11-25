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
    if (!currentUser) return;
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
  }, [currentUser]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, location.pathname]);

  useEffect(() => {
    const onFocus = () => {
      refreshCounts();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshCounts]);

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111C32]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to={currentUser?.role === 'admin' && isAdminArea ? '/admin' : '/dashboard'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Campus<span className="text-blue-600 dark:text-blue-400">Mate</span>
                </span>
                {isAdminArea && (
                  <Badge variant="purple" size="sm">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide hidden sm:block">
                Your Entire Campus, Connected.
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Quick Global Search & Date */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-2">
          <form onSubmit={handleQuickSearch} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search notices, books, events, clubs, students..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </form>
          <span className="hidden xl:inline-flex text-[11px] font-medium text-slate-400 dark:text-slate-400 whitespace-nowrap">
            {todayFormatted}
          </span>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Global Search Shortcut */}
          <Link
            to="/search"
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Global Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Quick link to Switch Portals for Admins */}
          {currentUser?.role === 'admin' && (
            <Link
              to={isAdminArea ? '/dashboard' : '/admin'}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdminArea ? 'Student Portal' : 'Admin Console'}</span>
            </Link>
          )}

          {/* Student Messages Shortcut */}
          {currentUser && (
            <Link
              to="/messages"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Campus Messages"
              title="Messages"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </Link>
          )}

          {/* Notification Center Bell */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setDropdownOpen(false);
                }}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
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
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#111C32] shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Notifications
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {unreadNotifCount} unread updates
                        </p>
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          You are all caught up!
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-2.5 ${
                              !n.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                !n.isRead ? 'bg-blue-600' : 'bg-transparent'
                              }`}
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open Notification Center
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
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
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <img
                  src={sanitizeUrl(
                    currentUser.avatarUrl,
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      currentUser.fullName
                    )}`
                  )}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/20"
                />
                <div className="text-left hidden lg:block leading-tight">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400">
                    {currentUser.role === 'admin' ? 'Administrator' : currentUser.studentId}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111C32] p-2 shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1">
                        <Badge
                          variant={currentUser.role === 'admin' ? 'purple' : 'primary'}
                          size="sm"
                        >
                          {currentUser.role === 'admin' ? 'Campus Admin' : 'University Student'}
                        </Badge>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Student Profile</span>
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>Notification Center</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Preferences & Security</span>
                    </Link>

                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-500" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
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
