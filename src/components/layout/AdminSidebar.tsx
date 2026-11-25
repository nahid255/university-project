import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  CalendarDays,
  Search,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Flag,
  ShoppingBag,
  CalendarHeart,
  Award,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const adminGroups = [
    {
      title: 'CORE MANAGEMENT',
      links: [
        { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Student Directory', path: '/admin/students', icon: Users },
        { label: 'Notice Management', path: '/admin/notices', icon: Bell },
        { label: 'Academic Schedules', path: '/admin/academic', icon: CalendarDays },
        { label: 'Lost & Found / Claims', path: '/admin/lost-found', icon: Search },
        { label: 'Resource Moderation', path: '/admin/resources', icon: BookOpen },
      ],
    },
    {
      title: 'V2 CAMPUS MODERATION',
      links: [
        { label: 'Community & Reports', path: '/admin/moderation', icon: Flag },
        { label: 'Marketplace & Books', path: '/admin/marketplace', icon: ShoppingBag },
        { label: 'Events & Registrations', path: '/admin/events', icon: CalendarHeart },
        { label: 'Clubs & Memberships', path: '/admin/clubs', icon: Award },
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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Administration</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Control Center & Moderation
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {adminGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                {group.title}
              </p>
              {group.links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to Student View</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
