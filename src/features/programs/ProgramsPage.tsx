import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Layers,
  CheckCircle2,
  FolderKanban,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { EmptyStateCard } from '@/src/components/ui/card';
import { useAppStore } from '@/src/store';
import { programService } from '@/src/services/programService';
import { ProgramCard } from './components/ProgramCard';
import { ProgramFormDialog } from './components/ProgramFormDialog';
import { ProgramDetailView } from './components/ProgramDetailView';
import type { StudyProgram, ProgramStatus } from '@/src/types';

export function ProgramsPage() {
  const { programId } = useParams<{ programId?: string }>();
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);

  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProgramStatus>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StudyProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<StudyProgram | null>(null);

  // Subscribe to programs in realtime for the active authenticated user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = programService.subscribePrograms(currentUser.uid, (list) => {
      setPrograms(list);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  // If a programId route param is present, find and display ProgramDetailView
  const selectedProgram = programId ? programs.find((p) => p.id === programId) : null;

  if (selectedProgram) {
    return (
      <ProgramDetailView
        program={selectedProgram}
        currentUserUid={currentUser.uid}
        onBack={() => navigate('/programs')}
        onProgramUpdated={(updated) => {
          setPrograms((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }}
        onProgramDeleted={(deletedId) => {
          setPrograms((prev) => prev.filter((p) => p.id !== deletedId));
          navigate('/programs');
        }}
      />
    );
  }

  // Filter programs based on search and status tabs
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? p.status !== 'archived' // Default to non-archived in 'all' view
        : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = programs.filter((p) => p.status === 'active').length;
  const completedCount = programs.filter((p) => p.status === 'completed').length;
  const archivedCount = programs.filter((p) => p.status === 'archived').length;

  const handleCreateProgram = async (data: {
    name: string;
    description: string;
    startDate: string;
    targetDate: string;
  }) => {
    const created = await programService.createProgram(currentUser.uid, data);
    setCreateModalOpen(false);
    // Navigate straight to syllabus detail view so the user can immediately add subjects and chapters
    navigate(`/programs/${created.id}`);
  };

  const handleUpdateProgram = async (data: any) => {
    if (!editingProgram) return;
    await programService.updateProgram(editingProgram.id, currentUser.uid, data);
    setEditingProgram(null);
  };

  const handleToggleArchive = async (program: StudyProgram) => {
    const newStatus: ProgramStatus = program.status === 'archived' ? 'active' : 'archived';
    await programService.setProgramStatus(program.id, currentUser.uid, newStatus);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProgram) return;
    await programService.deleteProgram(deletingProgram.id, currentUser.uid);
    setDeletingProgram(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Programs"
        description="Design your curriculum, organize subjects into focused chapters, and track completion progress."
        badge={<Badge variant="secondary">{activeCount} Active Tracks</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Create Program</span>
          </Button>
        }
      />

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl dark:bg-zinc-800/60 overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            All Tracks ({programs.length - archivedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'archived'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((prog) => (
            <ProgramCard
              key={prog.id}
              program={prog}
              onOpen={(p) => navigate(`/programs/${p.id}`)}
              onEdit={(p) => setEditingProgram(p)}
              onDelete={(p) => setDeletingProgram(p)}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={statusFilter === 'archived' ? Archive : BookOpen}
          title={
            search
              ? 'No matching study programs'
              : statusFilter === 'archived'
              ? 'No archived programs'
              : statusFilter === 'completed'
              ? 'No completed programs yet'
              : 'No study programs yet'
          }
          description={
            search
              ? `No tracks matched "${search}". Try checking your spelling or clear filters.`
              : 'Create your first study curriculum with subjects and chapters to begin tracking your academic syllabus.'
          }
          actionLabel={search || statusFilter !== 'all' ? undefined : 'Create Study Program'}
          onAction={search || statusFilter !== 'all' ? undefined : () => setCreateModalOpen(true)}
        />
      )}

      {/* Program Creation Dialog */}
      <ProgramFormDialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateProgram}
      />

      {/* Program Edit Dialog */}
      <ProgramFormDialog
        isOpen={!!editingProgram}
        onClose={() => setEditingProgram(null)}
        onSubmit={handleUpdateProgram}
        initialData={editingProgram}
      />

      {/* Delete Confirmation Modal */}
      {deletingProgram && (
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
              Delete Program?
            </h3>

            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                "{deletingProgram.name}"
              </strong>
              ? This action will permanently remove all subjects, chapters, and progress records associated with it.
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProgram(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete Program
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
