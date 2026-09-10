import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Sparkles,
  CheckCircle2,
  Clock,
  LayoutGrid,
  CalendarDays,
  History,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, EmptyStateCard } from '@/src/components/ui/card';
import { useAppStore } from '@/src/store';
import { habitService, formatDateToIso } from '@/src/services/habitService';
import { HabitCard } from './components/HabitCard';
import { HabitFormDialog } from './components/HabitFormDialog';
import { WeeklyHabitsView } from './components/WeeklyHabitsView';
import { HabitHistoryView } from './components/HabitHistoryView';
import type { CustomHabit, DailyHabitLog } from '@/src/types';

type ActiveTab = 'today' | 'weekly' | 'history';

export function HabitsPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const updateScoreSummary = useAppStore((state) => state.updateScoreSummary);

  const [habits, setHabits] = useState<CustomHabit[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyHabitLog[]>([]);
  const [allLogs, setAllLogs] = useState<DailyHabitLog[]>([]);

  // Selected date for tracking (defaults to today)
  const todayIso = useMemo(() => formatDateToIso(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  // Dialog state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<CustomHabit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<CustomHabit | null>(null);
  const [isInitializingDefaults, setIsInitializingDefaults] = useState(false);

  // 1. Realtime subscription to habits
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = habitService.subscribeHabits(currentUser.uid, (list) => {
      setHabits(list);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // 2. Realtime subscription to selected date logs
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = habitService.subscribeDailyLogs(
      currentUser.uid,
      selectedDate,
      (logs) => {
        setDailyLogs(logs);
      }
    );

    return () => unsub();
  }, [currentUser?.uid, selectedDate]);

  // 3. Realtime subscription to all logs for streaks, weekly & history views
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = habitService.subscribeAllLogs(currentUser.uid, (logs) => {
      setAllLogs(logs);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  // Habits active on the selected day of week
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const selectedDayOfWeek = selectedDateObj.getDay();

  // Active habits scheduled for this day
  const scheduledHabits = useMemo(() => {
    return habits.filter((h) => {
      if (!h.isActive) return false;
      return h.activeDays.includes(selectedDayOfWeek);
    });
  }, [habits, selectedDayOfWeek]);

  // Date Navigation handlers
  const handleShiftDate = (days: number) => {
    const nextDate = new Date(selectedDateObj);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(formatDateToIso(nextDate));
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayIso);
  };

  // Record / edit habit progress
  const handleRecordHabit = async (habit: CustomHabit, actualValue: any) => {
    const res = await habitService.recordDailyLog(currentUser.uid, habit, selectedDate, actualValue);
    if (res?.scoringResult?.scoreSummary) {
      updateScoreSummary(res.scoringResult.scoreSummary);
    }
  };

  // Weekly view toggle handler
  const handleToggleHabitDay = async (
    habit: CustomHabit,
    dateIso: string,
    currentCompleted: boolean
  ) => {
    const targetVal =
      habit.type === 'boolean' || habit.type === 'checkbox'
        ? !currentCompleted
        : currentCompleted
        ? 0
        : habit.targetValue;
    const res = await habitService.recordDailyLog(currentUser.uid, habit, dateIso, targetVal);
    if (res?.scoringResult?.scoreSummary) {
      updateScoreSummary(res.scoringResult.scoreSummary);
    }
  };

  // Create habit
  const handleCreateHabit = async (
    data: Omit<CustomHabit, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>
  ) => {
    await habitService.createHabit(currentUser.uid, data);
    setCreateModalOpen(false);
  };

  // Update habit
  const handleUpdateHabit = async (data: any) => {
    if (!editingHabit) return;
    await habitService.updateHabit(editingHabit.id, currentUser.uid, data);
    setEditingHabit(null);
  };

  // Delete habit
  const handleConfirmDelete = async () => {
    if (!deletingHabit) return;
    await habitService.deleteHabit(deletingHabit.id, currentUser.uid);
    setDeletingHabit(null);
  };

  // Initialize standard habits (Wake Up, Study, Salat, Exercise)
  const handleInitializeDefaults = async () => {
    setIsInitializingDefaults(true);
    try {
      await habitService.seedDefaultHabits(currentUser.uid);
    } finally {
      setIsInitializingDefaults(false);
    }
  };

  // Today's summary statistics
  const totalScheduledToday = scheduledHabits.length;
  const completedLogsToday = dailyLogs.filter((l) => l.completed);
  const completedCountToday = completedLogsToday.length;
  const todayCompletionPercentage =
    totalScheduledToday > 0
      ? Math.round((completedCountToday / totalScheduledToday) * 100)
      : 0;

  // Projected earned score placeholder
  const todayEarnedScore = dailyLogs.reduce(
    (acc, curr) => acc + (curr.earnedPoints || 0),
    0
  );
  const todayPotentialMaxScore = scheduledHabits.reduce(
    (acc, curr) => acc + curr.pointValue,
    0
  );

  // Overall streak placeholder calculation
  const overallStreakDays = useMemo(() => {
    if (habits.length === 0 || allLogs.length === 0) return 0;
    // Calculate average or top streak among active habits
    const streaks = habits.map((h) => habitService.calculateStreak(h, allLogs).currentStreak);
    return Math.max(0, ...streaks);
  }, [habits, allLogs]);

  // Formatted display for selected date
  const isToday = selectedDate === todayIso;
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Daily Habits"
        description="Track your daily academic rituals, build unstoppable study momentum, and earn score multipliers."
        badge={
          <Badge variant="success" className="flex items-center gap-1 font-semibold">
            <Flame className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
            <span>{overallStreakDays} Day Streak (Placeholder)</span>
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>New Habit</span>
          </Button>
        }
      />

      {/* Date Navigation & View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs dark:bg-zinc-900 dark:border-zinc-800">
        {/* Date Navigator */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {formattedSelectedDate}
              </span>
            </div>

            {isToday ? (
              <Badge variant="live" className="text-[10px]">
                Today
              </Badge>
            ) : (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Jump to Today
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs: Today / Weekly / History */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl dark:bg-zinc-800 self-stretch sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Action Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Weekly View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History View</span>
          </button>
        </div>
      </div>

      {/* Daily Metric Overview Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Completion */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500 font-medium">Completion Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {todayCompletionPercentage}%
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {completedCountToday} of {totalScheduledToday} completed
          </p>
        </div>

        {/* Card 2: Today's Earned-Score Placeholder */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500 font-medium">Today's Score</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            +{todayEarnedScore} pts
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {todayPotentialMaxScore} pts maximum potential
          </p>
        </div>

        {/* Card 3: Streak Placeholder */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500 font-medium">Streak Multiplier</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {overallStreakDays} Days
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            1.2x boost active (Placeholder)
          </p>
        </div>

        {/* Card 4: Scheduled Rituals */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500 font-medium">Scheduled Today</span>
            <Zap className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {scheduledHabits.length} Tracks
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {habits.length} total created habits
          </p>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          {scheduledHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {scheduledHabits.map((habit) => {
                const log = dailyLogs.find((l) => l.habitId === habit.id);
                const streak = habitService.calculateStreak(habit, allLogs);

                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    log={log}
                    onRecord={handleRecordHabit}
                    onEdit={(h) => setEditingHabit(h)}
                    onDelete={(h) => setDeletingHabit(h)}
                    streakDays={streak.currentStreak}
                  />
                );
              })}
            </div>
          ) : habits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                No Habits Configured Yet
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5 leading-relaxed">
                Initialize the proven standard student habit stack (Wake Up at 06:30, 4h Study, 5 Salat, 30m Exercise) or build your custom habits.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInitializeDefaults}
                  disabled={isInitializingDefaults}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  <span>
                    {isInitializingDefaults
                      ? 'Creating Habits...'
                      : 'Load Standard Habit Stack'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  <span>Custom Habit</span>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyStateCard
              icon={Clock}
              title="No habits scheduled for this day"
              description={`None of your ${habits.length} habits are scheduled for ${formattedSelectedDate}. You can adjust their active days or create a new track.`}
              actionLabel="Add Habit for Today"
              onAction={() => setCreateModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* Weekly View */}
      {activeTab === 'weekly' && (
        <WeeklyHabitsView
          habits={habits}
          allLogs={allLogs}
          onToggleHabitDay={handleToggleHabitDay}
          onSelectDate={(iso) => {
            setSelectedDate(iso);
            setActiveTab('today');
          }}
        />
      )}

      {/* History View */}
      {activeTab === 'history' && (
        <HabitHistoryView
          habits={habits}
          allLogs={allLogs}
          onUpdateLog={async (habit, dateIso, val) => {
            await habitService.recordDailyLog(currentUser.uid, habit, dateIso, val);
          }}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Habit Create Modal */}
      <HabitFormDialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateHabit}
      />

      {/* Habit Edit Modal */}
      <HabitFormDialog
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={handleUpdateHabit}
        initialData={editingHabit}
      />

      {/* Delete Confirmation Modal */}
      {deletingHabit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              Delete Habit?
            </h3>

            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                "{deletingHabit.name}"
              </strong>
              ? This will remove the habit configuration. Past completion logs will remain in your archive.
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingHabit(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete Habit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
