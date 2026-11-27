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
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors">
      <FirebaseStatusBanner />

      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isAdminArea={isAdminArea}
      />

      <div className="flex-1 flex w-full">
        {isAdminArea ? (
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 max-w-[1360px] mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-5 px-6 text-center text-sm text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-[#111827]/70">
        <p>
          &copy; {new Date().getFullYear()} JSTU Campus &middot; Official University Administration &amp; Student Ecosystem &middot; All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
