import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  FileCheck2,
  CheckSquare,
  Bell,
  Search,
  BookOpen,
  User,
  Settings,
  ShieldCheck,
  Compass,
  Users,
  ShoppingBag,
  BookCopy,
  CalendarHeart,
  Award,
  MessageSquare,
  Globe,
  BellRing,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();

  const navItems = [
    {
      group: 'MAIN MENU',
      items: [
        { label: 'Student Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Global Search', path: '/search', icon: Globe },
        { label: 'Notifications', path: '/notifications', icon: BellRing },
      ],
    },
    {
      group: 'ACADEMIC PORTAL',
      items: [
        { label: 'Class Routine', path: '/academic/routine', icon: CalendarDays },
        { label: 'Exam Schedule', path: '/academic/exams', icon: FileCheck2 },
        { label: 'Assignment Tracker', path: '/academic/assignments', icon: CheckSquare },
        { label: 'Study Resources', path: '/resources', icon: BookOpen },
      ],
    },
    {
      group: 'CAMPUS COMMUNITY',
      items: [
        { label: 'Student Community', path: '/community', icon: Users },
        { label: 'Campus Events', path: '/events', icon: CalendarHeart },
        { label: 'Student Clubs', path: '/clubs', icon: Award },
        { label: 'Messages', path: '/messages', icon: MessageSquare },
      ],
    },
    {
      group: 'CAMPUS EXCHANGE',
      items: [
        { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
        { label: 'Book Exchange', path: '/books', icon: BookCopy },
        { label: 'Notice Board', path: '/notices', icon: Bell },
        { label: 'Lost & Found', path: '/lost-found', icon: Search },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { label: 'Student Profile', path: '/profile', icon: User },
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#0c1527] border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase mb-1">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Admin Switcher Card if user has Admin role */}
          {currentUser?.role === 'admin' && (
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900/10 to-indigo-900/10 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200/60 dark:border-purple-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Admin Privileges
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-snug">
                  You have administrative clearance to moderate content and manage campus modules.
                </p>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Open Admin Console</span>
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* University Badge Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            University Portal
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-400">
            CampusMate v2.0 Production
          </p>
        </div>
      </aside>
    </>
  );
};
