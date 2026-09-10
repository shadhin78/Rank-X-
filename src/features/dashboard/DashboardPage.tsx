import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Flame,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { StatCard, Card, CardHeader, CardTitle, CardDescription, CardContent, EmptyStateCard } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useAppStore } from '@/src/store';
import { getFirebaseStatus } from '@/src/lib/firebase';
import { programService } from '@/src/services/programService';
import { habitService, formatDateToIso } from '@/src/services/habitService';
import type { StudyProgram, CustomHabit, DailyHabitLog } from '@/src/types';

export function DashboardPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const fbStatus = getFirebaseStatus();
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [habits, setHabits] = useState<CustomHabit[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyHabitLog[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubPrograms = programService.subscribePrograms(currentUser.uid, (list) => {
      setPrograms(list);
    });

    const todayIso = formatDateToIso(new Date());
    const unsubHabits = habitService.subscribeHabits(currentUser.uid, (list) => {
      setHabits(list);
    });
    const unsubLogs = habitService.subscribeDailyLogs(currentUser.uid, todayIso, (logs) => {
      setDailyLogs(logs);
    });

    return () => {
      unsubPrograms();
      unsubHabits();
      unsubLogs();
    };
  }, [currentUser?.uid]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${currentUser?.displayName || 'Scholar'}`}
        description="Here is an overview of your study programs, daily habits, and ranking performance."
        badge={<Badge variant="success">Active Session</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/programs">
              <Button variant="outline" size="sm">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Browse Programs
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="primary" size="sm">
                <Trophy className="mr-1.5 h-3.5 w-3.5" />
                View Leaderboard
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary Productivity Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Performance Points"
          value={currentUser?.totalPoints?.toLocaleString() || '1,420'}
          description="accumulated study & habits"
          trend={{ value: '+180 pts this week', isPositive: true }}
          icon={Trophy}
        />
        <StatCard
          title="Study Streak"
          value={`${currentUser?.streak ?? 14} Days`}
          description="personal best: 21 days"
          trend={{ value: 'Flame active', isPositive: true }}
          icon={Flame}
        />
        <StatCard
          title="Active Programs"
          value="3 Programs"
          description="12 chapters pending"
          trend={{ value: '2 in progress', isPositive: true }}
          icon={BookOpen}
        />
        <StatCard
          title="Global Ranking"
          value="#2"
          description="in friends cohort"
          trend={{ value: '+1 rank up', isPositive: true }}
          icon={TrendingUp}
        />
      </div>

      {/* Secondary Dashboard Modules: Split Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Active Programs & Habits Overview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Programs Overview Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Current Study Programs</CardTitle>
                <CardDescription>
                  Your enrolled tracks, chapters, and completion milestones
                </CardDescription>
              </div>
              <Link to="/programs">
                <Button variant="ghost" size="sm" className="text-xs">
                  <span>View All</span>
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {programs.length > 0 ? (
                programs.slice(0, 3).map((prog) => {
                  const pace = programService.getPaceStatus(prog);
                  return (
                    <Link
                      key={prog.id}
                      to={`/programs/${prog.id}`}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-100 p-4 transition-all hover:bg-zinc-50/70 hover:border-zinc-200 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40 sm:flex-row sm:items-center sm:justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 transition-colors">
                            {prog.name}
                          </span>
                          <Badge variant={pace.variant} className="text-[10px]">
                            {pace.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {prog.description || `${prog.totalSubjects} subjects in curriculum`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right text-xs">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {prog.progressPercentage}%
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-500 block text-[10px]">
                            {prog.completedChapters}/{prog.totalChapters} done
                          </span>
                        </div>
                        <div className="h-2 w-16 rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              prog.progressPercentage === 100
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: `${prog.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <span>No study programs created yet. </span>
                  <Link
                    to="/programs"
                    className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400 inline-flex items-center gap-1 ml-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create a Program</span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Habits Preview Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Today's Habits</CardTitle>
                <CardDescription>
                  Daily routines contributing to your score multiplier
                </CardDescription>
              </div>
              <Link to="/habits">
                <Button variant="ghost" size="sm" className="text-xs">
                  <span>Manage</span>
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {habits.length > 0 ? (
                habits.slice(0, 3).map((habit) => {
                  const log = dailyLogs.find((l) => l.habitId === habit.id);
                  const isDone = log?.completed;

                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        isDone
                          ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                          : 'border-zinc-100 dark:border-zinc-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser?.uid) return;
                            const nextVal =
                              habit.type === 'boolean' || habit.type === 'checkbox'
                                ? !isDone
                                : isDone
                                ? 0
                                : habit.targetValue;
                            habitService.recordDailyLog(
                              currentUser.uid,
                              habit,
                              formatDateToIso(new Date()),
                              nextVal
                            );
                          }}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform active:scale-95 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <span
                            className={`text-sm font-semibold ${
                              isDone
                                ? 'text-emerald-950 dark:text-emerald-300 line-through decoration-emerald-500/50'
                                : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {habit.name}
                          </span>
                          <span className="text-xs text-zinc-400 block">
                            Target: {String(habit.targetValue)} {habit.unit || ''}
                          </span>
                        </div>
                      </div>
                      <Badge variant={isDone ? 'success' : 'secondary'}>
                        +{habit.pointValue} pts
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5">
                  <p className="text-xs text-zinc-500 mb-2">No habits configured yet</p>
                  <Link to="/habits">
                    <Button variant="outline" size="sm" className="text-xs">
                      Configure Habits
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Leaderboard Snapshot & Foundation Status */}
        <div className="space-y-6">
          {/* Quick Rank Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Leaderboard Snapshot</CardTitle>
                <Badge variant="live" className="text-[10px]">
                  Realtime
                </Badge>
              </div>
              <CardDescription>Top friends ranking this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {/* Rank 1 */}
                <div className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Sarah Chen
                      </p>
                      <span className="text-[11px] text-zinc-400">18d streak</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    1,640 pts
                  </span>
                </div>

                {/* Rank 2 (You) */}
                <div className="flex items-center justify-between rounded-lg bg-indigo-50/70 p-2 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                        Alex Rivera (You)
                      </p>
                      <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                        14d streak
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    1,420 pts
                  </span>
                </div>

                {/* Rank 3 */}
                <div className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Marcus Vance
                      </p>
                      <span className="text-[11px] text-zinc-400">9d streak</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    1,180 pts
                  </span>
                </div>
              </div>

              <Link to="/leaderboard" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Full Realtime Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Project Architecture & Firebase Foundation Info Card */}
          <Card className="border-indigo-200/50 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-sm">Architecture Ready</CardTitle>
              </div>
              <CardDescription className="text-xs">
                StudyRank Step 1 Foundation verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-zinc-800/60">
                <span>Firebase Project:</span>
                <span className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                  {fbStatus.projectId}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-zinc-800/60">
                <span>Routing System:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  12 Routes Active
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Responsive Shell:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Desktop + Mobile Nav
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
