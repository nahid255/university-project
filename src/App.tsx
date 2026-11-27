import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// V1 Student Pages
import { DashboardPage } from './pages/student/DashboardPage';
import { RoutinePage } from './pages/student/RoutinePage';
import { ExamsPage } from './pages/student/ExamsPage';
import { AssignmentsPage } from './pages/student/AssignmentsPage';
import { NoticesPage } from './pages/student/NoticesPage';
import { NoticeDetailPage } from './pages/student/NoticeDetailPage';
import { LostFoundPage } from './pages/student/LostFoundPage';
import { LostFoundDetailPage } from './pages/student/LostFoundDetailPage';
import { ResourcesPage } from './pages/student/ResourcesPage';
import { ResourceDetailPage } from './pages/student/ResourceDetailPage';
import { ProfilePage } from './pages/student/ProfilePage';
import { SettingsPage } from './pages/student/SettingsPage';

// V2 & Transportation Student Pages
import { CommunityPage } from './pages/student/CommunityPage';
import { MarketplacePage } from './pages/student/MarketplacePage';
import { BookExchangePage } from './pages/student/BookExchangePage';
import { EventsPage } from './pages/student/EventsPage';
import { ClubsPage } from './pages/student/ClubsPage';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { MessagesPage } from './pages/student/MessagesPage';
import { GlobalSearchPage } from './pages/student/GlobalSearchPage';
import { StudentPublicProfilePage } from './pages/student/StudentPublicProfilePage';
import { MyLabDashboardPage } from './pages/student/MyLabDashboardPage';
import { MyLabExperimentPage } from './pages/student/MyLabExperimentPage';
import { TransportationPage } from './pages/student/TransportationPage';

// V1 Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminNoticesPage } from './pages/admin/AdminNoticesPage';
import { AdminAcademicPage } from './pages/admin/AdminAcademicPage';
import { AdminLostFoundPage } from './pages/admin/AdminLostFoundPage';
import { AdminResourcesPage } from './pages/admin/AdminResourcesPage';

// V2 & Transportation Admin Pages
import { AdminModerationPage } from './pages/admin/AdminModerationPage';
import { AdminMarketplacePage } from './pages/admin/AdminMarketplacePage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminClubsPage } from './pages/admin/AdminClubsPage';
import { AdminTransportationPage } from './pages/admin/AdminTransportationPage';

// Not Found
import { NotFoundPage } from './pages/NotFoundPage';

// Strict Student Route Guard
const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner fullPage label="Authenticating student session..." />;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

// Strict University Administration Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner fullPage label="Verifying University Administration clearance..." />;
  }
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F5F8FF] dark:bg-[#080F1F]">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 ring-8 ring-rose-50 dark:ring-rose-950/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          University Administration Clearance Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
          Your account has Student access only and is not authorized to access the JSTU Campus University Administration portal.
        </p>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          Return to Student Dashboard
        </Link>
      </div>
    );
  }
  return <>{children}</>;
};

// Root index redirect based on auth status
const RootRedirect: React.FC = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage label="Initializing JSTU Campus..." />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Portals */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Dedicated Student Portal */}
            <Route
              element={
                <StudentRoute>
                  <AppLayout />
                </StudentRoute>
              }
            >
              {/* V1 Student Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/academic/routine" element={<RoutinePage />} />
              <Route path="/academic/exams" element={<ExamsPage />} />
              <Route path="/academic/assignments" element={<AssignmentsPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/notices/:id" element={<NoticeDetailPage />} />
              <Route path="/lost-found" element={<LostFoundPage />} />
              <Route path="/lost-found/:id" element={<LostFoundDetailPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:id" element={<ResourceDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* V2, My Lab & Transportation Student Routes */}
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/books" element={<BookExchangePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/search" element={<GlobalSearchPage />} />
              <Route path="/students/:uid" element={<StudentPublicProfilePage />} />
              <Route path="/mylab" element={<MyLabDashboardPage />} />
              <Route path="/mylab/:experimentId" element={<MyLabExperimentPage />} />
              <Route path="/transportation" element={<TransportationPage />} />
            </Route>

            {/* Dedicated University Administration Portal */}
            <Route
              element={
                <AdminRoute>
                  <AppLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/students" element={<AdminStudentsPage />} />
              <Route path="/admin/transportation" element={<AdminTransportationPage />} />
              <Route path="/admin/notices" element={<AdminNoticesPage />} />
              <Route path="/admin/academic" element={<AdminAcademicPage />} />
              <Route path="/admin/lost-found" element={<AdminLostFoundPage />} />
              <Route path="/admin/resources" element={<AdminResourcesPage />} />
              <Route path="/admin/moderation" element={<AdminModerationPage />} />
              <Route path="/admin/marketplace" element={<AdminMarketplacePage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/clubs" element={<AdminClubsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
