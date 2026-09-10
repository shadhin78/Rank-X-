import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Medal,
  Search,
  Filter,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  RotateCw,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { useAppStore } from '@/src/store';
import {
  leaderboardService,
  type LeaderboardSubscriptionData,
} from '@/src/services/leaderboardService';
import type { LeaderboardRecord, LeaderboardLimit } from '@/src/types';
import { PodiumCard } from './components/PodiumCard';
import { LeaderboardTable } from './components/LeaderboardTable';
import { LeaderboardMobileList } from './components/LeaderboardMobileList';
import { CurrentUserBanner } from './components/CurrentUserBanner';
import { RealtimeTestConsole } from './components/RealtimeTestConsole';

export function LeaderboardPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentUid = currentUser?.uid || 'uid_alex_02'; // default demo user Alex Rivera

  // Filter state
  const [limitCount, setLimitCount] = useState<LeaderboardLimit>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTestConsole, setShowTestConsole] = useState<boolean>(false);

  // Realtime subscription data
  const [data, setData] = useState<LeaderboardSubscriptionData>({
    records: [],
    userRecord: null,
    userRank: 0,
    totalCount: 0,
    pointsToNext: { pointsNeeded: 0, userAhead: null, isLeader: false },
    isRealtimeConnected: true,
  });

  // Subscribe to realtime updates via Firestore onSnapshot
  useEffect(() => {
    const unsubscribe = leaderboardService.subscribeLeaderboard(
      {
        limitCount,
        currentUserId: currentUid,
      },
      (freshData) => {
        setData(freshData);
      },
      (error) => {
        console.warn('[LeaderboardPage] Realtime subscription notice:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [limitCount, currentUid]);

  // Filtered records for search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return data.records;
    const query = searchQuery.toLowerCase().trim();
    return data.records.filter(
      (r) =>
        r.displayName.toLowerCase().includes(query) ||
        r.username.toLowerCase().includes(query)
    );
  }, [data.records, searchQuery]);

  // Top 3 for podium
  const topThree = useMemo(() => {
    return data.records.slice(0, 3);
  }, [data.records]);

  // Determine if current user is outside current slice
  const isUserOutsideSlice = useMemo(() => {
    if (!data.userRecord) return false;
    return !data.records.some((r) => r.uid === data.userRecord?.uid);
  }, [data.records, data.userRecord]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Global Leaderboard"
        description="Authoritative realtime rankings based on verified study progress and consistent habits."
        badge={
          <Badge variant="live" className="flex items-center gap-1.5 py-1 px-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Realtime onSnapshot</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTestConsole((prev) => !prev)}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>{showTestConsole ? 'Hide Test Console' : '🧪 Test Realtime Sync'}</span>
              {showTestConsole ? (
                <ChevronUp className="h-3 w-3 ml-0.5" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-0.5" />
              )}
            </Button>
          </div>
        }
      />

      {/* Realtime Multi-User Testing Console */}
      {showTestConsole && (
        <RealtimeTestConsole
          records={data.records}
          isRealtimeConnected={data.isRealtimeConnected}
        />
      )}

      {/* Current User Standing Banner */}
      <CurrentUserBanner
        userRecord={data.userRecord}
        userRank={data.userRank}
        pointsToNext={data.pointsToNext}
        isOutsideTopSlice={isUserOutsideSlice}
      />

      {/* Top 3 Podium Cards */}
      {topThree.length >= 3 && !searchQuery && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Current Leaders
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 2nd Place (Silver) */}
            <div className="order-2 md:order-1">
              <PodiumCard
                record={topThree[1]}
                place={2}
                isCurrentUser={topThree[1].uid === currentUid}
              />
            </div>

            {/* 1st Place (Gold) */}
            <div className="order-1 md:order-2">
              <PodiumCard
                record={topThree[0]}
                place={1}
                isCurrentUser={topThree[0].uid === currentUid}
              />
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="order-3">
              <PodiumCard
                record={topThree[2]}
                place={3}
                isCurrentUser={topThree[2].uid === currentUid}
              />
            </div>
          </div>
        </div>
      )}

      {/* Standings Table & Filters */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle>Standings</CardTitle>
            <CardDescription>
              {data.totalCount} active peers ranked by points and strict tie-breakers
            </CardDescription>
          </div>

          {/* Filter Controls: Top 10 / 25 / 50 and Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-36 sm:w-48 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Top N Selectors */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
              {([10, 25, 50] as LeaderboardLimit[]).map((limitVal) => (
                <button
                  key={limitVal}
                  type="button"
                  onClick={() => setLimitCount(limitVal)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    limitCount === limitVal
                      ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Top {limitVal}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <LeaderboardTable
              records={filteredRecords}
              currentUserUid={currentUid}
            />
          </div>

          {/* Mobile Compact Cards View */}
          <div className="p-4 md:hidden">
            <LeaderboardMobileList
              records={filteredRecords}
              currentUserUid={currentUid}
            />
          </div>

          {/* Empty Search State */}
          {filteredRecords.length === 0 && (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <Trophy className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
              <p className="font-semibold text-sm">No participants match "{searchQuery}"</p>
              <p className="text-xs mt-1">Try a different search term or clear the filter.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
