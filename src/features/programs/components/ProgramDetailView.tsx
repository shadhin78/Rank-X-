import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Circle,
  Clock3,
  TrendingUp,
  AlertTriangle,
  MoveUp,
  MoveDown,
  MoreVertical,
  Gauge,
  Zap,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { programService } from '@/src/services/programService';
import { calculatePaceScore } from '@/src/lib/scoring/scoringEngine';
import { useAppStore } from '@/src/store';
import { SubjectFormDialog } from './SubjectFormDialog';
import { ChapterFormDialog } from './ChapterFormDialog';
import { ProgramFormDialog } from './ProgramFormDialog';
import type { StudyProgram, Subject, Chapter, ChapterStatus } from '@/src/types';

interface ProgramDetailViewProps {
  program: StudyProgram;
  currentUserUid: string;
  onBack: () => void;
  onProgramUpdated: (updated: StudyProgram) => void;
  onProgramDeleted: (programId: string) => void;
}

export function ProgramDetailView({
  program,
  currentUserUid,
  onBack,
  onProgramUpdated,
  onProgramDeleted,
}: ProgramDetailViewProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [editProgramOpen, setEditProgramOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [targetSubjectIdForChapter, setTargetSubjectIdForChapter] = useState<string>('');

  // Confirmation dialogs
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'program' | 'subject' | 'chapter';
    id: string;
    name: string;
  } | null>(null);

  // Subscribe to subjects and chapters in realtime
  useEffect(() => {
    const unsubSubjects = programService.subscribeSubjects(
      currentUserUid,
      program.id,
      (list) => {
        setSubjects(list);
        // Expand all subjects initially
        setExpandedSubjectIds((prev) => {
          const next = { ...prev };
          list.forEach((s) => {
            if (next[s.id] === undefined) next[s.id] = true;
          });
          return next;
        });
      }
    );

    const unsubChapters = programService.subscribeChapters(
      currentUserUid,
      program.id,
      (list) => {
        setChapters(list);
      }
    );

    return () => {
      unsubSubjects();
      unsubChapters();
    };
  }, [program.id, currentUserUid]);

  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjectIds((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    subjects.forEach((s) => (next[s.id] = true));
    setExpandedSubjectIds(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    subjects.forEach((s) => (next[s.id] = false));
    setExpandedSubjectIds(next);
  };

  // Program operations
  const handleUpdateProgram = async (data: any) => {
    await programService.updateProgram(program.id, currentUserUid, data);
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const handleToggleArchive = async () => {
    const newStatus = program.status === 'archived' ? 'active' : 'archived';
    await programService.setProgramStatus(program.id, currentUserUid, newStatus);
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const handleDeleteProgram = async () => {
    await programService.deleteProgram(program.id, currentUserUid);
    onProgramDeleted(program.id);
  };

  // Subject operations
  const handleSaveSubject = async (data: { name: string; description: string }) => {
    if (editingSubject) {
      await programService.updateSubject(editingSubject.id, program.id, currentUserUid, data);
    } else {
      await programService.createSubject(currentUserUid, program.id, data);
    }
    // Refresh program summary
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    await programService.deleteSubject(subjectId, program.id, currentUserUid);
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const handleReorderSubject = async (subjectId: string, direction: 'up' | 'down') => {
    const sorted = [...subjects].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === subjectId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = sorted[idx];
      sorted[idx] = sorted[idx - 1];
      sorted[idx - 1] = temp;
    } else if (direction === 'down' && idx < sorted.length - 1) {
      const temp = sorted[idx];
      sorted[idx] = sorted[idx + 1];
      sorted[idx + 1] = temp;
    } else {
      return;
    }

    const orderedIds = sorted.map((s) => s.id);
    await programService.reorderSubjects(currentUserUid, program.id, orderedIds);
  };

  // Chapter operations
  const handleSaveChapter = async (data: any) => {
    if (editingChapter) {
      await programService.updateChapter(editingChapter.id, program.id, currentUserUid, data);
    } else {
      await programService.createChapter(
        currentUserUid,
        program.id,
        data.subjectId,
        data
      );
    }
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    await programService.deleteChapter(chapterId, program.id, currentUserUid);
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const updateScoreSummary = useAppStore((state) => state.updateScoreSummary);

  const handleCycleChapterStatus = async (chapter: Chapter) => {
    let nextStatus: ChapterStatus = 'not_started';
    if (chapter.status === 'not_started') nextStatus = 'in_progress';
    else if (chapter.status === 'in_progress') nextStatus = 'completed';
    else if (chapter.status === 'completed') nextStatus = 'not_started';

    const scoringResult = await programService.setChapterStatus(
      chapter.id,
      program.id,
      currentUserUid,
      nextStatus
    );
    if (scoringResult?.scoreSummary) {
      updateScoreSummary(scoringResult.scoreSummary);
    }
    const updated = await programService.getProgramById(program.id, currentUserUid);
    if (updated) onProgramUpdated(updated);
  };

  const handleReorderChapter = async (
    subjectId: string,
    chapterId: string,
    direction: 'up' | 'down'
  ) => {
    const subChapters = chapters
      .filter((c) => c.subjectId === subjectId)
      .sort((a, b) => a.order - b.order);
    const idx = subChapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = subChapters[idx];
      subChapters[idx] = subChapters[idx - 1];
      subChapters[idx - 1] = temp;
    } else if (direction === 'down' && idx < subChapters.length - 1) {
      const temp = subChapters[idx];
      subChapters[idx] = subChapters[idx + 1];
      subChapters[idx + 1] = temp;
    } else {
      return;
    }

    const orderedIds = subChapters.map((c) => c.id);
    await programService.reorderChapters(currentUserUid, subjectId, orderedIds);
  };

  const pace = useMemo(() => calculatePaceScore(program, chapters), [program, chapters]);

  const formattedTargetDate = program.targetDate
    ? new Date(program.targetDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline set';

  const formattedStartDate = program.startDate
    ? new Date(program.startDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Ongoing';

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Programs</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleArchive}
            className="text-xs"
          >
            {program.status === 'archived' ? (
              <>
                <ArchiveRestore className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                <span>Restore Track</span>
              </>
            ) : (
              <>
                <Archive className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                <span>Archive Track</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditProgramOpen(true)}
            className="text-xs"
          >
            <Edit2 className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
            <span>Edit Program</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              setDeleteConfirmTarget({
                type: 'program',
                id: program.id,
                name: program.name,
              })
            }
            className="text-xs"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Program Header Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950">
        <CardContent className="p-5 sm:p-7 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    program.status === 'completed'
                      ? 'success'
                      : program.status === 'archived'
                      ? 'outline'
                      : 'default'
                  }
                  className="capitalize"
                >
                  {program.status}
                </Badge>
                <span title={pace.description}>
                  <Badge
                    variant={pace.variant}
                    className="flex items-center gap-1 font-medium"
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span>{pace.label}</span>
                  </Badge>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {program.name}
              </h1>

              {program.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                  {program.description}
                </p>
              )}
            </div>

            {/* Date badges */}
            <div className="flex sm:flex-col gap-3 text-xs text-zinc-500 shrink-0">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 dark:bg-zinc-800/80 dark:border-zinc-700">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>Started: <strong className="text-zinc-800 dark:text-zinc-200">{formattedStartDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 dark:bg-zinc-800/80 dark:border-zinc-700">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Target: <strong className="text-zinc-800 dark:text-zinc-200">{formattedTargetDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Summary Stats */}
          <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">Curriculum Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {program.progressPercentage}% Complete
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  program.progressPercentage === 100
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600 dark:bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, program.progressPercentage))}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-zinc-100 bg-white p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-800/40">
                <span className="block text-[11px] text-zinc-400 font-medium">Subjects</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {program.totalSubjects}
                </span>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-white p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-800/40">
                <span className="block text-[11px] text-zinc-400 font-medium">Total Chapters</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {program.totalChapters}
                </span>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-white p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-800/40">
                <span className="block text-[11px] text-zinc-400 font-medium">Completed</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {program.completedChapters}
                </span>
              </div>
            </div>

            {/* Pacing Engine Metrics */}
            <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Pace Intelligence Engine
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      pace.classification === 'ahead'
                        ? 'success'
                        : pace.classification === 'behind'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="capitalize text-[11px] font-medium"
                  >
                    {pace.classification === 'ahead' && 'Ahead of Pace'}
                    {pace.classification === 'on_track' && 'On Track'}
                    {pace.classification === 'behind' && 'Behind Schedule'}
                    {pace.pacePercentage !== 0 && ` (${pace.pacePercentage > 0 ? '+' : ''}${pace.pacePercentage}%)`}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 block">Expected</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {pace.expectedProgress}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 block">Days Left</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {pace.daysRemaining !== null ? `${pace.daysRemaining} days` : 'Open-ended'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 block">Study Velocity</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {pace.velocityChaptersPerDay} ch/day
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 block">Est. Completion</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate block">
                    {pace.estimatedCompletionDate || 'Pending progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects & Chapters Curriculum Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Syllabus Structure
            </h2>
            <p className="text-xs text-zinc-500">
              Manage subjects and ordered chapter learning topics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {subjects.length > 1 && (
              <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded"
                >
                  Expand All
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded"
                >
                  Collapse All
                </button>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSubject(null);
                setSubjectDialogOpen(true);
              }}
              className="text-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Add Subject</span>
            </Button>
          </div>
        </div>

        {/* Empty state if no subjects exist */}
        {subjects.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              No subjects added yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-4">
              Create your first subject module (e.g. Financial Accounting, Calculus) to organize chapter topics.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSubject(null);
                setSubjectDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Add First Subject</span>
            </Button>
          </div>
        )}

        {/* Subject Accordions */}
        <div className="space-y-4">
          {subjects
            .sort((a, b) => a.order - b.order)
            .map((subject, sIdx) => {
              const subjectChapters = chapters
                .filter((c) => c.subjectId === subject.id)
                .sort((a, b) => a.order - b.order);
              const completedCount = subjectChapters.filter((c) => c.status === 'completed').length;
              const isExpanded = expandedSubjectIds[subject.id] ?? true;

              return (
                <div
                  key={subject.id}
                  className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden shadow-xs"
                >
                  {/* Subject Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 gap-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer select-none flex-1"
                      onClick={() => toggleSubjectExpand(subject.id)}
                    >
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                        aria-label="Toggle subject accordion"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                            Module {sIdx + 1}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 font-medium">
                            {completedCount}/{subjectChapters.length} done
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {subject.name}
                        </h3>
                        {subject.description && (
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subject Controls & Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => handleReorderSubject(subject.id, 'up')}
                        title="Move subject up"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 disabled:opacity-30 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={sIdx === subjects.length - 1}
                        onClick={() => handleReorderSubject(subject.id, 'down')}
                        title="Move subject down"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 disabled:opacity-30 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>

                      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setTargetSubjectIdForChapter(subject.id);
                          setEditingChapter(null);
                          setChapterDialogOpen(true);
                        }}
                        className="text-xs h-8"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        <span>Add Chapter</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubject(subject);
                          setSubjectDialogOpen(true);
                        }}
                        title="Edit subject"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmTarget({
                            type: 'subject',
                            id: subject.id,
                            name: subject.name,
                          })
                        }
                        title="Delete subject"
                        className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Chapters List */}
                  {isExpanded && (
                    <div className="p-4 space-y-2.5">
                      {subjectChapters.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                          No chapters in this subject module.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSubjectIdForChapter(subject.id);
                              setEditingChapter(null);
                              setChapterDialogOpen(true);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 ml-1"
                          >
                            Add first chapter
                          </button>
                        </div>
                      ) : (
                        subjectChapters.map((chapter, cIdx) => {
                          const isCompleted = chapter.status === 'completed';
                          const isInProgress = chapter.status === 'in_progress';

                          return (
                            <div
                              key={chapter.id}
                              className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-150 gap-3 ${
                                isCompleted
                                  ? 'bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                                  : isInProgress
                                  ? 'bg-amber-50/30 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40'
                                  : 'bg-white border-zinc-100 hover:border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800 dark:hover:border-zinc-700'
                              }`}
                            >
                              {/* Left status & info */}
                              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                {/* Interactive status toggler */}
                                <button
                                  type="button"
                                  onClick={() => handleCycleChapterStatus(chapter)}
                                  title={`Status: ${chapter.status.replace('_', ' ')} (Click to toggle)`}
                                  className="mt-0.5 sm:mt-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform active:scale-90"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                  ) : isInProgress ? (
                                    <Clock3 className="h-6 w-6 text-amber-500 animate-pulse" />
                                  ) : (
                                    <Circle className="h-6 w-6 text-zinc-300 dark:text-zinc-600 hover:text-zinc-400" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-sm font-semibold truncate ${
                                        isCompleted
                                          ? 'text-zinc-600 dark:text-zinc-400 line-through'
                                          : 'text-zinc-900 dark:text-zinc-100'
                                      }`}
                                    >
                                      {chapter.name}
                                    </span>

                                    {/* Status Pill */}
                                    <span
                                      onClick={() => handleCycleChapterStatus(chapter)}
                                      className={`cursor-pointer select-none text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                                        isCompleted
                                          ? 'bg-emerald-100/80 text-emerald-700 border-emerald-300/60 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                          : isInProgress
                                          ? 'bg-amber-100/80 text-amber-700 border-amber-300/60 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                      }`}
                                    >
                                      {chapter.status.replace('_', ' ')}
                                    </span>
                                  </div>

                                  {chapter.description && (
                                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                      {chapter.description}
                                    </p>
                                  )}

                                  {/* Badges / Metrics row */}
                                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 flex-wrap">
                                    {chapter.targetDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-zinc-400" />
                                        <span>Target: {chapter.targetDate}</span>
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-zinc-400" />
                                      <span>Est: {chapter.estimatedMinutes}m</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock3 className="h-3 w-3 text-indigo-400" />
                                      <span>Act: {chapter.actualMinutes}m</span>
                                    </span>
                                    {chapter.completedAt && (
                                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                                        Completed on {new Date(chapter.completedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right controls: reordering, edit, delete */}
                              <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  disabled={cIdx === 0}
                                  onClick={() => handleReorderChapter(subject.id, chapter.id, 'up')}
                                  title="Move chapter up"
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-20 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                >
                                  <MoveUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={cIdx === subjectChapters.length - 1}
                                  onClick={() => handleReorderChapter(subject.id, chapter.id, 'down')}
                                  title="Move chapter down"
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-20 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                >
                                  <MoveDown className="h-3 w-3" />
                                </button>

                                <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetSubjectIdForChapter(subject.id);
                                    setEditingChapter(chapter);
                                    setChapterDialogOpen(true);
                                  }}
                                  title="Edit chapter details"
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirmTarget({
                                      type: 'chapter',
                                      id: chapter.id,
                                      name: chapter.name,
                                    })
                                  }
                                  title="Delete chapter"
                                  className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Edit Program Dialog */}
      <ProgramFormDialog
        isOpen={editProgramOpen}
        onClose={() => setEditProgramOpen(false)}
        onSubmit={handleUpdateProgram}
        initialData={program}
      />

      {/* Subject Dialog */}
      <SubjectFormDialog
        isOpen={subjectDialogOpen}
        onClose={() => {
          setSubjectDialogOpen(false);
          setEditingSubject(null);
        }}
        onSubmit={handleSaveSubject}
        initialData={editingSubject}
        programName={program.name}
      />

      {/* Chapter Dialog */}
      <ChapterFormDialog
        isOpen={chapterDialogOpen}
        onClose={() => {
          setChapterDialogOpen(false);
          setEditingChapter(null);
        }}
        onSubmit={handleSaveChapter}
        initialData={editingChapter}
        defaultSubjectId={targetSubjectIdForChapter || subjects[0]?.id || ''}
        subjects={subjects}
      />

      {/* Unified Deletion Confirmation Modal */}
      {deleteConfirmTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              Delete {deleteConfirmTarget.type === 'program' ? 'Program' : deleteConfirmTarget.type === 'subject' ? 'Subject' : 'Chapter'}?
            </h3>

            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                "{deleteConfirmTarget.name}"
              </strong>
              ?
              {deleteConfirmTarget.type === 'program' &&
                ' This will permanently delete this program and all associated subjects and chapters.'}
              {deleteConfirmTarget.type === 'subject' &&
                ' This will permanently delete this subject module and all its chapters.'}
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (deleteConfirmTarget.type === 'program') {
                    await handleDeleteProgram();
                  } else if (deleteConfirmTarget.type === 'subject') {
                    await handleDeleteSubject(deleteConfirmTarget.id);
                  } else if (deleteConfirmTarget.type === 'chapter') {
                    await handleDeleteChapter(deleteConfirmTarget.id);
                  }
                  setDeleteConfirmTarget(null);
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
