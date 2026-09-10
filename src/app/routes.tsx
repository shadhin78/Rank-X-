import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { LoadingState } from './LoadingState';
import { NotFoundPage } from './NotFoundPage';

// Lazy-loaded route components for high performance code splitting
const LoginPage = lazy(() =>
  import('@/src/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/src/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
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

export const appRouteList = [
  { path: '/login', component: LoginPage, publicOnly: true },
  { path: '/register', component: RegisterPage, publicOnly: true },
  { path: '/dashboard', component: DashboardPage },
  { path: '/programs', component: ProgramsPage },
  { path: '/habits', component: HabitsPage },
  { path: '/leaderboard', component: LeaderboardPage },
  { path: '/profile', component: ProfilePage },
  { path: '/settings', component: SettingsPage },
  { path: '/admin', component: AdminOverviewPage },
  { path: '/admin/users', component: AdminUsersPage },
  { path: '/admin/approvals', component: AdminApprovalsPage },
  { path: '/admin/activity', component: AdminActivityPage },
];
