/**
 * StudyRank Modular Scoring Engine
 *
 * CRITICAL SECURITY INVARIANT:
 * All scoring formulas are isolated, deterministic, and pure.
 * Client submissions MUST NEVER be trusted to dictate scores or points.
 * All computations here are executed by trusted backend services and transactions.
 */

import type {
  Chapter,
  CustomHabit,
  DailyHabitLog,
  StudyProgram,
  ChapterPointsBreakdown,
  HabitPointsBreakdown,
  StreakBonusResult,
  ProgramCompletionBonusResult,
  PaceCalculationResult,
  PaceClassification,
  StreakCalculationResult,
} from '@/src/types';

// ============================================================================
// CONFIGURABLE CONSTANTS (ISOLATED FORMULAS)
// ============================================================================

export const SCORING_CONFIG = {
  // Chapter completion parameters
  CHAPTER_BASE_POINTS: 50,
  CHAPTER_DURATION_BONUS_DIVISOR: 10, // 1 bonus pt per 10 mins estimated
  CHAPTER_DURATION_BONUS_CAP: 50,     // Max 50 bonus pts for duration
  CHAPTER_ON_TIME_BONUS: 15,          // Bonus if completed on or before targetDate

  // Habit completion parameters
  HABIT_DEFAULT_POINT_VALUE: 5,
  HABIT_MIN_POINT_VALUE: 1,
  HABIT_MAX_POINT_VALUE: 50,

  // Streak milestone thresholds and bonus rewards
  STREAK_MILESTONES: [
    { days: 100, bonus: 1000, label: 'Century Streak (100 Days)' },
    { days: 60, bonus: 500, label: 'Master of Consistency (60 Days)' },
    { days: 30, bonus: 200, label: 'Monthly Dedication (30 Days)' },
    { days: 14, bonus: 75, label: 'Fortnight Focus (14 Days)' },
    { days: 7, bonus: 30, label: 'Full Week Streak (7 Days)' },
    { days: 3, bonus: 10, label: '3-Day Momentum (3 Days)' },
  ],

  // Program completion bonus parameters
  PROGRAM_COMPLETION_BASE_BONUS: 200,
  PROGRAM_CHAPTER_SCALE_FACTOR: 10,   // 10 pts per chapter completed in curriculum
  PROGRAM_SUBJECT_SCALE_FACTOR: 15,   // 15 pts per subject mastered in curriculum

  // Pace thresholds (percentage points)
  PACE_AHEAD_THRESHOLD: 5,            // >= +5% ahead of timeline
  PACE_BEHIND_THRESHOLD: -10,         // < -10% behind timeline
};

/**
 * 1. Calculate Chapter Points
 *
 * Awards base points + duration bonus + on-time completion bonus.
 * Does not depend on client claims.
 */
export function calculateChapterPoints(
  chapter: Pick<Chapter, 'estimatedMinutes' | 'targetDate' | 'completedAt'>,
  context?: { completionDate?: string | Date }
): ChapterPointsBreakdown {
  const basePoints = SCORING_CONFIG.CHAPTER_BASE_POINTS;

  // Duration bonus based on estimated workload
  const estMins = Math.max(0, Number(chapter.estimatedMinutes) || 0);
  const durationBonus = Math.min(
    SCORING_CONFIG.CHAPTER_DURATION_BONUS_CAP,
    Math.floor(estMins / SCORING_CONFIG.CHAPTER_DURATION_BONUS_DIVISOR)
  );

  // On-time bonus
  let onTimeBonus = 0;
  if (chapter.targetDate) {
    const targetTimestamp = new Date(chapter.targetDate + 'T23:59:59').getTime();
    const completedTimestamp = context?.completionDate
      ? new Date(context.completionDate).getTime()
      : chapter.completedAt
      ? new Date(chapter.completedAt).getTime()
      : Date.now();

    if (!isNaN(targetTimestamp) && completedTimestamp <= targetTimestamp) {
      onTimeBonus = SCORING_CONFIG.CHAPTER_ON_TIME_BONUS;
    }
  }

  const totalPoints = basePoints + durationBonus + onTimeBonus;

  return {
    totalPoints,
    basePoints,
    durationBonus,
    onTimeBonus,
  };
}

/**
 * 2. Calculate Habit Points
 *
 * Validates habit completion state and enforces boundaries.
 * Incomplete habits award 0 points to prevent fractional gaming/farming.
 */
