/**
 * Atomic Scoring Transaction Executor
 *
 * Implements the 8-step atomic transaction lifecycle:
 * 1. Validate authenticated user (account existence & active approval status; ban check)
 * 2. Validate resource ownership (user must own chapter, program, or habit)
 * 3. Validate current state & idempotent event lookup (check if already awarded)
 * 4. Record state transition (mark chapter/habit completed)
 * 5. Calculate points via pure isolated scoring engine formulas
 * 6. Update score summary (totalPoints, studyPoints, habitPoints, streak)
 * 7. Update leaderboard summary
 * 8. Record immutable score event (idempotency key prevents duplicate point generation)
 */

import {
  calculateChapterPoints,
  calculateHabitPoints,
  calculateProgramCompletionBonus,
  calculateStreak,
} from './scoringEngine';
import type {
  UserProfile,
  StudyProgram,
  Chapter,
  CustomHabit,
  DailyHabitLog,
  ScoreEvent,
  ScoringTransactionResult,
} from '@/src/types';

export class ScoringSecurityError extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ScoringSecurityError';
    this.code = code;
  }
}

/**
 * Deterministic Idempotency Key Builders
 */
export function getChapterScoreEventId(userId: string, chapterId: string): string {
  return `score_chap_${userId}_${chapterId}`;
}

export function getProgramScoreEventId(userId: string, programId: string): string {
  return `score_prog_${userId}_${programId}`;
}

export function getHabitScoreEventId(userId: string, habitId: string, dateIso: string): string {
  return `score_habit_${userId}_${habitId}_${dateIso}`;
}

/**
 * Storage Abstraction for Firestore & In-Memory / Test execution
 */
export interface ScoringStore {
  getUser(userId: string): Promise<UserProfile | null>;
  updateUser(userId: string, updates: Partial<UserProfile>): Promise<void>;

  getChapter(chapterId: string): Promise<Chapter | null>;
  updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<void>;
  getProgramChapters(programId: string): Promise<Chapter[]>;

  getProgram(programId: string): Promise<StudyProgram | null>;
  updateProgram(programId: string, updates: Partial<StudyProgram>): Promise<void>;

  getHabit(habitId: string): Promise<CustomHabit | null>;
  getHabitLog(logId: string): Promise<DailyHabitLog | null>;
  saveHabitLog(log: DailyHabitLog): Promise<void>;
  getAllUserHabitLogs(userId: string): Promise<DailyHabitLog[]>;

  getScoreEvent(eventId: string): Promise<ScoreEvent | null>;
  saveScoreEvent(event: ScoreEvent): Promise<void>;

  updateLeaderboardEntry(entry: {
    uid: string;
    userId?: string;
    username: string;
    displayName: string;
    totalPoints: number;
    studyPoints: number;
    habitPoints: number;
    streak: number;
    paceScore?: number;
    completionScore?: number;
    rank?: number;
    previousRank?: number;
    updatedAt: string;
  }): Promise<void>;
}

/**
 * Atomic Chapter Completion Execution
 */
