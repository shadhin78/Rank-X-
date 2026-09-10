import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ArrowUpRight, Plus, ChevronRight, Compass } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { calculateDetailedProgramPace } from '@/src/lib/scoring/paceAnalytics';
import type { StudyProgram } from '@/src/types';

interface ActiveProgramsCardProps {
  programs: StudyProgram[];
  onSeedDefaultProgram?: () => Promise<void>;
  isLoading?: boolean;
}

export function ActiveProgramsCard({
  programs,
  onSeedDefaultProgram,
  isLoading = false,
}: ActiveProgramsCardProps) {
  const activePrograms = programs.filter((p) => p.status === 'active' || p.status === undefined);

  const formatTargetDate = (dateStr?: string): string => {
    if (!dateStr) return 'No target date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card id="active-programs-card" className="border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base font-semibold">Active Programs</CardTitle>
            <Badge variant="secondary" className="text-[11px] font-medium">
              {activePrograms.length} Active
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Curriculum tracks, chapter progress, and pace metrics
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/analytics">
            <Button variant="outline" size="sm" className="text-xs h-8">
              <Compass className="mr-1 h-3.5 w-3.5 text-indigo-500" />
              <span>Pace Projections</span>
            </Button>
          </Link>
          <Link to="/programs">
            <Button variant="ghost" size="sm" className="text-xs h-8">
              <span>View All</span>
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {activePrograms.length > 0 ? (
          <div className="space-y-3">
            {activePrograms.slice(0, 3).map((prog) => {
              const detailedPace = calculateDetailedProgramPace(prog);
              const progressPct = detailedPace.actualProgress;

              const badgeVariant =
                detailedPace.classification === 'Ahead'
                  ? 'success'
                  : detailedPace.classification === 'Behind'
                  ? 'danger'
                  : 'default';

              const paceText =
                detailedPace.pacePercentage > 0
                  ? `+${detailedPace.pacePercentage}%`
                  : `${detailedPace.pacePercentage}%`;

              return (
                <Link
                  key={prog.id}
                  to={`/programs/${prog.id}`}
                  id={`program-card-${prog.id}`}
                  className="group block rounded-xl border border-zinc-200/80 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Program Info */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {prog.name}
                        </span>
                        {/* Pace Badge with exact Ahead/On Track/Behind and % */}
                        <Badge variant={badgeVariant} className="text-[10px] font-semibold">
                          {detailedPace.classification} ({paceText})
                        </Badge>
                        {/* Status Badge */}
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                          {prog.status || 'Active'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          Target: {formatTargetDate(prog.targetDate)}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>
                          <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {prog.completedChapters || 0}
                          </strong>{' '}
                          of{' '}
                          <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {prog.totalChapters || 0}
                          </strong>{' '}
                          chapters (Expected: {detailedPace.expectedChapters})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                          {progressPct}%
                        </span>
                        <span className="text-[10px] text-zinc-400">progress</span>
                      </div>

                      <div className="h-2 w-20 rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            detailedPace.classification === 'Ahead'
                              ? 'bg-emerald-500'
                              : detailedPace.classification === 'Behind'
                              ? 'bg-rose-500'
                              : 'bg-indigo-600 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              No active study programs found
            </p>
            <p className="text-xs text-zinc-500 mb-4 max-w-sm mx-auto">
              Organize your academic curriculum into subjects and chapters to start accumulating study points.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onSeedDefaultProgram && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSeedDefaultProgram}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Load Sample BBA Curriculum
                </Button>
              )}
              <Link to="/programs">
                <Button variant="primary" size="sm" className="text-xs">
                  Create Program
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
