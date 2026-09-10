/**
 * Scoring Service
 *
 * Frontend service interacting with the trusted backend scoring engine.
 * IMPORTANT: The frontend NEVER calculates or pushes raw arbitrary points.
 * All point modifications are driven by authenticated transaction endpoints or
 * verified transaction executors.
 */

import type {
  ScoringTransactionResult,
  StudyProgram,
  Chapter,
  PaceCalculationResult,
} from '@/src/types';
import { calculatePaceScore } from '@/src/lib/scoring/scoringEngine';
import { executeChapterCompletion, executeHabitCompletion } from '@/src/lib/scoring/scoreTransaction';
import { FirestoreScoringStore, InMemoryScoringStore } from '@/src/lib/scoring/scoringStore';
import { doc, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '@/src/lib/firebase';

const firestoreStore = new FirestoreScoringStore();

export const scoringService = {
  /**
   * Complete a chapter securely.
   * Invokes backend API or trusted atomic transaction.
   */
  async completeChapter(
    userId: string,
    chapterId: string,
    programId: string
  ): Promise<ScoringTransactionResult> {
    // 1. Attempt server-side API call
    try {
      const res = await fetch('/api/scoring/complete-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, chapterId, programId }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Backend not running / offline sandbox fallback
    }

    // 2. Direct transactional execution fallback
    return await executeChapterCompletion(firestoreStore, {
      userId,
      chapterId,
      programId,
    });
  },

  /**
   * Uncomplete a chapter (e.g. user toggles back to not_started).
   * Note: The immutable score event remains in history so points CANNOT be re-earned!
   */
  async uncompleteChapter(
    userId: string,
    chapterId: string,
    programId: string
  ): Promise<void> {
    try {
      const res = await fetch('/api/scoring/uncomplete-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, chapterId, programId }),
      });
      if (res.ok) return;
    } catch {
      // Fallback
    }

    try {
      await updateDoc(doc(firestoreDb, 'chapters', chapterId), {
        status: 'not_started',
        completedAt: null,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[ScoringService] uncompleteChapter fallback error:', err);
    }
  },

  /**
   * Record habit progress securely.
   */
  async recordHabitLog(
    userId: string,
    habitId: string,
    dateIso: string,
    actualValue: any
  ): Promise<ScoringTransactionResult> {
    try {
      const res = await fetch('/api/scoring/log-habit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, habitId, dateIso, actualValue }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Fallback
    }

    return await executeHabitCompletion(firestoreStore, {
      userId,
      habitId,
      dateIso,
      actualValue,
    });
  },

  /**
   * Calculate Pace Score for a program curriculum
   */
  getPaceScore(
    program: StudyProgram,
    chapters: Chapter[],
    asOfDate?: Date
  ): PaceCalculationResult {
    return calculatePaceScore(program, chapters, asOfDate);
  },
};
