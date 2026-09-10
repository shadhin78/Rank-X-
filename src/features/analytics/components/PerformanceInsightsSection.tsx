import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import type { PerformanceInsights } from '@/src/types';

interface PerformanceInsightsSectionProps {
  insights: PerformanceInsights;
}

export function PerformanceInsightsSection({ insights }: PerformanceInsightsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Performance Diagnostic Summary</span>
          </h3>
          <p className="text-xs text-zinc-500">
            Automated intelligence identifying positive momentum, delayed curricula, and habit inconsistencies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. What is Improving */}
        <Card className="border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-950/40 dark:bg-emerald-950/10">
          <CardHeader className="pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                What is Improving
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Positive velocity and rising consistency metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {insights.improving.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/70 dark:bg-zinc-900/60 p-2.5 border border-emerald-100 dark:border-emerald-900/30"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-zinc-800 dark:text-zinc-200">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2. What is Falling Behind */}
        <Card className="border-rose-200/80 bg-rose-50/20 dark:border-rose-950/40 dark:bg-rose-950/10">
          <CardHeader className="pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-rose-900 dark:text-rose-200">
                What is Falling Behind
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-rose-700/80 dark:text-rose-400/80">
              Curricula or habits requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {insights.fallingBehind.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/70 dark:bg-zinc-900/60 p-2.5 border border-rose-100 dark:border-rose-900/30"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 mt-0.5 shrink-0" />
                <span className="text-zinc-800 dark:text-zinc-200">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3. Which Program is Weakest */}
        <Card>
          <CardHeader className="pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <BookOpen className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold">Weakest Study Program</CardTitle>
              </div>
              {insights.weakestProgram && (
                <Badge
                  variant={
                    insights.weakestProgram.classification === 'Behind'
                      ? 'danger'
                      : insights.weakestProgram.classification === 'Ahead'
                      ? 'success'
                      : 'default'
                  }
                  className="text-[10px]"
                >
                  {insights.weakestProgram.classification} (
                  {insights.weakestProgram.pacePercentage > 0 ? '+' : ''}
                  {insights.weakestProgram.pacePercentage}%)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Program with lowest relative velocity or greatest schedule lag
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            {insights.weakestProgram ? (
              <div className="space-y-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    {insights.weakestProgram.name}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {insights.weakestProgram.actualChapters} / {insights.weakestProgram.totalChapters} chap
                  </span>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  Expected {insights.weakestProgram.expectedChapters} chapters by this date.
                  {insights.weakestProgram.daysRemaining !== null
                    ? ` ${insights.weakestProgram.daysRemaining} days remaining.`
                    : ''}
                </div>
                <div className="rounded bg-amber-50 p-2 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-medium text-[11px] flex items-start gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{insights.weakestProgram.recommendation}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-400 text-xs">
                No programs enrolled yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Which Habits are Inconsistent */}
        <Card>
          <CardHeader className="pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold">Inconsistent Habits</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {insights.inconsistentHabits.length} Needs Attention
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Habits with missed days or completion rate below 80%
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2.5">
            {insights.inconsistentHabits.length === 0 ? (
              <div className="p-4 text-center text-emerald-600 dark:text-emerald-400 text-xs flex flex-col items-center gap-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="font-semibold">All habits are consistent!</span>
                <span className="text-[11px] text-zinc-500">Every tracked habit maintains ≥80% check-in rate.</span>
              </div>
            ) : (
              insights.inconsistentHabits.map((habit) => (
                <div
                  key={habit.habitId}
                  className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {habit.name}
                    </span>
                    <Badge variant="warning" className="text-[10px] font-mono">
                      {habit.completionRate}% Consistency
                    </Badge>
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Target: {habit.target}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      {habit.missedDaysCount} missed check-ins
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 italic bg-white dark:bg-zinc-800 p-1.5 rounded">
                    💡 {habit.suggestion}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
