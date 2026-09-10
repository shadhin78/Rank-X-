import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy, Flame, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/src/store';
import { programService, seedDefaultProgramForUser } from '@/src/services/programService';
import { habitService, formatDateToIso } from '@/src/services/habitService';
import { leaderboardService } from '@/src/services/leaderboardService';
import { performanceService, type PerformanceSummary } from '@/src/services/performanceService';
import type { StudyProgram, CustomHabit, DailyHabitLog, LeaderboardRecord } from '@/src/types';
import {
  DashboardHeader,
  TodayProgressCard,
  TodayHabitsCard,
  ActiveProgramsCard,
  PerformanceSummaryCard,
  LeaderboardSnapshotCard,
} from './components';

export function DashboardPage() {
  const currentUser = useAppStore((state) => state.currentUser);

  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [habits, setHabits] = useState<CustomHabit[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyHabitLog[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<{
    records: LeaderboardRecord[];
    userRecord: LeaderboardRecord | null;
    userRank: number;
    pointsToNext: number;
  }>({
    records: [],
    userRecord: null,
    userRank: 0,
    pointsToNext: 0,
  });

  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary>({
    todayPoints: 0,
    thisWeekPoints: 0,
    thisMonthPoints: 0,
    studyPoints: currentUser?.studyPoints ?? 0,
    habitPoints: currentUser?.habitPoints ?? 0,
    totalPoints: currentUser?.totalPoints ?? 0,
    streak: currentUser?.streak ?? 1,
    rank: currentUser?.rank ?? 0,
  });

  const [isSeeding, setIsSeeding] = useState(false);

  // Realtime subscriptions
  useEffect(() => {
    if (!currentUser?.uid) return;

    const uid = currentUser.uid;
    const todayIso = formatDateToIso(new Date());

    // 1. Realtime Active Programs subscription (summary documents)
    const unsubPrograms = programService.subscribePrograms(uid, (list) => {
      setPrograms(list);
    });

    // 2. Realtime Habits subscription
    const unsubHabits = habitService.subscribeHabits(uid, (list) => {
      setHabits(list);
    });

    // 3. Realtime Today's Daily Habit Logs subscription (only queries date == todayIso)
    const unsubLogs = habitService.subscribeDailyLogs(uid, todayIso, (logs) => {
      setDailyLogs(logs);
    });

    // 4. Realtime Leaderboard Snapshot subscription (top 5 + current user standing)
    const unsubLeaderboard = leaderboardService.subscribeLeaderboard(
      { limitCount: 10, currentUserId: uid },
      (data) => {
        setLeaderboardData({
          records: data.records,
          userRecord: data.userRecord,
          userRank: data.userRank,
          pointsToNext: data.pointsToNext,
        });
      }
    );

    // 5. Realtime Performance Summary subscription
    const unsubPerformance = performanceService.subscribePerformanceSummary(
      uid,
      {
        totalPoints: currentUser.totalPoints,
        studyPoints: currentUser.studyPoints,
        habitPoints: currentUser.habitPoints,
        streak: currentUser.streak,
        rank: currentUser.rank,
      },
      (summary) => {
        setPerformanceSummary(summary);
      }
    );

    return () => {
      unsubPrograms();
      unsubHabits();
      unsubLogs();
      unsubLeaderboard();
      unsubPerformance();
    };
  }, [currentUser?.uid]);

  // Seed default curriculum if empty
  const handleSeedDefaultProgram = async () => {
    if (!currentUser?.uid || isSeeding) return;
    setIsSeeding(true);
    try {
      await programService.seedDefaultProgram(currentUser.uid);
    } catch (err) {
      console.error('[Dashboard] Failed to seed program:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Seed default habits if empty
  const handleSeedDefaultHabits = async () => {
    if (!currentUser?.uid || isSeeding) return;
    setIsSeeding(true);
    try {
      await habitService.seedDefaultHabits(currentUser.uid);
    } catch (err) {
      console.error('[Dashboard] Failed to seed habits:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Habit completion toggle
  const handleToggleHabit = async (habit: CustomHabit, isDone: boolean) => {
    if (!currentUser?.uid) return;
    const todayIso = formatDateToIso(new Date());

    let nextVal: any = isDone;
    if (habit.type === 'count' || habit.type === 'duration' || habit.type === 'number') {
      nextVal = isDone ? habit.targetValue : 0;
    } else if (habit.type === 'time') {
      nextVal = isDone ? habit.targetValue || 'Done' : false;
    }

    await habitService.recordDailyLog(currentUser.uid, habit, todayIso, nextVal);
  };

  // --- Derived Calculations ---
  const todayDay = new Date().getDay();
  const activeHabitsToday = habits.filter((h) => {
    if (h.isActive === false) return false;
    if (!h.activeDays || h.activeDays.length === 0) return true;
    return h.activeDays.includes(todayDay);
  });

  const completedHabitsToday = activeHabitsToday.filter(
    (h) => dailyLogs.find((l) => l.habitId === h.id)?.completed
  );

  const habitCompletion =
    activeHabitsToday.length > 0
      ? Math.round((completedHabitsToday.length / activeHabitsToday.length) * 100)
      : 100;

  const activePrograms = programs.filter(
    (p) => p.status === 'active' || p.status === undefined
  );
  const totalChapters = activePrograms.reduce(
    (sum, p) => sum + (p.totalChapters || 0),
    0
  );
  const completedChapters = activePrograms.reduce(
    (sum, p) => sum + (p.completedChapters || 0),
    0
  );

  const studyCompletion =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : activePrograms.length > 0
      ? 100
      : 0;

  const overallCompletion =
    activePrograms.length > 0 && activeHabitsToday.length > 0
      ? Math.round(studyCompletion * 0.5 + habitCompletion * 0.5)
      : activeHabitsToday.length > 0
      ? habitCompletion
      : studyCompletion;

  const rankToDisplay =
    leaderboardData.userRank ||
    leaderboardData.userRecord?.rank ||
    performanceSummary.rank ||
    currentUser?.rank ||
    0;

  const totalPointsToDisplay =
    leaderboardData.userRecord?.totalPoints ??
    performanceSummary.totalPoints ??
    currentUser?.totalPoints ??
    0;

  const streakToDisplay =
    leaderboardData.userRecord?.streak ??
    performanceSummary.streak ??
    currentUser?.streak ??
    1;

  return (
    <div id="dashboard-page" className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader
        displayName={currentUser?.displayName || 'Scholar'}
        rank={rankToDisplay}
        totalPoints={totalPointsToDisplay}
        streak={streakToDisplay}
      />

      {/* Mobile-Prioritized Quick Targets Banner (Visible on mobile/tablet) */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {/* Today's Habits Target */}
        <div
          id="mobile-habits-target"
          className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>Today's Habits</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {completedHabitsToday.length}/{activeHabitsToday.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {habitCompletion}%
            </span>
          </div>
        </div>

        {/* Today's Study Target */}
        <div
          id="mobile-study-target"
          className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs mb-1">
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            <span>Study Target</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {completedChapters}/{totalChapters || 0}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {studyCompletion}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Today's Progress Card */}
      <TodayProgressCard
        studyCompletion={studyCompletion}
        habitCompletion={habitCompletion}
        overallCompletion={overallCompletion}
        studyDetail={
          totalChapters > 0
            ? `${completedChapters} of ${totalChapters} chapters completed`
            : 'Curriculum targets'
        }
        habitDetail={
          activeHabitsToday.length > 0
            ? `${completedHabitsToday.length} of ${activeHabitsToday.length} active habits done`
            : 'Daily habits'
        }
      />

      {/* Main Responsive Grid Layout: Left 2 Cols (Habits & Programs), Right 1 Col (Summary & Snapshot) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols on lg): Today's Habits & Active Programs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Habits */}
          <TodayHabitsCard
            habits={habits}
            dailyLogs={dailyLogs}
            onToggleHabit={handleToggleHabit}
            onSeedDefaults={handleSeedDefaultHabits}
            isLoading={isSeeding}
          />

          {/* Active Programs */}
          <ActiveProgramsCard
            programs={programs}
            onSeedDefaultProgram={handleSeedDefaultProgram}
            isLoading={isSeeding}
          />
        </div>

        {/* Right Column (1 Col on lg): Performance Summary & Leaderboard Snapshot */}
        <div className="space-y-6">
          {/* Performance Summary */}
          <PerformanceSummaryCard
            todayPoints={performanceSummary.todayPoints}
            thisWeekPoints={performanceSummary.thisWeekPoints}
            thisMonthPoints={performanceSummary.thisMonthPoints}
            studyPoints={performanceSummary.studyPoints}
            habitPoints={performanceSummary.habitPoints}
            totalPoints={totalPointsToDisplay}
          />

          {/* Leaderboard Snapshot */}
          <LeaderboardSnapshotCard
            records={leaderboardData.records}
            currentUserId={currentUser?.uid}
            userRank={rankToDisplay}
            userRecord={leaderboardData.userRecord}
            pointsToNext={leaderboardData.pointsToNext}
          />
        </div>
      </div>
    </div>
  );
}
