import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Ban,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { AdminNavTabs } from './components/AdminNavTabs';
import { adminService } from '@/src/services/adminService';
import type { UserProfile } from '@/src/types';
import { UserPerformanceModal } from './components/UserPerformanceModal';

export function AdminApprovalsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [inspectUid, setInspectUid] = useState<string | null>(null);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({ status: 'pending', limit: 50 });
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
    const unsub = adminService.subscribe(() => {
      loadPendingUsers();
    });
    return unsub;
  }, []);

  const handleApprove = async (uid: string) => {
    setProcessingId(uid);
    try {
      await adminService.approveUser(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e: any) {
      alert(e.message || 'Failed to approve user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectOrBan = async (uid: string) => {
    const reason = window.prompt(
      'Enter reason for registration rejection / ban:',
      'Invalid credentials or failed verification'
    );
    if (reason === null) return;
    setProcessingId(uid);
    try {
      await adminService.banUser(uid, reason);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e: any) {
      alert(e.message || 'Failed to reject registration');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Pending Approvals"
        description="Review new student registrations. Approved users can immediately log in and participate."
        badge={<Badge variant="warning">{users.length} Pending Approval</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pending Approvals' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadPendingUsers} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <AdminNavTabs pendingCount={users.length} />

      {loading ? (
        <Card className="p-8 text-center text-xs text-zinc-500">
          Loading pending registrations...
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No Pending Approvals
            </p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              All registered student accounts have been processed. When new candidates register with a username and PIN, their verification request will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isBusy = processingId === u.uid;
            return (
              <Card
                key={u.uid}
                className="border-amber-200/80 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10 hover:border-amber-300 transition-colors"
              >
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">
                        {u.displayName}
                      </CardTitle>
                      <span className="font-mono text-xs text-zinc-500 font-normal">
                        @{u.username}
                      </span>
                      <Badge variant="warning" className="text-[10px]">
                        Pending Review
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-zinc-500 mt-0.5">
                      Submitted application on {new Date(u.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInspectUid(u.uid)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Inspect Profile
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs"
                      disabled={isBusy}
                      onClick={() => handleRejectOrBan(u.uid)}
                    >
                      <Ban className="mr-1 h-3.5 w-3.5" />
                      Reject / Ban
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      disabled={isBusy}
                      onClick={() => handleApprove(u.uid)}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve Account
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-zinc-500 border-t border-amber-100 dark:border-amber-950/40 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Awaiting administrator verification</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">UID: {u.uid}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {inspectUid && (
        <UserPerformanceModal
          uid={inspectUid}
          onClose={() => setInspectUid(null)}
          onStatusUpdated={() => loadPendingUsers()}
        />
      )}
    </div>
  );
}
