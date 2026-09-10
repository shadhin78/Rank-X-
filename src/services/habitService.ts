import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestoreDb } from '@/src/lib/firebase';
import type { CustomHabit, DailyHabitLog, HabitType } from '@/src/types';
import { scoringService } from './scoringService';

const LOCAL_HABITS_PREFIX = 'studyrank_habits_';
const LOCAL_LOGS_PREFIX = 'studyrank_habit_logs_';

function getLocalData<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('[HabitService] LocalStorage error:', err);
  }
}

/**
 * Format Date to YYYY-MM-DD in local time
 */
export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const habitService = {
  /**
   * Helper to construct deterministic document ID for a daily log
   */
  getLogDocId(ownerUid: string, habitId: string, date: string): string {
    return `${ownerUid}_${habitId}_${date}`;
  },

  /**
   * Subscribe to all habits for a specific owner in real-time
   */
  subscribeHabits(ownerUid: string, onUpdate: (habits: CustomHabit[]) => void): Unsubscribe {
    const localKey = `${LOCAL_HABITS_PREFIX}${ownerUid}`;
    const initialLocal = getLocalData<CustomHabit>(localKey);
    if (initialLocal.length > 0) {
      onUpdate(initialLocal);
    }

    try {
      const q = query(
        collection(firestoreDb, 'habits'),
        where('ownerUid', '==', ownerUid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: CustomHabit[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<CustomHabit, 'id'>),
          }));

          // Sort by creation date descending
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          saveLocalData(localKey, list);
          onUpdate(list);
        },
        (error) => {
          console.warn('[HabitService] Firestore habits listener fallback to cache:', error);
          const cached = getLocalData<CustomHabit>(localKey);
          onUpdate(cached);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('[HabitService] Init error, using local fallback:', err);
      const cached = getLocalData<CustomHabit>(localKey);
      onUpdate(cached);
      return () => {};
    }
  },

  /**
   * Subscribe to daily logs for a given date in real-time
   */
  subscribeDailyLogs(
    ownerUid: string,
    date: string,
    onUpdate: (logs: DailyHabitLog[]) => void
  ): Unsubscribe {
    const localKey = `${LOCAL_LOGS_PREFIX}${ownerUid}_${date}`;
    const initialLocal = getLocalData<DailyHabitLog>(localKey);
    if (initialLocal.length > 0) {
      onUpdate(initialLocal);
    }

    try {
      const q = query(
        collection(firestoreDb, 'habitLogs'),
        where('ownerUid', '==', ownerUid),
        where('date', '==', date)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: DailyHabitLog[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<DailyHabitLog, 'id'>),
          }));

          saveLocalData(localKey, list);
          onUpdate(list);
        },
        (error) => {
          console.warn('[HabitService] Daily logs listener error:', error);
          const cached = getLocalData<DailyHabitLog>(localKey);
          onUpdate(cached);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('[HabitService] Daily logs error, using local fallback:', err);
      const cached = getLocalData<DailyHabitLog>(localKey);
      onUpdate(cached);
      return () => {};
    }
  },

  /**
   * Subscribe to all daily logs for an owner across history in real-time
   */
  subscribeAllLogs(
    ownerUid: string,
    onUpdate: (logs: DailyHabitLog[]) => void
  ): Unsubscribe {
    const localKey = `${LOCAL_LOGS_PREFIX}${ownerUid}_all`;
    const initialLocal = getLocalData<DailyHabitLog>(localKey);
    if (initialLocal.length > 0) {
      onUpdate(initialLocal);
    }

    try {
      const q = query(
        collection(firestoreDb, 'habitLogs'),
        where('ownerUid', '==', ownerUid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: DailyHabitLog[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<DailyHabitLog, 'id'>),
          }));

          saveLocalData(localKey, list);
          onUpdate(list);
        },
        (error) => {
          console.warn('[HabitService] All logs listener error:', error);
          const cached = getLocalData<DailyHabitLog>(localKey);
          onUpdate(cached);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('[HabitService] All logs error, using local fallback:', err);
      const cached = getLocalData<DailyHabitLog>(localKey);
      onUpdate(cached);
      return () => {};
    }
  },

  /**
   * Calculate completion percentage and status for a habit
   */
  evaluateCompletion(
    type: HabitType,
    targetValue: any,
    actualValue: any
  ): { completionPercentage: number; completed: boolean } {
    switch (type) {
      case 'boolean':
      case 'checkbox': {
        const isDone = Boolean(actualValue);
        return {
          completionPercentage: isDone ? 100 : 0,
          completed: isDone,
        };
      }
      case 'count':
      case 'number':
      case 'duration': {
        const targetNum = Number(targetValue) || 1;
        const actualNum = Number(actualValue) || 0;
        if (targetNum <= 0) return { completionPercentage: 100, completed: true };
        const rawPct = Math.round((actualNum / targetNum) * 100);
        const completionPercentage = Math.max(0, Math.min(100, rawPct));
        return {
          completionPercentage,
          completed: actualNum >= targetNum,
        };
      }
      case 'time': {
        // e.g. target "06:30", actual "06:15"
        if (!actualValue) {
          return { completionPercentage: 0, completed: false };
        }
        if (typeof actualValue === 'boolean') {
          return {
            completionPercentage: actualValue ? 100 : 0,
            completed: actualValue,
          };
        }
        const targetStr = String(targetValue).trim();
        const actualStr = String(actualValue).trim();
        // Compare "HH:MM"
        const isEarlierOrEqual = actualStr <= targetStr;
        return {
          completionPercentage: isEarlierOrEqual ? 100 : 0,
          completed: isEarlierOrEqual,
        };
      }
      default:
        return { completionPercentage: 0, completed: false };
    }
  },

  /**
   * Create a new custom habit
   */
  async createHabit(
    ownerUid: string,
    data: Omit<CustomHabit, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomHabit> {
    const habitId = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newHabit: CustomHabit = {
      id: habitId,
      ownerUid,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      type: data.type,
      targetValue: data.targetValue,
      unit: data.unit?.trim() || '',
      pointValue: Number(data.pointValue) || 5,
      activeDays: data.activeDays.length > 0 ? data.activeDays : [0, 1, 2, 3, 4, 5, 6],
      startDate: data.startDate || formatDateToIso(new Date()),
      endDate: data.endDate || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    // Update local cache optimistically
    const localKey = `${LOCAL_HABITS_PREFIX}${ownerUid}`;
    const cached = getLocalData<CustomHabit>(localKey);
    saveLocalData(localKey, [newHabit, ...cached]);

    // Save to Firestore
    try {
      const docRef = doc(firestoreDb, 'habits', habitId);
      await setDoc(docRef, newHabit);
    } catch (err) {
      console.warn('[HabitService] Firestore write failed, persisted locally:', err);
    }

    return newHabit;
  },

  /**
   * Update an existing habit
   */
  async updateHabit(
    habitId: string,
    ownerUid: string,
    updates: Partial<CustomHabit>
  ): Promise<void> {
    const now = new Date().toISOString();
    const localKey = `${LOCAL_HABITS_PREFIX}${ownerUid}`;
    const cached = getLocalData<CustomHabit>(localKey);
    const nextList = cached.map((h) =>
      h.id === habitId ? { ...h, ...updates, updatedAt: now } : h
    );
    saveLocalData(localKey, nextList);

    try {
      const docRef = doc(firestoreDb, 'habits', habitId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('[HabitService] Firestore update failed, saved locally:', err);
    }
  },

  /**
   * Delete a habit and its local logs
   */
  async deleteHabit(habitId: string, ownerUid: string): Promise<void> {
    const localKey = `${LOCAL_HABITS_PREFIX}${ownerUid}`;
    const cached = getLocalData<CustomHabit>(localKey);
    saveLocalData(
      localKey,
      cached.filter((h) => h.id !== habitId)
    );

    try {
      const docRef = doc(firestoreDb, 'habits', habitId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[HabitService] Firestore delete failed:', err);
    }
  },

  /**
   * Record or edit a daily progress log for a habit.
   * Driven by trusted scoring engine to prevent point farming.
   */
  async recordDailyLog(
    ownerUid: string,
    habit: CustomHabit,
    date: string,
    actualValue: any
  ): Promise<{ log: DailyHabitLog; scoringResult: any }> {
    const logId = this.getLogDocId(ownerUid, habit.id, date);
    const now = new Date().toISOString();

    const { completionPercentage, completed } = this.evaluateCompletion(
      habit.type,
      habit.targetValue,
      actualValue
    );

    // Call trusted scoring transaction
    const scoringResult = await scoringService.recordHabitLog(
      ownerUid,
      habit.id,
      date,
      actualValue
    );

    const earnedPoints = scoringResult.pointsAwarded || 0;

    const log: DailyHabitLog = {
      id: logId,
      habitId: habit.id,
      ownerUid,
      date,
      targetValue: habit.targetValue,
      actualValue,
      completionPercentage,
      completed,
      earnedPoints,
      createdAt: now,
      updatedAt: now,
    };

    // Update local cache
    const dateKey = `${LOCAL_LOGS_PREFIX}${ownerUid}_${date}`;
    const cached = getLocalData<DailyHabitLog>(dateKey);
    const exists = cached.some((l) => l.habitId === habit.id);
    const nextCached = exists
      ? cached.map((l) => (l.habitId === habit.id ? log : l))
      : [...cached, log];
    saveLocalData(dateKey, nextCached);

    // Also update all-logs cache
    const allKey = `${LOCAL_LOGS_PREFIX}${ownerUid}_all`;
    const cachedAll = getLocalData<DailyHabitLog>(allKey);
    const existsAll = cachedAll.some((l) => l.id === logId);
    const nextAll = existsAll
      ? cachedAll.map((l) => (l.id === logId ? log : l))
      : [...cachedAll, log];
    saveLocalData(allKey, nextAll);

    // Persist to Firestore
    try {
      const docRef = doc(firestoreDb, 'habitLogs', logId);
      await setDoc(docRef, log, { merge: true });
    } catch (err) {
      console.warn('[HabitService] Firestore log write failed, persisted locally:', err);
    }

    return { log, scoringResult };
  },

  /**
   * Calculate consecutive streak and best streak from habit logs
   */
  calculateStreak(
    habit: CustomHabit,
    allLogs: DailyHabitLog[]
  ): { currentStreak: number; bestStreak: number } {
    const habitLogs = allLogs.filter((l) => l.habitId === habit.id && l.completed);
    if (habitLogs.length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    // Set of completed date strings
    const completedDates = new Set(habitLogs.map((l) => l.date));

    const today = new Date();
    const todayIso = formatDateToIso(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = formatDateToIso(yesterday);

    // Determine current streak counting backward
    let currentStreak = 0;
    let checkDate = new Date(today);

    // If not completed today yet, check if completed yesterday to keep streak alive
    if (!completedDates.has(todayIso)) {
      if (completedDates.has(yesterdayIso)) {
        checkDate = yesterday;
      } else {
        checkDate = today;
      }
    }

    // Walk backward day by day
    while (true) {
      const iso = formatDateToIso(checkDate);
      const dayOfWeek = checkDate.getDay();

      // If habit is active on this day, it must be completed
      if (habit.activeDays.includes(dayOfWeek)) {
        if (completedDates.has(iso)) {
          currentStreak++;
        } else {
          // Break if missed an active day
          break;
        }
      }

      checkDate.setDate(checkDate.getDate() - 1);
      // Safety bound 365 days
      if (currentStreak > 365) break;
    }

    // Best streak estimation
    const bestStreak = Math.max(currentStreak, habitLogs.length > 0 ? Math.min(habitLogs.length, 30) : 0);

    return { currentStreak, bestStreak };
  },

  /**
   * Seed standard custom habits for a new user if empty
   */
  async seedDefaultHabits(ownerUid: string): Promise<CustomHabit[]> {
    const today = formatDateToIso(new Date());

    const defaults: Array<Omit<CustomHabit, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>> = [
      {
        name: 'Wake Up',
        description: 'Wake up early to start the day with intention and clear mind.',
        type: 'time',
        targetValue: '06:30',
        unit: '',
        pointValue: 5,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        startDate: today,
        isActive: true,
      },
      {
        name: 'Study',
        description: 'Deep focus study block dedicated to core academic subjects.',
        type: 'duration',
        targetValue: 4,
        unit: 'hours',
        pointValue: 10,
        activeDays: [1, 2, 3, 4, 5],
        startDate: today,
        isActive: true,
      },
      {
        name: 'Salat',
        description: 'Perform the five daily obligatory prayers on time.',
        type: 'count',
        targetValue: 5,
        unit: 'prayers',
        pointValue: 10,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        startDate: today,
        isActive: true,
      },
      {
        name: 'Exercise',
        description: 'Physical workout, gym session, or brisk outdoor run.',
        type: 'duration',
        targetValue: 30,
        unit: 'minutes',
        pointValue: 5,
        activeDays: [1, 2, 3, 4, 5, 6],
        startDate: today,
        isActive: true,
      },
    ];

    const created: CustomHabit[] = [];
    for (const item of defaults) {
      const habit = await this.createHabit(ownerUid, item);
      created.push(habit);
    }

    return created;
  },
};
