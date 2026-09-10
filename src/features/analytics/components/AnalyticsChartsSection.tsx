import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  CheckCircle2,
  Flame,
  Compass,
  Award,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { LightweightAreaChart, LightweightBarChart } from '@/src/components/charts';
import type { ProgressAnalyticsPayload } from '@/src/types';

interface AnalyticsChartsSectionProps {
  analytics: ProgressAnalyticsPayload;
}

type ChartTab =
  | 'points'
  | 'chapters'
  | 'habits'
  | 'streaks'
  | 'pace';

export function AnalyticsChartsSection({ analytics }: AnalyticsChartsSectionProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('points');
  const [pointsTimeframe, setPointsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Computed summary metrics
  const totalDailyPoints = analytics.dailyPoints.reduce((acc, d) => acc + d.value, 0);
  const avgDailyPoints = Math.round(totalDailyPoints / Math.max(1, analytics.dailyPoints.length));

  const totalCompletedInWindow = analytics.chapterCompletionTrend.reduce((acc, d) => acc + d.value, 0);
  const avgHabitConsistency = Math.round(
    analytics.habitCompletionTrend.reduce((acc, d) => acc + d.value, 0) /
      Math.max(1, analytics.habitCompletionTrend.length)
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Interactive Progress Analytics</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Deterministic historical trajectories, velocity curves, and consistency metrics.
            </CardDescription>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 p-1">
            <button
              onClick={() => setActiveTab('points')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'points'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Points Trends
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'chapters'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Chapter Completion
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'habits'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Habit Completion
            </button>
            <button
              onClick={() => setActiveTab('streaks')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'streaks'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Streak History
            </button>
            <button
              onClick={() => setActiveTab('pace')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'pace'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Pace History
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* TAB 1: Points Trends (Daily, Weekly, Monthly) */}
        {activeTab === 'points' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Score Points Earned Over Time</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Avg {avgDailyPoints} pts/day
                  </Badge>
                </h4>
                <p className="text-xs text-zinc-500">
                  Includes study chapter points, verified habit check-ins, and streak milestone rewards.
                </p>
              </div>

              {/* Daily / Weekly / Monthly Switcher */}
              <div className="flex items-center gap-1 self-start sm:self-auto border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 text-xs">
                <button
                  onClick={() => setPointsTimeframe('daily')}
                  className={`px-2 py-0.5 rounded ${
                    pointsTimeframe === 'daily'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setPointsTimeframe('weekly')}
                  className={`px-2 py-0.5 rounded ${
                    pointsTimeframe === 'weekly'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPointsTimeframe('monthly')}
                  className={`px-2 py-0.5 rounded ${
                    pointsTimeframe === 'monthly'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {pointsTimeframe === 'daily' && (
              <LightweightAreaChart
                data={analytics.dailyPoints}
                height={220}
                color="#6366f1"
                unit="pts"
              />
            )}
            {pointsTimeframe === 'weekly' && (
              <LightweightBarChart
                data={analytics.weeklyPoints}
                height={220}
                barColor="#4f46e5"
                unit="pts"
              />
            )}
            {pointsTimeframe === 'monthly' && (
              <LightweightBarChart
                data={analytics.monthlyPoints}
                height={220}
                barColor="#4338ca"
                unit="pts"
              />
            )}
          </div>
        )}

        {/* TAB 2: Chapter Completion Trend */}
        {activeTab === 'chapters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Chapter Completion Trend
                </h4>
                <p className="text-xs text-zinc-500">
                  Daily chapters finished across all enrolled study curricula.
                </p>
              </div>
              <Badge variant="success" className="text-xs">
                {totalCompletedInWindow} completed in last 14d
              </Badge>
            </div>

            <LightweightBarChart
              data={analytics.chapterCompletionTrend}
              height={220}
              barColor="#10b981"
              unit="chap"
            />
          </div>
        )}

        {/* TAB 3: Habit Completion Trend */}
        {activeTab === 'habits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Daily Habit Consistency Trend
                </h4>
                <p className="text-xs text-zinc-500">
                  Percentage of scheduled daily habits successfully checked in.
                </p>
              </div>
              <Badge variant="warning" className="text-xs">
                {avgHabitConsistency}% 14-day average
              </Badge>
            </div>

            <LightweightBarChart
              data={analytics.habitCompletionTrend}
              height={220}
              barColor="#f59e0b"
              unit="%"
              maxValOverride={100}
            />
          </div>
        )}

        {/* TAB 4: Streak History */}
        {activeTab === 'streaks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Streak Progression History</span>
                </h4>
                <p className="text-xs text-zinc-500">
                  Consecutive active study and habit streak days maintained over time.
                </p>
              </div>
              <Badge variant="warning" className="text-xs">
                🔥 {analytics.streaks.overallStreak} days current
              </Badge>
            </div>

            <LightweightAreaChart
              data={analytics.streakHistory}
              height={220}
              color="#f97316"
              unit="days"
            />
          </div>
        )}

        {/* TAB 5: Pace History */}
        {activeTab === 'pace' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-indigo-500" />
                  <span>Program Pace History</span>
                </h4>
                <p className="text-xs text-zinc-500">
                  Relative pace delta percentage vs. target date deadlines.
                </p>
              </div>
              <Badge variant="default" className="text-xs">
                Pace Delta %
              </Badge>
            </div>

            <LightweightAreaChart
              data={analytics.paceHistory}
              height={220}
              color="#6366f1"
              unit="%"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
