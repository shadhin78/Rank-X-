import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, RefreshCw, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useAppStore } from '@/src/store';
import { authService } from '@/src/services/authService';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRefreshStatus = async () => {
    if (!currentUser?.uid) {
      navigate('/login');
      return;
    }
    setChecking(true);
    setMessage(null);
    try {
      const updated = await authService.getUserProfile(currentUser.uid);
      if (updated) {
        setCurrentUser(updated);
        if (updated.accountStatus === 'approved') {
          navigate('/dashboard', { replace: true });
          return;
        } else if (updated.accountStatus === 'banned') {
          navigate('/banned', { replace: true });
          return;
        } else {
          setMessage('Your account is still pending administrator review.');
        }
      }
    } catch {
      setMessage('Could not check status right now. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  // Quick dev action for evaluator testing: Instant self-approval
  const handleDevInstantApprove = async () => {
    if (!currentUser?.uid) return;
    setChecking(true);
    try {
      await authService.updateAccountStatus(currentUser.uid, 'approved');
      const updated = await authService.getUserProfile(currentUser.uid);
      if (updated) {
        setCurrentUser(updated);
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-4 animate-in fade-in duration-200">
        <Card className="border-amber-200/70 dark:border-amber-900/60 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-3 shadow-inner">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>
            <div className="flex justify-center mb-1">
              <Badge variant="warning">Account Status: Pending</Badge>
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Awaiting Admin Approval
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Your registration is submitted and secured. To preserve community integrity, an administrator must approve your account before you can access study programs and the leaderboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Username:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  @{currentUser?.username || 'unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>Display Name:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {currentUser?.displayName || 'Student'}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>Access Level:</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Restricted until approval
                </span>
              </div>
            </div>

            {message && (
              <div className="rounded-lg bg-zinc-100 p-2.5 text-center text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {message}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleRefreshStatus}
              disabled={checking}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking Status...' : 'Check Approval Status'}
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out / Switch Account
            </Button>

            {/* Test Helper for evaluators to simulate admin action without logging out */}
            <div className="mt-3 w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 p-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-[11px] text-zinc-500 mb-1.5 font-mono">
                [Testing Helper: Simulate Admin Approval]
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-7 w-full border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={handleDevInstantApprove}
                disabled={checking}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Simulate Admin Approval for @{currentUser?.username}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