export async function executeChapterCompletion(
  store: ScoringStore,
  params: {
    userId: string;
    chapterId: string;
    programId: string;
    nowIso?: string;
  }
): Promise<ScoringTransactionResult> {
  const now = params.nowIso || new Date().toISOString();
  const eventId = getChapterScoreEventId(params.userId, params.chapterId);

  // 1. Validate authenticated user
  const user = await store.getUser(params.userId);
  if (!user) {
    throw new ScoringSecurityError(`User ${params.userId} does not exist.`, 'USER_NOT_FOUND');
  }

  if (user.accountStatus === 'banned') {
    throw new ScoringSecurityError(
      'Banned users cannot generate new points or modify scoring records.',
      'USER_BANNED'
    );
  }

  if (user.accountStatus !== 'approved') {
    throw new ScoringSecurityError(
      'Only approved accounts may participate in scoring activities.',
      'USER_NOT_APPROVED'
    );
  }

  // 2. Validate ownership
  const chapter = await store.getChapter(params.chapterId);
  if (!chapter) {
    throw new ScoringSecurityError(`Chapter ${params.chapterId} not found.`, 'CHAPTER_NOT_FOUND');
  }

  if (chapter.ownerUid !== params.userId) {
    throw new ScoringSecurityError(
      'Unauthorized: Chapter ownership verification failed.',
      'FORBIDDEN_OWNERSHIP'
    );
  }

  if (chapter.programId !== params.programId) {
    throw new ScoringSecurityError(
      'Chapter does not belong to the declared program.',
      'INVALID_PROGRAM_ASSOCIATION'
    );
  }

  // 3. Validate current state & check idempotency event
  const existingEvent = await store.getScoreEvent(eventId);
  const isAlreadyAwarded = !!existingEvent;

  // 4. Record state transition (mark completed)
  await store.updateChapter(params.chapterId, {
    status: 'completed',
    completedAt: chapter.completedAt || now,
    updatedAt: now,
  });

  // If already awarded, return idempotent response with ZERO point delta!
  if (isAlreadyAwarded) {
    return {
      success: true,
      pointsAwarded: 0,
      alreadyAwarded: true,
      eventType: 'chapter_completion',
      eventId,
      scoreSummary: {
        totalPoints: user.totalPoints,
        studyPoints: user.studyPoints,
        habitPoints: user.habitPoints,
        streak: user.streak,
      },
      message: 'Chapter status updated. Points were previously awarded.',
    };
  }

  // 5. Calculate points using isolated scoring engine
  const breakdown = calculateChapterPoints(chapter, { completionDate: now });
  const pointsAwarded = breakdown.totalPoints;

  // 6. Update score summary
  const nextStudyPoints = (user.studyPoints || 0) + pointsAwarded;
  let nextTotalPoints = (user.totalPoints || 0) + pointsAwarded;

  // Check Program Completion Bonus
  let programBonusAwarded = 0;
  const allProgramChapters = await store.getProgramChapters(params.programId);
  // Account for the chapter being completed in this transaction
  const updatedChapters = allProgramChapters.map((c) =>
    c.id === params.chapterId ? { ...c, status: 'completed' as const } : c
  );

  const totalChapCount = updatedChapters.length;
  const completedChapCount = updatedChapters.filter((c) => c.status === 'completed').length;
  const program = await store.getProgram(params.programId);

  if (program && totalChapCount > 0 && completedChapCount === totalChapCount) {
    const progEventId = getProgramScoreEventId(params.userId, params.programId);
    const existingProgEvent = await store.getScoreEvent(progEventId);

    if (!existingProgEvent) {
      const bonusResult = calculateProgramCompletionBonus(program, updatedChapters);
      if (bonusResult.bonusPoints > 0) {
        programBonusAwarded = bonusResult.bonusPoints;
        nextTotalPoints += programBonusAwarded;

        // Record program completion event
        const progEvent: ScoreEvent = {
          id: progEventId,
          userId: params.userId,
          eventType: 'program_completion',
          targetId: params.programId,
          category: 'study',
          pointsAwarded: programBonusAwarded,
          metadata: {
            programName: program.name,
            totalChapters: totalChapCount,
            breakdown: bonusResult.breakdown,
          },
          createdAt: now,
        };
        await store.saveScoreEvent(progEvent);

        // Update program status
        await store.updateProgram(params.programId, {
          status: 'completed',
          completedChapters: totalChapCount,
          progressPercentage: 100,
          updatedAt: now,
        });
      }
    }
  } else if (program) {
    // Recalculate program progress
    const progressPercentage =
      totalChapCount > 0 ? Math.round((completedChapCount / totalChapCount) * 100) : 0;
    await store.updateProgram(params.programId, {
      completedChapters: completedChapCount,
      progressPercentage,
      updatedAt: now,
    });
  }

  // Update user profile in store
  await store.updateUser(params.userId, {
    totalPoints: nextTotalPoints,
    studyPoints: nextStudyPoints + programBonusAwarded,
    lastActiveAt: now,
  });

  // 7. Update leaderboard summary
  await store.updateLeaderboardEntry({
    uid: user.uid,
    userId: user.uid,
    username: user.username,
    displayName: user.displayName,
    totalPoints: nextTotalPoints,
    studyPoints: nextStudyPoints + programBonusAwarded,
    habitPoints: user.habitPoints,
    streak: user.streak,
    completionScore: totalChapCount > 0 ? Math.round((completedChapCount / totalChapCount) * 100) : 0,
    updatedAt: now,
  });

  // 8. Record immutable chapter completion score event
  const scoreEvent: ScoreEvent = {
    id: eventId,
    userId: params.userId,
    eventType: 'chapter_completion',
    targetId: params.chapterId,
    category: 'study',
    pointsAwarded,
    metadata: {
      chapterName: chapter.name,
      programId: params.programId,
      breakdown,
    },
    createdAt: now,
  };
  await store.saveScoreEvent(scoreEvent);

  return {
    success: true,
    pointsAwarded,
    alreadyAwarded: false,
    eventType: 'chapter_completion',
    eventId,
    scoreSummary: {
      totalPoints: nextTotalPoints,
      studyPoints: nextStudyPoints + programBonusAwarded,
      habitPoints: user.habitPoints,
      streak: user.streak,
    },
    programBonusAwarded: programBonusAwarded > 0 ? programBonusAwarded : undefined,
    message: 'Chapter completed successfully. Verified points awarded.',
  };
}

