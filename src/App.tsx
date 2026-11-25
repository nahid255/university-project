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

// V2 Student Pages
import { CommunityPage } from './pages/student/CommunityPage';
import { MarketplacePage } from './pages/student/MarketplacePage';
import { BookExchangePage } from './pages/student/BookExchangePage';
import { EventsPage } from './pages/student/EventsPage';
import { ClubsPage } from './pages/student/ClubsPage';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { MessagesPage } from './pages/student/MessagesPage';
import { GlobalSearchPage } from './pages/student/GlobalSearchPage';
import { StudentPublicProfilePage } from './pages/student/StudentPublicProfilePage';

// V1 Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminNoticesPage } from './pages/admin/AdminNoticesPage';
import { AdminAcademicPage } from './pages/admin/AdminAcademicPage';
import { AdminLostFoundPage } from './pages/admin/AdminLostFoundPage';
import { AdminResourcesPage } from './pages/admin/AdminResourcesPage';

// V2 Admin Pages
import { AdminModerationPage } from './pages/admin/AdminModerationPage';
import { AdminMarketplacePage } from './pages/admin/AdminMarketplacePage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminClubsPage } from './pages/admin/AdminClubsPage';

// Not Found
import { NotFoundPage } from './pages/NotFoundPage';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner fullPage label="Authenticating student session..." />;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner fullPage label="Verifying administrator clearance..." />;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 ring-8 ring-rose-50 dark:ring-rose-950/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Administrative Clearance Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
          Your current account is registered with student permissions and is not authorized to access the campus administrative control panel.
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
  if (loading) return <LoadingSpinner fullPage label="Initializing CampusMate..." />;
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
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Student Protected Portal */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* V1 Student Routes (Preserved) */}
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

              {/* V2 Student Routes */}
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/books" element={<BookExchangePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/search" element={<GlobalSearchPage />} />
              <Route path="/students/:uid" element={<StudentPublicProfilePage />} />

              {/* V1 Admin Protected Console (Preserved) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <AdminRoute>
                    <AdminStudentsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/notices"
                element={
                  <AdminRoute>
                    <AdminNoticesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/academic"
                element={
                  <AdminRoute>
                    <AdminAcademicPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/lost-found"
                element={
                  <AdminRoute>
                    <AdminLostFoundPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/resources"
                element={
                  <AdminRoute>
                    <AdminResourcesPage />
                  </AdminRoute>
                }
              />

              {/* V2 Admin Protected Routes */}
              <Route
                path="/admin/moderation"
                element={
                  <AdminRoute>
                    <AdminModerationPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/marketplace"
                element={
                  <AdminRoute>
                    <AdminMarketplacePage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <AdminRoute>
                    <AdminEventsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/clubs"
                element={
                  <AdminRoute>
                    <AdminClubsPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
