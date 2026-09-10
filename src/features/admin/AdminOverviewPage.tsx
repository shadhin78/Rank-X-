import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, UserCheck, Activity, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';

export function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Console"
        description="System administration overview for user management, approval workflows, and audit activity."
        badge={<Badge variant="warning">Restricted Access</Badge>}
      />

      {/* Admin stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Registered Users"
          value="48"
          description="4 new this week"
          icon={Users}
        />
        <StatCard
          title="Pending Approvals"
          value="3"
          description="workspace join requests"
          trend={{ value: 'Action required', isPositive: false }}
          icon={UserCheck}
        />
        <StatCard
          title="Audit Log Events"
          value="254"
          description="past 30 days"
          icon={Activity}
        />
      </div>

      {/* Quick Navigation Cards for Sub-modules */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Manage Users</CardTitle>
            <CardDescription className="text-xs">
              View roster, roles (member, moderator, admin), and access permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>Browse Directory</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mb-2">
              <UserCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Pending Approvals</CardTitle>
            <CardDescription className="text-xs">
              Review join invitations, program publications, and scoring challenges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/approvals">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>Review Approvals (3)</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              <Activity className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Audit Activity</CardTitle>
            <CardDescription className="text-xs">
              Immutable log of scoring events, role modifications, and logins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/activity">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <span>View Event Stream</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
