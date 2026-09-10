import React from 'react';
import { Sparkles, Calendar, BookOpen, CheckSquare, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';

interface PerformanceSummaryCardProps {
  todayPoints: number;
  thisWeekPoints: number;
  thisMonthPoints: number;
  studyPoints: number;
  habitPoints: number;
  totalPoints: number;
}

export function PerformanceSummaryCard({
  todayPoints,
  thisWeekPoints,
  thisMonthPoints,
  studyPoints,
  habitPoints,
  totalPoints,
}: PerformanceSummaryCardProps) {
  const total = studyPoints + habitPoints || totalPoints || 1;
  const studyPct = Math.round((studyPoints / total) * 100);
  const habitPct = 100 - studyPct;

  return (
    <Card id="performance-summary-card" className="border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base font-semibold">Performance Summary</CardTitle>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {totalPoints.toLocaleString()} Total
          </span>
        </div>
        <CardDescription className="text-xs">
          Points accumulated across time periods and activity categories
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Period Points Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Today */}
          <div
            id="summary-today-points"
            className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800/40"
          >
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
              Today's Points
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              +{todayPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">pts</span>
          </div>

          {/* This Week */}
          <div
            id="summary-week-points"
            className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800/40"
          >
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
              This Week
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              +{thisWeekPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">pts</span>
          </div>

          {/* This Month */}
          <div
            id="summary-month-points"
            className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800/40"
          >
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
              This Month
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              +{thisMonthPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">pts</span>
          </div>
        </div>

        {/* Category Breakdown: Study Points vs Habit Points */}
        <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800/70 dark:bg-zinc-800/20">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Points by Category</span>
            <span className="text-zinc-400 font-normal text-[11px]">Cumulative</span>
          </div>

          {/* Ratio bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700 flex">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${studyPct}%` }}
              title={`Study: ${studyPct}%`}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${habitPct}%` }}
              title={`Habits: ${habitPct}%`}
            />
          </div>

          {/* Category numbers */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium">Study Points:</span>
              <strong className="font-bold">{studyPoints.toLocaleString()}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium">Habit Points:</span>
              <strong className="font-bold">{habitPoints.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
