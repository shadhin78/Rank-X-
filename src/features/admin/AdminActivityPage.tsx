import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  CheckCircle2,
  Award,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Lock,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Ban,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { AdminNavTabs } from './components/AdminNavTabs';
import { adminService } from '@/src/services/adminService';
import type { AuditLogEntry, AuditAction } from '@/src/types';

export function AdminActivityPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs({
        page,
        limit,
        action: actionFilter,
        search,
      });
      setLogs(data.logs);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const unsub = adminService.subscribe(() => {
      fetchLogs();
    });
    return unsub;
  }, [page, limit, actionFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'USER_APPROVED':
        return <Badge variant="success" className="text-[10px] font-mono">USER_APPROVED</Badge>;
      case 'USER_BANNED':
        return <Badge variant="danger" className="text-[10px] font-mono">USER_BANNED</Badge>;
      case 'USER_UNBANNED':
        return <Badge variant="secondary" className="text-[10px] font-mono text-emerald-600">USER_UNBANNED</Badge>;
      case 'ACCOUNT_DEACTIVATED':
        return <Badge variant="warning" className="text-[10px] font-mono">ACCOUNT_DEACTIVATED</Badge>;
      case 'USER_ROLE_CHANGED':
        return <Badge variant="default" className="text-[10px] font-mono">ROLE_CHANGED</Badge>;
      case 'PROGRAM_INSPECTED':
        return <Badge variant="secondary" className="text-[10px] font-mono text-indigo-600">PROGRAM_INSPECTED</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] font-mono">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Audit Activity"
        description="Immutable, timestamped audit log of administrative operations, account approvals, and disciplinary actions."
        badge={<Badge variant="secondary">{totalCount} Immutable Records</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Audit Activity' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <AdminNavTabs />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search actor, target, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="all">All Actions</option>
            <option value="USER_APPROVED">USER_APPROVED</option>
            <option value="USER_BANNED">USER_BANNED</option>
            <option value="USER_UNBANNED">USER_UNBANNED</option>
            <option value="ACCOUNT_DEACTIVATED">ACCOUNT_DEACTIVATED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="PROGRAM_INSPECTED">PROGRAM_INSPECTED</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Authoritative Audit Trail</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Guaranteed immutable logging. No confidential credentials or PINs are ever persisted.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Action</th>
                  <th className="px-4 py-3 sm:px-6">Actor (Administrator)</th>
                  <th className="px-4 py-3 sm:px-6">Target User</th>
                  <th className="px-4 py-3 sm:px-6">Metadata / Reason</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-zinc-400">
                      {loading ? 'Loading audit records...' : 'No audit records match the filter.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 sm:px-6">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-3 sm:px-6 font-mono text-xs">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          @{log.actorUsername}
                        </span>
                        <div className="text-[10px] text-zinc-400">{log.actorUid}</div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 font-mono text-xs">
                        {log.targetUsername ? (
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            @{log.targetUsername}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                        <div className="text-[10px] text-zinc-400">{log.targetUid}</div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 text-xs text-zinc-600 dark:text-zinc-400">
                        {log.metadata?.reason ? (
                          <span className="italic text-zinc-800 dark:text-zinc-200">
                            "{log.metadata.reason}"
                          </span>
                        ) : log.metadata?.note ? (
                          <span>{log.metadata.note}</span>
                        ) : log.metadata?.programName ? (
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {log.metadata.programName}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6 text-right font-mono text-xs text-zinc-500 whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 px-6 py-3">
            <div className="text-xs text-zinc-500">
              Showing{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {logs.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {Math.min(page * limit, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalCount}</span> logs
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
