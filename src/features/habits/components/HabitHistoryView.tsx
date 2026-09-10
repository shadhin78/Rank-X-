import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Sparkles,
  ArrowUpDown,
  Edit3,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { formatDateToIso } from '@/src/services/habitService';
import type { CustomHabit, DailyHabitLog } from '@/src/types';

interface HabitHistoryViewProps {
  habits: CustomHabit[];
  allLogs: DailyHabitLog[];
  onUpdateLog: (habit: CustomHabit, dateIso: string, actualValue: any) => Promise<void>;
  selectedDate: string;
  onSelectDate: (dateIso: string) => void;
}

export function HabitHistoryView({
  habits,
  allLogs,
  onUpdateLog,
  selectedDate,
  onSelectDate,
}: HabitHistoryViewProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const todayIso = formatDateToIso(new Date());

  // Past 7 days quick chips
  const quickDates = useMemo(() => {
    const dates: Array<{ label: string; iso: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = formatDateToIso(d);
      dates.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        iso,
      });
    }
    return dates;
  }, []);

  // Filter logs based on date and habit
  const filteredLogs = useMemo(() => {
    return allLogs
      .filter((l) => {
        const matchesDate = !selectedDate || l.date === selectedDate;
        const matchesHabit = selectedHabitId === 'all' || l.habitId === selectedHabitId;
        const habit = habits.find((h) => h.id === l.habitId);
        const matchesSearch =
          !search ||
          (habit && habit.name.toLowerCase().includes(search.toLowerCase())) ||
          l.date.includes(search);

        return matchesDate && matchesHabit && matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allLogs, selectedDate, selectedHabitId, search, habits]);

  // Daily stats for currently selected date
  const dayLogs = allLogs.filter((l) => l.date === selectedDate);
  const dayCompleted = dayLogs.filter((l) => l.completed).length;
  const dayPoints = dayLogs.reduce((acc, curr) => acc + (curr.earnedPoints || 0), 0);

  const startEdit = (log: DailyHabitLog) => {
    setEditingLogId(log.id);
    setEditValue(log.actualValue ?? '');
  };

  const saveEdit = async (log: DailyHabitLog) => {
    const habit = habits.find((h) => h.id === log.habitId);
    if (!habit) return;

    let parsedVal = editValue;
    if (habit.type === 'count' || habit.type === 'number' || habit.type === 'duration') {
      parsedVal = Number(editValue) || 0;
    } else if (habit.type === 'boolean' || habit.type === 'checkbox') {
      parsedVal = Boolean(editValue);
    }

    await onUpdateLog(habit, log.date, parsedVal);
    setEditingLogId(null);
  };

  return (
    <div className="space-y-5">
      {/* Date & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => onSelectDate('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDate === ''
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              All Time
            </button>
            {quickDates.map((d) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => onSelectDate(d.iso)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDate === d.iso
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Secondary filters: Habit dropdown & search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">All Habits ({habits.length})</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.type})
                </option>
              ))}
            </select>
          </div>

          {selectedDate && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-500">
                Completed on {selectedDate}:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                  {dayCompleted} habits
                </strong>
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Sparkles className="h-3 w-3" />
                <span>+{dayPoints} pts placeholder</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Habit</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Actual Value</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const habit = habits.find((h) => h.id === log.habitId);
                  const isEditing = editingLogId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                        {log.date}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {habit?.name || log.habitId}
                        </div>
                        {habit && (
                          <div className="text-[10px] text-zinc-400 capitalize">
                            {habit.type}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {String(log.targetValue)} {habit?.unit || ''}
                      </td>

                      {/* Actual value with inline edit support */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            {habit?.type === 'time' ? (
                              <input
                                type="time"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 w-28 rounded-lg border border-zinc-200 px-2 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800"
                              />
                            ) : habit?.type === 'boolean' || habit?.type === 'checkbox' ? (
                              <button
                                type="button"
                                onClick={() => setEditValue(!editValue)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                  editValue
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {editValue ? 'Completed' : 'Incomplete'}
                              </button>
                            ) : (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 w-20 rounded-lg border border-zinc-200 px-2 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-800"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => saveEdit(log)}
                              className="h-8 px-2.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLogId(null)}
                              className="h-8 px-2 rounded-lg text-zinc-400 hover:text-zinc-600 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {habit?.type === 'boolean' || habit?.type === 'checkbox'
                              ? log.actualValue
                                ? 'Done'
                                : 'No'
                              : String(log.actualValue ?? '0')} {habit?.unit || ''}
                          </span>
                        )}
                      </td>

                      {/* Progress Percentage */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={log.completed ? 'success' : 'secondary'}
                            className="text-[10px]"
                          >
                            {log.completionPercentage}%
                          </Badge>
                        </div>
                      </td>

                      {/* Earned Points Placeholder */}
                      <td className="py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">
                        +{log.earnedPoints} pts
                      </td>

                      {/* Edit Result button */}
                      <td className="py-3 px-4 text-right">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEdit(log)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                            title="Edit Result"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                    No habit logs found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
