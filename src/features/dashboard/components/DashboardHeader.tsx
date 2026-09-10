import React from 'react';
import { Trophy, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';

interface DashboardHeaderProps {
  displayName: string;
  rank: number;
  totalPoints: number;
  streak: number;
}

export function DashboardHeader({
  displayName,
  rank,
  totalPoints,
  streak,
}: DashboardHeaderProps) {
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div
      id="dashboard-header"
      className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting & Identity */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Personal Performance Dashboard
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {getGreeting()},{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              {displayName || 'Scholar'}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Here is your daily study targets, active habit completion, and realtime ranking standing.
          </p>
        </div>

        {/* Right: Key Performance Badges / Quick Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Current Rank */}
          <div
            id="metric-rank-badge"
            className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-amber-900/80 dark:text-amber-300/80 block">
                Current Rank
              </span>
              <span className="text-base font-bold text-amber-950 dark:text-amber-200">
                {rank > 0 ? `#${rank}` : 'Unranked'}
              </span>
            </div>
          </div>

          {/* Total Points */}
          <div
            id="metric-points-badge"
            className="flex items-center gap-3 rounded-xl border border-indigo-200/70 bg-indigo-50/60 px-4 py-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-indigo-900/80 dark:text-indigo-300/80 block">
                Total Points
              </span>
              <span className="text-base font-bold text-indigo-950 dark:text-indigo-200">
                {totalPoints.toLocaleString()} pts
              </span>
            </div>
          </div>

          {/* Current Streak */}
          <div
            id="metric-streak-badge"
            className="flex items-center gap-3 rounded-xl border border-orange-200/70 bg-orange-50/60 px-4 py-2.5 dark:border-orange-900/50 dark:bg-orange-950/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-xs">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-orange-900/80 dark:text-orange-300/80 block">
                Current Streak
              </span>
              <span className="text-base font-bold text-orange-950 dark:text-orange-200">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
