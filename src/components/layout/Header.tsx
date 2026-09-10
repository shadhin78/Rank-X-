import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  CheckCircle,
  Sparkles,
  User,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '@/src/store';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { Button } from '@/src/components/ui/button';
import { getFirebaseStatus } from '@/src/lib/firebase';

export function Header() {
  const location = useLocation();
  const toggleMobileNav = useAppStore((state) => state.toggleMobileNav);
  const currentUser = useAppStore((state) => state.currentUser);
  const fbStatus = getFirebaseStatus();

  // Determine friendly location title
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/programs')) return 'Study Programs';
    if (path.startsWith('/habits')) return 'Daily Habits';
    if (path.startsWith('/leaderboard')) return 'Leaderboard';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/settings')) return 'Settings';
    if (path === '/admin') return 'Admin Overview';
    if (path.startsWith('/admin/users')) return 'Admin / Users';
    if (path.startsWith('/admin/approvals')) return 'Admin / Approvals';
    if (path.startsWith('/admin/activity')) return 'Admin / Activity';
    if (path === '/login') return 'Authentication / Login';
    if (path === '/register') return 'Authentication / Register';
    return 'StudyRank';
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6 lg:px-8">
      {/* Left section: Mobile hamburger + breadcrumb title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden min-h-[44px] min-w-[44px]"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile brand mark */}
        <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
            StudyRank
          </span>
        </Link>

        {/* Desktop breadcrumb current section */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-zinc-400 dark:text-zinc-500">Workspace</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Center Search Input (Placeholder for global quick navigation) */}
      <div className="hidden lg:flex items-center max-w-xs w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Quick search subjects, habits, friends..."
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-colors"
            readOnly
          />
        </div>
      </div>

      {/* Right controls: Firebase status, theme toggle, notifications, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Firebase Live Status Indicator */}
        <div
          title={`Firebase initialized for project: ${fbStatus.projectId}`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px]">Firebase</span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications Icon Button */}
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="View notifications"
          className="relative text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
        </Button>

        {/* Quick User Avatar / Link & Logout */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 p-0.5"
              aria-label="View user profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-xs dark:bg-indigo-500">
                {(currentUser.displayName || currentUser.username || 'U')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            </Link>
            <button
              type="button"
              onClick={async () => {
                const { authService } = await import('@/src/services/authService');
                await authService.logout();
                useAppStore.getState().setCurrentUser(null);
                window.location.href = '/login';
              }}
              className="hidden sm:flex items-center justify-center p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link to="/login">
            <Button size="sm" variant="default">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
