import { Router, type Request, type Response } from 'express';
import {
  executeChapterCompletion,
  executeHabitCompletion,
  ScoringSecurityError,
} from '../../src/lib/scoring/scoreTransaction';
import { FirestoreScoringStore, InMemoryScoringStore } from '../../src/lib/scoring/scoringStore';

export const scoringRouter = Router();

// Store fallback: If running in container with Firestore, use FirestoreScoringStore
// Otherwise use in-memory store
const defaultStore = new InMemoryScoringStore();

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
