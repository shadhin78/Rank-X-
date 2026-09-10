import { describe, it, expect } from 'vitest';
import {
  calculateDetailedProgramPace,
  calculateMultiStreaks,
  generateAnalyticsData,
} from '../src/lib/scoring/paceAnalytics';
import type { StudyProgram, CustomHabit, DailyHabitLog, ScoreEvent } from '../src/types';

describe('Advanced Progress Analytics Suite', () => {
  describe('Program Pace Engine', () => {
    it('accurately calculates user prompt specification: 100 chapters, 50 days, day 10 expected 20, actual 25 -> Ahead +25%', () => {
      // Setup start: 2026-09-01, target: 50 days later (2026-10-21)
      const startDate = '2026-09-01';
      // 50 days from Sep 1: Sep has 30 days -> Sep 1 to Sep 30 is 29 days, Oct 21 is day 50
      const targetDate = '2026-10-21';

      // As of day 10 (Sep 11, 2026)
      const asOfDate = new Date('2026-09-11T12:00:00Z');

      const program: Pick<
        StudyProgram,
        'id' | 'name' | 'startDate' | 'targetDate' | 'createdAt' | 'status' | 'totalChapters' | 'completedChapters'
      > = {
        id: 'prog_bba',
        name: 'Curriculum Mastery',
        startDate,
        targetDate,
        createdAt: '2026-09-01T00:00:00.000Z',
        status: 'active',
        totalChapters: 100,
        completedChapters: 25,
      };

      const result = calculateDetailedProgramPace(program, asOfDate);

      // Verify days elapsed is 10
      expect(result.daysElapsed).toBe(10);
      // Verify total days is 50
      expect(result.totalDays).toBe(50);
      // Verify days remaining is 40
      expect(result.daysRemaining).toBe(40);
      // Expected chapters on day 10: 20
      expect(result.expectedChapters).toBe(20);
      // Actual chapters: 25
      expect(result.completedChapters).toBe(25);
      // Expected progress: 20%
      expect(result.expectedProgress).toBe(20);
      // Actual progress: 25%
      expect(result.actualProgress).toBe(25);
      // Result: Ahead, +25%
      expect(result.classification).toBe('Ahead');
      expect(result.pacePercentage).toBe(25);
      // Velocity: 2.5 chapters per day
      expect(result.velocityChaptersPerDay).toBe(2.5);
      // Estimated completion date: day 10 + (75 remaining / 2.5) = 30 days -> Day 40!
      expect(result.estimatedCompletionDate).toBeDefined();
    });

    it('classifies On Track when actual matches expected', () => {
      const startDate = '2026-09-01';
      const targetDate = '2026-10-21'; // 50 days
      const asOfDate = new Date('2026-09-11T12:00:00Z'); // 10 days elapsed

      const program = {
        id: 'prog_on_track',
        name: 'Standard Program',
        startDate,
        targetDate,
        createdAt: '2026-09-01T00:00:00.000Z',
        status: 'active' as const,
        totalChapters: 100,
        completedChapters: 20, // exactly matches expected
      };

      const result = calculateDetailedProgramPace(program, asOfDate);
      expect(result.expectedChapters).toBe(20);
      expect(result.completedChapters).toBe(20);
      expect(result.pacePercentage).toBe(0);
      expect(result.classification).toBe('On Track');
    });

    it('classifies Behind when actual chapters lag expected', () => {
      const startDate = '2026-09-01';
      const targetDate = '2026-10-21'; // 50 days
      const asOfDate = new Date('2026-09-11T12:00:00Z'); // 10 days elapsed

      const program = {
        id: 'prog_behind',
        name: 'Lagging Track',
        startDate,
        targetDate,
        createdAt: '2026-09-01T00:00:00.000Z',
        status: 'active' as const,
        totalChapters: 100,
        completedChapters: 15, // 15 vs 20 expected -> -25%
      };

      const result = calculateDetailedProgramPace(program, asOfDate);
      expect(result.expectedChapters).toBe(20);
      expect(result.completedChapters).toBe(15);
      expect(result.pacePercentage).toBe(-25);
      expect(result.classification).toBe('Behind');
    });

    it('handles completed status properly with 100% progress', () => {
      const program = {
        id: 'prog_done',
        name: 'Finished Course',
        startDate: '2026-08-01',
        targetDate: '2026-09-01',
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'completed' as const,
        totalChapters: 30,
        completedChapters: 30,
      };

      const result = calculateDetailedProgramPace(program, new Date('2026-09-05T00:00:00Z'));
      expect(result.actualProgress).toBe(100);
      expect(result.expectedProgress).toBe(100);
      expect(result.classification).toBe('Ahead');
    });
  });

  describe('Multi-Streaks Tracking Engine', () => {
    it('accurately distinguishes daily habit streak, study streak, overall streak, and longest streak', () => {
      const asOfDate = new Date('2026-09-12T12:00:00Z');

      // Habits completed for 4 consecutive days: Sep 9, 10, 11, 12
      const habitLogs: Array<Pick<DailyHabitLog, 'date' | 'completed'>> = [
        { date: '2026-09-09', completed: true },
        { date: '2026-09-10', completed: true },
        { date: '2026-09-11', completed: true },
        { date: '2026-09-12', completed: true },
      ];

      // Study completed on: Sep 11, 12 (2 days streak)
      const chapterDates = ['2026-09-11T10:00:00Z', '2026-09-12T14:00:00Z'];

      const streaks = calculateMultiStreaks(habitLogs, chapterDates, asOfDate);

      expect(streaks.dailyHabitStreak).toBe(4);
      expect(streaks.studyStreak).toBe(2);
      expect(streaks.overallStreak).toBe(4);
      expect(streaks.todayHabitCompleted).toBe(true);
      expect(streaks.todayStudyCompleted).toBe(true);
      expect(streaks.todayOverallCompleted).toBe(true);
      expect(streaks.longestStreak).toBeGreaterThanOrEqual(4);
    });

    it('retains previous day streak if today is not yet completed', () => {
      const asOfDate = new Date('2026-09-12T12:00:00Z');

      // Habits completed yesterday and day before, but not today
      const habitLogs: Array<Pick<DailyHabitLog, 'date' | 'completed'>> = [
        { date: '2026-09-10', completed: true },
        { date: '2026-09-11', completed: true },
      ];

      const chapterDates: string[] = [];

      const streaks = calculateMultiStreaks(habitLogs, chapterDates, asOfDate);
      expect(streaks.todayHabitCompleted).toBe(false);
      expect(streaks.todayOverallCompleted).toBe(false);
      // Streak still holds active (2 days) pending today's check-in
      expect(streaks.dailyHabitStreak).toBe(2);
      expect(streaks.overallStreak).toBe(2);
    });
  });

  describe('Full Analytics Trends & Performance Diagnostics', () => {
    it('generates all 7 required trends and performance insights', () => {
      const asOfDate = new Date('2026-09-12T12:00:00Z');

      const mockPrograms: StudyProgram[] = [
        {
          id: 'p1',
          ownerUid: 'u1',
          name: 'BBA 2nd Year',
          description: 'Comprehensive business administration track',
          startDate: '2026-09-01',
          targetDate: '2026-10-21',
          status: 'active',
          totalSubjects: 4,
          totalChapters: 100,
          completedChapters: 25,
          progressPercentage: 25,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-12T00:00:00Z',
        },
        {
          id: 'p2',
          ownerUid: 'u1',
          name: 'Advanced Accounting',
          description: 'Corporate financial reporting and analysis',
          startDate: '2026-09-01',
          targetDate: '2026-09-20',
          status: 'active',
          totalSubjects: 2,
          totalChapters: 40,
          completedChapters: 5,
          progressPercentage: 12.5,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-10T00:00:00Z',
        },
      ];

      const mockHabits: CustomHabit[] = [
        {
          id: 'h1',
          ownerUid: 'u1',
          name: 'Deep Work 90m',
          description: 'Focused distraction-free study blocks',
          type: 'duration',
          targetValue: 90,
          unit: 'mins',
          pointValue: 15,
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          startDate: '2026-09-01',
          isActive: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 'h2',
          ownerUid: 'u1',
          name: 'Morning Flashcards',
          description: 'Spaced repetition flashcards',
          type: 'count',
          targetValue: 20,
          unit: 'cards',
          pointValue: 10,
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          startDate: '2026-09-01',
          isActive: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ];

      const mockDailyLogs: DailyHabitLog[] = [
        {
          id: 'l1',
          ownerUid: 'u1',
          habitId: 'h1',
          date: '2026-09-12',
          completed: true,
          targetValue: 90,
          actualValue: 90,
          completionPercentage: 100,
          earnedPoints: 15,
          createdAt: '2026-09-12T08:00:00Z',
          updatedAt: '2026-09-12T08:00:00Z',
        },
        {
          id: 'l2',
          ownerUid: 'u1',
          habitId: 'h2',
          date: '2026-09-12',
          completed: false, // inconsistent habit
          targetValue: 20,
          actualValue: 0,
          completionPercentage: 0,
          earnedPoints: 0,
          createdAt: '2026-09-12T08:00:00Z',
          updatedAt: '2026-09-12T08:00:00Z',
        },
      ];

      const mockScoreEvents: ScoreEvent[] = [
        {
          id: 'ev_1',
          userId: 'u1',
          targetId: 'c1',
          eventType: 'chapter_completion',
          category: 'study',
          pointsAwarded: 45,
          createdAt: '2026-09-12T10:00:00Z',
        },
      ];

      const userStreaks = calculateMultiStreaks(
        mockDailyLogs,
        ['2026-09-12T10:00:00Z'],
        asOfDate
      );

      const analytics = generateAnalyticsData(
        mockPrograms,
        mockHabits,
        mockDailyLogs,
        mockScoreEvents,
        userStreaks,
        asOfDate
      );

      // 1. Daily points (14 days)
      expect(analytics.dailyPoints.length).toBe(14);
      // 2. Weekly points (8 weeks)
      expect(analytics.weeklyPoints.length).toBe(8);
      // 3. Monthly points (6 months)
      expect(analytics.monthlyPoints.length).toBe(6);
      // 4. Chapter completion trend
      expect(analytics.chapterCompletionTrend.length).toBe(14);
      // 5. Habit completion trend
      expect(analytics.habitCompletionTrend.length).toBe(14);
      // 6. Streak history
      expect(analytics.streakHistory.length).toBe(14);
      // 7. Pace history
      expect(analytics.paceHistory.length).toBe(14);

      // Program paces
      expect(analytics.programPaces.length).toBe(2);
      expect(analytics.programPaces[0].classification).toBe('Ahead');
      expect(analytics.programPaces[0].pacePercentage).toBe(14);

      // Performance Summary Insights
      expect(analytics.insights.improving.length).toBeGreaterThan(0);
      expect(analytics.insights.weakestProgram).toBeDefined();
      expect(analytics.insights.weakestProgram?.name).toBe('Advanced Accounting');
      expect(analytics.insights.inconsistentHabits.length).toBeGreaterThan(0);
      expect(analytics.insights.inconsistentHabits[0].name).toBe('Morning Flashcards');
    });
  });
});
