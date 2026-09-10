import React from 'react';
import { Flame, CheckCircle2, Award, Zap, Calendar, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import type { UserMultiStreaks } from '@/src/types';

interface StreaksTrackerCardProps {
  streaks: UserMultiStreaks;
}

export function StreaksTrackerCard({ streaks }: StreaksTrackerCardProps) {
  // Milestone calculation
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find((m) => m > streaks.overallStreak) || 100;
  const prevMilestone = [...milestones].reverse().find((m) => m <= streaks.overallStreak) || 0;
  const milestoneProgress = Math.min(
    100,
    Math.round(((streaks.overallStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
  );

  return (
    <Card className="overflow-hidden border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:border-amber-900/50 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-amber-950/20 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Main Visual Display: 🔥 12 day streak */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-100 dark:ring-amber-900/30 animate-pulse">
              <span className="text-3xl sm:text-4xl select-none" role="img" aria-label="fire">
                🔥
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  🔥 {streaks.overallStreak} day streak
                </h2>
                <Badge variant="warning" className="text-xs px-2 py-0.5">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm">
                {streaks.todayOverallCompleted
                  ? "Today's activity completed! Your consistency momentum is fully secured for today."
                  : 'Complete a chapter or mark your daily habits to keep your active streak alive today.'}
              </p>

              {/* Milestone Meter */}
              <div className="mt-3 flex items-center gap-2 max-w-xs">
                <div className="h-2 flex-1 rounded-full bg-amber-100 dark:bg-amber-950/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, milestoneProgress)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  {streaks.overallStreak}/{nextMilestone}d milestone
                </span>
              </div>
            </div>
          </div>

          {/* 4 Tracked Streaks Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            {/* Daily Habit Streak */}
            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3 dark:border-amber-900/40 dark:bg-zinc-800/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-zinc-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Habit Streak</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {streaks.dailyHabitStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {streaks.todayHabitCompleted ? '✓ Done today' : 'Pending today'}
              </div>
            </div>

            {/* Study Streak */}
            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3 dark:border-amber-900/40 dark:bg-zinc-800/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-zinc-500">
                <Zap className="h-3.5 w-3.5 text-indigo-500" />
                <span>Study Streak</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {streaks.studyStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {streaks.todayStudyCompleted ? '✓ Done today' : 'Pending today'}
              </div>
            </div>

            {/* Overall Streak */}
            <div className="rounded-xl border border-amber-300 bg-amber-100/50 p-3 dark:border-amber-800 dark:bg-amber-950/40 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span>Overall Streak</span>
              </div>
              <div className="mt-1 font-mono text-xl font-extrabold text-amber-900 dark:text-amber-100">
                {streaks.overallStreak} <span className="text-xs font-normal opacity-70">days</span>
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                Current active
              </div>
            </div>

            {/* Longest Streak */}
            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3 dark:border-amber-900/40 dark:bg-zinc-800/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-zinc-500">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span>Longest Streak</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {streaks.longestStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Personal record
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
