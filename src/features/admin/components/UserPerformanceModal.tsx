import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Trophy,
  Flame,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { adminService } from '@/src/services/adminService';
import type { AdminUserDetailPerformance, StudyProgram, UserProfile } from '@/src/types';

interface UserPerformanceModalProps {
  uid: string;
  onClose: () => void;
  onStatusUpdated?: (updatedUser: UserProfile) => void;
}

export function UserPerformanceModal({
  uid,
  onClose,
  onStatusUpdated,
}: UserPerformanceModalProps) {
  const [data, setData] = useState<AdminUserDetailPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);
  const [inspectPrograms, setInspectPrograms] = useState<StudyProgram[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await adminService.getUserPerformance(uid);
      setData(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to load user performance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid]);

  const handleApprove = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const updated = await adminService.approveUser(data.user.uid);
      setData((prev) => (prev ? { ...prev, user: updated } : null));
      onStatusUpdated?.(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!data) return;
    const reason = window.prompt('Enter reason for immediate account ban:', 'Community violations');
    if (reason === null) return;
    setActionLoading(true);
    try {
      const updated = await adminService.banUser(data.user.uid, reason);
      setData((prev) => (prev ? { ...prev, user: updated } : null));
      onStatusUpdated?.(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to ban');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const updated = await adminService.unbanUser(data.user.uid);
      setData((prev) => (prev ? { ...prev, user: updated } : null));
      onStatusUpdated?.(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to unban');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!data) return;
    const reason = window.prompt('Enter reason for account deactivation:', 'Administrative request');
    if (reason === null) return;
    setActionLoading(true);
    try {
      const updated = await adminService.deactivateUser(data.user.uid, reason);
      setData((prev) => (prev ? { ...prev, user: updated } : null));
      onStatusUpdated?.(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectPrograms = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const res = await adminService.inspectUserPrograms(data.user.uid);
      setInspectPrograms(res.programs);
      setShowPrograms(true);
    } catch (err: any) {
      alert(err.message || 'Failed to inspect programs');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                User Performance & Admin Inspection
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Authoritative Server Record: {uid}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Loading authoritative performance records...
            </div>
          ) : error || !data ? (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs">
              {error || 'Unable to retrieve record'}
            </div>
          ) : (
            <>
              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {data.user.displayName}
                    </h3>
                    <Badge
                      variant={
                        data.user.accountStatus === 'approved'
                          ? 'success'
                          : data.user.accountStatus === 'pending'
                          ? 'warning'
                          : data.user.accountStatus === 'banned'
                          ? 'danger'
                          : 'secondary'
                      }
                      className="capitalize text-[10px]"
                    >
                      {data.user.accountStatus}
                    </Badge>
                    <Badge
                      variant={data.user.role === 'admin' ? 'default' : 'secondary'}
                      className="capitalize text-[10px]"
                    >
                      {data.user.role === 'admin' ? '👑 Admin' : 'Student'}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">
                    @{data.user.username} • {data.user.email || 'No email attached'}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {data.user.accountStatus === 'pending' && (
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      Approve Account
                    </Button>
                  )}
                  {data.user.accountStatus === 'approved' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeactivate}
                        disabled={actionLoading}
                        className="text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                      >
                        Deactivate
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBan}
                        disabled={actionLoading}
                        className="text-xs"
                      >
                        Ban User
                      </Button>
                    </>
                  )}
                  {data.user.accountStatus === 'banned' && (
                    <Button
                      size="sm"
                      onClick={handleUnban}
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    >
                      Unban & Restore Access
                    </Button>
                  )}
                  {data.user.accountStatus === 'deactivated' && (
                    <Button
                      size="sm"
                      onClick={handleUnban}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      Reactivate Account
                    </Button>
                  )}
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="text-[11px] text-zinc-500">Rank</div>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {data.user.rank > 0 ? `#${data.user.rank}` : 'Unranked'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="text-[11px] text-zinc-500">Total Points</div>
                  <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {data.user.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {data.user.studyPoints} study + {data.user.habitPoints} habit
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="text-[11px] text-zinc-500">Streak</div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {data.user.streak} days
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="text-[11px] text-zinc-500">Pace / Velocity</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {data.paceScore}%
                  </div>
                </div>
              </div>

              {/* Account Timeline & Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Activity Timestamps</span>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-400">Last Active: </span>
                    <span className="font-medium">
                      {new Date(data.user.lastActiveAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-400">Created: </span>
                    <span className="font-medium">
                      {new Date(data.user.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Academic Curriculum</span>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-400">Chapters Completed: </span>
                    <span className="font-medium">
                      {data.completedChaptersCount} of {data.totalChaptersCount} (
                      {data.completionScore}%)
                    </span>
                  </div>
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleInspectPrograms}
                      disabled={actionLoading}
                    >
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                      Inspect Study Programs
                    </Button>
                  </div>
                </div>
              </div>

              {/* Program Inspection Drawer/Section */}
              {showPrograms && (
                <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Inspected Programs for @{data.user.username}
                    </h4>
                    <span className="text-[11px] text-zinc-500">
                      {inspectPrograms.length} active curricula
                    </span>
                  </div>

                  {inspectPrograms.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                        <span>{p.name}</span>
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500">{p.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <span>
                          Target: {p.targetDate} • Progress: {p.progressPercentage}%
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {p.completedChapters}/{p.totalChapters} chapters
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-3 flex justify-end bg-zinc-50 dark:bg-zinc-900/60">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
