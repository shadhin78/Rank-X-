import { Router, type Request, type Response } from 'express';
import {
  executeChapterCompletion,
  executeHabitCompletion,
  ScoringSecurityError,
} from '../../src/lib/scoring/scoreTransaction';
import { FirestoreScoringStore, InMemoryScoringStore } from '../../src/lib/scoring/scoringStore';
import { rankLeaderboardRecords } from '../../src/lib/scoring/rankingEngine';
import type { LeaderboardRecord } from '../../src/types';

export const scoringRouter = Router();

// Store fallback: If running in container with Firestore, use FirestoreScoringStore
// Otherwise use in-memory store
const defaultStore = new InMemoryScoringStore();

// Seed default initial leaderboard records into defaultStore
export const INITIAL_LEADERBOARD_SEED: LeaderboardRecord[] = [
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
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    uid: 'uid_alex_02',
    username: 'alex_rivera',
    displayName: 'Alex Rivera (You)',
    totalPoints: 1420,
    studyPoints: 920,
    habitPoints: 500,
    streak: 14,
    paceScore: 94,
    completionScore: 88,
    rank: 2,
    previousRank: 2,
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    uid: 'u_marcus_03',
    username: 'marcus_vance',
    displayName: 'Marcus Vance',
    totalPoints: 1180,
    studyPoints: 780,
    habitPoints: 400,
    streak: 9,
    paceScore: 85,
    completionScore: 74,
    rank: 3,
    previousRank: 3,
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    uid: 'u_priya_04',
    username: 'priya_sharma',
    displayName: 'Priya Sharma',
    totalPoints: 980,
    studyPoints: 640,
    habitPoints: 340,
    streak: 7,
    paceScore: 82,
    completionScore: 68,
    rank: 4,
    previousRank: 4,
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    uid: 'u_david_05',
    username: 'david_kim',
    displayName: 'David Kim',
    totalPoints: 850,
    studyPoints: 550,
    habitPoints: 300,
    streak: 5,
    paceScore: 78,
    completionScore: 60,
    rank: 5,
    previousRank: 5,
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    uid: 'u_jordan_06',
    username: 'jordan_blake',
    displayName: 'Jordan Blake (Test User A)',
    totalPoints: 760,
    studyPoints: 510,
    habitPoints: 250,
    streak: 6,
    paceScore: 75,
    completionScore: 54,
    rank: 6,
    previousRank: 6,
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    uid: 'u_elena_07',
    username: 'elena_rostova',
    displayName: 'Elena Rostova (Test User B)',
    totalPoints: 690,
    studyPoints: 450,
    habitPoints: 240,
    streak: 4,
    paceScore: 72,
    completionScore: 48,
    rank: 7,
    previousRank: 7,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    uid: 'u_liam_08',
    username: 'liam_oconnor',
    displayName: 'Liam O\'Connor',
    totalPoints: 620,
    studyPoints: 400,
    habitPoints: 220,
    streak: 3,
    paceScore: 68,
    completionScore: 42,
    rank: 8,
    previousRank: 8,
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    uid: 'u_maya_09',
    username: 'maya_patel',
    displayName: 'Maya Patel',
    totalPoints: 550,
    studyPoints: 360,
    habitPoints: 190,
    streak: 4,
    paceScore: 65,
    completionScore: 38,
    rank: 9,
    previousRank: 9,
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    uid: 'u_lucas_10',
    username: 'lucas_silva',
    displayName: 'Lucas Silva',
    totalPoints: 480,
    studyPoints: 310,
    habitPoints: 170,
    streak: 2,
    paceScore: 60,
    completionScore: 32,
    rank: 10,
    previousRank: 10,
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    uid: 'u_chloe_11',
    username: 'chloe_bennett',
    displayName: 'Chloe Bennett',
    totalPoints: 420,
    studyPoints: 280,
    habitPoints: 140,
    streak: 2,
    paceScore: 58,
    completionScore: 28,
    rank: 11,
    previousRank: 11,
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    uid: 'u_noah_12',
    username: 'noah_williams',
    displayName: 'Noah Williams',
    totalPoints: 360,
    studyPoints: 240,
    habitPoints: 120,
    streak: 1,
    paceScore: 55,
    completionScore: 24,
    rank: 12,
    previousRank: 12,
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

// Initialize default store
for (const entry of INITIAL_LEADERBOARD_SEED) {
  defaultStore.leaderboard.set(entry.uid, { ...entry });
}

/**
 * POST /api/scoring/complete-chapter
 *
 * Awards verified points for first-time chapter completion.
 * Discards any user-supplied score values.
 */
scoringRouter.post('/complete-chapter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, chapterId, programId } = req.body;

    if (!userId || !chapterId || !programId) {
      res.status(400).json({
        error: 'Missing required fields: userId, chapterId, programId',
      });
      return;
    }

    // Explicitly reject any attempts to inject points directly
    if (req.body.totalPoints !== undefined || req.body.pointsAwarded !== undefined) {
      console.warn(`[Security Warning] User ${userId} attempted to supply arbitrary points.`);
    }

    const result = await executeChapterCompletion(defaultStore, {
      userId: String(userId),
      chapterId: String(chapterId),
      programId: String(programId),
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof ScoringSecurityError) {
      res.status(403).json({ error: err.message, code: err.code });
      return;
    }
    console.error('[Scoring API Error]:', err);
    res.status(500).json({ error: 'Internal scoring transaction error' });
  }
});

/**
 * POST /api/scoring/uncomplete-chapter
 *
 * Resets chapter status to not_started.
 * Note: Historical scoreEvent is kept, so completing again will NOT award points.
 */
