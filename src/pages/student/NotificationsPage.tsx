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
    <div className="max-w-4xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="jstu-page-title flex items-center gap-3">
            <BellRing className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Notification Center</span>
          </h1>
          <p className="jstu-secondary mt-1.5">
            Stay updated on notices, community replies, marketplace inquiries, events, and club memberships
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="jstu-btn-primary self-start sm:self-auto tabular-nums"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors tabular-nums ${
            filter === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors tabular-nums ${
            filter === 'unread'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
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
        <div className="jstu-surface divide-y divide-slate-200/80 dark:divide-slate-800 overflow-hidden">
          {visible.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                !notif.isRead ? 'bg-blue-50/45 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                    !notif.isRead ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                      {notif.title}
                    </h2>
                    <Badge variant="neutral" size="sm">
                      {notif.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5 tabular-nums">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif)}
                    className="jstu-btn-secondary min-h-[38px] px-3.5 py-2 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark Read</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpen(notif)}
                  className="jstu-btn-primary min-h-[38px] px-4 py-2 text-sm"
                >
                  <span>Open</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
