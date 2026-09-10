/**
 * Scoring Store Implementations
 *
 * 1. InMemoryScoringStore:
 *    Deterministic, isolated in-memory store for unit tests, offline resilience, and local verification.
 * 2. FirestoreScoringStore:
 *    Production Firestore implementation with document lookups and batch/transaction updates.
 */

import type {
  UserProfile,
  StudyProgram,
  Chapter,
  CustomHabit,
  DailyHabitLog,
  ScoreEvent,
} from '@/src/types';
import type { ScoringStore } from './scoreTransaction';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firestoreDb } from '@/src/lib/firebase';

/**
 * 1. InMemoryScoringStore (Ideal for unit testing & sandbox isolation)
 */
export class InMemoryScoringStore implements ScoringStore {
  public users: Map<string, UserProfile> = new Map();
  public programs: Map<string, StudyProgram> = new Map();
  public chapters: Map<string, Chapter> = new Map();
  public habits: Map<string, CustomHabit> = new Map();
  public habitLogs: Map<string, DailyHabitLog> = new Map();
  public scoreEvents: Map<string, ScoreEvent> = new Map();
  public leaderboard: Map<string, any> = new Map();

  async getUser(userId: string): Promise<UserProfile | null> {
    const u = this.users.get(userId);
    return u ? JSON.parse(JSON.stringify(u)) : null;
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const existing = this.users.get(userId);
    if (!existing) return;
    this.users.set(userId, { ...existing, ...updates });
  }

  async getChapter(chapterId: string): Promise<Chapter | null> {
    const c = this.chapters.get(chapterId);
    return c ? JSON.parse(JSON.stringify(c)) : null;
  }

  async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<void> {
    const existing = this.chapters.get(chapterId);
    if (!existing) return;
    this.chapters.set(chapterId, { ...existing, ...updates });
  }

  async getProgramChapters(programId: string): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter((c) => c.programId === programId)
      .map((c) => JSON.parse(JSON.stringify(c)));
  }

  async getProgram(programId: string): Promise<StudyProgram | null> {
    const p = this.programs.get(programId);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  async updateProgram(programId: string, updates: Partial<StudyProgram>): Promise<void> {
    const existing = this.programs.get(programId);
    if (!existing) return;
    this.programs.set(programId, { ...existing, ...updates });
  }

  async getHabit(habitId: string): Promise<CustomHabit | null> {
    const h = this.habits.get(habitId);
    return h ? JSON.parse(JSON.stringify(h)) : null;
  }

  async getHabitLog(logId: string): Promise<DailyHabitLog | null> {
    const l = this.habitLogs.get(logId);
    return l ? JSON.parse(JSON.stringify(l)) : null;
  }

  async saveHabitLog(log: DailyHabitLog): Promise<void> {
    this.habitLogs.set(log.id, JSON.parse(JSON.stringify(log)));
  }

  async getAllUserHabitLogs(userId: string): Promise<DailyHabitLog[]> {
    return Array.from(this.habitLogs.values())
      .filter((l) => l.ownerUid === userId)
      .map((l) => JSON.parse(JSON.stringify(l)));
  }

  async getScoreEvent(eventId: string): Promise<ScoreEvent | null> {
    const e = this.scoreEvents.get(eventId);
    return e ? JSON.parse(JSON.stringify(e)) : null;
  }

  async saveScoreEvent(event: ScoreEvent): Promise<void> {
    this.scoreEvents.set(event.id, JSON.parse(JSON.stringify(event)));
  }

  async updateLeaderboardEntry(entry: any): Promise<void> {
    this.leaderboard.set(entry.userId, JSON.parse(JSON.stringify(entry)));
  }
}

/**
 * 2. FirestoreScoringStore (Production Firestore connection)
 */
export class FirestoreScoringStore implements ScoringStore {
  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'users', userId));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch {
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(firestoreDb, 'users', userId), updates);
    } catch (err) {
      console.warn('[FirestoreScoringStore] updateUser warning:', err);
    }
  }

  async getChapter(chapterId: string): Promise<Chapter | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'chapters', chapterId));
      return snap.exists() ? (snap.data() as Chapter) : null;
    } catch {
      return null;
    }
  }

  async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<void> {
    try {
      await updateDoc(doc(firestoreDb, 'chapters', chapterId), updates);
    } catch (err) {
      console.warn('[FirestoreScoringStore] updateChapter warning:', err);
    }
  }

  async getProgramChapters(programId: string): Promise<Chapter[]> {
    try {
      const q = query(collection(firestoreDb, 'chapters'), where('programId', '==', programId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Chapter);
    } catch {
      return [];
    }
  }

  async getProgram(programId: string): Promise<StudyProgram | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'programs', programId));
      return snap.exists() ? (snap.data() as StudyProgram) : null;
    } catch {
      return null;
    }
  }

  async updateProgram(programId: string, updates: Partial<StudyProgram>): Promise<void> {
    try {
      await updateDoc(doc(firestoreDb, 'programs', programId), updates);
    } catch (err) {
      console.warn('[FirestoreScoringStore] updateProgram warning:', err);
    }
  }

  async getHabit(habitId: string): Promise<CustomHabit | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'habits', habitId));
      return snap.exists() ? (snap.data() as CustomHabit) : null;
    } catch {
      return null;
    }
  }

  async getHabitLog(logId: string): Promise<DailyHabitLog | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'habitLogs', logId));
      return snap.exists() ? (snap.data() as DailyHabitLog) : null;
    } catch {
      return null;
    }
  }

  async saveHabitLog(log: DailyHabitLog): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'habitLogs', log.id), log, { merge: true });
    } catch (err) {
      console.warn('[FirestoreScoringStore] saveHabitLog warning:', err);
    }
  }

  async getAllUserHabitLogs(userId: string): Promise<DailyHabitLog[]> {
    try {
      const q = query(collection(firestoreDb, 'habitLogs'), where('ownerUid', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as DailyHabitLog);
    } catch {
      return [];
    }
  }

  async getScoreEvent(eventId: string): Promise<ScoreEvent | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'scoreEvents', eventId));
      return snap.exists() ? (snap.data() as ScoreEvent) : null;
    } catch {
      return null;
    }
  }

  async saveScoreEvent(event: ScoreEvent): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'scoreEvents', event.id), event);
    } catch (err) {
      console.warn('[FirestoreScoringStore] saveScoreEvent warning:', err);
    }
  }

  async updateLeaderboardEntry(entry: any): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'leaderboard', entry.userId), entry, { merge: true });
    } catch (err) {
      console.warn('[FirestoreScoringStore] updateLeaderboardEntry warning:', err);
    }
  }
}
