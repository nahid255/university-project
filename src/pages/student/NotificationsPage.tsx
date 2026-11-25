import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CheckCheck,
  Check,
  Clock,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationService';
import { AppNotification } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const list = await getNotifications(currentUser.uid, 50);
      setNotifications(list);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleMarkRead = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleOpen = async (notif: AppNotification) => {
    await handleMarkRead(notif);
    const target = notif.link && notif.link.startsWith('/') ? notif.link : '/dashboard';
    navigate(target);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) {
    return <LoadingSpinner label="Loading notification center..." />;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stay updated on notices, community replies, marketplace inquiries, events, and club memberships
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            filter === 'unread'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="Important updates from your classes, clubs, events, and peer interactions will appear here."
        />
      ) : (
        <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
          {visible.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                !notif.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    !notif.isRead ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </h3>
                    <Badge variant="neutral" size="sm">
                      {notif.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Read</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpen(notif)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
