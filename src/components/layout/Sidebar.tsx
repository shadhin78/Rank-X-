import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  BarChart2,
  Trophy,
  User,
  Settings,
  ShieldAlert,
  Users,
  UserCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Flame,
} from 'lucide-react';
import { navigationConfig, type NavItemConfig } from '@/src/config/navigation';
import { useAppStore } from '@/src/store';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';

const ICON_MAP = {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  BarChart2,
  Trophy,
  User,
  Settings,
  ShieldAlert,
  Users,
  UserCheck,
  Activity,
};

export function Sidebar() {
  const location = useLocation();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const currentUser = useAppStore((state) => state.currentUser);
  const isAdmin = useAppStore((state) => state.isAdmin);
  const toggleAdminMode = useAppStore((state) => state.toggleAdminMode);

  const renderNavItem = (item: NavItemConfig) => {
    const IconComponent = ICON_MAP[item.iconName] || LayoutDashboard;
    const isActive =
      item.href === '/dashboard'
        ? location.pathname === '/dashboard' || location.pathname === '/'
        : location.pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative min-h-[40px]',
          isActive
            ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-50'
            : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
          sidebarCollapsed && 'justify-center px-2'
        )}
        title={sidebarCollapsed ? item.title : undefined}
      >
        <IconComponent
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            isActive
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200'
          )}
        />
        {!sidebarCollapsed && (
          <span className="truncate flex-1">{item.title}</span>
        )}
        {!sidebarCollapsed && item.badge && (
          <Badge
            variant={item.badge === 'Live' ? 'live' : 'secondary'}
            className="text-[10px] px-1.5 py-0"
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/90 h-screen sticky top-0 transition-all duration-200 z-30 select-none',
        sidebarCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <Link
          to="/dashboard"
          className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-opacity',
            sidebarCollapsed ? 'justify-center w-full' : ''
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs dark:bg-indigo-500">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                  StudyRank
                </span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  v0.1
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
                Focus & Compete
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Workspace */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {navigationConfig.main.title}
            </p>
          )}
          <div className="space-y-0.5">
            {navigationConfig.main.items.map(renderNavItem)}
          </div>
        </div>

        {/* Competition */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {navigationConfig.competition.title}
            </p>
          )}
          <div className="space-y-0.5">
            {navigationConfig.competition.items.map(renderNavItem)}
          </div>
        </div>

        {/* Personal */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {navigationConfig.account.title}
            </p>
          )}
          <div className="space-y-0.5">
            {navigationConfig.account.items.map(renderNavItem)}
          </div>
        </div>

        {/* Administration (Visible in admin mode or preview) */}
        <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {navigationConfig.admin.title}
              </p>
              <button
                type="button"
                onClick={toggleAdminMode}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isAdmin ? 'Admin ON' : 'Preview'}
              </button>
            </div>
          )}
          <div className="space-y-0.5">
            {navigationConfig.admin.items.map(renderNavItem)}
          </div>
        </div>
      </div>

      {/* Footer User Profile & Collapse Toggle */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/80 p-3 space-y-2">
        {currentUser && !sidebarCollapsed ? (
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                AR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser.displayName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
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
        ) : null}

        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2 w-full px-2 text-xs">
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse menu</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
