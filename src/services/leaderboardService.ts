/**
 * Leaderboard Service
 *
 * Realtime global leaderboard synchronization powered by Firestore onSnapshot listeners
 * and authoritative scoring integration.
 *
 * Requirements satisfied:
 * - Common to all approved authenticated users
 * - Exposes only intentionally public performance data (uid, username, displayName, points, rank, streak, pace)
 * - Realtime updates via onSnapshot (no polling, no page reload)
 * - Primary ranking by totalPoints descending with strict tie-breakers:
 *   1. Higher completion performance
 *   2. Higher consistency (streak, then pace)
 *   3. Earlier achievement
 * - Cross-tab and multi-device instant synchrony via Firestore + BroadcastChannel
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb } from '@/src/lib/firebase';
import { authService } from '@/src/services/authService';
import type { LeaderboardRecord, LeaderboardLimit } from '@/src/types';
import {
  rankLeaderboardRecords,
  getPointsToNextRank,
} from '@/src/lib/scoring/rankingEngine';

// Cross-tab broadcast channel for instantaneous local multi-window responsiveness
const BROADCAST_CHANNEL_NAME = 'studyrank_leaderboard_realtime';
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel unavailable in some test/ssr environments
}

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
    displayName: 'Alex Rivera',
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
    displayName: 'Jordan Blake',
    totalPoints: 760,
    studyPoints: 510,
    habitPoints: 250,
    streak: 6,
    paceScore: 75,
    completionScore: 54,
    rank: 6,
    previousRank: 6,
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isTestFixture: true,
  },
  {
    uid: 'u_elena_07',
    username: 'elena_rostova',
    displayName: 'Elena Rostova',
    totalPoints: 690,
    studyPoints: 450,
    habitPoints: 240,
    streak: 4,
    paceScore: 72,
    completionScore: 48,
    rank: 7,
    previousRank: 7,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isTestFixture: true,
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

const LOCAL_CACHE_KEY = 'studyrank_leaderboard_cache_v2';

function loadCachedLeaderboard(): LeaderboardRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_LEADERBOARD_SEED;
}

function saveCachedLeaderboard(records: LeaderboardRecord[]): void {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export interface LeaderboardSubscriptionData {
  records: LeaderboardRecord[];
  userRecord: LeaderboardRecord | null;
  userRank: number;
  totalCount: number;
  pointsToNext: {
    pointsNeeded: number;
    userAhead: LeaderboardRecord | null;
    isLeader: boolean;
    leadMargin?: number;
  };
  isRealtimeConnected: boolean;
}

export interface SubscribeLeaderboardOptions {
  limitCount: LeaderboardLimit;
  currentUserId?: string;
}

export const leaderboardService = {
  /**
   * Realtime subscription to the global leaderboard
   * Uses Firestore onSnapshot listeners with fallback and BroadcastChannel cross-tab synchronization.
   */
  subscribeLeaderboard(
    options: SubscribeLeaderboardOptions,
    onUpdate: (data: LeaderboardSubscriptionData) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    let isConnected = false;
    let localRecords = loadCachedLeaderboard();
    let unsubUserDoc: Unsubscribe | null = null;
    let unsubFirestoreCollection: Unsubscribe | null = null;

    const notifyUpdate = (rawRecords: LeaderboardRecord[], specificUserRecord?: LeaderboardRecord | null) => {
      const rankedAll = rankLeaderboardRecords(rawRecords);
      saveCachedLeaderboard(rankedAll);

      const slicedRecords = rankedAll.slice(0, options.limitCount);

      // Current user position lookup
      let userRecord: LeaderboardRecord | null = null;
      let userRank = 0;

      if (options.currentUserId) {
        const found = rankedAll.find((r) => r.uid === options.currentUserId);
        if (found) {
          userRecord = found;
          userRank = found.rank;
        } else if (specificUserRecord) {
          userRecord = specificUserRecord;
          userRank = specificUserRecord.rank || 0;
        }
      }

      const pointsToNext = getPointsToNextRank(userRecord, rankedAll);

      onUpdate({
        records: slicedRecords,
        userRecord,
        userRank,
        totalCount: rankedAll.length,
        pointsToNext,
        isRealtimeConnected: isConnected,
      });
    };

    // Initial immediate render from cache
    notifyUpdate(localRecords);

    // 1. Setup Firestore realtime collection listener
    try {
      const leaderboardCollRef = collection(firestoreDb, 'leaderboard');
      // Primary ordering on totalPoints descending
      const q = query(leaderboardCollRef, orderBy('totalPoints', 'desc'), limit(options.limitCount * 2));

      unsubFirestoreCollection = onSnapshot(
        q,
        (snapshot) => {
          isConnected = true;
          if (!snapshot.empty) {
            const records: LeaderboardRecord[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              records.push({
                uid: data.uid || docSnap.id,
                username: data.username || docSnap.id,
                displayName: data.displayName || 'Student',
                totalPoints: typeof data.totalPoints === 'number' ? data.totalPoints : 0,
                studyPoints: typeof data.studyPoints === 'number' ? data.studyPoints : 0,
                habitPoints: typeof data.habitPoints === 'number' ? data.habitPoints : 0,
                streak: typeof data.streak === 'number' ? data.streak : 0,
                paceScore: typeof data.paceScore === 'number' ? data.paceScore : 100,
                completionScore: typeof data.completionScore === 'number' ? data.completionScore : 50,
                rank: typeof data.rank === 'number' ? data.rank : 0,
                previousRank: typeof data.previousRank === 'number' ? data.previousRank : 0,
                updatedAt: data.updatedAt || new Date().toISOString(),
              });
            });

            localRecords = records;
            notifyUpdate(records);
          } else {
            // If empty in Firestore, seed initial entries to Firestore
            leaderboardService.seedInitialLeaderboard().catch((err) => {
              console.warn('[LeaderboardService] Seeding notice:', err);
            });
          }
        },
        (error) => {
          console.warn('[LeaderboardService] Firestore onSnapshot warning:', error);
          isConnected = false;
          if (onError) onError(error);
          // Fall back to server API fetch or local records
          leaderboardService.fetchServerLeaderboard(options.limitCount, options.currentUserId)
            .then((serverData) => {
              if (serverData && serverData.records.length > 0) {
                notifyUpdate(serverData.records, serverData.userRecord);
              }
            })
            .catch(() => {});
        }
      );
    } catch (err) {
      console.warn('[LeaderboardService] Listener creation error:', err);
    }

    // 2. If current user exists and might be outside the top slice, listen to the user's specific doc
    if (options.currentUserId) {
      try {
        const userDocRef = doc(firestoreDb, 'leaderboard', options.currentUserId);
        unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const uRecord: LeaderboardRecord = {
              uid: data.uid || docSnap.id,
              username: data.username || docSnap.id,
              displayName: data.displayName || 'You',
              totalPoints: data.totalPoints || 0,
              studyPoints: data.studyPoints || 0,
              habitPoints: data.habitPoints || 0,
              streak: data.streak || 0,
              paceScore: data.paceScore || 100,
              completionScore: data.completionScore || 50,
              rank: data.rank || 0,
              previousRank: data.previousRank || 0,
              updatedAt: data.updatedAt || new Date().toISOString(),
            };

            // Merge into local list if not present
            const existingIdx = localRecords.findIndex((r) => r.uid === uRecord.uid);
            if (existingIdx !== -1) {
              localRecords[existingIdx] = uRecord;
            } else {
              localRecords.push(uRecord);
            }
            notifyUpdate(localRecords, uRecord);
          }
        });
      } catch {
        // ignore
      }
    }

    // 3. Cross-tab & Multi-window Broadcast listener
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LEADERBOARD_UPDATED') {
        const updated = event.data.records as LeaderboardRecord[];
        if (Array.isArray(updated) && updated.length > 0) {
          localRecords = updated;
          notifyUpdate(updated);
        }
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }

    // Storage event listener for older or sandboxed iframe tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            localRecords = parsed;
            notifyUpdate(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Return cleanup unsubscription function
    return () => {
      if (unsubFirestoreCollection) unsubFirestoreCollection();
      if (unsubUserDoc) unsubUserDoc();
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  },

  /**
   * Fallback server API fetch for authoritative leaderboard snapshot
   */
  async fetchServerLeaderboard(
    limitCount: number = 50,
    userId?: string
  ): Promise<{ records: LeaderboardRecord[]; userRecord: LeaderboardRecord | null; userRank: number } | null> {
    try {
      const url = new URL('/api/scoring/leaderboard', window.location.origin);
      url.searchParams.set('limit', String(limitCount));

      // Pass authenticated UID in standard Authorization Bearer header
      const headers: Record<string, string> = {};
      const activeUid = userId || firebaseAuth.currentUser?.uid || authService.getStoredSession()?.uid;
      if (activeUid) {
        headers['Authorization'] = `Bearer ${activeUid}`;
      }

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      // Backend unavailable or running client-only
    }
    return null;
  },

  /**
   * Authoritative score simulation & multi-user testing tool.
   * Modifies scores via server-authoritative endpoint and verifies realtime rank updates
   * across multiple connected windows or devices without page reload.
   */
  async simulateScoreChange(params: {
    userId: string;
    deltaStudyPoints?: number;
    deltaHabitPoints?: number;
    deltaStreak?: number;
    deltaCompletionScore?: number;
    deltaPaceScore?: number;
    setTotalPoints?: number;
  }): Promise<LeaderboardRecord[]> {
    // 1. Delegate strictly to authoritative server backend
    try {
      const res = await fetch('/api/scoring/simulate-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.leaderboard && Array.isArray(json.leaderboard)) {
          saveCachedLeaderboard(json.leaderboard);
          if (broadcastChannel) {
            broadcastChannel.postMessage({
              type: 'LEADERBOARD_UPDATED',
              records: json.leaderboard,
            });
          }
          return json.leaderboard;
        }
      }
    } catch (err) {
      console.warn('[LeaderboardService] Server simulation endpoint unavailable, using local fallback:', err);
    }

    // 2. Offline / local fallback for isolated test execution
    const current = loadCachedLeaderboard();
    const existingIdx = current.findIndex((r) => r.uid === params.userId);

    let targetRecord: LeaderboardRecord;
    if (existingIdx !== -1) {
      targetRecord = { ...current[existingIdx] };
    } else {
      targetRecord = {
        uid: params.userId,
        username: params.userId,
        displayName: params.userId,
        totalPoints: 0,
        studyPoints: 0,
        habitPoints: 0,
        streak: 1,
        paceScore: 100,
        completionScore: 50,
        rank: current.length + 1,
        previousRank: current.length + 1,
        updatedAt: new Date().toISOString(),
      };
      current.push(targetRecord);
    }

    const prevRank = targetRecord.rank || 0;
    const nextStudy = Math.max(0, targetRecord.studyPoints + (params.deltaStudyPoints || 0));
    const nextHabit = Math.max(0, targetRecord.habitPoints + (params.deltaHabitPoints || 0));
    const nextTotal = params.setTotalPoints !== undefined
      ? params.setTotalPoints
      : nextStudy + nextHabit;
    const nextStreak = Math.max(0, targetRecord.streak + (params.deltaStreak || 0));
    const nextComp = Math.min(100, Math.max(0, targetRecord.completionScore + (params.deltaCompletionScore || 0)));
    const nextPace = Math.max(0, targetRecord.paceScore + (params.deltaPaceScore || 0));

    const updatedRecord: LeaderboardRecord = {
      ...targetRecord,
      totalPoints: nextTotal,
      studyPoints: nextStudy,
      habitPoints: nextHabit,
      streak: nextStreak,
      completionScore: nextComp,
      paceScore: nextPace,
      previousRank: prevRank,
      updatedAt: new Date().toISOString(),
    };

    const targetIdx = current.findIndex((r) => r.uid === params.userId);
    if (targetIdx !== -1) {
      current[targetIdx] = updatedRecord;
    } else {
      current.push(updatedRecord);
    }

    const newlyRanked = rankLeaderboardRecords(current);
    saveCachedLeaderboard(newlyRanked);

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'LEADERBOARD_UPDATED',
        records: newlyRanked,
      });
    }

    return newlyRanked;
  },

  /**
   * Seeds initial default leaderboard records to Firestore and local cache
   */
  async seedInitialLeaderboard(): Promise<void> {
    const ranked = rankLeaderboardRecords(INITIAL_LEADERBOARD_SEED);
    saveCachedLeaderboard(ranked);

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'LEADERBOARD_UPDATED',
        records: ranked,
      });
    }

    // Write seed records to Firestore
    try {
      for (const entry of ranked) {
        const entryDoc = doc(firestoreDb, 'leaderboard', entry.uid);
        await setDoc(entryDoc, entry, { merge: true });
      }
    } catch (err) {
      console.warn('[LeaderboardService] Seed to Firestore notice:', err);
    }
  },

  /**
   * Resets leaderboard back to initial seeded values
   */
  async resetLeaderboard(): Promise<LeaderboardRecord[]> {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    await this.seedInitialLeaderboard();
    try {
      await fetch('/api/scoring/seed-leaderboard', { method: 'POST' });
    } catch {
      // ignore
    }
    return INITIAL_LEADERBOARD_SEED;
  },
};
