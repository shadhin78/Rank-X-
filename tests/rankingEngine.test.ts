import { describe, it, expect } from 'vitest';
import {
  compareLeaderboardRecords,
  rankLeaderboardRecords,
  getRankMovement,
  getPointsToNextRank,
} from '../src/lib/scoring/rankingEngine';
import type { LeaderboardRecord } from '../src/types';

describe('Ranking Engine & Tie-Breakers', () => {
  it('ranks by totalPoints descending as primary criteria', () => {
    const records: LeaderboardRecord[] = [
      {
        uid: 'u2',
        username: 'bob',
        displayName: 'Bob',
        totalPoints: 1200,
        studyPoints: 800,
        habitPoints: 400,
        streak: 10,
        paceScore: 85,
        completionScore: 70,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T10:00:00Z',
      },
      {
        uid: 'u1',
        username: 'alice',
        displayName: 'Alice',
        totalPoints: 1500,
        studyPoints: 1000,
        habitPoints: 500,
        streak: 12,
        paceScore: 90,
        completionScore: 80,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T10:00:00Z',
      },
    ];

    const ranked = rankLeaderboardRecords(records);
    expect(ranked[0].uid).toBe('u1');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].uid).toBe('u2');
    expect(ranked[1].rank).toBe(2);
  });

  it('uses completionScore as 1st tie-breaker when totalPoints are tied', () => {
    const records: LeaderboardRecord[] = [
      {
        uid: 'u1',
        username: 'alice',
        displayName: 'Alice',
        totalPoints: 1400,
        studyPoints: 900,
        habitPoints: 500,
        streak: 10,
        paceScore: 80,
        completionScore: 75,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T10:00:00Z',
      },
      {
        uid: 'u2',
        username: 'bob',
        displayName: 'Bob',
        totalPoints: 1400,
        studyPoints: 900,
        habitPoints: 500,
        streak: 10,
        paceScore: 80,
        completionScore: 85, // Higher completion performance
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T10:00:00Z',
      },
    ];

    const ranked = rankLeaderboardRecords(records);
    expect(ranked[0].uid).toBe('u2'); // Bob wins tie-breaker 1
    expect(ranked[1].uid).toBe('u1');
  });

  it('uses consistency (streak, then paceScore) as 2nd tie-breaker', () => {
    const records: LeaderboardRecord[] = [
      {
        uid: 'u1',
        username: 'alice',
        displayName: 'Alice',
        totalPoints: 1400,
        studyPoints: 900,
        habitPoints: 500,
        streak: 15, // Higher streak
        paceScore: 80,
        completionScore: 80,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T10:00:00Z',
      },
      {
        uid: 'u2',
        username: 'bob',
        displayName: 'Bob',
        totalPoints: 1400,
        studyPoints: 900,
        habitPoints: 500,
        streak: 10,
        paceScore: 80,
        completionScore: 80,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T10:00:00Z',
      },
    ];

    const ranked = rankLeaderboardRecords(records);
    expect(ranked[0].uid).toBe('u1'); // Alice wins tie-breaker 2
  });

  it('uses earlier achievement (updatedAt) as 3rd tie-breaker', () => {
    const records: LeaderboardRecord[] = [
      {
        uid: 'u2_later',
        username: 'bob',
        displayName: 'Bob',
        totalPoints: 1400,
        studyPoints: 900,
        habitPoints: 500,
        streak: 10,
        paceScore: 80,
        completionScore: 80,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-09T12:00:00Z', // Later
      },
      {
        uid: 'u1_earlier',
        username: 'alice',
        displayName: 'Alice',
        totalPoints: 1400,
        studyPoints: 900,
        habitPoints: 500,
        streak: 10,
        paceScore: 80,
        completionScore: 80,
        rank: 0,
        previousRank: 0,
        updatedAt: '2026-09-08T09:00:00Z', // Earlier achievement
      },
    ];

    const ranked = rankLeaderboardRecords(records);
    expect(ranked[0].uid).toBe('u1_earlier');
  });

  it('formats rank movement correctly', () => {
    expect(getRankMovement(1, 3)).toEqual({ type: 'up', delta: 2, text: '▲ 2' });
    expect(getRankMovement(2, 1)).toEqual({ type: 'down', delta: 1, text: '▼ 1' });
    expect(getRankMovement(2, 2)).toEqual({ type: 'same', delta: 0, text: '─' });
    expect(getRankMovement(4, 0)).toEqual({ type: 'same', delta: 0, text: '─' });
  });

  it('calculates points to next rank accurately', () => {
    const r1: LeaderboardRecord = {
      uid: 'u1',
      username: 'leader',
      displayName: 'Leader',
      totalPoints: 1500,
      studyPoints: 1000,
      habitPoints: 500,
      streak: 10,
      paceScore: 90,
      completionScore: 90,
      rank: 1,
      previousRank: 1,
      updatedAt: '2026-09-08T10:00:00Z',
    };
    const r2: LeaderboardRecord = {
      uid: 'u2',
      username: 'second',
      displayName: 'Second',
      totalPoints: 1450,
      studyPoints: 950,
      habitPoints: 500,
      streak: 8,
      paceScore: 80,
      completionScore: 80,
      rank: 2,
      previousRank: 2,
      updatedAt: '2026-09-08T10:00:00Z',
    };

    const nextForLeader = getPointsToNextRank(r1, [r1, r2]);
    expect(nextForLeader.isLeader).toBe(true);
    expect(nextForLeader.leadMargin).toBe(50);

    const nextForSecond = getPointsToNextRank(r2, [r1, r2]);
    expect(nextForSecond.isLeader).toBe(false);
    expect(nextForSecond.pointsNeeded).toBe(51); // 1450 + 51 = 1501 > 1500
    expect(nextForSecond.userAhead?.username).toBe('leader');
  });
});
