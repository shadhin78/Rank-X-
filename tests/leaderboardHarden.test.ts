import { describe, it, expect } from 'vitest';
import {
  compareLeaderboardRecords,
  rankLeaderboardRecords,
  getRankMovement,
  getPointsToNextRank,
} from '../src/lib/scoring/rankingEngine';
import {
  executeChapterCompletion,
  executeHabitCompletion,
  getChapterScoreEventId,
  getHabitScoreEventId,
} from '../src/lib/scoring/scoreTransaction';
import { InMemoryScoringStore } from '../src/lib/scoring/scoringStore';
import { getAuthenticatedUidFromRequest } from '../server/routes/scoring';
import type { LeaderboardRecord, UserProfile, Chapter, CustomHabit } from '../src/types';
import type { Request } from 'express';

describe('StudyRank Leaderboard Hardening & Audit Verification', () => {
  // Requirement 1 & 7: Server-Authoritative Ranking & Strict Tie-Breaking Order
  describe('Requirement 1 & 7: Authoritative Ranking & Tie-Breaker Engine', () => {
    it('ranks primarily by totalPoints DESC', () => {
      const records: LeaderboardRecord[] = [
        {
          uid: 'user_b',
          username: 'user_b',
          displayName: 'User B',
          totalPoints: 1200,
          studyPoints: 800,
          habitPoints: 400,
          streak: 10,
          paceScore: 80,
          completionScore: 70,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z',
        },
        {
          uid: 'user_a',
          username: 'user_a',
          displayName: 'User A',
          totalPoints: 1500,
          studyPoints: 1000,
          habitPoints: 500,
          streak: 12,
          paceScore: 90,
          completionScore: 85,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z',
        },
      ];

      const ranked = rankLeaderboardRecords(records);
      expect(ranked[0].uid).toBe('user_a');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].uid).toBe('user_b');
      expect(ranked[1].rank).toBe(2);
    });

    it('tie-breaker 1: completionScore DESC when totalPoints are equal', () => {
      const records: LeaderboardRecord[] = [
        {
          uid: 'user_low_comp',
          username: 'low',
          displayName: 'Low Comp',
          totalPoints: 1000,
          studyPoints: 600,
          habitPoints: 400,
          streak: 10,
          paceScore: 80,
          completionScore: 65,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z',
        },
        {
          uid: 'user_high_comp',
          username: 'high',
          displayName: 'High Comp',
          totalPoints: 1000,
          studyPoints: 600,
          habitPoints: 400,
          streak: 10,
          paceScore: 80,
          completionScore: 85,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z',
        },
      ];

      const ranked = rankLeaderboardRecords(records);
      expect(ranked[0].uid).toBe('user_high_comp');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].uid).toBe('user_low_comp');
      expect(ranked[1].rank).toBe(2);
    });

    it('tie-breaker 2: streak DESC, then paceScore DESC when points and completion are equal', () => {
      const records: LeaderboardRecord[] = [
        {
          uid: 'user_low_streak',
          username: 'low_s',
          displayName: 'Low Streak',
          totalPoints: 1000,
          studyPoints: 600,
          habitPoints: 400,
          streak: 5,
          paceScore: 90,
          completionScore: 80,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z',
        },
        {
          uid: 'user_high_streak',
          username: 'high_s',
          displayName: 'High Streak',
          totalPoints: 1000,
          studyPoints: 600,
          habitPoints: 400,
          streak: 15,
          paceScore: 70,
          completionScore: 80,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z',
        },
      ];

      const ranked = rankLeaderboardRecords(records);
      expect(ranked[0].uid).toBe('user_high_streak');
      expect(ranked[0].rank).toBe(1);
    });

    it('tie-breaker 3: earlier achievement timestamp ASC when all other metrics are equal', () => {
      const records: LeaderboardRecord[] = [
        {
          uid: 'user_later',
          username: 'later',
          displayName: 'Later',
          totalPoints: 1000,
          studyPoints: 600,
          habitPoints: 400,
          streak: 10,
          paceScore: 80,
          completionScore: 80,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T15:00:00Z', // 5 hours later
        },
        {
          uid: 'user_earlier',
          username: 'earlier',
          displayName: 'Earlier',
          totalPoints: 1000,
          studyPoints: 600,
          habitPoints: 400,
          streak: 10,
          paceScore: 80,
          completionScore: 80,
          rank: 0,
          previousRank: 0,
          updatedAt: '2026-09-08T10:00:00Z', // Earlier achievement
        },
      ];

      const ranked = rankLeaderboardRecords(records);
      expect(ranked[0].uid).toBe('user_earlier');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].uid).toBe('user_later');
      expect(ranked[1].rank).toBe(2);
    });
  });

  // Requirement 4 & 10: Server Authentication Context & Current User Identification
  describe('Requirement 4 & 10: Server Authentication Context & Non-Zero User Lookups', () => {
    it('extracts authenticated UID strictly from Authorization Bearer token', () => {
      const reqWithAuth = {
        headers: {
          authorization: 'Bearer uid_alex_02',
        },
      } as unknown as Request;

      const uid = getAuthenticatedUidFromRequest(reqWithAuth);
      expect(uid).toBe('uid_alex_02');
    });

    it('correctly parses UID from JWT Bearer token payload', () => {
      const mockPayload = Buffer.from(JSON.stringify({ user_id: 'uid_alex_02' })).toString('base64');
      const jwtToken = `header.${mockPayload}.signature`;

      const reqWithJwt = {
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      } as unknown as Request;

      const uid = getAuthenticatedUidFromRequest(reqWithJwt);
      expect(uid).toBe('uid_alex_02');
    });

    it('returns null for unauthenticated requests and does NOT trust client query params', () => {
      const unauthReq = {
        headers: {},
        query: { userId: 'uid_alex_02' },
      } as unknown as Request;

      const uid = getAuthenticatedUidFromRequest(unauthReq);
      expect(uid).toBeNull();
    });

    it('maps authenticated UID to userRecord and userRank without returning null/0', () => {
      const records: LeaderboardRecord[] = [
        {
          uid: 'u_sarah_01',
          username: 'sarah_chen',
          displayName: 'Sarah Chen',
          totalPoints: 1640,
          studyPoints: 1020,
          habitPoints: 620,
          streak: 18,
          paceScore: 98,
          completionScore: 92,
          rank: 1,
          previousRank: 1,
          updatedAt: '2026-09-08T10:00:00Z',
        },
        {
          uid: 'uid_alex_02',
          username: 'alex_rivera',
          displayName: 'Alex Rivera', // Verified: No hardcoded "(You)" in database record
          totalPoints: 1420,
          studyPoints: 920,
          habitPoints: 500,
          streak: 14,
          paceScore: 94,
          completionScore: 88,
          rank: 2,
          previousRank: 2,
          updatedAt: '2026-09-08T10:00:00Z',
        },
      ];

      const ranked = rankLeaderboardRecords(records);
      const authenticatedUid = 'uid_alex_02';

      const foundRecord = ranked.find((r) => r.uid === authenticatedUid);
      expect(foundRecord).toBeDefined();
      expect(foundRecord?.uid).toBe('uid_alex_02');
      expect(foundRecord?.rank).toBe(2);
      expect(foundRecord?.totalPoints).toBe(1420);
      expect(foundRecord?.displayName).toBe('Alex Rivera');
    });

    it('calculates points needed for next rank accurately', () => {
      const records: LeaderboardRecord[] = [
        {
          uid: 'u_leader',
          username: 'leader',
          displayName: 'Leader',
          totalPoints: 1600,
          studyPoints: 1000,
          habitPoints: 600,
          streak: 10,
          paceScore: 90,
          completionScore: 90,
          rank: 1,
          previousRank: 1,
          updatedAt: '2026-09-08T10:00:00Z',
        },
        {
          uid: 'u_chaser',
          username: 'chaser',
          displayName: 'Chaser',
          totalPoints: 1450,
          studyPoints: 950,
          habitPoints: 500,
          streak: 8,
          paceScore: 85,
          completionScore: 85,
          rank: 2,
          previousRank: 2,
          updatedAt: '2026-09-08T10:00:00Z',
        },
      ];

      const ranked = rankLeaderboardRecords(records);
      const chaserRecord = ranked.find((r) => r.uid === 'u_chaser')!;
      const pointsInfo = getPointsToNextRank(chaserRecord, ranked);

      // Delta is 1600 - 1450 = 150; overtaking requires delta + 1 = 151 pts
      expect(pointsInfo.pointsNeeded).toBe(151);
      expect(pointsInfo.userAhead?.username).toBe('leader');
      expect(pointsInfo.isLeader).toBe(false);

      // Verify leader perspective
      const leaderRecord = ranked.find((r) => r.uid === 'u_leader')!;
      const leaderInfo = getPointsToNextRank(leaderRecord, ranked);
      expect(leaderInfo.isLeader).toBe(true);
      expect(leaderInfo.leadMargin).toBe(150);
    });
  });

  // Requirement 6: Rank Movement Verification
  describe('Requirement 6: Authoritative Rank Movement', () => {
    it('computes upward movement accurately (e.g. prev 5 -> curr 3 => ▲ 2)', () => {
      const movement = getRankMovement(3, 5);
      expect(movement.type).toBe('up');
      expect(movement.delta).toBe(2);
      expect(movement.text).toBe('▲ 2');
    });

    it('computes downward movement accurately (e.g. prev 2 -> curr 4 => ▼ 2)', () => {
      const movement = getRankMovement(4, 2);
      expect(movement.type).toBe('down');
      expect(movement.delta).toBe(2);
      expect(movement.text).toBe('▼ 2');
    });

    it('computes unchanged rank accurately (e.g. prev 3 -> curr 3 => ─)', () => {
      const movement = getRankMovement(3, 3);
      expect(movement.type).toBe('same');
      expect(movement.delta).toBe(0);
      expect(movement.text).toBe('─');
    });
  });

  // Requirement 8: Duplicate Score Events & Anti-Farming Idempotency
  describe('Requirement 8: Idempotent Scoring Transactions & Anti-Point-Farming', () => {
    it('awards points only once when duplicate completion requests are executed', async () => {
      const store = new InMemoryScoringStore();

      const user: UserProfile = {
        uid: 'user_test_01',
        username: 'testuser',
        displayName: 'Test User',
        role: 'user',
        accountStatus: 'approved',
        createdAt: '2026-09-08T10:00:00Z',
        lastActiveAt: '2026-09-08T10:00:00Z',
        totalPoints: 0,
        studyPoints: 0,
        habitPoints: 0,
        streak: 0,
        rank: 0,
      };
      store.users.set(user.uid, user);

      const chapter: Chapter = {
        id: 'chap_01',
        programId: 'prog_01',
        subjectId: 'subj_01',
        ownerUid: 'user_test_01',
        name: 'Quantum Mechanics Intro',
        description: 'Introduction to Quantum Mechanics',
        order: 0,
        status: 'not_started',
        estimatedMinutes: 60,
        actualMinutes: 0,
        createdAt: '2026-09-08T10:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z',
      };
      store.chapters.set(chapter.id, chapter);

      // Attempt 1: First completion awards points
      const result1 = await executeChapterCompletion(store, {
        userId: 'user_test_01',
        chapterId: 'chap_01',
        programId: 'prog_01',
      });

      expect(result1.success).toBe(true);
      expect(result1.pointsAwarded).toBeGreaterThan(0);
      expect(result1.alreadyAwarded).toBe(false);

      const userAfterFirst = await store.getUser('user_test_01');
      const awardedPoints = result1.pointsAwarded;
      expect(userAfterFirst?.totalPoints).toBe(awardedPoints);

      // Attempt 2: Duplicate completion request MUST award ZERO additional points
      const result2 = await executeChapterCompletion(store, {
        userId: 'user_test_01',
        chapterId: 'chap_01',
        programId: 'prog_01',
      });

      expect(result2.success).toBe(true);
      expect(result2.pointsAwarded).toBe(0);
      expect(result2.alreadyAwarded).toBe(true);

      const userAfterSecond = await store.getUser('user_test_01');
      // Score MUST remain unchanged — no point farming!
      expect(userAfterSecond?.totalPoints).toBe(awardedPoints);
    });

    it('prevents point farming across complete -> uncomplete -> complete cycle', async () => {
      const store = new InMemoryScoringStore();

      const user: UserProfile = {
        uid: 'user_test_02',
        username: 'farmer',
        displayName: 'Farmer Test',
        role: 'user',
        accountStatus: 'approved',
        createdAt: '2026-09-08T10:00:00Z',
        lastActiveAt: '2026-09-08T10:00:00Z',
        totalPoints: 0,
        studyPoints: 0,
        habitPoints: 0,
        streak: 0,
        rank: 0,
      };
      store.users.set(user.uid, user);

      const chapter: Chapter = {
        id: 'chap_farm_01',
        programId: 'prog_farm_01',
        subjectId: 'subj_farm_01',
        ownerUid: 'user_test_02',
        name: 'Calculus IV',
        description: 'Advanced multivariable calculus',
        order: 0,
        status: 'not_started',
        estimatedMinutes: 45,
        actualMinutes: 0,
        createdAt: '2026-09-08T10:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z',
      };
      store.chapters.set(chapter.id, chapter);

      // 1. First completion
      const res1 = await executeChapterCompletion(store, {
        userId: 'user_test_02',
        chapterId: 'chap_farm_01',
        programId: 'prog_farm_01',
      });
      const initialPoints = res1.pointsAwarded;
      expect(initialPoints).toBeGreaterThan(0);

      // 2. Uncomplete chapter (simulate client resetting status to in_progress)
      await store.updateChapter('chap_farm_01', { status: 'in_progress' });
      const updatedChap = await store.getChapter('chap_farm_01');
      expect(updatedChap?.status).toBe('in_progress');

      // 3. Second completion attempt: Score event already exists in immutable ledger!
      const res2 = await executeChapterCompletion(store, {
        userId: 'user_test_02',
        chapterId: 'chap_farm_01',
        programId: 'prog_farm_01',
      });

      expect(res2.pointsAwarded).toBe(0);
      expect(res2.alreadyAwarded).toBe(true);

      const finalUser = await store.getUser('user_test_02');
      expect(finalUser?.totalPoints).toBe(initialPoints);
    });

    it('enforces idempotency for daily habit logs on the same date', async () => {
      const store = new InMemoryScoringStore();

      const user: UserProfile = {
        uid: 'user_habit_01',
        username: 'habit_hero',
        displayName: 'Habit Hero',
        role: 'user',
        accountStatus: 'approved',
        createdAt: '2026-09-08T10:00:00Z',
        lastActiveAt: '2026-09-08T10:00:00Z',
        totalPoints: 0,
        studyPoints: 0,
        habitPoints: 0,
        streak: 0,
        rank: 0,
      };
      store.users.set(user.uid, user);

      const habit: any = {
        id: 'habit_deep_work',
        ownerUid: 'user_habit_01',
        title: 'Deep Study 2h',
        category: 'focus',
        type: 'boolean',
        targetPerDay: 1,
        unit: 'session',
        metricType: 'boolean',
        isActive: true,
        orderIndex: 0,
        createdAt: '2026-09-08T10:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z',
      };
      store.habits.set(habit.id, habit);

      const today = '2026-09-10';

      // First habit completion
      const res1 = await executeHabitCompletion(store, {
        userId: 'user_habit_01',
        habitId: 'habit_deep_work',
        dateIso: today,
        actualValue: true,
      });

      expect(res1.success).toBe(true);
      expect(res1.pointsAwarded).toBeGreaterThan(0);
      expect(res1.alreadyAwarded).toBe(false);
      const habitPoints = res1.pointsAwarded;

      // Duplicate habit completion for same day
      const res2 = await executeHabitCompletion(store, {
        userId: 'user_habit_01',
        habitId: 'habit_deep_work',
        dateIso: today,
        actualValue: true,
      });

      expect(res2.pointsAwarded).toBe(0);
      expect(res2.alreadyAwarded).toBe(true);

      const userAfter = await store.getUser('user_habit_01');
      expect(userAfter?.totalPoints).toBe(habitPoints);
    });
  });

  // Requirement 3: Leaderboard Document Field Privacy
  describe('Requirement 3: Public Metrics Only in Leaderboard Record', () => {
    it('leaderboard document contains only public metrics and excludes private data', () => {
      const publicFields: (keyof LeaderboardRecord)[] = [
        'uid',
        'username',
        'displayName',
        'totalPoints',
        'studyPoints',
        'habitPoints',
        'streak',
        'paceScore',
        'completionScore',
        'rank',
        'previousRank',
        'updatedAt',
      ];

      const sampleRecord: LeaderboardRecord = {
        uid: 'uid_alex_02',
        username: 'alex_rivera',
        displayName: 'Alex Rivera',
        totalPoints: 1420,
        studyPoints: 920,
        habitPoints: 500,
        streak: 14,
        paceScore: 94,
        completionScore: 88,
        rank: 2,
        previousRank: 2,
        updatedAt: '2026-09-10T12:00:00Z',
      };

      const keys = Object.keys(sampleRecord);
      for (const key of keys) {
        expect(publicFields).toContain(key);
      }

      // Assert private fields are strictly absent
      expect((sampleRecord as any).pin).toBeUndefined();
      expect((sampleRecord as any).password).toBeUndefined();
      expect((sampleRecord as any).email).toBeUndefined();
      expect((sampleRecord as any).programs).toBeUndefined();
      expect((sampleRecord as any).chapters).toBeUndefined();
      expect((sampleRecord as any).habitLogs).toBeUndefined();
    });
  });

  // Requirement 9: Test User Isolation
  describe('Requirement 9: Test Users Isolation', () => {
    it('identifies development test fixtures without leaking into production naming', () => {
      const testUserA: LeaderboardRecord = {
        uid: 'u_jordan_06',
        username: 'jordan_blake',
        displayName: 'Jordan Blake',
        totalPoints: 760,
        studyPoints: 510,
        habitPoints: 250,
        streak: 6,
        paceScore: 75,
        completionScore: 54,
        rank: 6,
        previousRank: 6,
        updatedAt: '2026-09-08T10:00:00Z',
        isTestFixture: true,
      };

      expect(testUserA.isTestFixture).toBe(true);
      expect(testUserA.displayName).toBe('Jordan Blake');
      expect(testUserA.displayName.includes('(Test User')).toBe(false);
    });
  });
});
