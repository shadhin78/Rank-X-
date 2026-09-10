import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import type { DetailedProgramPace } from '@/src/types';

interface ProgramPaceCardProps {
  key?: string;
  pace: DetailedProgramPace;
}

export function ProgramPaceCard({ pace }: ProgramPaceCardProps) {
  const getBadgeVariant = (cls: DetailedProgramPace['classification']) => {
    switch (cls) {
      case 'Ahead':
        return 'success';
      case 'Behind':
        return 'danger';
      case 'On Track':
      default:
        return 'default';
    }
  };

  const getPaceIcon = (cls: DetailedProgramPace['classification']) => {
    switch (cls) {
      case 'Ahead':
        return <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Behind':
        return <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'On Track':
      default:
        return <Minus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const formattedPace =
    pace.pacePercentage > 0
      ? `+${pace.pacePercentage}%`
      : `${pace.pacePercentage}%`;

  return (
    <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {pace.programName}
              </CardTitle>
              <Badge variant={getBadgeVariant(pace.classification)} className="text-xs px-2 py-0.5">
                {getPaceIcon(pace.classification)}
                <span className="ml-1 font-semibold">{pace.classification}</span>
                <span className="ml-1 opacity-90 font-mono font-normal">({formattedPace})</span>
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              {pace.completedChapters} of {pace.totalChapters} chapters completed ({pace.actualProgress}%)
            </CardDescription>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-zinc-500">
            {pace.velocityChaptersPerDay > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <TrendingUp className="h-3 w-3 text-indigo-500" />
                {pace.velocityChaptersPerDay} chap/day velocity
              </span>
            ) : (
              <span className="text-zinc-400">Velocity not established</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Progress Comparison Visualizer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Expected on Day {pace.daysElapsed}:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                {pace.expectedChapters} chapters ({pace.expectedProgress}%)
              </strong>
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              Actual: {pace.completedChapters} chapters ({pace.actualProgress}%)
            </span>
          </div>

          {/* Dual Layer Progress Bar: Expected marker vs Actual progress */}
          <div className="relative h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            {/* Expected progress marker shadow */}
            <div
              className="absolute top-0 bottom-0 bg-zinc-300/70 dark:bg-zinc-700"
              style={{ width: `${Math.min(100, pace.expectedProgress)}%` }}
            />
            {/* Actual progress bar */}
            <div
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-300 ${
                pace.classification === 'Ahead'
                  ? 'bg-emerald-500'
                  : pace.classification === 'Behind'
                  ? 'bg-rose-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, pace.actualProgress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Start: {pace.startDate}</span>
            {pace.targetDate ? (
              <span>Target: {pace.targetDate}</span>
            ) : (
              <span>Self-Paced</span>
            )}
          </div>
        </div>

        {/* Pace Breakdown Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-2.5 border border-zinc-100 dark:border-zinc-800/40">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Days Elapsed</span>
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {pace.daysElapsed} days
            </div>
            {pace.totalDays && (
              <div className="text-[10px] text-zinc-400 mt-0.5">
                of {pace.totalDays} total days
              </div>
            )}
          </div>

          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-2.5 border border-zinc-100 dark:border-zinc-800/40">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Days Remaining</span>
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {pace.daysRemaining !== null ? `${pace.daysRemaining} days` : 'Unlimited'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              until target date
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-2.5 border border-zinc-100 dark:border-zinc-800/40">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
              <Compass className="h-3.5 w-3.5 text-zinc-400" />
              <span>Pace Percentage</span>
            </div>
            <div
              className={`mt-1 font-mono text-sm font-semibold ${
                pace.classification === 'Ahead'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : pace.classification === 'Behind'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {formattedPace}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              vs expected rate
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-2.5 border border-zinc-100 dark:border-zinc-800/40">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Est. Completion</span>
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {pace.estimatedCompletionDate || 'Calculating...'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {pace.classification === 'Ahead'
                ? 'Ahead of schedule'
                : pace.classification === 'Behind'
                ? 'Needs acceleration'
                : 'Projected on target'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
