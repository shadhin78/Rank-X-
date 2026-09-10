import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Trophy,
  BarChart2,
  Menu,
  X,
  User,
  Settings,
  ShieldAlert,
  Users,
  UserCheck,
  Activity,
  Flame,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '@/src/store';
import { cn } from '@/src/lib/utils';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { Badge } from '@/src/components/ui/badge';
import { getFirebaseStatus } from '@/src/lib/firebase';

const PRIMARY_MOBILE_TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/programs', label: 'Programs', icon: BookOpen },
  { href: '/habits', label: 'Habits', icon: CheckCircle2 },
  { href: '/leaderboard', label: 'Rank', icon: Trophy, badge: 'Live' },
];

export function MobileNav() {
  const location = useLocation();
  const mobileNavOpen = useAppStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen);
  const currentUser = useAppStore((state) => state.currentUser);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const toggleAdminMode = useAppStore((state) => state.toggleAdminMode);

  const fbStatus = getFirebaseStatus();

  return (
    <>
      {/* 1. Primary Bottom Tab Bar (Visible on mobile only < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-zinc-200/90 bg-white/95 px-2 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 md:hidden"
      >
        {PRIMARY_MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === '/dashboard'
              ? location.pathname === '/dashboard' || location.pathname === '/'
              : location.pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              to={tab.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-1 min-h-[44px] min-w-[44px] text-xs font-medium transition-colors relative',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </div>
              <span className="mt-1 text-[11px] leading-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* More Tab / Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-1 min-h-[44px] min-w-[44px] text-xs font-medium transition-colors',
            mobileNavOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          )}
          aria-label="Open more options"
        >
          <Menu className="h-5 w-5" />
          <span className="mt-1 text-[11px] leading-tight">More</span>
        </button>
      </nav>

      {/* 2. Slide-out Drawer Sheet for Secondary Navigation */}
      {mobileNavOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto flex h-full w-4/5 max-w-sm flex-col bg-white p-5 shadow-2xl transition-transform dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                  StudyRank
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] min-w-[44px]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Profile Snapshot */}
            {currentUser && (
              <div className="my-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs">
                    AR
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {currentUser.displayName}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center text-amber-600 dark:text-amber-400">
                        <Flame className="h-3 w-3 mr-0.5" />
                        {currentUser.streak ?? 0}d streak
                      </span>
                      <span>•</span>
                      <span>{currentUser.totalPoints ?? 0} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Analytics & Progress
                </p>
                <Link
                  to="/analytics"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <BarChart2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Progress Analytics</span>
                </Link>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Account
                </p>
                <Link
                  to="/profile"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Administration
                  </p>
                  <button
                    type="button"
                    onClick={toggleAdminMode}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400"
                  >
                    {isAdmin ? 'Admin ON' : 'Toggle Preview'}
                  </button>
                </div>
                <Link
                  to="/admin"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <Users className="h-4 w-4" />
                  <span>Users Directory</span>
                </Link>
                <Link
                  to="/admin/approvals"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4" />
                    <span>Approvals</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    3
                  </Badge>
                </Link>
                <Link
                  to="/admin/activity"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <Activity className="h-4 w-4" />
                  <span>Audit Activity</span>
                </Link>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Authentication
                </p>
                <Link
                  to="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  <span>Register Account</span>
                </Link>
              </div>
            </div>

            {/* Footer with Firebase Status indicator */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                Firebase SDK Ready
              </span>
              <span className="font-mono text-[10px]">{fbStatus.projectId}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
