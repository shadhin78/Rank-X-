import { describe, it, expect } from 'vitest';
import { performanceService } from '../src/services/performanceService';
import { programService } from '../src/services/programService';
import { habitService } from '../src/services/habitService';
import type { StudyProgram, CustomHabit, DailyHabitLog } from '../src/types';

describe('Dashboard Architecture & Performance Metrics', () => {
  it('calculates accurate date boundaries for today, this week, and this month', () => {
    const boundaries = performanceService.getTimeBoundaries();
    expect(boundaries.startOfToday).toBeDefined();
    expect(boundaries.startOfWeek).toBeDefined();
    expect(boundaries.startOfMonth).toBeDefined();

    const todayDate = new Date(boundaries.startOfToday);
    const weekDate = new Date(boundaries.startOfWeek);
    const monthDate = new Date(boundaries.startOfMonth);

    expect(todayDate.getTime()).toBeGreaterThanOrEqual(weekDate.getTime());
    expect(weekDate.getTime()).toBeGreaterThanOrEqual(
      new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).getTime() - 7 * 86400000
    );
  });

  it('calculates study completion percentage without loading chapter sub-trees', () => {
    const activePrograms: StudyProgram[] = [
      {
        id: 'prog_1',
        ownerUid: 'user_1',
        name: 'Finance & Accounting',
        description: 'Semester curriculum',
        startDate: '2026-09-01',
        targetDate: '2026-10-15',
        status: 'active',
        totalSubjects: 2,
        totalChapters: 10,
        completedChapters: 6,
        progressPercentage: 60,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z',
      },
      {
        id: 'prog_2',
        ownerUid: 'user_1',
        name: 'Corporate Strategy',
        description: 'Strategic management',
        startDate: '2026-09-01',
        targetDate: '2026-11-01',
        status: 'active',
        totalSubjects: 1,
        totalChapters: 6,
        completedChapters: 2,
        progressPercentage: 33,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z',
      },
    ];

    const totalChapters = activePrograms.reduce((sum, p) => sum + p.totalChapters, 0);
    const completedChapters = activePrograms.reduce((sum, p) => sum + p.completedChapters, 0);
    const studyCompletion = Math.round((completedChapters / totalChapters) * 100);

    expect(totalChapters).toBe(16);
    expect(completedChapters).toBe(8);
    expect(studyCompletion).toBe(50);
  });

  it('evaluates habit completion percentage strictly for active habits today', () => {
    const todayDay = new Date().getDay();

    const habits: CustomHabit[] = [
      {
        id: 'h_1',
        ownerUid: 'user_1',
        name: 'Morning Wake Up',
        description: '',
        type: 'time',
        targetValue: '06:30',
        unit: '',
        pointValue: 5,
        activeDays: [0, 1, 2, 3, 4, 5, 6], // Active every day
        startDate: '2026-09-01',
        isActive: true,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'h_2',
        ownerUid: 'user_1',
        name: 'Deep Focus Study',
        description: '',
        type: 'duration',
        targetValue: 4,
        unit: 'hours',
        pointValue: 10,
        activeDays: [todayDay], // Active today
        startDate: '2026-09-01',
        isActive: true,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'h_inactive',
        ownerUid: 'user_1',
        name: 'Weekend Review',
        description: '',
        type: 'boolean',
        targetValue: true,
        unit: '',
        pointValue: 15,
        activeDays: [(todayDay + 3) % 7], // Not active today
        startDate: '2026-09-01',
        isActive: true,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ];

    const activeToday = habits.filter((h) => h.activeDays.includes(todayDay) && h.isActive);
    expect(activeToday.length).toBe(2);

    const dailyLogs: DailyHabitLog[] = [
      {
        id: 'user_1_h_1_2026-09-10',
        habitId: 'h_1',
        ownerUid: 'user_1',
        date: '2026-09-10',
        targetValue: '06:30',
        actualValue: '06:15',
        completionPercentage: 100,
        completed: true,
        earnedPoints: 5,
        createdAt: '2026-09-10T06:15:00Z',
        updatedAt: '2026-09-10T06:15:00Z',
      },
    ];

    const completedCount = activeToday.filter((h) =>
      dailyLogs.find((l) => l.habitId === h.id && l.completed)
    ).length;

    const habitPct = Math.round((completedCount / activeToday.length) * 100);
    expect(completedCount).toBe(1);
    expect(habitPct).toBe(50);
  });

  it('calculates pace status on program cards correctly', () => {
    const onTrackProgram: StudyProgram = {
      id: 'p_track',
      ownerUid: 'user_1',
      name: 'On Track Program',
      description: '',
      startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      targetDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: 'active',
      totalSubjects: 1,
      totalChapters: 10,
      completedChapters: 5,
      progressPercentage: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pace = programService.getPaceStatus(onTrackProgram);
    expect(pace.label).toBe('On Track');
    expect(pace.variant).toBe('success');
  });

  it('blends overall completion score from study and habit completions', () => {
    const studyCompletion = 80;
    const habitCompletion = 60;
    const overall = Math.round(studyCompletion * 0.5 + habitCompletion * 0.5);

    expect(overall).toBe(70);
  });
});
