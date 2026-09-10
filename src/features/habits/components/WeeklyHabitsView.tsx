import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { formatDateToIso } from '@/src/services/habitService';
import type { CustomHabit, DailyHabitLog } from '@/src/types';

interface WeeklyHabitsViewProps {
  habits: CustomHabit[];
  allLogs: DailyHabitLog[];
  onToggleHabitDay: (habit: CustomHabit, dateIso: string, currentCompleted: boolean) => Promise<void>;
  onSelectDate: (dateIso: string) => void;
}

export function WeeklyHabitsView({
  habits,
  allLogs,
  onToggleHabitDay,
  onSelectDate,
}: WeeklyHabitsViewProps) {
  // Current week offset (0 = this week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute the 7 days of the selected week (Mon - Sun)
  const getWeekDays = (offset: number) => {
    const today = new Date();
    // Shift by week offset
    today.setDate(today.getDate() + offset * 7);

    // Find current Monday (assuming Monday is start of week)
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const days: Array<{
      date: Date;
      iso: string;
      dayName: string;
      dayNumber: number;
      dayOfWeek: number;
      isToday: boolean;
    }> = [];

    const todayIso = formatDateToIso(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatDateToIso(d);
      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        dayOfWeek: d.getDay(),
        isToday: iso === todayIso,
      });
    }

    return days;
  };

  const weekDays = getWeekDays(weekOffset);

  // Helper to find log for a specific habit and day
  const getLog = (habitId: string, dateIso: string) => {
    return allLogs.find((l) => l.habitId === habitId && l.date === dateIso);
  };

  // Week range label
  const firstDay = weekDays[0].date;
  const lastDay = weekDays[6].date;
  const weekLabel = `${firstDay.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${lastDay.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

  // Filter active habits
  const activeHabits = habits.filter((h) => h.isActive);

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Weekly Consistency Matrix
            </h3>
            <p className="text-xs text-zinc-500">{weekLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="h-8 px-2.5"
            title="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {weekOffset !== 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              className="h-8 text-xs font-semibold"
            >
              Current Week
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="h-8 px-2.5"
            title="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Habits Matrix Grid */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40">
              <th className="py-3 px-4 font-bold text-zinc-600 dark:text-zinc-300 w-52">
                Habit Track
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.iso}
                  onClick={() => onSelectDate(day.iso)}
                  className={`py-3 px-2 text-center cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    day.isToday
                      ? 'bg-indigo-50/60 font-extrabold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider">
                    {day.dayName}
                  </div>
                  <div
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                      day.isToday
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {day.dayNumber}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {activeHabits.length > 0 ? (
              activeHabits.map((habit) => (
                <tr
                  key={habit.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {habit.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400">
                      <span className="capitalize">{habit.type}</span>
                      <span>•</span>
                      <span>+{habit.pointValue} pts</span>
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const log = getLog(habit.id, day.iso);
                    const isScheduled = habit.activeDays.includes(day.dayOfWeek);
                    const isDone = log?.completed;

                    if (!isScheduled) {
                      return (
                        <td
                          key={day.iso}
                          className="py-3 px-2 text-center text-zinc-300 dark:text-zinc-700 select-none"
                        >
                          <span className="text-[10px] italic">off</span>
                        </td>
                      );
                    }

                    return (
                      <td key={day.iso} className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleHabitDay(habit, day.iso, isDone || false)
                          }
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-xl transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95'
                              : log && log.completionPercentage > 0
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-200'
                              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700'
                          }`}
                          title={`${habit.name} on ${day.iso}: ${
                            isDone ? 'Completed' : 'Click to toggle'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : log && log.completionPercentage > 0 ? (
                            <span className="text-[10px] font-bold">
                              {log.completionPercentage}%
                            </span>
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  No active habits found.
                </td>
              </tr>
            )}
          </tbody>

          {/* Daily Total Summary Footer */}
          <tfoot>
            <tr className="border-t-2 border-zinc-100 bg-zinc-50/90 font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
              <td className="py-3 px-4 text-xs font-bold">
                Daily Completed
              </td>
              {weekDays.map((day) => {
                const dayLogs = allLogs.filter(
                  (l) => l.date === day.iso && l.completed
                );
                const count = dayLogs.length;
                const points = dayLogs.reduce((acc, curr) => acc + (curr.earnedPoints || 0), 0);

                return (
                  <td key={day.iso} className="py-3 px-2 text-center text-xs">
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      {count}
                    </div>
                    {points > 0 && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        +{points}p
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
