import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  UserCheck,
  Activity,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Ban,
  UserMinus,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { AdminNavTabs } from './components/AdminNavTabs';
import { adminService } from '@/src/services/adminService';
import type { AdminOverviewStats } from '@/src/types';
import { UserPerformanceModal } from './components/UserPerformanceModal';

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectUid, setInspectUid] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOverviewStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const unsub = adminService.subscribe(() => {
      loadStats();
    });
    return unsub;
  }, []);

  const handleQuickApprove = async (uid: string) => {
    try {
      await adminService.approveUser(uid);
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to approve user');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Admin Overview"
        description="Server-enforced administration console for user lifecycle, approvals, rankings, and audit logs."
        badge={<Badge variant="warning">Server-Enforced Authorization</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Overview' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <AdminNavTabs pendingCount={stats?.pendingApprovals} />

      {/* Top 4 Realtime Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats ? String(stats.totalUsers) : '...'}
          description={`${stats?.activeUsers || 0} active, ${stats?.bannedUsers || 0} banned`}
          icon={Users}
        />
        <StatCard
          title="Pending Approvals"
          value={stats ? String(stats.pendingApprovals) : '...'}
          description="Waiting for administrator approval"
          trend={
            stats && stats.pendingApprovals > 0
              ? { value: `${stats.pendingApprovals} pending`, isPositive: false }
              : undefined
          }
          icon={UserCheck}
        />
        <StatCard
          title="Audit Trail Logs"
          value={stats ? String(stats.auditLogsCount) : '...'}
          description="Authoritative immutable events"
          icon={Activity}
        />
        <StatCard
          title="Security Enforcement"
          value="Server Strict"
          description="Client tokens verified on server"
          icon={ShieldCheck}
        />
      </div>

      {/* 4 Primary Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-2">
              <Users className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold">User Directory</CardTitle>
            <CardDescription className="text-xs">
              Search, filter, paginate, ban/unban, deactivate accounts, and inspect points.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/users">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>Manage Users</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mb-2">
              <UserCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold">Pending Approvals</CardTitle>
            <CardDescription className="text-xs">
              Review new student registrations. Approved users gain immediate login access.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/approvals">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>Approvals ({stats?.pendingApprovals || 0})</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              <Trophy className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold">Leaderboard</CardTitle>
            <CardDescription className="text-xs">
              Verify rankings, calculate pace scores, and monitor competition integrity.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/leaderboard">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>View Leaderboard</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 mb-2">
              <Activity className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold">Audit Activity</CardTitle>
            <CardDescription className="text-xs">
              Review tamper-proof audit trail of administrative approvals, bans, and events.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/activity">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>View Audit Logs</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Two Columns: Recent Pending Users + Latest Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Quick Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Pending Registration Requests</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Requires admin approval before student can authenticate
              </CardDescription>
            </div>
            <Link to="/admin/approvals" className="text-xs font-medium text-indigo-600 hover:underline">
              View all ({stats?.pendingApprovals || 0})
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats && stats.recentPending.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.recentPending.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {user.displayName}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        @{user.username} • {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setInspectUid(user.uid)}
                      >
                        Inspect
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                        onClick={() => handleQuickApprove(user.uid)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                No pending registrations waiting for approval.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Trail */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Recent Audit Activity</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Timestamped, server-logged administrator actions
              </CardDescription>
            </div>
            <Link to="/admin/activity" className="text-xs font-medium text-indigo-600 hover:underline">
              View all ({stats?.auditLogsCount || 0})
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats && stats.recentAuditLogs.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.action === 'USER_APPROVED'
                              ? 'success'
                              : log.action === 'USER_BANNED'
                              ? 'danger'
                              : 'secondary'
                          }
                          className="text-[9px] font-mono"
                        >
                          {log.action}
                        </Badge>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {log.targetUsername ? `@${log.targetUsername}` : log.targetUid}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        by <span className="font-medium text-zinc-700 dark:text-zinc-300">@{log.actorUsername}</span>
                        {log.metadata?.reason && ` — Reason: "${log.metadata.reason}"`}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                No audit activity recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {inspectUid && (
        <UserPerformanceModal
          uid={inspectUid}
          onClose={() => setInspectUid(null)}
          onStatusUpdated={() => loadStats()}
        />
      )}
    </div>
  );
}
