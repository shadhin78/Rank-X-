import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  BookOpen,
  MoreVertical,
  Edit2,
  Archive,
  ArchiveRestore,
  Trash2,
  ArrowRight,
  Clock,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { programService } from '@/src/services/programService';
import type { StudyProgram } from '@/src/types';

interface ProgramCardProps {
  key?: string | number;
  program: StudyProgram;
  onOpen: (program: StudyProgram) => void;
  onEdit: (program: StudyProgram) => void;
  onDelete: (program: StudyProgram) => void;
  onToggleArchive: (program: StudyProgram) => void;
}

export function ProgramCard({
  program,
  onOpen,
  onEdit,
  onDelete,
  onToggleArchive,
}: ProgramCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pace = programService.getPaceStatus(program);

  const formattedTargetDate = program.targetDate
    ? new Date(program.targetDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

  return (
    <Card className="group relative flex flex-col justify-between transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700">
      <div>
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Program Status Badge */}
              <Badge
                variant={
                  program.status === 'completed'
                    ? 'success'
                    : program.status === 'archived'
                    ? 'outline'
                    : 'default'
                }
                className="capitalize text-[10px]"
              >
                {program.status}
              </Badge>

              {/* Pace Status Badge (Placeholder as required) */}
              <span title={pace.description}>
                <Badge
                  variant={pace.variant}
                  className="text-[10px] flex items-center gap-1 font-medium"
                >
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span>{pace.label}</span>
                </Badge>
              </span>
            </div>

            {/* Overflow Action Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Program options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(program);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                      Edit Program
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleArchive(program);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {program.status === 'archived' ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5 text-zinc-400" />
                          Unarchive Program
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5 text-zinc-400" />
                          Archive Program
                        </>
                      )}
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(program);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Program
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="cursor-pointer" onClick={() => onOpen(program)}>
            <CardTitle className="text-base font-bold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 line-clamp-1">
              {program.name}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 line-clamp-2 mt-1 min-h-[2rem]">
              {program.description || 'No description provided.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3.5 pt-0">
          {/* Progress Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                Progress
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {program.progressPercentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  program.progressPercentage === 100
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600 dark:bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, program.progressPercentage))}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-center text-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
            <div>
              <span className="text-[10px] text-zinc-400 block font-normal">
                Chapters Done
              </span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {program.completedChapters} / {program.totalChapters}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-normal">
                Subjects
              </span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {program.totalSubjects}
              </span>
            </div>
          </div>

          {/* Target Date row */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Target Date:</span>
            </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {formattedTargetDate}
            </span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="border-t border-zinc-100 pt-3 pb-3 justify-between dark:border-zinc-800">
        <span className="text-[11px] text-zinc-400">
          {program.totalChapters === 0
            ? 'No chapters yet'
            : program.completedChapters === program.totalChapters
            ? 'Curriculum Completed'
            : `${program.totalChapters - program.completedChapters} chapters left`}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpen(program)}
          className="text-xs group/btn"
        >
          <span>View Syllabus</span>
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
