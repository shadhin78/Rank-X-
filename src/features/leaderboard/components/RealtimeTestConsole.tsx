import React, { useState } from 'react';
import { Zap, RotateCcw, Activity, Users, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { leaderboardService } from '@/src/services/leaderboardService';
import type { LeaderboardRecord } from '@/src/types';

interface RealtimeTestConsoleProps {
  records: LeaderboardRecord[];
  isRealtimeConnected: boolean;
  onRefresh?: () => void;
}

export function RealtimeTestConsole({
  records,
  isRealtimeConnected,
}: RealtimeTestConsoleProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('u_jordan_06');
  const [customDelta, setCustomDelta] = useState<number>(50);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const selectedUser = records.find((r) => r.uid === selectedUserId) || records[0];

  const handleApplyDelta = async (delta: number, category: 'study' | 'habit') => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      await leaderboardService.simulateScoreChange({
        userId: selectedUser.uid,
        deltaStudyPoints: category === 'study' ? delta : 0,
        deltaHabitPoints: category === 'habit' ? delta : 0,
        deltaStreak: delta > 0 ? 1 : 0,
      });

      setLastNotification(
        `Updated ${selectedUser.displayName}: ${delta > 0 ? '+' : ''}${delta} ${category} pts!`
      );
      setTimeout(() => setLastNotification(null), 4000);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    setIsUpdating(true);
    try {
      await leaderboardService.resetLeaderboard();
      setLastNotification('Leaderboard reset to default baseline.');
      setTimeout(() => setLastNotification(null), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-4">
        {/* Header & Realtime Connection Status */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Realtime Verification Console
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Badge variant="outline" className="text-[11px] font-medium">
              Multi-Device / Tab Live Sync
            </Badge>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Verify multi-user realtime ranking: open StudyRank in a second tab or window, select <strong>Jordan Blake (Test User A)</strong> or <strong>Elena Rostova (Test User B)</strong> below, and click <span className="font-semibold text-zinc-800 dark:text-zinc-200">+100 Points</span>. The leaderboard re-ranks immediately on all connected screens without page reload.
        </p>

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* User selector */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Target Test User:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {records.map((r) => (
                <option key={r.uid} value={r.uid}>
                  #{r.rank} {r.displayName} ({r.totalPoints} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Quick point triggers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => handleApplyDelta(50, 'study')}
              className="text-xs font-semibold"
            >
              +50 Study
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => handleApplyDelta(25, 'habit')}
              className="text-xs font-semibold"
            >
              +25 Habit
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdating}
              onClick={() => handleApplyDelta(100, 'study')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              +100 Boost
            </Button>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={handleReset}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Baseline
            </Button>
          </div>
        </div>

        {/* Live Notification Feedback */}
        {lastNotification && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{lastNotification}</span>
          </div>
        )}
      </div>
    </div>
  );
}
