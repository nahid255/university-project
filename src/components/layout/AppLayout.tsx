import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AdminSidebar } from './AdminSidebar';
import { FirebaseStatusBanner } from '../common/FirebaseStatusBanner';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FF] dark:bg-[#080F1F] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Firebase Status & Diagnostics Bar */}
      <FirebaseStatusBanner />

      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isAdminArea={isAdminArea}
      />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex w-full">
        {isAdminArea ? (
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* University Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xs">
        <p>
          &copy; {new Date().getFullYear()} CampusMate &bull; University Student Management & Campus Community Ecosystem &bull; All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
