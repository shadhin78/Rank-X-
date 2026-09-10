import React from 'react';
import { Trophy, TrendingUp, Target, Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { LeaderboardRecord } from '@/src/types';
import { getRankMovement } from '@/src/lib/scoring/rankingEngine';

interface CurrentUserBannerProps {
  userRecord: LeaderboardRecord | null;
  userRank: number;
  pointsToNext: {
    pointsNeeded: number;
    userAhead: LeaderboardRecord | null;
    isLeader: boolean;
    leadMargin?: number;
  };
  isOutsideTopSlice: boolean;
  onJumpToPosition?: () => void;
}

export function CurrentUserBanner({
  userRecord,
  userRank,
  pointsToNext,
  isOutsideTopSlice,
}: CurrentUserBannerProps) {
  if (!userRecord) return null;

  const movement = getRankMovement(userRecord.rank, userRecord.previousRank);

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isOutsideTopSlice
          ? 'border-indigo-400 bg-indigo-50/70 shadow-sm dark:border-indigo-600 dark:bg-indigo-950/40'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/80'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Your Rank & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-black text-white dark:bg-indigo-500 text-sm">
            #{userRank || userRecord.rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                Your Standing
              </h4>
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {userRecord.displayName}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-xs ${
                  movement.type === 'up'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : movement.type === 'down'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {movement.type === 'up' && <ArrowUp className="h-3 w-3" />}
                {movement.type === 'down' && <ArrowDown className="h-3 w-3" />}
                {movement.type === 'same' && <Minus className="h-3 w-3" />}
                {movement.text}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Score: <span className="font-bold text-zinc-900 dark:text-zinc-100">{userRecord.totalPoints.toLocaleString()} pts</span> · Streak: <span className="font-semibold text-amber-600 dark:text-amber-400">{userRecord.streak} days</span>
            </p>
          </div>
        </div>

        {/* Right: Milestone / Points to next rank */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3.5 py-2 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
          <Target className="h-4 w-4 text-indigo-500 shrink-0" />
          <div className="text-xs">
            {pointsToNext.isLeader ? (
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                👑 You're in 1st Place! Leading by {pointsToNext.leadMargin?.toLocaleString()} pts
              </p>
            ) : pointsToNext.userAhead ? (
              <p className="text-zinc-700 dark:text-zinc-300">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  +{pointsToNext.pointsNeeded} pts
                </span>{' '}
                needed to reach #{userRank - 1} (@{pointsToNext.userAhead.username})
              </p>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">Keep completing chapters to climb the ranks!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
