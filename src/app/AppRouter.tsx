import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/src/components/layout';
import { LoadingState } from './LoadingState';
import { NotFoundPage } from './NotFoundPage';
import { useAppStore } from '@/src/store';

// Lazy load feature components for performance and code splitting
const LoginPage = lazy(() =>
  import('@/src/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/src/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const PendingApprovalPage = lazy(() =>
  import('@/src/features/auth/PendingApprovalPage').then((m) => ({
    default: m.PendingApprovalPage,
  }))
);
const BannedAccountPage = lazy(() =>
  import('@/src/features/auth/BannedAccountPage').then((m) => ({
    default: m.BannedAccountPage,
  }))
);

const DashboardPage = lazy(() =>
  import('@/src/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ProgramsPage = lazy(() =>
  import('@/src/features/programs/ProgramsPage').then((m) => ({ default: m.ProgramsPage }))
);
const HabitsPage = lazy(() =>
  import('@/src/features/habits/HabitsPage').then((m) => ({ default: m.HabitsPage }))
);
const LeaderboardPage = lazy(() =>
  import('@/src/features/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const ProfilePage = lazy(() =>
  import('@/src/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const SettingsPage = lazy(() =>
  import('@/src/features/profile/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AdminOverviewPage = lazy(() =>
  import('@/src/features/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);
const AdminUsersPage = lazy(() =>
  import('@/src/features/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
);
const AdminApprovalsPage = lazy(() =>
  import('@/src/features/admin/AdminApprovalsPage').then((m) => ({ default: m.AdminApprovalsPage }))
);
const AdminActivityPage = lazy(() =>
  import('@/src/features/admin/AdminActivityPage').then((m) => ({ default: m.AdminActivityPage }))
);
const AdminLeaderboardPage = lazy(() =>
  import('@/src/features/admin/AdminLeaderboardPage').then((m) => ({ default: m.AdminLeaderboardPage }))
);

/**
 * Route guard for authenticated, approved users only.
 * Redirects unauthenticated users to /login.
 * Redirects pending users to /pending-approval.
 * Redirects banned users to /banned.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.accountStatus === 'banned') {
    return <Navigate to="/banned" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

/**
 * Route guard for administrators only.
 * Prevents access through manually typing an admin URL.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.accountStatus === 'banned') {
    return <Navigate to="/banned" replace />;
  }

  if (currentUser.role !== 'admin') {
    // Strictly prevent access through manually typing an admin URL
    return <Navigate to="/dashboard" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

/**
 * Route guard for public auth pages (login, register).
 * Redirects already authenticated and approved users to /dashboard.
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);

  if (currentUser) {
    if (currentUser.accountStatus === 'approved') {
      return <Navigate to="/dashboard" replace />;
    }
    if (currentUser.accountStatus === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    if (currentUser.accountStatus === 'banned') {
      return <Navigate to="/banned" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Guard for pending approval screen
 */
function PendingApprovalRoute() {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  if (currentUser.accountStatus === 'banned') {
    return <Navigate to="/banned" replace />;
  }

  return <PendingApprovalPage />;
}

/**
 * Guard for banned account screen
 */
function BannedRoute() {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.accountStatus === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  if (currentUser.accountStatus === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <BannedAccountPage />;
}

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <LoadingState />
        </div>
      }
    >
      <Routes>
        {/* Default route redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Authentication Pages */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4">
                <LoginPage />
              </div>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4">
                <RegisterPage />
              </div>
            </PublicOnlyRoute>
          }
        />

        {/* Account Status Interstitials */}
        <Route path="/pending-approval" element={<PendingApprovalRoute />} />
        <Route path="/banned" element={<BannedRoute />} />

        {/* Protected Member Pages (Only accessible to approved users) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs/:programId"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <HabitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Restricted Routes (Requires role: 'admin' and status: 'approved') */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminOverviewPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <AdminRoute>
              <AdminApprovalsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/leaderboard"
          element={
            <AdminRoute>
              <AdminLeaderboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <AdminRoute>
              <AdminActivityPage />
            </AdminRoute>
          }
        />

        {/* 404 Fallback Route */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <NotFoundPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
