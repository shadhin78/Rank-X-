import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Compass,
  Flame,
  Award,
  BookOpen,
  RefreshCw,
  PlusCircle,
  Lightbulb,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useAppStore } from '@/src/store';
import { programService } from '@/src/services/programService';
import { habitService, formatDateToIso } from '@/src/services/habitService';
import { scoringService } from '@/src/services/scoringService';
import {
  calculateDetailedProgramPace,
  calculateMultiStreaks,
  generateAnalyticsData,
} from '@/src/lib/scoring/paceAnalytics';
import type {
  StudyProgram,
  CustomHabit,
  DailyHabitLog,
  ScoreEvent,
  ProgressAnalyticsPayload,
} from '@/src/types';
import { ProgramPaceCard } from './components/ProgramPaceCard';
import { StreaksTrackerCard } from './components/StreaksTrackerCard';
import { AnalyticsChartsSection } from './components/AnalyticsChartsSection';
import { PerformanceInsightsSection } from './components/PerformanceInsightsSection';

export function AnalyticsPage() {
  const currentUser = useAppStore((state) => state.currentUser);

  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [habits, setHabits] = useState<CustomHabit[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyHabitLog[]>([]);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data efficiently
  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;

    setLoading(true);

    // 1. Subscribe to Programs
    const unsubPrograms = programService.subscribePrograms(uid, (list) => {
      setPrograms(list);
      setLoading(false);
    });

    // 2. Subscribe to Habits
    const unsubHabits = habitService.subscribeHabits(uid, (list) => {
      setHabits(list);
    });

    // 3. Subscribe to recent habit logs (only queries current user's logs)
    const unsubLogs = habitService.subscribeAllLogs(uid, (logs) => {
      setDailyLogs(logs);
    });

    return () => {
      unsubPrograms();
      unsubHabits();
      unsubLogs();
    };
  }, [currentUser?.uid]);

  // Derive multi-streaks and analytics data
  const chapterDates = programs.flatMap((p) => [p.updatedAt, p.createdAt]);

  const multiStreaks = calculateMultiStreaks(
    dailyLogs,
    chapterDates,
    new Date()
  );

  // Sync user's streak if higher
  if (currentUser?.streak && currentUser.streak > multiStreaks.overallStreak) {
    multiStreaks.overallStreak = currentUser.streak;
    multiStreaks.longestStreak = Math.max(multiStreaks.longestStreak, currentUser.streak);
  }

  const analyticsData: ProgressAnalyticsPayload = generateAnalyticsData(
    programs,
    habits,
    dailyLogs,
    scoreEvents,
    multiStreaks,
    new Date()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Progress Analytics"
        description="Comprehensive program pace projections, multi-streak consistency, and performance diagnostics."
        badge={
          <Badge variant="live" className="font-mono text-xs">
            🔥 {multiStreaks.overallStreak} Day Streak
          </Badge>
        }
        breadcrumbs={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      {/* 1. Visual Streaks Card (🔥 12 day streak + 4-way streak breakdown) */}
      <StreaksTrackerCard streaks={multiStreaks} />

      {/* 2. Interactive Time Series Trend Charts (Daily, Weekly, Monthly, Chapter, Habit, Streak, Pace) */}
      <AnalyticsChartsSection analytics={analyticsData} />

      {/* 3. Program Pace Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              <span>Program Pace Projections</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Evaluates elapsed vs remaining timeline to compute expected progress, pace percentages, and estimated completion dates.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs self-start sm:self-auto font-mono">
            {analyticsData.programPaces.length} Active Program{analyticsData.programPaces.length === 1 ? '' : 's'}
          </Badge>
        </div>

        {analyticsData.programPaces.length === 0 ? (
          <Card className="p-8 text-center text-xs text-zinc-500">
            No active study programs found. Enroll in a program to monitor your pace!
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analyticsData.programPaces.map((pace) => (
              <ProgramPaceCard key={pace.programId} pace={pace} />
            ))}
          </div>
        )}
      </div>

      {/* 4. Performance Diagnostics Summary */}
      <PerformanceInsightsSection insights={analyticsData.insights} />
    </div>
  );
}
