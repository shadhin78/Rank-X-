import React from 'react';
import { BookOpen, CheckSquare, Target, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';

interface TodayProgressCardProps {
  studyCompletion: number; // 0 - 100
  habitCompletion: number; // 0 - 100
  overallCompletion: number; // 0 - 100
  studyDetail?: string;
  habitDetail?: string;
}

export function TodayProgressCard({
  studyCompletion,
  habitCompletion,
  overallCompletion,
  studyDetail = 'Chapters & syllabus targets',
  habitDetail = 'Active routines completed',
}: TodayProgressCardProps) {
  return (
    <Card id="today-progress-card" className="border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-base font-semibold">Today's Progress</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Daily target completion across your curriculum study and habitual routines
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {overallCompletion}%
            </span>
            <span className="text-[11px] text-zinc-400 block font-medium">Overall Daily</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Overall Completion Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <Target className="h-3.5 w-3.5 text-indigo-500" />
              Overall Completion
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {overallCompletion}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallCompletion >= 100
                  ? 'bg-emerald-500'
                  : overallCompletion >= 50
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-indigo-400 dark:bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallCompletion))}%` }}
            />
          </div>
        </div>

        {/* Progress Grid: Study vs Habit */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Study Completion */}
          <div
            id="study-progress-card"
            className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Study Completion
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {studyDetail}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {studyCompletion}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  studyCompletion >= 100 ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, studyCompletion))}%` }}
              />
            </div>
          </div>

          {/* Habit Completion */}
          <div
            id="habit-progress-card"
            className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckSquare className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Habit Completion
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {habitDetail}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {habitCompletion}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/60">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, habitCompletion))}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
