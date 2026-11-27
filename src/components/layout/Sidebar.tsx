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
  Users,
  ShoppingBag,
  BookCopy,
  CalendarHeart,
  Award,
  MessageSquare,
  Globe,
  BellRing,
  FlaskConical,
  Bus,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      group: 'Overview',
      items: [
        { label: 'Student Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Global Search', path: '/search', icon: Globe },
        { label: 'Notifications', path: '/notifications', icon: BellRing },
      ],
    },
    {
      group: 'Academic Portal',
      items: [
        { label: 'Class Routine', path: '/academic/routine', icon: CalendarDays },
        { label: 'Exam Schedule', path: '/academic/exams', icon: FileCheck2 },
        { label: 'Assignment Tracker', path: '/academic/assignments', icon: CheckSquare },
        { label: 'Study Resources', path: '/resources', icon: BookOpen },
        { label: 'My Lab', path: '/mylab', icon: FlaskConical },
      ],
    },
    {
      group: 'Campus Community',
      items: [
        { label: 'Student Community', path: '/community', icon: Users },
        { label: 'Campus Events', path: '/events', icon: CalendarHeart },
        { label: 'Student Clubs', path: '/clubs', icon: Award },
        { label: 'Messages', path: '/messages', icon: MessageSquare },
      ],
    },
    {
      group: 'Campus Services',
      items: [
        { label: 'Transportation', path: '/transportation', icon: Bus },
        { label: 'Notice Board', path: '/notices', icon: Bell },
        { label: 'Lost & Found', path: '/lost-found', icon: Search },
        { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
        { label: 'Book Exchange', path: '/books', icon: BookCopy },
      ],
    },
    {
      group: 'Account',
      items: [
        { label: 'Student Profile', path: '/profile', icon: User },
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[272px] shrink-0 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
            JSTU Campus
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3.5 text-[12px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">
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
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-semibold border border-blue-200/70 dark:border-blue-400/20'
                          : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            JSTU Campus
          </p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Student Ecosystem
          </p>
        </div>
      </aside>
    </>
  );
};
