/**
 * StudyRank Domain Models & Application Types
 */

export type UserRole = 'user' | 'admin';
export type AccountStatus = 'pending' | 'approved' | 'banned' | 'deactivated';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  lastActiveAt: string;
  totalPoints: number;
  studyPoints: number;
  habitPoints: number;
  streak: number;
  rank: number;
  email?: string | null;
  photoURL?: string | null;
}

export type ProgramStatus = 'active' | 'completed' | 'archived';

export interface StudyProgram {
  id: string;
  ownerUid: string;
  name: string;
  description: string;
  startDate: string;
  targetDate: string;
  status: ProgramStatus;
  totalSubjects: number;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  programId: string;
  ownerUid: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type ChapterStatus = 'not_started' | 'in_progress' | 'completed';

export interface Chapter {
  id: string;
  programId: string;
  subjectId: string;
  ownerUid: string;
  name: string;
  description: string;
  order: number;
  status: ChapterStatus;
  targetDate?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';
export type HabitType = 'boolean' | 'checkbox' | 'number' | 'duration' | 'count' | 'time';

export interface CustomHabit {
  id: string;
  ownerUid: string;
  name: string;
  description: string;
  type: HabitType;
  targetValue: number | string | boolean;
  unit: string;
  pointValue: number;
  activeDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Habit = CustomHabit;

export interface DailyHabitLog {
  id: string;
  habitId: string;
  ownerUid: string;
  date: string; // YYYY-MM-DD
  targetValue: number | string | boolean;
  actualValue: number | string | boolean;
  completionPercentage: number;
  completed: boolean;
  earnedPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardRecord {
  uid: string;
  username: string;
  displayName: string;
  totalPoints: number;
  studyPoints: number;
  habitPoints: number;
  streak: number;
  paceScore: number;
  completionScore: number;
  rank: number;
  previousRank: number;
  updatedAt: string;
  isTestFixture?: boolean;
}

export type RankMovementType = 'up' | 'down' | 'same' | 'new';

export interface RankMovement {
  type: RankMovementType;
  delta: number; // absolute change in positions
  text: string;  // e.g. "▲ 2", "▼ 1", "─"
}

export type LeaderboardLimit = 10 | 25 | 50;

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  points: number;
  streakDays: number;
  completedTasksThisWeek: number;
  trend: 'up' | 'down' | 'same';
}

export interface AdminApprovalRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  requestType: 'join_workspace' | 'program_publish' | 'score_challenge';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
}

export interface AdminActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  badge?: string | number;
  section?: 'main' | 'productivity' | 'competition' | 'admin';
}

/**
 * Secure Scoring Engine Domain Models
 */

export type ScoreEventType =
  | 'chapter_completion'
  | 'habit_completion'
  | 'program_completion'
  | 'streak_bonus'
  | 'pace_bonus';

export type ScoreCategory = 'study' | 'habit' | 'bonus';

export interface ScoreEvent {
  id: string; // Deterministic event ID e.g. score_chap_${userId}_${chapterId}
  userId: string;
  eventType: ScoreEventType;
  targetId: string;
  category: ScoreCategory;
  pointsAwarded: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type PaceClassification = 'ahead' | 'on_track' | 'behind';

export interface PaceCalculationResult {
  expectedProgress: number; // 0 - 100 percentage
  actualProgress: number; // 0 - 100 percentage
  pacePercentage: number; // delta: actualProgress - expectedProgress
  daysRemaining: number | null;
  estimatedCompletionDate: string | null; // YYYY-MM-DD
  classification: PaceClassification;
  velocityChaptersPerDay: number;
  aheadByDays?: number;
  behindByDays?: number;
}

export type PaceStatusLabel = 'Ahead' | 'On Track' | 'Behind';

export interface DetailedProgramPace {
  programId: string;
  programName: string;
  startDate: string;
  targetDate: string | null;
  daysElapsed: number;
  daysRemaining: number | null;
  totalDays: number | null;
  totalChapters: number;
  completedChapters: number;
  expectedChapters: number;
  expectedProgress: number; // percentage (0 - 100)
  actualProgress: number;   // percentage (0 - 100)
  pacePercentage: number;   // relative pace difference: e.g. +25%
  absolutePaceDelta: number; // actualProgress - expectedProgress (e.g. +5%)
  estimatedCompletionDate: string | null;
  classification: PaceStatusLabel;
  status: ProgramStatus;
  velocityChaptersPerDay: number;
}

export interface UserMultiStreaks {
  dailyHabitStreak: number;
  studyStreak: number;
  overallStreak: number;
  longestStreak: number;
  todayHabitCompleted: boolean;
  todayStudyCompleted: boolean;
  todayOverallCompleted: boolean;
  lastActiveDate: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  label: string;
  value: number;
  secondaryValue?: number;
  meta?: string;
}

export interface PerformanceInsights {
  improving: string[];
  fallingBehind: string[];
  weakestProgram: {
    programId: string;
    name: string;
    pacePercentage: number;
    expectedChapters: number;
    actualChapters: number;
    totalChapters: number;
    daysRemaining: number | null;
    classification: PaceStatusLabel;
    recommendation: string;
  } | null;
  inconsistentHabits: Array<{
    habitId: string;
    name: string;
    target: string;
    completionRate: number; // 0 - 100%
    missedDaysCount: number;
    recentTrend: 'improving' | 'declining' | 'stagnant';
    suggestion: string;
  }>;
}

export interface ProgressAnalyticsPayload {
  dailyPoints: TimeSeriesDataPoint[];
  weeklyPoints: TimeSeriesDataPoint[];
  monthlyPoints: TimeSeriesDataPoint[];
  chapterCompletionTrend: TimeSeriesDataPoint[];
  habitCompletionTrend: TimeSeriesDataPoint[];
  streakHistory: TimeSeriesDataPoint[];
  paceHistory: TimeSeriesDataPoint[];
  programPaces: DetailedProgramPace[];
  streaks: UserMultiStreaks;
  insights: PerformanceInsights;
}

export interface ChapterPointsBreakdown {
  totalPoints: number;
  basePoints: number;
  durationBonus: number;
  onTimeBonus: number;
}

export interface HabitPointsBreakdown {
  pointsAwarded: number;
  basePoints: number;
  consistencyBonus: number;
}

export interface StreakBonusResult {
  bonusPoints: number;
  milestoneReached: string | null;
}

export interface ProgramCompletionBonusResult {
  bonusPoints: number;
  breakdown: {
    baseBonus: number;
    chapterScaleBonus: number;
    subjectDiversityBonus: number;
  };
}

export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
}

export interface ScoringTransactionResult {
  success: boolean;
  pointsAwarded: number;
  alreadyAwarded: boolean;
  eventType: ScoreEventType;
  eventId: string;
  scoreSummary: {
    totalPoints: number;
    studyPoints: number;
    habitPoints: number;
    streak: number;
  };
  programBonusAwarded?: number;
  message?: string;
}

export type AuditAction =
  | 'USER_APPROVED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'ACCOUNT_DEACTIVATED'
  | 'USER_ROLE_CHANGED'
  | 'PROGRAM_INSPECTED'
  | 'LEADERBOARD_RESYNC';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorUsername: string;
  action: AuditAction;
  targetUid: string;
  targetUsername?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AdminPaginatedUsers {
  users: UserProfile[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOverviewStats {
  totalUsers: number;
  pendingApprovals: number;
  activeUsers: number;
  bannedUsers: number;
  deactivatedUsers: number;
  auditLogsCount: number;
  recentAuditLogs: AuditLogEntry[];
  recentPending: UserProfile[];
}

export interface AdminUserDetailPerformance {
  user: UserProfile;
  programsCount: number;
  completedChaptersCount: number;
  totalChaptersCount: number;
  habitsCount: number;
  completionScore: number;
  paceScore: number;
  recentScoreEvents: ScoreEvent[];
  programs: StudyProgram[];
}
