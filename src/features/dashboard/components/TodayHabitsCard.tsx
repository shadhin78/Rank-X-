import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowUpRight, Plus, Flame, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import type { CustomHabit, DailyHabitLog } from '@/src/types';

interface TodayHabitsCardProps {
  habits: CustomHabit[];
  dailyLogs: DailyHabitLog[];
  onToggleHabit: (habit: CustomHabit, isDone: boolean) => Promise<void>;
  onSeedDefaults?: () => Promise<void>;
  isLoading?: boolean;
}

export function TodayHabitsCard({
  habits,
  dailyLogs,
  onToggleHabit,
  onSeedDefaults,
  isLoading = false,
}: TodayHabitsCardProps) {
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);

  // Filter habits active today
  const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon ...
  const activeHabitsToday = habits.filter((h) => {
    if (h.isActive === false) return false;
    if (!h.activeDays || h.activeDays.length === 0) return true;
    return h.activeDays.includes(todayDay);
  });

  const formatTarget = (habit: CustomHabit): string => {
    if (habit.type === 'time') {
      return habit.targetValue ? `Before ${habit.targetValue}` : 'Daily';
    }
    if (habit.type === 'boolean' || habit.type === 'checkbox') {
      return 'Completed';
    }
    return `${habit.targetValue} ${habit.unit || ''}`.trim();
  };

  const formatActual = (habit: CustomHabit, log?: DailyHabitLog): string => {
    if (!log) return 'Pending';
    if (habit.type === 'boolean' || habit.type === 'checkbox') {
      return log.completed ? 'Done' : 'Not yet';
    }
    if (habit.type === 'time') {
      return log.completed ? `${log.actualValue || 'Done'}` : 'Not yet';
    }
    return `${log.actualValue || 0} ${habit.unit || ''}`.trim();
  };

  const handleToggle = async (habit: CustomHabit) => {
    if (busyHabitId) return;
    const log = dailyLogs.find((l) => l.habitId === habit.id);
    const isCurrentlyDone = Boolean(log?.completed);

    setBusyHabitId(habit.id);
    try {
      await onToggleHabit(habit, !isCurrentlyDone);
    } finally {
      setBusyHabitId(null);
    }
  };

  return (
    <Card id="today-habits-card" className="border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-base font-semibold">Today's Habits</CardTitle>
            <Badge variant="secondary" className="text-[11px] font-medium">
              {activeHabitsToday.filter((h) => dailyLogs.find((l) => l.habitId === h.id)?.completed).length} / {activeHabitsToday.length} Done
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Active daily habits scheduled for today with realtime points
          </CardDescription>
        </div>
        <Link to="/habits">
          <Button variant="ghost" size="sm" className="text-xs">
            <span>Manage All</span>
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {activeHabitsToday.length > 0 ? (
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 dark:divide-zinc-800/80 dark:border-zinc-800/80 overflow-hidden">
            {activeHabitsToday.map((habit) => {
              const log = dailyLogs.find((l) => l.habitId === habit.id);
              const isCompleted = Boolean(log?.completed);
              const completionPct = log?.completionPercentage ?? (isCompleted ? 100 : 0);
              const earnedPts = isCompleted ? (log?.earnedPoints || habit.pointValue) : 0;
              const isBusy = busyHabitId === habit.id;

              return (
                <div
                  key={habit.id}
                  id={`habit-row-${habit.id}`}
                  className={`flex items-center justify-between p-3.5 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/15'
                      : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30'
                  }`}
                >
                  {/* Left: Quick Check Toggle & Habit Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      id={`toggle-habit-${habit.id}`}
                      disabled={isBusy}
                      onClick={() => handleToggle(habit)}
                      aria-label={`Toggle habit ${habit.name}`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all active:scale-95 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'border border-zinc-300 bg-white text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4 stroke-[1.5]" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isCompleted
                              ? 'text-zinc-500 line-through dark:text-zinc-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>
                          Target: <strong className="font-medium text-zinc-700 dark:text-zinc-300">{formatTarget(habit)}</strong>
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>
                          Actual: <strong className="font-medium text-zinc-700 dark:text-zinc-300">{formatActual(habit, log)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Completion Percentage & Points */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                        {completionPct}%
                      </span>
                      <span className="text-[10px] text-zinc-400">completion</span>
                    </div>

                    <div
                      id={`habit-points-${habit.id}`}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      +{isCompleted ? earnedPts : habit.pointValue} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              No active habits scheduled for today
            </p>
            <p className="text-xs text-zinc-500 mb-4 max-w-sm mx-auto">
              Track habits like Morning Study, Deep Focus, and Reading to boost your multiplier.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onSeedDefaults && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSeedDefaults}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Load Standard Habits
                </Button>
              )}
              <Link to="/habits">
                <Button variant="primary" size="sm" className="text-xs">
                  Create Habit
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
