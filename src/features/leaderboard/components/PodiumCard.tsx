import React from 'react';
import { Crown, Medal, Flame, BookOpen, CheckCircle, Gauge, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { LeaderboardRecord, RankMovement } from '@/src/types';
import { getRankMovement } from '@/src/lib/scoring/rankingEngine';

interface PodiumCardProps {
  record: LeaderboardRecord;
  place: 1 | 2 | 3;
  isCurrentUser: boolean;
}

export function PodiumCard({ record, place, isCurrentUser }: PodiumCardProps) {
  const movement: RankMovement = getRankMovement(record.rank, record.previousRank);

  // Stylistic archetypes adhering strictly to anti-slop & high-contrast rules
  const styles = {
    1: {
      cardClass: 'border-amber-400/50 bg-amber-500/5 dark:border-amber-400/40 dark:bg-amber-500/10 shadow-xs ring-1 ring-amber-400/20',
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      icon: <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400 inline mr-1" />,
      titleText: '1st Place',
      rankText: 'text-amber-700 dark:text-amber-300',
      avatarBorder: 'ring-2 ring-amber-400/50',
    },
    2: {
      cardClass: 'border-zinc-300 dark:border-zinc-700 bg-zinc-500/5 dark:bg-zinc-500/10',
      badgeClass: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
      icon: <Medal className="h-4 w-4 text-zinc-500 dark:text-zinc-400 inline mr-1" />,
      titleText: '2nd Place',
      rankText: 'text-zinc-700 dark:text-zinc-300',
      avatarBorder: 'ring-2 ring-zinc-300 dark:ring-zinc-600',
    },
    3: {
      cardClass: 'border-amber-700/30 bg-amber-900/5 dark:border-amber-700/30 dark:bg-amber-900/10',
      badgeClass: 'bg-amber-900/10 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-700/30',
      icon: <Medal className="h-4 w-4 text-amber-700 dark:text-amber-500 inline mr-1" />,
      titleText: '3rd Place',
      rankText: 'text-amber-800 dark:text-amber-400',
      avatarBorder: 'ring-2 ring-amber-700/40',
    },
  }[place];

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all flex flex-col justify-between ${styles.cardClass} ${
        isCurrentUser ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.badgeClass}`}
        >
          {styles.icon}
          {styles.titleText}
        </span>

        {/* Movement Indicator */}
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            movement.type === 'up'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              : movement.type === 'down'
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
          }`}
          title={`Movement: was rank #${record.previousRank || record.rank}`}
        >
          {movement.type === 'up' && <ArrowUp className="h-3 w-3" />}
          {movement.type === 'down' && <ArrowDown className="h-3 w-3" />}
          {movement.type === 'same' && <Minus className="h-3 w-3" />}
          {movement.text}
        </span>
      </div>

      {/* User Information */}
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-sm ${styles.avatarBorder}`}
        >
          {record.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-base">
              {record.displayName}
            </h3>
            {isCurrentUser && (
              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            @{record.username}
          </p>
        </div>
      </div>

      {/* Primary Metric: Total Points */}
      <div className="mb-4 rounded-lg bg-white/70 p-3 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Total Performance
        </p>
        <p className={`text-2xl font-black tracking-tight ${styles.rankText}`}>
          {record.totalPoints.toLocaleString()} <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">pts</span>
        </p>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">Study:</span>
          <span className="font-semibold">{record.studyPoints} pts</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">Habits:</span>
          <span className="font-semibold">{record.habitPoints} pts</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">Streak:</span>
          <span className="font-semibold">{record.streak}d</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <Gauge className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">Pace:</span>
          <span className="font-semibold">{record.paceScore}%</span>
        </div>
      </div>
    </div>
  );
}
