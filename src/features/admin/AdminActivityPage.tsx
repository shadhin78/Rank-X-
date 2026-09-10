import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Award, UserPlus, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  type: 'score' | 'auth' | 'admin' | 'program';
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    actor: 'Sarah Chen',
    action: 'Completed Chapter 4: Distributed Consensus',
    target: 'Algorithms & Distributed Systems',
    time: '12 minutes ago',
    type: 'score',
  },
  {
    id: 'act-2',
    actor: 'Alex Rivera',
    action: 'Marked habit complete: Deep Focus 90m',
    target: '+50 points awarded',
    time: '45 minutes ago',
    type: 'score',
  },
  {
    id: 'act-3',
    actor: 'System / Firebase',
    action: 'Client SDK session handshake verified',
    target: 'project-error-78',
    time: '1 hour ago',
    type: 'auth',
  },
  {
    id: 'act-4',
    actor: 'Marcus Vance',
    action: 'Enrolled in study curriculum',
    target: 'Machine Learning Foundations',
    time: '3 hours ago',
    type: 'program',
  },
  {
    id: 'act-5',
    actor: 'Admin Console',
    action: 'Approved workspace membership request',
    target: 'Priya Sharma',
    time: '5 hours ago',
    type: 'admin',
  },
];

export function AdminActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Activity"
        description="Realtime audit trail of study completions, habit check-ins, and administrative events."
        badge={<Badge variant="live">Live Stream</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Activity' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>System Activity Logs</CardTitle>
          <CardDescription>
            Chronological audit trail of verified actions across StudyRank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {ACTIVITIES.map((item) => (
              <div key={item.id} className="relative group">
                <span className="absolute -left-[23px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-600 dark:border-indigo-400" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.actor}{' '}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">{item.action}</span>
                    <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                      {item.target}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 self-start sm:self-center whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
