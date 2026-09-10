import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateChapterPoints,
  calculateHabitPoints,
  calculateStreakBonus,
  calculateProgramCompletionBonus,
  calculatePaceScore,
  calculateStreak,
} from '../src/lib/scoring/scoringEngine';
import {
  executeChapterCompletion,
  executeHabitCompletion,
  ScoringSecurityError,
  getChapterScoreEventId,
  getProgramScoreEventId,
  getHabitScoreEventId,
} from '../src/lib/scoring/scoreTransaction';
import { InMemoryScoringStore } from '../src/lib/scoring/scoringStore';
import type { UserProfile, StudyProgram, Chapter, CustomHabit } from '../src/types';

describe('StudyRank Secure Scoring Engine', () => {
  let store: InMemoryScoringStore;

  const mockUser: UserProfile = {
    uid: 'user_123',
    email: 'alex@example.com',
    username: 'alexdev',
    displayName: 'Alex Dev',
    role: 'user',
    accountStatus: 'approved',
    totalPoints: 0,
    studyPoints: 0,
    habitPoints: 0,
    streak: 0,
    rank: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastActiveAt: '2026-09-01T00:00:00.000Z',
  };

  const mockProgram: StudyProgram = {
    id: 'prog_1',
    ownerUid: 'user_123',
    name: 'Advanced Algorithms',
    description: 'Mastering algorithmic problem solving',
    startDate: '2026-09-01',
    targetDate: '2026-09-30',
    status: 'active',
    totalSubjects: 1,
    totalChapters: 3,
    completedChapters: 0,
    progressPercentage: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const mockChapter1: Chapter = {
    id: 'chap_1',
    programId: 'prog_1',
    subjectId: 'sub_1',
    ownerUid: 'user_123',
    name: 'Dynamic Programming Basics',
    description: 'Core recursive and memoization patterns',
    order: 1,
    status: 'not_started',
    estimatedMinutes: 60,
    actualMinutes: 0,
    targetDate: '2026-09-15',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const mockChapter2: Chapter = {
    id: 'chap_2',
    programId: 'prog_1',
    subjectId: 'sub_1',
    ownerUid: 'user_123',
    name: 'Graph Traversal',
    description: 'BFS and DFS graph structures',
    order: 2,
    status: 'not_started',
    estimatedMinutes: 90,
    actualMinutes: 0,
    targetDate: '2026-09-20',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const mockChapter3: Chapter = {
    id: 'chap_3',
    programId: 'prog_1',
    subjectId: 'sub_1',
    ownerUid: 'user_123',
    name: 'Network Flow',
    description: 'Max flow min cut theory',
    order: 3,
    status: 'not_started',
    estimatedMinutes: 120,
    actualMinutes: 0,
    targetDate: '2026-09-25',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const mockHabit: CustomHabit = {
    id: 'habit_deep_work',
    ownerUid: 'user_123',
    name: '4 Hours Deep Work',
    description: 'Uninterrupted study sessions',
    type: 'duration',
    targetValue: 240,
    unit: 'minutes',
    pointValue: 15,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    startDate: '2026-09-01',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  beforeEach(() => {
    store = new InMemoryScoringStore();
    store.users.set(mockUser.uid, JSON.parse(JSON.stringify(mockUser)));
    store.programs.set(mockProgram.id, JSON.parse(JSON.stringify(mockProgram)));
    store.chapters.set(mockChapter1.id, JSON.parse(JSON.stringify(mockChapter1)));
    store.chapters.set(mockChapter2.id, JSON.parse(JSON.stringify(mockChapter2)));
    store.chapters.set(mockChapter3.id, JSON.parse(JSON.stringify(mockChapter3)));
    store.habits.set(mockHabit.id, JSON.parse(JSON.stringify(mockHabit)));
  });

  // ==========================================================================
  // REQUIREMENT 1: First chapter completion awards points once
  // ==========================================================================
  it('awards verified points once on first chapter completion', async () => {
    const res = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
      nowIso: '2026-09-10T12:00:00.000Z',
    });

    expect(res.success).toBe(true);
    expect(res.alreadyAwarded).toBe(false);
    // Base 50 + Duration 6 (60 mins / 10) + On-time 15 (target is Sept 15) = 71 points
    expect(res.pointsAwarded).toBe(71);

    const updatedUser = await store.getUser(mockUser.uid);
    expect(updatedUser?.totalPoints).toBe(71);
    expect(updatedUser?.studyPoints).toBe(71);

    // Verify deterministic ledger event was recorded
    const eventId = getChapterScoreEventId(mockUser.uid, mockChapter1.id);
    const scoreEvent = await store.getScoreEvent(eventId);
    expect(scoreEvent).not.toBeNull();
    expect(scoreEvent?.pointsAwarded).toBe(71);
  });

  // ==========================================================================
  // REQUIREMENT 2: Duplicate request does not award twice
  // ==========================================================================
  it('does not award twice on duplicate completion requests or uncomplete-complete cycles', async () => {
    // 1st completion
    const firstRes = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
      nowIso: '2026-09-10T12:00:00.000Z',
    });
    expect(firstRes.pointsAwarded).toBe(71);

    // 2nd duplicate completion request
    const dupRes = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
      nowIso: '2026-09-10T12:01:00.000Z',
    });
    expect(dupRes.alreadyAwarded).toBe(true);
    expect(dupRes.pointsAwarded).toBe(0);

    // Anti-abuse cycle: uncomplete -> complete -> uncomplete -> complete
    await store.updateChapter(mockChapter1.id, { status: 'not_started', completedAt: null });

    const cycleRes1 = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
      nowIso: '2026-09-10T12:05:00.000Z',
    });
    expect(cycleRes1.alreadyAwarded).toBe(true);
    expect(cycleRes1.pointsAwarded).toBe(0);

    await store.updateChapter(mockChapter1.id, { status: 'not_started', completedAt: null });

    const cycleRes2 = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
      nowIso: '2026-09-10T12:10:00.000Z',
    });
    expect(cycleRes2.alreadyAwarded).toBe(true);
    expect(cycleRes2.pointsAwarded).toBe(0);

    // Total points must strictly remain 71, not multiplied!
    const user = await store.getUser(mockUser.uid);
    expect(user?.totalPoints).toBe(71);
    expect(user?.studyPoints).toBe(71);
  });

  // ==========================================================================
  // REQUIREMENT 3: Habit completion cannot be farmed
  // ==========================================================================
  it('prevents habit point farming through repeated daily toggles', async () => {
    const today = '2026-09-10';

    // 1st habit completion today (target is 240 mins, user logged 250)
    const logRes1 = await executeHabitCompletion(store, {
      userId: mockUser.uid,
      habitId: mockHabit.id,
      dateIso: today,
      actualValue: 250,
      nowIso: '2026-09-10T10:00:00.000Z',
    });

    expect(logRes1.success).toBe(true);
    expect(logRes1.alreadyAwarded).toBe(false);
    expect(logRes1.pointsAwarded).toBe(15); // Base pointValue of habit

    const userAfterFirst = await store.getUser(mockUser.uid);
    expect(userAfterFirst?.habitPoints).toBe(15);
    expect(userAfterFirst?.totalPoints).toBe(15);

    // Farming attempt: repeated toggles on the same calendar day
    for (let i = 0; i < 5; i++) {
      // Toggle to incomplete
      await executeHabitCompletion(store, {
        userId: mockUser.uid,
        habitId: mockHabit.id,
        dateIso: today,
        actualValue: 0,
        nowIso: '2026-09-10T11:00:00.000Z',
      });

      // Toggle back to completed
      const reLog = await executeHabitCompletion(store, {
        userId: mockUser.uid,
        habitId: mockHabit.id,
        dateIso: today,
        actualValue: 240,
        nowIso: '2026-09-10T11:05:00.000Z',
      });

      expect(reLog.alreadyAwarded).toBe(true);
      expect(reLog.pointsAwarded).toBe(0);
    }

    // User score MUST remain strictly 15, NOT 90
    const finalUser = await store.getUser(mockUser.uid);
    expect(finalUser?.habitPoints).toBe(15);
    expect(finalUser?.totalPoints).toBe(15);
  });

  // ==========================================================================
  // REQUIREMENT 4: Program completion bonus occurs only once
  // ==========================================================================
  it('awards program completion bonus exactly once when all chapters complete', async () => {
    // Complete Chapter 1 (Base 50 + Dur 6 + OnTime 15 = 71)
    await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
    });

    // Complete Chapter 2 (Base 50 + Dur 9 + OnTime 15 = 74)
    await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter2.id,
      programId: mockProgram.id,
    });

    // Complete Chapter 3 (Base 50 + Dur 12 + OnTime 15 = 77)
    // PLUS program completion bonus: Base 200 + (3 chapters * 10) + (1 subject * 15) = 245
    const finalChapRes = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter3.id,
      programId: mockProgram.id,
    });

    expect(finalChapRes.programBonusAwarded).toBe(245);

    const expectedTotal = 71 + 74 + 77 + 245; // 467 points
    const userAfterCompletion = await store.getUser(mockUser.uid);
    expect(userAfterCompletion?.totalPoints).toBe(expectedTotal);

    // Verify program completion ledger event exists
    const progEventId = getProgramScoreEventId(mockUser.uid, mockProgram.id);
    const progEvent = await store.getScoreEvent(progEventId);
    expect(progEvent).not.toBeNull();
    expect(progEvent?.pointsAwarded).toBe(245);

    // Anti-abuse: uncomplete chapter 3 and re-complete
    await store.updateChapter(mockChapter3.id, { status: 'not_started', completedAt: null });

    const reCompleteRes = await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter3.id,
      programId: mockProgram.id,
    });

    expect(reCompleteRes.alreadyAwarded).toBe(true);
    expect(reCompleteRes.pointsAwarded).toBe(0);
    expect(reCompleteRes.programBonusAwarded).toBeUndefined();

    // User score MUST remain 467 points
    const finalUser = await store.getUser(mockUser.uid);
    expect(finalUser?.totalPoints).toBe(expectedTotal);
  });

  // ==========================================================================
  // REQUIREMENT 5: Score totals remain mathematically consistent
  // ==========================================================================
  it('maintains strict mathematical consistency across mixed activities', async () => {
    // 1. Chapter 1
    await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
    });

    // 2. Habit on day 1
    await executeHabitCompletion(store, {
      userId: mockUser.uid,
      habitId: mockHabit.id,
      dateIso: '2026-09-01',
      actualValue: 240,
    });

    // 3. Habit on day 2
    await executeHabitCompletion(store, {
      userId: mockUser.uid,
      habitId: mockHabit.id,
      dateIso: '2026-09-02',
      actualValue: 240,
    });

    // 4. Chapter 2
    await executeChapterCompletion(store, {
      userId: mockUser.uid,
      chapterId: mockChapter2.id,
      programId: mockProgram.id,
    });

    const user = await store.getUser(mockUser.uid);
    expect(user).not.toBeNull();

    // Sum every ledger score event recorded
    const allEvents = Array.from(store.scoreEvents.values()).filter(
      (e) => e.userId === mockUser.uid
    );
    const ledgerSum = allEvents.reduce((acc, curr) => acc + curr.pointsAwarded, 0);

    expect(user!.totalPoints).toBe(ledgerSum);
    expect(user!.totalPoints).toBe(user!.studyPoints + user!.habitPoints);
  });

  // ==========================================================================
  // REQUIREMENT 6: Users cannot directly edit score fields
  // ==========================================================================
  it('enforces that client attempts to manipulate score fields fail or get discarded', async () => {
    // Test that our scoring transactions derive points purely internally
    const roguePayload = {
      userId: mockUser.uid,
      chapterId: mockChapter1.id,
      programId: mockProgram.id,
      totalPoints: 999999, // Injected arbitrary score
      pointsAwarded: 50000,
    };

    const res = await executeChapterCompletion(store, roguePayload);

    // The injected points must have zero effect:
    expect(res.pointsAwarded).toBe(71);
    const user = await store.getUser(mockUser.uid);
    expect(user?.totalPoints).toBe(71);
    expect(user?.totalPoints).not.toBe(999999);
  });

  // ==========================================================================
  // REQUIREMENT 7: Banned users cannot generate new points
  // ==========================================================================
  it('blocks banned users from generating any points or score events', async () => {
    // Ban user
    await store.updateUser(mockUser.uid, { accountStatus: 'banned' });

    // Attempt chapter completion
    await expect(
      executeChapterCompletion(store, {
        userId: mockUser.uid,
        chapterId: mockChapter1.id,
        programId: mockProgram.id,
      })
    ).rejects.toThrow(ScoringSecurityError);

    // Attempt habit completion
    await expect(
      executeHabitCompletion(store, {
        userId: mockUser.uid,
        habitId: mockHabit.id,
        dateIso: '2026-09-10',
        actualValue: 240,
      })
    ).rejects.toThrow(ScoringSecurityError);

    // Points must remain 0 and score events empty
    const user = await store.getUser(mockUser.uid);
    expect(user?.totalPoints).toBe(0);
    expect(store.scoreEvents.size).toBe(0);
  });

  // ==========================================================================
  // REQUIREMENT 8: Pace Score Calculation
  // ==========================================================================
  describe('Pace Calculation Engine', () => {
    it('classifies progress as ahead when completed ahead of timeline', () => {
      const prog: StudyProgram = {
        ...mockProgram,
        startDate: '2026-09-01',
        targetDate: '2026-09-30',
      };
      // On Sept 10 (30% elapsed), 2 out of 3 chapters completed (67% actual)
      const chaps = [
        { ...mockChapter1, status: 'completed' as const },
        { ...mockChapter2, status: 'completed' as const },
        { ...mockChapter3, status: 'not_started' as const },
      ];

      const pace = calculatePaceScore(prog, chaps, new Date('2026-09-10T12:00:00Z'));
      expect(pace.actualProgress).toBe(67);
      expect(pace.classification).toBe('ahead');
      expect(pace.daysRemaining).toBe(21);
      expect(pace.velocityChaptersPerDay).toBeGreaterThan(0);
    });

    it('classifies progress as behind when lagging timeline', () => {
      const prog: StudyProgram = {
        ...mockProgram,
        startDate: '2026-09-01',
        targetDate: '2026-09-30',
      };
      // On Sept 25 (83% elapsed), only 1 chapter completed (33% actual)
      const chaps = [
        { ...mockChapter1, status: 'completed' as const },
        { ...mockChapter2, status: 'not_started' as const },
        { ...mockChapter3, status: 'not_started' as const },
      ];

      const pace = calculatePaceScore(prog, chaps, new Date('2026-09-25T12:00:00Z'));
      expect(pace.actualProgress).toBe(33);
      expect(pace.classification).toBe('behind');
    });
  });

  // ==========================================================================
  // REQUIREMENT 9: Streak Calculation Engine
  // ==========================================================================
  describe('Streak Calculation Engine', () => {
    it('calculates current and longest streaks accurately', () => {
      const logs = [
        { date: '2026-09-08', completed: true },
        { date: '2026-09-09', completed: true },
        { date: '2026-09-10', completed: true },
      ];

      const res = calculateStreak(logs, [0, 1, 2, 3, 4, 5, 6], new Date('2026-09-10T12:00:00Z'));
      expect(res.currentStreak).toBe(3);
      expect(res.longestStreak).toBe(3);
      expect(res.isCompletedToday).toBe(true);
    });

    it('identifies broken streak when day is missed', () => {
      const logs = [
        { date: '2026-09-01', completed: true },
        { date: '2026-09-02', completed: true },
        { date: '2026-09-03', completed: true },
        // Missed Sept 4, 5, 6, 7, 8, 9
      ];

      const res = calculateStreak(logs, [0, 1, 2, 3, 4, 5, 6], new Date('2026-09-10T12:00:00Z'));
      expect(res.currentStreak).toBe(0);
      expect(res.longestStreak).toBe(3);
      expect(res.isCompletedToday).toBe(false);
    });
  });
});
