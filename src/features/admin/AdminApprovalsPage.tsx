import React, { useState, useEffect } from 'react';
import { UserCheck, Check, X, Clock, AlertCircle, RefreshCw, UserX } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { authService } from '@/src/services/authService';
import type { UserProfile } from '@/src/types';

export function AdminApprovalsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const all = await authService.getAllUsers();
      setUsers(all.filter((u) => u.accountStatus === 'pending'));
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleApprove = async (uid: string) => {
    setProcessingId(uid);
    try {
      await authService.updateAccountStatus(uid, 'approved');
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBan = async (uid: string) => {
    setProcessingId(uid);
    try {
      await authService.updateAccountStatus(uid, 'banned');
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Approvals"
        description="Review new student registrations and grant access to study programs and rankings."
        badge={<Badge variant="warning">{users.length} Pending Approvals</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Approvals' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadPendingUsers} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <Card className="p-8 text-center text-xs text-zinc-500">
          Loading pending registrations...
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <UserCheck className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Pending Approvals
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            All registered users have been processed. When a new user registers with a Username and PIN, they will appear here for verification.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.uid} className="border-amber-200/60 dark:border-amber-900/40">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{u.displayName}</CardTitle>
                    <span className="font-mono text-xs text-zinc-500 font-normal">
                      @{u.username}
                    </span>
                    <Badge variant="warning" className="text-[10px]">
                      Pending Review
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Registered: {new Date(u.createdAt).toLocaleString()} • Initial Score: 0 pts
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBan(u.uid)}
                    disabled={processingId === u.uid}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-xs"
                  >
                    <UserX className="mr-1 h-3.5 w-3.5" />
                    Ban / Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(u.uid)}
                    disabled={processingId === u.uid}
                    className="text-xs"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Approve Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 pt-0">
                <p className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/40 font-mono text-[11px]">
                  UID: {u.uid} • Role: {u.role} • Status: {u.accountStatus}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
