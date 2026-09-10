import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertOctagon, LogOut, Mail } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useAppStore } from '@/src/store';
import { authService } from '@/src/services/authService';

export function BannedAccountPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-4 animate-in fade-in duration-200">
        <Card className="border-red-200/80 dark:border-red-900/60 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 mb-3 shadow-inner">
              <AlertOctagon className="h-7 w-7" />
            </div>
            <div className="flex justify-center mb-1">
              <Badge variant="danger">Account Status: Suspended / Banned</Badge>
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-red-900 dark:text-red-200">
              Access Revoked
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              This account has been flagged and suspended by a platform administrator for policy or competition integrity violations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-1 text-xs">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Account:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  @{currentUser?.username || 'user'}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>Restriction:</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  Permanent Suspension
                </span>
              </div>
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
              If you believe this ban is in error or wish to submit an appeal, contact your study group administrator with your username.
            </p>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out & Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
