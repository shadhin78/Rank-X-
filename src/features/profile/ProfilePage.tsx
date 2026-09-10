import React from 'react';
import { User, ShieldCheck, Flame, Trophy, Award, KeyRound, Shield } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { useAppStore } from '@/src/store';
import { authService } from '@/src/services/authService';

export function ProfilePage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const initials = (currentUser?.displayName || currentUser?.username || 'U')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        description="Review your account credentials, security tier, and performance statistics."
        badge={
          <Badge
            variant={
              currentUser?.accountStatus === 'approved'
                ? 'success'
                : currentUser?.accountStatus === 'pending'
                ? 'warning'
                : 'danger'
            }
          >
            {currentUser?.accountStatus ? `Status: ${currentUser.accountStatus}` : 'Member'}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shadow-md dark:bg-indigo-500">
              {initials}
            </div>
            <CardTitle className="mt-3 text-lg">{currentUser?.displayName || 'Student'}</CardTitle>
            <CardDescription className="text-xs font-mono text-zinc-500">
              @{currentUser?.username || 'username'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Account Role</span>
                <Badge variant={currentUser?.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                  {currentUser?.role === 'admin' ? '👑 Admin' : 'Student'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Account Status</span>
                <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">
                  {currentUser?.accountStatus || 'approved'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Auth Method</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Username + Hashed PIN
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Member Since</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full text-xs text-red-600 dark:text-red-400"
                onClick={async () => {
                  await authService.logout();
                  setCurrentUser(null);
                  window.location.href = '/login';
                }}
              >
                Sign Out from Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges and Milestones */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
            <CardDescription>
              Score metrics calculated securely across subjects, chapters, and habits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-[11px] text-zinc-500 font-medium">Total Score</span>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {currentUser?.totalPoints ?? 0}
                </p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Leaderboard pts</span>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-[11px] text-zinc-500 font-medium">Study Score</span>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {currentUser?.studyPoints ?? 0}
                </p>
                <span className="text-[10px] text-zinc-400">Chapters finished</span>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-[11px] text-zinc-500 font-medium">Habit Score</span>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {currentUser?.habitPoints ?? 0}
                </p>
                <span className="text-[10px] text-zinc-400">Routine executions</span>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-[11px] text-zinc-500 font-medium">Day Streak</span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Flame className="h-5 w-5" />
                  {currentUser?.streak ?? 0}d
                </p>
                <span className="text-[10px] text-zinc-400">Active streak</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Global Ranking</p>
                  <p className="text-[11px] text-zinc-500">Realtime sync with active cohort</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Immutable Metrics</p>
                  <p className="text-[11px] text-zinc-500">Protected by Firestore ABAC rules</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
