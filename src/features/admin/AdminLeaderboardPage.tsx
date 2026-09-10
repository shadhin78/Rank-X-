import React, { useState, useEffect } from 'react';
import { Trophy, Search, RefreshCw, Eye, ShieldCheck, Medal } from 'lucide-react';
import { PageHeader } from '@/src/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { AdminNavTabs } from './components/AdminNavTabs';
import { adminService } from '@/src/services/adminService';
import type { LeaderboardRecord } from '@/src/types';
import { UserPerformanceModal } from './components/UserPerformanceModal';

export function AdminLeaderboardPage() {
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inspectUid, setInspectUid] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLeaderboard();
      setRecords(data.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const unsub = adminService.subscribe(() => {
      fetchLeaderboard();
    });
    return unsub;
  }, []);

  const filtered = records.filter(
    (r) =>
      r.displayName.toLowerCase().includes(search.toLowerCase()) ||
      r.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Admin Leaderboard"
        description="Authoritative ranking oversight, student velocity scores, and anti-abuse verification."
        badge={<Badge variant="secondary">Authoritative Engine</Badge>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Leaderboard' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={fetchLeaderboard} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <AdminNavTabs />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="text-xs text-zinc-500">
          Showing {filtered.length} of {records.length} ranked competitors
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 sm:px-6 w-16">Rank</th>
                  <th className="px-4 py-3 sm:px-6">Student</th>
                  <th className="px-4 py-3 sm:px-6">Total Points</th>
                  <th className="px-4 py-3 sm:px-6">Study / Habit</th>
                  <th className="px-4 py-3 sm:px-6">Streak</th>
                  <th className="px-4 py-3 sm:px-6">Pace</th>
                  <th className="px-4 py-3 sm:px-6">Completion</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((r) => {
                  const isTop3 = r.rank <= 3;
                  return (
                    <tr
                      key={r.uid}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 sm:px-6 font-bold">
                        <div className="flex items-center gap-1.5">
                          {r.rank === 1 && <span className="text-amber-500">🥇</span>}
                          {r.rank === 2 && <span className="text-zinc-400">🥈</span>}
                          {r.rank === 3 && <span className="text-amber-700">🥉</span>}
                          <span className={isTop3 ? 'font-black' : 'font-mono text-zinc-500'}>
                            #{r.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {r.displayName}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">@{r.username}</div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 font-bold text-indigo-600 dark:text-indigo-400">
                        {r.totalPoints.toLocaleString()} pts
                      </td>
                      <td className="px-4 py-3 sm:px-6 text-xs text-zinc-500 font-mono">
                        {r.studyPoints} / {r.habitPoints}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          🔥 {r.streak}d
                        </Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-6 text-xs font-semibold">
                        <span
                          className={
                            r.paceScore >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : r.paceScore >= 60
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-zinc-500'
                          }
                        >
                          {r.paceScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 text-xs font-semibold">
                        {r.completionScore}%
                      </td>
                      <td className="px-4 py-3 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                          onClick={() => setInspectUid(r.uid)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {inspectUid && (
        <UserPerformanceModal uid={inspectUid} onClose={() => setInspectUid(null)} />
      )}
    </div>
  );
}