/**
 * Atomic Habit Completion Execution
 */
export async function executeHabitCompletion(
  store: ScoringStore,
  params: {
    userId: string;
    habitId: string;
    dateIso: string;
    actualValue: any;
    nowIso?: string;
  }
): Promise<ScoringTransactionResult> {
  const now = params.nowIso || new Date().toISOString();
  const eventId = getHabitScoreEventId(params.userId, params.habitId, params.dateIso);
  const logId = `${params.userId}_${params.habitId}_${params.dateIso}`;

  // 1. Validate authenticated user
  const user = await store.getUser(params.userId);
  if (!user) {
    throw new ScoringSecurityError(`User ${params.userId} does not exist.`, 'USER_NOT_FOUND');
  }

  if (user.accountStatus === 'banned') {
    throw new ScoringSecurityError(
      'Banned users cannot generate new points or modify scoring records.',
      'USER_BANNED'
    );
  }

  if (user.accountStatus !== 'approved') {
    throw new ScoringSecurityError(
      'Only approved accounts may participate in scoring activities.',
      'USER_NOT_APPROVED'
    );
  }

  // 2. Validate ownership
  const habit = await store.getHabit(params.habitId);
  if (!habit) {
    throw new ScoringSecurityError(`Habit ${params.habitId} not found.`, 'HABIT_NOT_FOUND');
  }

  if (habit.ownerUid !== params.userId) {
    throw new ScoringSecurityError(
      'Unauthorized: Habit ownership verification failed.',
      'FORBIDDEN_OWNERSHIP'
    );
  }

  // 3. Evaluate completion strictly on trusted server side
  let completed = false;
  let completionPercentage = 0;

  switch (habit.type) {
    case 'boolean':
    case 'checkbox': {
      completed = Boolean(params.actualValue);
      completionPercentage = completed ? 100 : 0;
      break;
    }
    case 'count':
    case 'number':
    case 'duration': {
      const target = Number(habit.targetValue) || 1;
      const actual = Number(params.actualValue) || 0;
      completionPercentage = target > 0 ? Math.round((actual / target) * 100) : 100;
      completed = actual >= target;
      break;
    }
    case 'time': {
      if (typeof params.actualValue === 'boolean') {
        completed = params.actualValue;
        completionPercentage = completed ? 100 : 0;
      } else if (params.actualValue) {
        const targetStr = String(habit.targetValue).trim();
        const actualStr = String(params.actualValue).trim();
        completed = actualStr <= targetStr;
        completionPercentage = completed ? 100 : 0;
      }
      break;
    }
  }

  // 4. Record state transition (save habit log)
  const existingEvent = await store.getScoreEvent(eventId);
  const isAlreadyAwarded = !!existingEvent;

  // Calculate habit points
  const pointsBreakdown = calculateHabitPoints(habit, { completed, completionPercentage });
  const pointsAwarded = completed && !isAlreadyAwarded ? pointsBreakdown.pointsAwarded : 0;

  const habitLog: DailyHabitLog = {
    id: logId,
    habitId: params.habitId,
    ownerUid: params.userId,
    date: params.dateIso,
    targetValue: habit.targetValue,
    actualValue: params.actualValue,
    completionPercentage,
    completed,
    earnedPoints: pointsAwarded,
    createdAt: now,
    updatedAt: now,
  };
  await store.saveHabitLog(habitLog);

  // Re-calculate streak securely based on verified habit logs
  const allLogs = await store.getAllUserHabitLogs(params.userId);
  // Ensure the current log is reflected
  const updatedLogs = [
    ...allLogs.filter((l) => l.id !== logId),
    habitLog,
  ];
  const streakResult = calculateStreak(updatedLogs, habit.activeDays);

  // If already awarded previously for this calendar date, don't award new points!
  if (isAlreadyAwarded || !completed) {
    // Only update streak if changed
    if (streakResult.currentStreak !== user.streak) {
      await store.updateUser(params.userId, {
        streak: streakResult.currentStreak,
        lastActiveAt: now,
      });
    }

    return {
      success: true,
      pointsAwarded: 0,
      alreadyAwarded: isAlreadyAwarded,
      eventType: 'habit_completion',
      eventId,
      scoreSummary: {
        totalPoints: user.totalPoints,
        studyPoints: user.studyPoints,
        habitPoints: user.habitPoints,
        streak: streakResult.currentStreak,
      },
      message: isAlreadyAwarded
        ? 'Habit progress logged. Points already awarded for today.'
        : 'Habit progress logged.',
    };
  }

  // 6. Update user score summary
  const nextHabitPoints = (user.habitPoints || 0) + pointsAwarded;
  const nextTotalPoints = (user.totalPoints || 0) + pointsAwarded;

  await store.updateUser(params.userId, {
    totalPoints: nextTotalPoints,
    habitPoints: nextHabitPoints,
    streak: streakResult.currentStreak,
    lastActiveAt: now,
  });

  // 7. Update leaderboard summary
  await store.updateLeaderboardEntry({
    uid: user.uid,
    userId: user.uid,
    username: user.username,
    displayName: user.displayName,
    totalPoints: nextTotalPoints,
    studyPoints: user.studyPoints,
    habitPoints: nextHabitPoints,
    streak: streakResult.currentStreak,
    updatedAt: now,
  });

  // 8. Record immutable habit score event
  const scoreEvent: ScoreEvent = {
    id: eventId,
    userId: params.userId,
    eventType: 'habit_completion',
    targetId: params.habitId,
    category: 'habit',
    pointsAwarded,
    metadata: {
      habitName: habit.name,
      date: params.dateIso,
      breakdown: pointsBreakdown,
    },
    createdAt: now,
  };
  await store.saveScoreEvent(scoreEvent);

  return {
    success: true,
    pointsAwarded,
    alreadyAwarded: false,
    eventType: 'habit_completion',
    eventId,
    scoreSummary: {
      totalPoints: nextTotalPoints,
      studyPoints: user.studyPoints,
      habitPoints: nextHabitPoints,
      streak: streakResult.currentStreak,
    },
    message: 'Habit completed successfully. Verified points awarded.',
  };
}
