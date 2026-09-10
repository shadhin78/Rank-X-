/**
 * Global Realtime Ranking & Tie-Breaker Engine
 *
 * Enforces authoritative StudyRank ranking specification:
 * - Primary ranking: highest totalPoints first
 * - Tie-breakers:
 *   1. Higher completion performance (completionScore)
 *   2. Higher consistency (streak, then paceScore)
 *   3. Earlier achievement (updatedAt ascending timestamp)
 */

import type { LeaderboardRecord, RankMovement } from '@/src/types';

/**
 * Compare two leaderboard records with primary points and strict tie-breakers.
 * Returns negative if record A is ranked higher than B.
 */
export function compareLeaderboardRecords(a: LeaderboardRecord, b: LeaderboardRecord): number {
  // Primary: highest totalPoints first
  if (b.totalPoints !== a.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }

  // Tie-breaker 1: higher completion performance
  const compA = typeof a.completionScore === 'number' ? a.completionScore : 0;
  const compB = typeof b.completionScore === 'number' ? b.completionScore : 0;
  if (compB !== compA) {
    return compB - compA;
  }

  // Tie-breaker 2: higher consistency (streak first, then paceScore)
  const streakA = typeof a.streak === 'number' ? a.streak : 0;
  const streakB = typeof b.streak === 'number' ? b.streak : 0;
  if (streakB !== streakA) {
    return streakB - streakA;
  }

  const paceA = typeof a.paceScore === 'number' ? a.paceScore : 0;
  const paceB = typeof b.paceScore === 'number' ? b.paceScore : 0;
  if (paceB !== paceA) {
    return paceB - paceA;
  }

  // Tie-breaker 3: earlier achievement (earlier timestamp achieved higher rank)
  const timeA = new Date(a.updatedAt || 0).getTime() || 0;
  const timeB = new Date(b.updatedAt || 0).getTime() || 0;
  return timeA - timeB;
}

/**
 * Sorts and computes updated rank and previousRank for an array of leaderboard records.
 */
export function rankLeaderboardRecords(records: LeaderboardRecord[]): LeaderboardRecord[] {
  const sorted = [...records].sort(compareLeaderboardRecords);

  return sorted.map((record, index) => {
    const newRank = index + 1;
    // Retain previousRank if already assigned and different, or record.rank
    const prev = record.previousRank !== undefined && record.previousRank > 0
      ? record.previousRank
      : (record.rank > 0 ? record.rank : newRank);

    return {
      ...record,
      rank: newRank,
      previousRank: prev,
    };
  });
}

/**
 * Computes rank movement details between current rank and previousRank.
 * Formats exactly as requested:
 * ▲ 2
 * ▼ 1
 * ─
 */
export function getRankMovement(rank: number, previousRank: number): RankMovement {
  if (!previousRank || previousRank === 0 || previousRank === rank) {
    return { type: 'same', delta: 0, text: '─' };
  }

  if (previousRank > rank) {
    const delta = previousRank - rank;
    return { type: 'up', delta, text: `▲ ${delta}` };
  }

  const delta = rank - previousRank;
  return { type: 'down', delta, text: `▼ ${delta}` };
}

/**
 * Calculates points needed to reach the rank above the current user.
 */
export function getPointsToNextRank(
  currentUserRecord: LeaderboardRecord | null,
  allRankedRecords: LeaderboardRecord[]
): {
  pointsNeeded: number;
  userAhead: LeaderboardRecord | null;
  isLeader: boolean;
  leadMargin?: number;
} {
  if (!currentUserRecord || allRankedRecords.length === 0) {
    return { pointsNeeded: 0, userAhead: null, isLeader: false };
  }

  const userIdx = allRankedRecords.findIndex((r) => r.uid === currentUserRecord.uid);
  if (userIdx === -1) {
    return { pointsNeeded: 0, userAhead: null, isLeader: false };
  }

  // If user is #1
  if (userIdx === 0) {
    const runnerUp = allRankedRecords[1];
    const leadMargin = runnerUp ? currentUserRecord.totalPoints - runnerUp.totalPoints : 0;
    return {
      pointsNeeded: 0,
      userAhead: null,
      isLeader: true,
      leadMargin: Math.max(0, leadMargin),
    };
  }

  const userAhead = allRankedRecords[userIdx - 1];
  // Points needed to strictly overtake: (pointsAhead - currentPoints) + 1
  // If points are equal, tie-breaker determines overtaking, so at least 1 point guarantees passing
  const delta = userAhead.totalPoints - currentUserRecord.totalPoints;
  const pointsNeeded = delta > 0 ? delta + 1 : 1;

  return {
    pointsNeeded,
    userAhead,
    isLeader: false,
  };
}