scoringRouter.post('/uncomplete-chapter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, chapterId, programId } = req.body;
    if (!userId || !chapterId) {
      res.status(400).json({ error: 'Missing userId or chapterId' });
      return;
    }

    const chapter = await defaultStore.getChapter(chapterId);
    if (chapter) {
      if (chapter.ownerUid !== userId) {
        res.status(403).json({ error: 'Forbidden ownership' });
        return;
      }
      await defaultStore.updateChapter(chapterId, {
        status: 'not_started',
        completedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ success: true, message: 'Chapter status reset to not_started' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset chapter' });
  }
});

/**
 * POST /api/scoring/log-habit
 *
 * Logs habit progress and calculates points securely.
 * Rejects repeated same-day completions from farming points.
 */
scoringRouter.post('/log-habit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, habitId, dateIso, actualValue } = req.body;

    if (!userId || !habitId || !dateIso) {
      res.status(400).json({
        error: 'Missing required fields: userId, habitId, dateIso',
      });
      return;
    }

    // Ignore any client-sent 'earnedPoints' or 'totalPoints'
    const result = await executeHabitCompletion(defaultStore, {
      userId: String(userId),
      habitId: String(habitId),
      dateIso: String(dateIso),
      actualValue,
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof ScoringSecurityError) {
      res.status(403).json({ error: err.message, code: err.code });
      return;
    }
    console.error('[Scoring API Error]:', err);
    res.status(500).json({ error: 'Internal scoring transaction error' });
  }
});

/**
 * GET /api/scoring/leaderboard
 *
 * Realtime authoritative ranked leaderboard data.
 * Supports query params: limit (10, 25, 50), userId (for position lookup).
 */
scoringRouter.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const requestedUserId = req.query.userId as string | undefined;

    const allEntries = Array.from(defaultStore.leaderboard.values()) as LeaderboardRecord[];
    const rankedAll = rankLeaderboardRecords(allEntries);

    const topRanked = rankedAll.slice(0, limit);
    let userRecord: LeaderboardRecord | null = null;
    let userRank = 0;

    if (requestedUserId) {
      const idx = rankedAll.findIndex((r) => r.uid === requestedUserId);
      if (idx !== -1) {
        userRecord = rankedAll[idx];
        userRank = idx + 1;
      }
    }

    res.json({
      records: topRanked,
      totalCount: rankedAll.length,
      userRecord,
      userRank,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Scoring Leaderboard API Error]:', err);
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});

/**
 * POST /api/scoring/simulate-score
 *
 * Authoritative scoring simulation endpoint for multi-user test verification.
 * Enables modifying scores of any test user and immediately observing realtime rank updates.
 */
scoringRouter.post('/simulate-score', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      deltaStudyPoints = 0,
      deltaHabitPoints = 0,
      deltaStreak = 0,
      deltaCompletionScore = 0,
      deltaPaceScore = 0,
      setTotalPoints,
    } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Retrieve or create entry
    let existing = defaultStore.leaderboard.get(String(userId)) as LeaderboardRecord | undefined;
    if (!existing) {
      existing = {
        uid: String(userId),
        username: String(userId),
        displayName: String(userId),
        totalPoints: 0,
        studyPoints: 0,
        habitPoints: 0,
        streak: 1,
        paceScore: 100,
        completionScore: 50,
        rank: defaultStore.leaderboard.size + 1,
        previousRank: defaultStore.leaderboard.size + 1,
        updatedAt: new Date().toISOString(),
      };
    }

    const prevRank = existing.rank;
    const nextStudyPoints = Math.max(0, existing.studyPoints + Number(deltaStudyPoints));
    const nextHabitPoints = Math.max(0, existing.habitPoints + Number(deltaHabitPoints));
    const nextTotalPoints = setTotalPoints !== undefined
      ? Number(setTotalPoints)
      : nextStudyPoints + nextHabitPoints;
    const nextStreak = Math.max(0, existing.streak + Number(deltaStreak));
    const nextCompletion = Math.min(100, Math.max(0, existing.completionScore + Number(deltaCompletionScore)));
    const nextPace = Math.max(0, existing.paceScore + Number(deltaPaceScore));

    const updatedRecord: LeaderboardRecord = {
      ...existing,
      totalPoints: nextTotalPoints,
      studyPoints: nextStudyPoints,
      habitPoints: nextHabitPoints,
      streak: nextStreak,
      completionScore: nextCompletion,
      paceScore: nextPace,
      previousRank: prevRank,
      updatedAt: new Date().toISOString(),
    };

    defaultStore.leaderboard.set(String(userId), updatedRecord);

    // Re-rank all entries authoritatively
    const all = Array.from(defaultStore.leaderboard.values()) as LeaderboardRecord[];
    const newlyRanked = rankLeaderboardRecords(all);

    // Store newly computed ranks back
    for (const item of newlyRanked) {
      defaultStore.leaderboard.set(item.uid, item);
    }

    const currentRecord = newlyRanked.find((r) => r.uid === String(userId));

    res.json({
      success: true,
      updatedRecord: currentRecord,
      leaderboard: newlyRanked,
    });
  } catch (err: any) {
    console.error('[Scoring Simulation API Error]:', err);
    res.status(500).json({ error: 'Failed to simulate score update' });
  }
});

/**
 * POST /api/scoring/seed-leaderboard
 * Resets the default test leaderboard
 */
scoringRouter.post('/seed-leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    defaultStore.leaderboard.clear();
    for (const entry of INITIAL_LEADERBOARD_SEED) {
      defaultStore.leaderboard.set(entry.uid, { ...entry });
    }
    const ranked = rankLeaderboardRecords(INITIAL_LEADERBOARD_SEED);
    res.json({ success: true, count: ranked.length, records: ranked });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset leaderboard' });
  }
});
