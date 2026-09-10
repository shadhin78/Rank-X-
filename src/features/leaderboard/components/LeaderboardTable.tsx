import React from 'react';
import { motion } from 'motion/react';
import { Flame, BookOpen, CheckCircle, Gauge, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { LeaderboardRecord } from '@/src/types';
import { getRankMovement } from '@/src/lib/scoring/rankingEngine';

interface LeaderboardTableProps {
  records: LeaderboardRecord[];
  currentUserUid?: string;
}

export function LeaderboardTable({ records, currentUserUid }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          <tr>
            <th className="px-5 py-3.5 w-16 text-center">Rank</th>
            <th className="px-5 py-3.5">User</th>
            <th className="px-5 py-3.5 text-right">Total Points</th>
            <th className="px-5 py-3.5 text-right">Study</th>
            <th className="px-5 py-3.5 text-right">Habits</th>
            <th className="px-5 py-3.5 text-center">Pace</th>
            <th className="px-5 py-3.5 text-center">Streak</th>
            <th className="px-5 py-3.5 text-center">Movement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
          {records.map((record) => {
            const isCurrent = record.uid === currentUserUid;
            const movement = getRankMovement(record.rank, record.previousRank);

            return (
              <motion.tr
                key={record.uid}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`group transition-colors ${
                  isCurrent
                    ? 'bg-indigo-50/60 font-medium dark:bg-indigo-950/30'
                    : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50'
                }`}
              >
                {/* Column 1: Rank */}
                <td className="whitespace-nowrap px-5 py-3.5 text-center">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      record.rank === 1
                        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400/50 dark:bg-amber-950 dark:text-amber-200'
                        : record.rank === 2
                        ? 'bg-zinc-200 text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200'
                        : record.rank === 3
                        ? 'bg-amber-900/10 text-amber-900 ring-1 ring-amber-700/30 dark:bg-amber-950 dark:text-amber-300'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    #{record.rank}
                  </span>
                </td>

                {/* Column 2: User */}
                <td className="whitespace-nowrap px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {record.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {record.displayName}
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        @{record.username}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Column 3: Total Points */}
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">
                    {record.totalPoints.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">pts</span>
                </td>

                {/* Column 4: Study */}
                <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs">
                  <div className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    <span>{record.studyPoints}</span>
                  </div>
                </td>

                {/* Column 5: Habits */}
                <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs">
                  <div className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{record.habitPoints}</span>
                  </div>
                </td>

                {/* Column 6: Pace */}
                <td className="whitespace-nowrap px-5 py-3.5 text-center text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                      record.paceScore >= 100
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : record.paceScore >= 80
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    <Gauge className="h-3 w-3" />
                    {record.paceScore}%
                  </span>
                </td>

                {/* Column 7: Streak */}
                <td className="whitespace-nowrap px-5 py-3.5 text-center text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Flame className="h-3.5 w-3.5 fill-amber-500/20" />
                    {record.streak}d
                  </span>
                </td>

                {/* Column 8: Movement */}
                <td className="whitespace-nowrap px-5 py-3.5 text-center text-xs">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-xs ${
                      movement.type === 'up'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : movement.type === 'down'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                    title={
                      movement.type !== 'same'
                        ? `Previous rank: #${record.previousRank}`
                        : 'Rank unchanged'
                    }
                  >
                    {movement.type === 'up' && <ArrowUp className="h-3 w-3" />}
                    {movement.type === 'down' && <ArrowDown className="h-3 w-3" />}
                    {movement.type === 'same' && <Minus className="h-3 w-3" />}
                    {movement.text}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
