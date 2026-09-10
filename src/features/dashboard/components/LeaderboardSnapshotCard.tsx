import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowUpRight, Flame, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import type { LeaderboardRecord } from '@/src/types';

interface LeaderboardSnapshotCardProps {
  records: LeaderboardRecord[];
  currentUserId?: string;
  userRank?: number;
  userRecord?: LeaderboardRecord | null;
  pointsToNext?: number;
}

export function LeaderboardSnapshotCard({
  records,
  currentUserId,
  userRank = 0,
  userRecord,
  pointsToNext = 0,
}: LeaderboardSnapshotCardProps) {
  // Take top 5
  const top5 = records.slice(0, 5);
  const isCurrentUserInTop5 = top5.some((r) => r.uid === currentUserId);

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold';
      case 2:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-bold';
      case 3:
        return 'bg-amber-900/10 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 border-amber-700/30 font-bold';
      default:
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 font-medium';
    }
  };

  return (
    <Card id="leaderboard-snapshot-card" className="border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-semibold">Leaderboard Snapshot</CardTitle>
          </div>
          <Badge variant="live" className="text-[10px]">
            Realtime
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Top 5 ranked scholars and your current standing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Top 5 list */}
        <div className="space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {top5.map((entry) => {
            const isMe = entry.uid === currentUserId;

            return (
              <div
                key={entry.uid}
                id={`leaderboard-top-${entry.rank}`}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                  isMe
                    ? 'bg-indigo-50/70 border border-indigo-200/60 dark:bg-indigo-950/40 dark:border-indigo-900/60'
                    : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${getRankBadgeClass(
                      entry.rank
                    )}`}
                  >
                    {entry.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isMe
                            ? 'text-indigo-950 dark:text-indigo-200'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {entry.displayName}
                      </span>
                      {isMe && (
                        <Badge variant="live" className="text-[9px] px-1.5 py-0">
                          You
                        </Badge>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Flame className="h-2.5 w-2.5 text-orange-500" />
                      {entry.streak}d streak
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      isMe
                        ? 'text-indigo-950 dark:text-indigo-200'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {entry.totalPoints.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* If user is NOT in the top 5, show a dedicated current user's standing block */}
        {!isCurrentUserInTop5 && (userRecord || userRank > 0) && (
          <div
            id="user-standing-row"
            className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
                  {userRank || userRecord?.rank || '-'}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {userRecord?.displayName || 'Your Standing'}
                    </span>
                    <Badge variant="live" className="text-[9px] px-1.5 py-0">
                      You
                    </Badge>
                  </div>
                  {pointsToNext > 0 ? (
                    <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                      {pointsToNext.toLocaleString()} pts to next rank
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {userRecord?.streak || 0}d streak
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                {(userRecord?.totalPoints || 0).toLocaleString()} pts
              </span>
            </div>
          </div>
        )}

        {/* Link: View Full Leaderboard */}
        <Link to="/leaderboard" id="link-view-full-leaderboard" className="block pt-1">
          <Button variant="outline" size="sm" className="w-full text-xs font-medium">
            <span>View Full Leaderboard</span>
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
