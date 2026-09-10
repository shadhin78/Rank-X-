import React from 'react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { useAppStore } from '@/src/store';
import { getFirebaseStatus } from '@/src/lib/firebase';

export function SettingsPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const fbStatus = getFirebaseStatus();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        description="Configure your workspace appearance, notification preferences, and account credentials."
      />

      <div className="space-y-6">
        {/* Appearance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance & Theme</CardTitle>
            <CardDescription>
              Select your preferred visual theme for the StudyRank productivity suite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant={theme === 'dark' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                Dark Theme
              </Button>
              <Button
                variant={theme === 'light' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                Light Theme
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Update your public username and display email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Display Name" defaultValue={currentUser?.displayName || 'Alex Rivera'} />
            <Input label="Email Address" defaultValue={currentUser?.email || 'alex.rivera@studyrank.app'} readOnly />
          </CardContent>
          <CardFooter className="justify-end border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Infrastructure & Firebase Connection Card */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Firebase Client Connectivity</CardTitle>
              <Badge variant="success">Initialized</Badge>
            </div>
            <CardDescription>
              Connected Firebase project credentials and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50 space-y-1 text-zinc-700 dark:text-zinc-300">
              <p>Project ID: {fbStatus.projectId}</p>
              <p>Auth Domain: {fbStatus.authDomain}</p>
              <p>App ID: {fbStatus.appId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
