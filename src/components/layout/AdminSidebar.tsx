import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  CalendarDays,
  Search,
  BookOpen,
  ShieldCheck,
  Flag,
  ShoppingBag,
  CalendarHeart,
  Award,
  Bus,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const adminGroups = [
    {
      title: 'Core Management',
      links: [
        { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Student Directory', path: '/admin/students', icon: Users },
        { label: 'Transportation', path: '/admin/transportation', icon: Bus },
        { label: 'Notice Management', path: '/admin/notices', icon: Bell },
        { label: 'Academic Schedules', path: '/admin/academic', icon: CalendarDays },
        { label: 'Lost & Found / Claims', path: '/admin/lost-found', icon: Search },
        { label: 'Resource Moderation', path: '/admin/resources', icon: BookOpen },
      ],
    },
    {
      title: 'Moderation & Services',
      links: [
        { label: 'Community & Reports', path: '/admin/moderation', icon: Flag },
        { label: 'Marketplace & Books', path: '/admin/marketplace', icon: ShoppingBag },
        { label: 'Events & Registrations', path: '/admin/events', icon: CalendarHeart },
        { label: 'Clubs & Memberships', path: '/admin/clubs', icon: Award },
      ],
    },
  ];

  const handleSignOut = async () => {
    onClose();
    await logout();
    navigate('/admin/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[272px] shrink-0 bg-[#0F172A] text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-0.5">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">JSTU Campus</span>
            </div>
            <p className="text-[13px] text-slate-400">
              University Administration
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close administration menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {adminGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3.5 text-[12px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
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
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-300 font-medium hover:bg-slate-800 hover:text-white'
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

        <div className="p-4 border-t border-slate-800 space-y-1.5">
          <NavLink
            to="/admin/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span>Preferences &amp; Theme</span>
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
