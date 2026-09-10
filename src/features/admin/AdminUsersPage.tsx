import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, UserCheck, UserX, RefreshCw, Shield } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { authService } from '@/src/services/authService';
import type { UserProfile, AccountStatus, UserRole } from '@/src/types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionUid, setActionUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await authService.getAllUsers();
      setUsers(list);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (uid: string, newStatus: AccountStatus) => {
    setActionUid(uid);
    try {
      await authService.updateAccountStatus(uid, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, accountStatus: newStatus } : u))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionUid(null);
    }
  };

  const handleRoleToggle = async (uid: string, currentRole: UserRole) => {
    const nextRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionUid(uid);
    try {
      await authService.updateUserRole(uid, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: nextRole } : u))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionUid(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users Directory"
        description="Comprehensive directory of registered StudyRank student and admin accounts."
        badge={<Badge variant="secondary">{users.length} Total Users</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6">User Account</th>
                  <th className="px-4 py-3 sm:px-6">Role</th>
                  <th className="px-4 py-3 sm:px-6">Account Status</th>
                  <th className="px-4 py-3 sm:px-6">Score</th>
                  <th className="px-4 py-3 sm:px-6">Streak</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {u.displayName}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <button
                        type="button"
                        onClick={() => handleRoleToggle(u.uid, u.role)}
                        disabled={actionUid === u.uid}
                        title="Click to toggle role"
                      >
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize text-[10px] cursor-pointer hover:opacity-80"
                        >
                          {u.role === 'admin' ? '👑 Admin' : 'User'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Badge
                        variant={
                          u.accountStatus === 'approved'
                            ? 'success'
                            : u.accountStatus === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        className="capitalize text-[10px]"
                      >
                        {u.accountStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 sm:px-6 font-semibold text-zinc-800 dark:text-zinc-200">
                      {u.totalPoints ?? 0} pts
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-zinc-500 text-xs">
                      {u.streak ?? 0}d
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right space-x-1 whitespace-nowrap">
                      {u.accountStatus !== 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          onClick={() => handleStatusChange(u.uid, 'approved')}
                          disabled={actionUid === u.uid}
                        >
                          Approve
                        </Button>
                      )}
                      {u.accountStatus !== 'banned' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() => handleStatusChange(u.uid, 'banned')}
                          disabled={actionUid === u.uid}
                        >
                          Ban
                        </Button>
                      )}
                      {u.accountStatus === 'banned' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-zinc-600 hover:text-zinc-700 dark:text-zinc-300"
                          onClick={() => handleStatusChange(u.uid, 'pending')}
                          disabled={actionUid === u.uid}
                        >
                          Reset to Pending
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
