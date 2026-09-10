import React from 'react';
import { motion } from 'motion/react';
import { Flame, BookOpen, CheckCircle, Gauge, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { LeaderboardRecord } from '@/src/types';
import { getRankMovement } from '@/src/lib/scoring/rankingEngine';

interface LeaderboardMobileListProps {
  records: LeaderboardRecord[];
  currentUserUid?: string;
}

export function LeaderboardMobileList({ records, currentUserUid }: LeaderboardMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {records.map((record) => {
        const isCurrent = record.uid === currentUserUid;
        const movement = getRankMovement(record.rank, record.previousRank);

        return (
          <motion.div
            key={record.uid}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`rounded-xl border p-4 transition-all ${
              isCurrent
                ? 'border-indigo-400 bg-indigo-50/50 shadow-xs dark:border-indigo-600 dark:bg-indigo-950/40'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60'
            }`}
          >
            {/* Top row: Rank, User, Movement */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    record.rank === 1
                      ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400/50 dark:bg-amber-950 dark:text-amber-200'
                      : record.rank === 2
                      ? 'bg-zinc-200 text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200'
                      : record.rank === 3
                      ? 'bg-amber-900/10 text-amber-900 ring-1 ring-amber-700/30 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  #{record.rank}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm">
                      {record.displayName}
                    </span>
                    {isCurrent && (
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    @{record.username}
                  </p>
                </div>
              </div>

              {/* Movement badge */}
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-xs shrink-0 ${
                  movement.type === 'up'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : movement.type === 'down'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {movement.type === 'up' && <ArrowUp className="h-3 w-3" />}
                {movement.type === 'down' && <ArrowDown className="h-3 w-3" />}
                {movement.type === 'same' && <Minus className="h-3 w-3" />}
                {movement.text}
              </span>
            </div>

            {/* Middle: Total points bar */}
            <div className="flex items-baseline justify-between mb-3 border-b border-zinc-100 pb-2.5 dark:border-zinc-800/60">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Score
              </span>
              <div className="text-right">
                <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  {record.totalPoints.toLocaleString()}
                </span>
                <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">pts</span>
              </div>
            </div>

            {/* Bottom Row: Secondary metrics grid */}
            <div className="grid grid-cols-4 gap-1 text-[11px] text-center text-zinc-600 dark:text-zinc-400">
              <div className="rounded bg-zinc-50 py-1.5 dark:bg-zinc-800/40">
                <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                  <BookOpen className="h-3 w-3" />
                  <span className="font-bold">{record.studyPoints}</span>
                </div>
                <span className="text-[10px] text-zinc-400">Study</span>
              </div>
              <div className="rounded bg-zinc-50 py-1.5 dark:bg-zinc-800/40">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-bold">{record.habitPoints}</span>
                </div>
                <span className="text-[10px] text-zinc-400">Habits</span>
              </div>
              <div className="rounded bg-zinc-50 py-1.5 dark:bg-zinc-800/40">
                <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Gauge className="h-3 w-3" />
                  <span className="font-bold">{record.paceScore}%</span>
                </div>
                <span className="text-[10px] text-zinc-400">Pace</span>
              </div>
              <div className="rounded bg-zinc-50 py-1.5 dark:bg-zinc-800/40">
                <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                  <Flame className="h-3 w-3" />
                  <span className="font-bold">{record.streak}d</span>
                </div>
                <span className="text-[10px] text-zinc-400">Streak</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