export function calculateHabitPoints(
  habit: Pick<CustomHabit, 'pointValue' | 'type' | 'targetValue'>,
  log: Pick<DailyHabitLog, 'completed' | 'completionPercentage'>
): HabitPointsBreakdown {
  if (!log.completed) {
    return {
      pointsAwarded: 0,
      basePoints: 0,
      consistencyBonus: 0,
    };
  }

  // Clamped base point value from habit configuration
  const rawPoints = Number(habit.pointValue) || SCORING_CONFIG.HABIT_DEFAULT_POINT_VALUE;
  const basePoints = Math.max(
    SCORING_CONFIG.HABIT_MIN_POINT_VALUE,
    Math.min(SCORING_CONFIG.HABIT_MAX_POINT_VALUE, rawPoints)
  );

  // Optional consistency bonus if target exceeded (e.g. studied 5 hours instead of 4)
  let consistencyBonus = 0;
  if (log.completionPercentage && log.completionPercentage > 100) {
    consistencyBonus = Math.min(5, Math.floor((log.completionPercentage - 100) / 20));
  }

  const pointsAwarded = basePoints + consistencyBonus;

  return {
    pointsAwarded,
    basePoints,
    consistencyBonus,
  };
}

/**
 * 3. Calculate Streak Bonus
 *
 * Determines if a streak milestone has been attained and returns bonus points.
 */
export function calculateStreakBonus(streakDays: number): StreakBonusResult {
  if (streakDays <= 0) {
    return { bonusPoints: 0, milestoneReached: null };
  }

  for (const milestone of SCORING_CONFIG.STREAK_MILESTONES) {
    if (streakDays === milestone.days) {
      return {
        bonusPoints: milestone.bonus,
        milestoneReached: milestone.label,
      };
    }
  }

  return { bonusPoints: 0, milestoneReached: null };
}

/**
 * 4. Calculate Program Completion Bonus
 *
 * Awarded ONLY when all chapters in a curriculum are 100% completed.
 * Formula: Base 200 + (totalChapters * 10) + (totalSubjects * 15)
 */
export function calculateProgramCompletionBonus(
  program: Pick<StudyProgram, 'totalSubjects' | 'totalChapters' | 'completedChapters'>,
  chapters: Array<Pick<Chapter, 'status'>>
): ProgramCompletionBonusResult {
  const totalChapters = chapters.length > 0 ? chapters.length : program.totalChapters || 0;
  const completedChapters =
    chapters.length > 0
      ? chapters.filter((c) => c.status === 'completed').length
      : program.completedChapters || 0;

  // Program is only complete if it contains at least 1 chapter and all chapters are completed
  if (totalChapters === 0 || completedChapters < totalChapters) {
    return {
      bonusPoints: 0,
      breakdown: {
        baseBonus: 0,
        chapterScaleBonus: 0,
        subjectDiversityBonus: 0,
      },
    };
  }

  const baseBonus = SCORING_CONFIG.PROGRAM_COMPLETION_BASE_BONUS;
  const chapterScaleBonus = totalChapters * SCORING_CONFIG.PROGRAM_CHAPTER_SCALE_FACTOR;
  const subjectCount = Math.max(1, program.totalSubjects || 1);
  const subjectDiversityBonus = subjectCount * SCORING_CONFIG.PROGRAM_SUBJECT_SCALE_FACTOR;

  const bonusPoints = baseBonus + chapterScaleBonus + subjectDiversityBonus;

  return {
    bonusPoints,
    breakdown: {
      baseBonus,
      chapterScaleBonus,
      subjectDiversityBonus,
    },
  };
}

/**
 * 5. Calculate Pace Score
 *
 * Computes:
 * - expected progress
 * - actual progress
 * - pace percentage
 * - days remaining
 * - estimated completion date
 * - classification ('ahead' | 'on_track' | 'behind')
 */
