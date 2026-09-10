import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Minus,
  Sparkles,
  Flame,
  MoreVertical,
  Edit2,
  Trash2,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import type { CustomHabit, DailyHabitLog } from '@/src/types';

interface HabitCardProps {
  key?: React.Key;
  habit: CustomHabit;
  log?: DailyHabitLog;
  onRecord: (habit: CustomHabit, actualValue: any) => Promise<void>;
  onEdit: (habit: CustomHabit) => void;
  onDelete: (habit: CustomHabit) => void;
  streakDays?: number;
}

export function HabitCard({
  habit,
  log,
  onRecord,
  onEdit,
  onDelete,
  streakDays = 0,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completed = log?.completed ?? false;
  const completionPercentage = log?.completionPercentage ?? 0;
  const actualValue = log?.actualValue;

  // Format current display value
  const displayActualValue = () => {
    if (actualValue === undefined || actualValue === null) {
      return habit.type === 'boolean' || habit.type === 'checkbox' ? 'Not yet' : '0';
    }
    if (habit.type === 'boolean' || habit.type === 'checkbox') {
      return actualValue ? 'Done' : 'Not yet';
    }
    return String(actualValue);
  };

  // Format target display
  const displayTarget = () => {
    switch (habit.type) {
      case 'time':
        return `Target: ${habit.targetValue}`;
      case 'duration':
        return `Target: ${habit.targetValue} ${habit.unit || 'mins'}`;
      case 'count':
        return `Target: ${habit.targetValue} ${habit.unit || 'times'}`;
      case 'number':
        return `Target: ${habit.targetValue} ${habit.unit || ''}`;
      case 'boolean':
      case 'checkbox':
        return 'Target: Complete';
      default:
        return `Target: ${habit.targetValue}`;
    }
  };

  const handleToggleBoolean = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRecord(habit, !completed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncrementCount = async (delta: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const current = Number(actualValue) || 0;
      const next = Math.max(0, current + delta);
      await onRecord(habit, next);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectCount = async (val: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRecord(habit, Math.max(0, val));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeNow = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;
      await onRecord(habit, currentTime);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeChange = async (timeStr: string) => {
    if (isSubmitting || !timeStr) return;
    setIsSubmitting(true);
    try {
      await onRecord(habit, timeStr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 dark:bg-zinc-900 ${
        completed
          ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
          : 'border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-base font-bold transition-colors ${
                completed
                  ? 'text-emerald-950 dark:text-emerald-300 line-through decoration-emerald-500/50'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {habit.name}
            </h3>

            {/* Habit Type Badge */}
            <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider">
              {habit.type}
            </Badge>

            {/* Streak Indicator Placeholder */}
            {streakDays > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{streakDays}d</span>
              </span>
            )}
          </div>

          {habit.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {habit.description}
            </p>
          )}
        </div>

        {/* Action Menu button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-9 z-30 w-36 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(habit);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Habit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(habit);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Habit</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Target & Current Values Row */}
      <div className="my-3 flex items-center justify-between rounded-xl bg-zinc-50/70 p-3 text-xs dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {displayTarget()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Current:</span>
          <span
            className={`font-bold ${
              completed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {displayActualValue()} {habit.unit ? habit.unit : ''}
          </span>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
            Completion Rate
          </span>
          <span
            className={`font-bold ${
              completed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {completionPercentage}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              completed
                ? 'bg-emerald-500'
                : completionPercentage > 0
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : 'bg-transparent'
            }`}
            style={{ width: `${Math.min(100, completionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Interactive Complete / Input Controls Tailored to Type */}
      <div className="mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        {/* Type: Boolean / Checkbox */}
        {(habit.type === 'boolean' || habit.type === 'checkbox') && (
          <button
            type="button"
            onClick={handleToggleBoolean}
            disabled={isSubmitting}
            className={`w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
              completed
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.98]'
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Marked Complete (Tap to Undo)</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                <span>Tap to Complete</span>
              </>
            )}
          </button>
        )}

        {/* Type: Count */}
        {habit.type === 'count' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrementCount(-1)}
                disabled={isSubmitting || (Number(actualValue) || 0) <= 0}
                className="h-11 w-12 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-95 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                title="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex-1 flex items-center justify-center h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {Number(actualValue) || 0} / {Number(habit.targetValue)} {habit.unit || ''}
              </div>

              <button
                type="button"
                onClick={() => handleIncrementCount(1)}
                disabled={isSubmitting}
                className="h-11 w-12 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-95 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                title="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Quick action button to mark full target */}
            {!completed && (
              <button
                type="button"
                onClick={() => handleDirectCount(Number(habit.targetValue))}
                disabled={isSubmitting}
                className="min-h-[38px] w-full flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Mark Full Target ({habit.targetValue})</span>
              </button>
            )}
          </div>
        )}

        {/* Type: Duration */}
        {habit.type === 'duration' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {/* Quick Preset Buttons */}
              <button
                type="button"
                onClick={() => {
                  const curr = Number(actualValue) || 0;
                  // If unit is hours, +15m is +0.25h or +1h
                  const delta = habit.unit?.toLowerCase().includes('hour') ? 1 : 15;
                  handleDirectCount(curr + delta);
                }}
                disabled={isSubmitting}
                className="flex-1 min-h-[40px] rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {habit.unit?.toLowerCase().includes('hour') ? '+1 hr' : '+15 min'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const curr = Number(actualValue) || 0;
                  const delta = habit.unit?.toLowerCase().includes('hour') ? 2 : 30;
                  handleDirectCount(curr + delta);
                }}
                disabled={isSubmitting}
                className="flex-1 min-h-[40px] rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {habit.unit?.toLowerCase().includes('hour') ? '+2 hrs' : '+30 min'}
              </button>

              <button
                type="button"
                onClick={() => handleDirectCount(Number(habit.targetValue))}
                disabled={isSubmitting}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                  completed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                <span>Full</span>
              </button>
            </div>

            {/* Direct Number Input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={actualValue ?? ''}
                placeholder="Custom value"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleDirectCount(val);
                  } else if (e.target.value === '') {
                    handleDirectCount(0);
                  }
                }}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <span className="text-xs font-medium text-zinc-500 shrink-0">
                {habit.unit || 'duration'}
              </span>
            </div>
          </div>
        )}

        {/* Type: Number */}
        {habit.type === 'number' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrementCount(-1)}
                disabled={isSubmitting || (Number(actualValue) || 0) <= 0}
                className="h-11 w-12 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-95 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                min="0"
                value={actualValue ?? ''}
                placeholder={`0 / ${habit.targetValue}`}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleDirectCount(val);
                  } else if (e.target.value === '') {
                    handleDirectCount(0);
                  }
                }}
                className="h-11 flex-1 text-center font-bold text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />

              <button
                type="button"
                onClick={() => handleIncrementCount(1)}
                disabled={isSubmitting}
                className="h-11 w-12 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-95 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {!completed && (
              <button
                type="button"
                onClick={() => handleDirectCount(Number(habit.targetValue))}
                disabled={isSubmitting}
                className="min-h-[38px] w-full flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Mark Target Achieved ({habit.targetValue} {habit.unit})</span>
              </button>
            )}
          </div>
        )}

        {/* Type: Time */}
        {habit.type === 'time' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* Log current time button */}
              <button
                type="button"
                onClick={handleTimeNow}
                disabled={isSubmitting}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Log Current Time</span>
              </button>

              {/* Time Picker */}
              <input
                type="time"
                value={typeof actualValue === 'string' ? actualValue : ''}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Quick On Time Toggle */}
            <button
              type="button"
              onClick={() => handleTimeChange(String(habit.targetValue))}
              disabled={isSubmitting}
              className={`w-full min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors ${
                completed
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>
                {completed ? 'Logged On Time' : `Mark Done at Target (${habit.targetValue})`}
              </span>
            </button>
          </div>
        )}

        {/* Today's Earned-Score Placeholder Footer */}
        <div className="mt-3 flex items-center justify-between pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Today's Score:</span>
          </span>

          <span
            className={`font-semibold ${
              completed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {completed
              ? `+${habit.pointValue} pts (Completed)`
              : completionPercentage > 0
              ? `+${Math.round((completionPercentage / 100) * habit.pointValue)} / ${habit.pointValue} pts`
              : `0 / ${habit.pointValue} pts (Pending)`}
          </span>
        </div>
      </div>
    </div>
  );
}
