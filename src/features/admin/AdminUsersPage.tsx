import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Ban,
  RotateCcw,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { AdminNavTabs } from './components/AdminNavTabs';
import { adminService } from '@/src/services/adminService';
import type { UserProfile, AccountStatus } from '@/src/types';
import { UserPerformanceModal } from './components/UserPerformanceModal';

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [inspectUid, setInspectUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        page,
        limit,
        search,
        status: statusFilter,
        sortBy,
        sortDir,
      });
      setUsers(data.users);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch paginated users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const unsub = adminService.subscribe(() => {
      fetchUsers();
    });
    return unsub;
  }, [page, limit, statusFilter, sortBy, sortDir]);

  // Handle search with slight debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleApprove = async (uid: string) => {
    setActionUid(uid);
    try {
      await adminService.approveUser(uid);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionUid(null);
    }
  };

  const handleBan = async (uid: string) => {
    const reason = window.prompt('Enter reason for immediate account ban:', 'Violation of platform terms');
    if (reason === null) return;
    setActionUid(uid);
    try {
      await adminService.banUser(uid, reason);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to ban');
    } finally {
      setActionUid(null);
    }
  };

  const handleUnban = async (uid: string) => {
    setActionUid(uid);
    try {
      await adminService.unbanUser(uid);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to unban');
    } finally {
      setActionUid(null);
    }
  };

  const handleDeactivate = async (uid: string) => {
    const reason = window.prompt('Enter reason for account deactivation:', 'Student account deactivation');
    if (reason === null) return;
    setActionUid(uid);
    try {
      await adminService.deactivateUser(uid, reason);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate');
    } finally {
      setActionUid(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Users Directory"
        description="Paginated student roster, server-enforced account state transitions, and performance inspection."
        badge={<Badge variant="secondary">{totalCount} Total Accounts</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <AdminNavTabs />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search username or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Filter Badges & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            {(['all', 'pending', 'approved', 'banned', 'deactivated'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split('-');
              setSortBy(sb);
              setSortDir(sd as 'asc' | 'desc');
              setPage(1);
            }}
            className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="totalPoints-desc">Highest Points</option>
            <option value="streak-desc">Longest Streak</option>
            <option value="rank-asc">Highest Rank</option>
            <option value="lastActiveAt-desc">Recently Active</option>
          </select>
        </div>
      </div>

      {/* User Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Username</th>
                  <th className="px-4 py-3 sm:px-6">Display Name</th>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                  <th className="px-4 py-3 sm:px-6">Rank</th>
                  <th className="px-4 py-3 sm:px-6">Points</th>
                  <th className="px-4 py-3 sm:px-6">Streak</th>
                  <th className="px-4 py-3 sm:px-6">Last Active</th>
                  <th className="px-4 py-3 sm:px-6">Created Date</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-xs text-zinc-400">
                      {loading ? 'Loading paginated records...' : 'No users match the search criteria.'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isBusy = actionUid === user.uid;
                    return (
                      <tr
                        key={user.uid}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* 1. Username */}
                        <td className="px-4 py-3 sm:px-6 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            {user.role === 'admin' && (
                              <span title="Administrator" className="text-amber-500">
                                👑
                              </span>
                            )}
                            <span>@{user.username}</span>
                          </div>
                        </td>

                        {/* 2. Display Name */}
                        <td className="px-4 py-3 sm:px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                          {user.displayName}
                        </td>

                        {/* 3. Status */}
                        <td className="px-4 py-3 sm:px-6">
                          <Badge
                            variant={
                              user.accountStatus === 'approved'
                                ? 'success'
                                : user.accountStatus === 'pending'
                                ? 'warning'
                                : user.accountStatus === 'banned'
                                ? 'danger'
                                : 'secondary'
                            }
                            className="text-[10px] capitalize font-medium"
                          >
                            {user.accountStatus}
                          </Badge>
                        </td>

                        {/* 4. Rank */}
                        <td className="px-4 py-3 sm:px-6 font-mono font-bold text-xs">
                          {user.rank > 0 ? `#${user.rank}` : '—'}
                        </td>

                        {/* 5. Points */}
                        <td className="px-4 py-3 sm:px-6">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                            {user.totalPoints.toLocaleString()} pts
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {user.studyPoints}s / {user.habitPoints}h
                          </div>
                        </td>

                        {/* 6. Streak */}
                        <td className="px-4 py-3 sm:px-6">
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            🔥 {user.streak}d
                          </Badge>
                        </td>

                        {/* 7. Last Active */}
                        <td className="px-4 py-3 sm:px-6 text-xs text-zinc-500">
                          {user.lastActiveAt
                            ? new Date(user.lastActiveAt).toLocaleDateString()
                            : 'Never'}
                        </td>

                        {/* 8. Created Date */}
                        <td className="px-4 py-3 sm:px-6 text-xs text-zinc-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        {/* 9. Actions */}
                        <td className="px-4 py-3 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                              onClick={() => setInspectUid(user.uid)}
                              title="Inspect Performance & Programs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Inspect
                            </Button>

                            {/* Pending User -> Approve */}
                            {user.accountStatus === 'pending' && (
                              <Button
                                size="sm"
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                disabled={isBusy}
                                onClick={() => handleApprove(user.uid)}
                              >
                                Approve
                              </Button>
                            )}

                            {/* Approved User -> Deactivate / Ban */}
                            {user.accountStatus === 'approved' && user.role !== 'admin' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                                  disabled={isBusy}
                                  onClick={() => handleDeactivate(user.uid)}
                                  title="Deactivate account"
                                >
                                  Deactivate
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  disabled={isBusy}
                                  onClick={() => handleBan(user.uid)}
                                  title="Ban user immediately"
                                >
                                  Ban
                                </Button>
                              </>
                            )}

                            {/* Banned User -> Unban */}
                            {user.accountStatus === 'banned' && (
                              <Button
                                size="sm"
                                className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                                disabled={isBusy}
                                onClick={() => handleUnban(user.uid)}
                              >
                                Unban
                              </Button>
                            )}

                            {/* Deactivated User -> Reactivate */}
                            {user.accountStatus === 'deactivated' && (
                              <Button
                                size="sm"
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                disabled={isBusy}
                                onClick={() => handleUnban(user.uid)}
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 px-6 py-3">
            <div className="text-xs text-zinc-500">
              Showing{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {users.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {Math.min(page * limit, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalCount}</span> users
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <div className="flex items-center gap-1 ml-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Inspection Modal */}
      {inspectUid && (
        <UserPerformanceModal
          uid={inspectUid}
          onClose={() => setInspectUid(null)}
          onStatusUpdated={() => fetchUsers()}
        />
      )}
    </div>
  );
}