export function calculatePaceScore(
  program: Pick<StudyProgram, 'startDate' | 'targetDate' | 'createdAt' | 'status'>,
  chapters: Array<Pick<Chapter, 'status' | 'completedAt'>>,
  asOfDate: Date = new Date()
): PaceCalculationResult {
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === 'completed').length;

  const actualProgress =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // If completed, pace is ahead/on-track
  if (program.status === 'completed' || (totalChapters > 0 && completedChapters === totalChapters)) {
    return {
      expectedProgress: 100,
      actualProgress: 100,
      pacePercentage: 0,
      daysRemaining: 0,
      estimatedCompletionDate: asOfDate.toISOString().split('T')[0],
      classification: 'ahead',
      velocityChaptersPerDay: 0,
    };
  }

  const nowMs = asOfDate.getTime();
  const startMs = new Date(program.startDate || program.createdAt).getTime();

  // If no target date is set, program is self-paced
  if (!program.targetDate) {
    return {
      expectedProgress: actualProgress,
      actualProgress,
      pacePercentage: 0,
      daysRemaining: null,
      estimatedCompletionDate: null,
      classification: 'on_track',
      velocityChaptersPerDay: 0,
    };
  }

  const targetMs = new Date(program.targetDate + 'T23:59:59').getTime();
  const totalDurationMs = targetMs - startMs;
  const elapsedMs = Math.max(0, nowMs - startMs);

  let expectedProgress = 0;
  if (totalDurationMs > 0) {
    const rawExpected = (elapsedMs / totalDurationMs) * 100;
    expectedProgress = Math.min(100, Math.max(0, Math.round(rawExpected)));
  } else {
    expectedProgress = nowMs >= targetMs ? 100 : 0;
  }

  const pacePercentage = actualProgress - expectedProgress;

  // Days remaining until deadline
  const daysRemaining = Math.ceil((targetMs - nowMs) / (1000 * 60 * 60 * 24));

  // Velocity computation (chapters completed per day since start)
  const elapsedDays = Math.max(1, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  const velocity = completedChapters / elapsedDays;

  // Estimated completion date projection
  let estimatedCompletionDate: string | null = null;
  const remainingChapters = totalChapters - completedChapters;
  if (velocity > 0 && remainingChapters > 0) {
    const daysNeeded = Math.ceil(remainingChapters / velocity);
    const projectedMs = nowMs + daysNeeded * (1000 * 60 * 60 * 24);
    estimatedCompletionDate = new Date(projectedMs).toISOString().split('T')[0];
  } else if (remainingChapters === 0) {
    estimatedCompletionDate = asOfDate.toISOString().split('T')[0];
  }

  // Classification: ahead, on_track, behind
  let classification: PaceClassification = 'on_track';
  if (pacePercentage >= SCORING_CONFIG.PACE_AHEAD_THRESHOLD) {
    classification = 'ahead';
  } else if (pacePercentage < SCORING_CONFIG.PACE_BEHIND_THRESHOLD || daysRemaining < 0) {
    classification = 'behind';
  }

  return {
    expectedProgress,
    actualProgress,
    pacePercentage,
    daysRemaining,
    estimatedCompletionDate,
    classification,
    velocityChaptersPerDay: Math.round(velocity * 100) / 100,
  };
}

/**
 * 6. Calculate Streak
 *
 * Deterministically computes current streak and longest streak from historical habit logs.
 * Clients cannot tamper with or directly inject streak values.
 */
export function calculateStreak(
  habitLogs: Array<Pick<DailyHabitLog, 'date' | 'completed'>>,
  activeDays: number[] = [0, 1, 2, 3, 4, 5, 6],
  asOfDate: Date = new Date()
): StreakCalculationResult {
  // Filter for completed logs
  const completedDatesSet = new Set(
    habitLogs.filter((l) => l.completed).map((l) => l.date)
  );

  const formatIso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayIso = formatIso(asOfDate);
  const isCompletedToday = completedDatesSet.has(todayIso);

  const yesterday = new Date(asOfDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = formatIso(yesterday);

  // Determine current streak by walking backward
  let currentStreak = 0;
  let checkDate = new Date(asOfDate);

  // If not completed today yet, check yesterday to preserve ongoing streak
  if (!isCompletedToday) {
    if (completedDatesSet.has(yesterdayIso)) {
      checkDate = yesterday;
    } else {
      // Streak broken
      checkDate = asOfDate;
    }
  }

  // Walk backwards day-by-day
  for (let i = 0; i < 365; i++) {
    const iso = formatIso(checkDate);
    const dayOfWeek = checkDate.getDay();

    if (activeDays.includes(dayOfWeek)) {
      if (completedDatesSet.has(iso)) {
        currentStreak++;
      } else {
        // Streak ends
        break;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak historically
  const sortedDates = Array.from(completedDatesSet).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr + 'T12:00:00');
    if (!previousDate) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    previousDate = currentDate;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
  };
}
