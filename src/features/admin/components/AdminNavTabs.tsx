import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Trophy,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import { adminService } from '@/src/services/adminService';

interface AdminNavTabsProps {
  pendingCount?: number;
}

export function AdminNavTabs({ pendingCount: initialPendingCount }: AdminNavTabsProps) {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(initialPendingCount ?? 0);

  useEffect(() => {
    let isMounted = true;
    const loadPendingCount = async () => {
      try {
        const stats = await adminService.getOverviewStats();
        if (isMounted) {
          setPendingCount(stats.pendingApprovals);
        }
      } catch {
        // Fallback
      }
    };

    if (initialPendingCount === undefined) {
      loadPendingCount();
    }

    const unsub = adminService.subscribe(() => {
      loadPendingCount();
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [initialPendingCount]);

  const tabs = [
    {
      title: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
      isActive: location.pathname === '/admin',
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
      isActive: location.pathname === '/admin/users',
    },
    {
      title: 'Pending Approvals',
      href: '/admin/approvals',
      icon: UserCheck,
      isActive: location.pathname === '/admin/approvals',
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Leaderboard',
      href: '/admin/leaderboard',
      icon: Trophy,
      isActive: location.pathname === '/admin/leaderboard',
    },
    {
      title: 'Activity',
      href: '/admin/activity',
      icon: Activity,
      isActive: location.pathname === '/admin/activity',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
      {/* Mobile-friendly horizontal scrollable navigation tabs */}
      <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0',
                tab.isActive
                  ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.title}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight',
                    tab.isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Security validation badge */}
      <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-700/60">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Server-Enforced Authorization</span>
      </div>
    </div>
  );
}
