import React, { useState } from 'react';
import { Trophy, Flame, Medal, ArrowUp, ArrowDown, Minus, Filter, Sparkles } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  points: number;
  streak: number;
  completedTasks: number;
  trend: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

const LEADERBOARD_DATA: LeaderboardUser[] = [
  {
    rank: 1,
    id: 'u-1',
    name: 'Sarah Chen',
    points: 1640,
    streak: 18,
    completedTasks: 34,
    trend: 'same',
  },
  {
    rank: 2,
    id: 'u-2',
    name: 'Alex Rivera (You)',
    points: 1420,
    streak: 14,
    completedTasks: 28,
    trend: 'up',
    isCurrentUser: true,
  },
  {
    rank: 3,
    id: 'u-3',
    name: 'Marcus Vance',
    points: 1180,
    streak: 9,
    completedTasks: 22,
    trend: 'down',
  },
  {
    rank: 4,
    id: 'u-4',
    name: 'Priya Sharma',
    points: 980,
    streak: 7,
    completedTasks: 19,
    trend: 'up',
  },
  {
    rank: 5,
    id: 'u-5',
    name: 'David Kim',
    points: 850,
    streak: 5,
    completedTasks: 15,
    trend: 'same',
  },
];

export function LeaderboardPage() {
  const [filterPeriod, setFilterPeriod] = useState<'weekly' | 'allTime'>('weekly');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Leaderboard"
        description="Realtime competitive ranking among peers based on verified study sessions and completed chapters."
        badge={<Badge variant="live">Realtime Sync</Badge>}
        actions={
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setFilterPeriod('weekly')}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filterPeriod === 'weekly'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('allTime')}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filterPeriod === 'allTime'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              All Time
            </button>
          </div>
        }
      />

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 2nd Place */}
        <Card className="order-2 md:order-1 border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/20 to-transparent">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 font-bold text-sm dark:bg-zinc-800 dark:text-zinc-300">
              #2
            </div>
            <CardTitle className="text-base mt-2">Alex Rivera (You)</CardTitle>
            <CardDescription className="text-xs">14d study streak</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0 pb-4">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              1,420 pts
            </div>
          </CardContent>
        </Card>

        {/* 1st Place */}
        <Card className="order-1 md:order-2 border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/30 to-transparent relative shadow-xs">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-bold">
              👑 Leader
            </Badge>
          </div>
          <CardHeader className="text-center pb-2 pt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-base dark:bg-amber-950 dark:text-amber-300">
              #1
            </div>
            <CardTitle className="text-base mt-2">Sarah Chen</CardTitle>
            <CardDescription className="text-xs">18d study streak</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0 pb-4">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              1,640 pts
            </div>
          </CardContent>
        </Card>

        {/* 3rd Place */}
        <Card className="order-3 border-zinc-200/80 dark:border-zinc-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/10 text-amber-800 font-bold text-sm dark:bg-amber-950/40 dark:text-amber-400">
              #3
            </div>
            <CardTitle className="text-base mt-2">Marcus Vance</CardTitle>
            <CardDescription className="text-xs">9d study streak</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0 pb-4">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              1,180 pts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Full Standings</CardTitle>
          <CardDescription>
            Points update automatically when members mark study modules as completed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Rank</th>
                  <th className="px-4 py-3 sm:px-6">Participant</th>
                  <th className="px-4 py-3 sm:px-6">Streak</th>
                  <th className="px-4 py-3 sm:px-6">Completed</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {LEADERBOARD_DATA.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      row.isCurrentUser
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-medium'
                        : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            row.rank === 1
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : row.rank === 2
                              ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                              : 'text-zinc-500'
                          }`}
                        >
                          {row.rank}
                        </span>
                        {row.trend === 'up' && (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {row.trend === 'down' && (
                          <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                        {row.trend === 'same' && (
                          <Minus className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {row.name.charAt(0)}
                        </div>
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Flame className="h-3.5 w-3.5" />
                        {row.streak}d
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500 sm:px-6">
                      {row.completedTasks} modules
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100 sm:px-6">
                      {row.points.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
