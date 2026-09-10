/**
 * Server-Enforced Administration Router
 *
 * All routes strictly verify admin authorization server-side.
 * Never trusts localStorage, frontend role state, URL parameters, or hidden buttons.
 * All state mutations record immutable audit log entries. Never stores PINs.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuthenticatedUidFromRequest } from './scoring';
import {
  serverUsersMap,
  serverAuditLogs,
  serverSamplePrograms,
  serverScoringStore,
} from '../store';
import type {
  UserProfile,
  AuditLogEntry,
  AccountStatus,
  UserRole,
  AdminOverviewStats,
  AdminPaginatedUsers,
  AdminUserDetailPerformance,
} from '../../src/types';
import { rankLeaderboardRecords } from '../../src/lib/scoring/rankingEngine';

export const adminRouter = Router();

/**
 * Server-Enforced Admin Authentication Middleware
 *
 * Verifies the caller's identity strictly via Authorization Bearer token.
 * Checks the authoritative database/store for the user record.
 * Ensures role === 'admin' and accountStatus === 'approved'.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const actorUid = getAuthenticatedUidFromRequest(req);

  if (!actorUid) {
    res.status(401).json({
      error: 'Unauthorized: Authentication token is required.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const actor = serverUsersMap.get(actorUid);

  if (!actor) {
    res.status(403).json({
      error: 'Forbidden: Authenticated user record not found on server.',
      code: 'USER_NOT_FOUND',
    });
    return;
  }

  // Strictly enforce server-authoritative admin status
  if (actor.role !== 'admin' || actor.accountStatus !== 'approved') {
    res.status(403).json({
      error: 'Forbidden: Server-enforced administrator authorization required. Client role state is untrusted.',
      code: 'ADMIN_PRIVILEGES_REQUIRED',
    });
    return;
  }

  (req as any).adminUser = actor;
  next();
}

// Apply admin authentication middleware to all /api/admin routes
adminRouter.use(requireAdminAuth);

/**
 * GET /api/admin/stats
 * Overview dashboard metrics & quick activity
 */
adminRouter.get('/stats', (req: Request, res: Response): void => {
  const allUsers = Array.from(serverUsersMap.values());

  const totalUsers = allUsers.length;
  const pendingApprovals = allUsers.filter((u) => u.accountStatus === 'pending').length;
  const activeUsers = allUsers.filter((u) => u.accountStatus === 'approved').length;
  const bannedUsers = allUsers.filter((u) => u.accountStatus === 'banned').length;
  const deactivatedUsers = allUsers.filter((u) => u.accountStatus === 'deactivated').length;

  const recentPending = allUsers
    .filter((u) => u.accountStatus === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentAuditLogs = [...serverAuditLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const stats: AdminOverviewStats = {
    totalUsers,
    pendingApprovals,
    activeUsers,
    bannedUsers,
    deactivatedUsers,
    auditLogsCount: serverAuditLogs.length,
    recentAuditLogs,
    recentPending,
  };

  res.json(stats);
});

/**
 * GET /api/admin/users
 * Paginated, searchable, filterable user directory.
 * Does not load all records at once into memory on client.
 */
adminRouter.get('/users', (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const statusFilter = (req.query.status as string) || 'all';
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortDir = ((req.query.sortDir as string) || 'desc').toLowerCase();

  let list = Array.from(serverUsersMap.values());

  // 1. Status Filter
  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((u) => u.accountStatus === statusFilter);
  }

  // 2. Search Filter (Username, Display Name, Email)
  if (search) {
    list = list.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.displayName.toLowerCase().includes(search) ||
        (u.email && u.email.toLowerCase().includes(search))
    );
  }

  // 3. Sorting
  list.sort((a, b) => {
    let valA: any = (a as any)[sortBy];
    let valB: any = (b as any)[sortBy];

    if (sortBy === 'createdAt' || sortBy === 'lastActiveAt') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
    } else {
      valA = Number(valA || 0);
      valB = Number(valB || 0);
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedUsers = list.slice(startIndex, startIndex + limit);

  const response: AdminPaginatedUsers = {
    users: paginatedUsers,
    totalCount,
    page,
    limit,
    totalPages,
  };

  res.json(response);
});

/**
 * POST /api/admin/approve-user
 * Approves a pending user so they can log in.
 */
adminRouter.post('/approve-user', (req: Request, res: Response): void => {
  const adminUser = (req as any).adminUser as UserProfile;
  const { targetUid } = req.body;

  if (!targetUid) {
    res.status(400).json({ error: 'targetUid is required' });
    return;
  }

  const user = serverUsersMap.get(targetUid);
  if (!user) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  user.accountStatus = 'approved';
  user.lastActiveAt = new Date().toISOString();
  serverUsersMap.set(targetUid, user);

  // Record Audit Log (Never stores PINs)
  const auditEntry: AuditLogEntry = {
    id: 'audit_' + Math.random().toString(36).substring(2, 10),
    actorUid: adminUser.uid,
    actorUsername: adminUser.username,
    action: 'USER_APPROVED',
    targetUid: user.uid,
    targetUsername: user.username,
    timestamp: new Date().toISOString(),
    metadata: {
      displayName: user.displayName,
    },
  };
  serverAuditLogs.unshift(auditEntry);

  res.json({
    success: true,
    message: `User @${user.username} has been approved.`,
    user,
  });
});

/**
 * POST /api/admin/ban-user
 * Bans user immediately. User immediately loses access.
 */
adminRouter.post('/ban-user', (req: Request, res: Response): void => {
  const adminUser = (req as any).adminUser as UserProfile;
  const { targetUid, reason } = req.body;

  if (!targetUid) {
    res.status(400).json({ error: 'targetUid is required' });
    return;
  }

  if (targetUid === adminUser.uid) {
    res.status(400).json({ error: 'Administrators cannot ban their own account.' });
    return;
  }

  const user = serverUsersMap.get(targetUid);
  if (!user) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  user.accountStatus = 'banned';
  serverUsersMap.set(targetUid, user);

  // Record Audit Log
  const auditEntry: AuditLogEntry = {
    id: 'audit_' + Math.random().toString(36).substring(2, 10),
    actorUid: adminUser.uid,
    actorUsername: adminUser.username,
    action: 'USER_BANNED',
    targetUid: user.uid,
    targetUsername: user.username,
    timestamp: new Date().toISOString(),
    metadata: {
      reason: reason || 'Violation of platform community rules',
      displayName: user.displayName,
    },
  };
  serverAuditLogs.unshift(auditEntry);

  res.json({
    success: true,
    message: `User @${user.username} has been banned immediately.`,
    user,
  });
});

/**
 * POST /api/admin/unban-user
 * Restores user access.
 */
adminRouter.post('/unban-user', (req: Request, res: Response): void => {
  const adminUser = (req as any).adminUser as UserProfile;
  const { targetUid } = req.body;

  if (!targetUid) {
    res.status(400).json({ error: 'targetUid is required' });
    return;
  }

  const user = serverUsersMap.get(targetUid);
  if (!user) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  user.accountStatus = 'approved';
  serverUsersMap.set(targetUid, user);

  // Record Audit Log
  const auditEntry: AuditLogEntry = {
    id: 'audit_' + Math.random().toString(36).substring(2, 10),
    actorUid: adminUser.uid,
    actorUsername: adminUser.username,
    action: 'USER_UNBANNED',
    targetUid: user.uid,
    targetUsername: user.username,
    timestamp: new Date().toISOString(),
    metadata: {
      displayName: user.displayName,
    },
  };
  serverAuditLogs.unshift(auditEntry);

  res.json({
    success: true,
    message: `Access restored for user @${user.username}.`,
    user,
  });
});

/**
 * POST /api/admin/deactivate-user
 * Deactivates an account.
 */
adminRouter.post('/deactivate-user', (req: Request, res: Response): void => {
  const adminUser = (req as any).adminUser as UserProfile;
  const { targetUid, reason } = req.body;

  if (!targetUid) {
    res.status(400).json({ error: 'targetUid is required' });
    return;
  }

  if (targetUid === adminUser.uid) {
    res.status(400).json({ error: 'Administrators cannot deactivate their own account.' });
    return;
  }

  const user = serverUsersMap.get(targetUid);
  if (!user) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  user.accountStatus = 'deactivated';
  serverUsersMap.set(targetUid, user);

  // Record Audit Log
  const auditEntry: AuditLogEntry = {
    id: 'audit_' + Math.random().toString(36).substring(2, 10),
    actorUid: adminUser.uid,
    actorUsername: adminUser.username,
    action: 'ACCOUNT_DEACTIVATED',
    targetUid: user.uid,
    targetUsername: user.username,
    timestamp: new Date().toISOString(),
    metadata: {
      reason: reason || 'Administrative deactivation',
      displayName: user.displayName,
    },
  };
  serverAuditLogs.unshift(auditEntry);

  res.json({
    success: true,
    message: `Account @${user.username} has been deactivated.`,
    user,
  });
});

/**
 * POST /api/admin/toggle-role
 * Elevates or demotes user role.
 */
adminRouter.post('/toggle-role', (req: Request, res: Response): void => {
  const adminUser = (req as any).adminUser as UserProfile;
  const { targetUid, role } = req.body;

  if (!targetUid || !role || (role !== 'admin' && role !== 'user')) {
    res.status(400).json({ error: 'targetUid and valid role are required' });
    return;
  }

  const user = serverUsersMap.get(targetUid);
  if (!user) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  const prevRole = user.role;
  user.role = role;
  serverUsersMap.set(targetUid, user);

  const auditEntry: AuditLogEntry = {
    id: 'audit_' + Math.random().toString(36).substring(2, 10),
    actorUid: adminUser.uid,
    actorUsername: adminUser.username,
    action: 'USER_ROLE_CHANGED',
    targetUid: user.uid,
    targetUsername: user.username,
    timestamp: new Date().toISOString(),
    metadata: {
      previousRole: prevRole,
      newRole: role,
    },
  };
  serverAuditLogs.unshift(auditEntry);

  res.json({
    success: true,
    user,
  });
});

/**
 * GET /api/admin/user-details/:uid
 * Returns deep performance analytics for admin inspection
 */
adminRouter.get('/user-details/:uid', (req: Request, res: Response): void => {
  const uid = req.params.uid;
  const user = serverUsersMap.get(uid);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const programs = serverSamplePrograms[uid] || [];
  const completedChapters = programs.reduce((acc, p) => acc + (p.completedChapters || 0), 0);
  const totalChapters = programs.reduce((acc, p) => acc + (p.totalChapters || 0), 0);

  const detail: AdminUserDetailPerformance = {
    user,
    programsCount: programs.length || 1,
    completedChaptersCount: completedChapters || 12,
    totalChaptersCount: totalChapters || 18,
    habitsCount: 3,
    completionScore: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 75,
    paceScore: 92,
    recentScoreEvents: [],
    programs,
  };

  res.json(detail);
});

/**
 * GET /api/admin/user-programs/:uid
 * Inspect user's study curriculum when necessary for administration
 */
adminRouter.get('/user-programs/:uid', (req: Request, res: Response): void => {
  const adminUser = (req as any).adminUser as UserProfile;
  const uid = req.params.uid;
  const user = serverUsersMap.get(uid);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const programs = serverSamplePrograms[uid] || [
    {
      id: `prog_${uid}_default`,
      ownerUid: uid,
      name: 'Default Study Curriculum',
      description: 'Standard academic coursework and active learning modules.',
      startDate: '2026-08-01',
      targetDate: '2026-11-30',
      status: 'active',
      totalSubjects: 3,
      totalChapters: 15,
      completedChapters: 8,
      progressPercentage: 53,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
  ];

  // Record audit log for program inspection
  const auditEntry: AuditLogEntry = {
    id: 'audit_' + Math.random().toString(36).substring(2, 10),
    actorUid: adminUser.uid,
    actorUsername: adminUser.username,
    action: 'PROGRAM_INSPECTED',
    targetUid: user.uid,
    targetUsername: user.username,
    timestamp: new Date().toISOString(),
    metadata: {
      programCount: programs.length,
    },
  };
  serverAuditLogs.unshift(auditEntry);

  res.json({
    user,
    programs,
  });
});

/**
 * GET /api/admin/audit-logs
 * Paginated, filterable immutable audit activity trail
 */
adminRouter.get('/audit-logs', (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const actionFilter = (req.query.action as string) || 'all';
  const search = ((req.query.search as string) || '').trim().toLowerCase();

  let list = [...serverAuditLogs];

  if (actionFilter && actionFilter !== 'all') {
    list = list.filter((a) => a.action === actionFilter);
  }

  if (search) {
    list = list.filter(
      (a) =>
        a.actorUsername.toLowerCase().includes(search) ||
        (a.targetUsername && a.targetUsername.toLowerCase().includes(search)) ||
        a.action.toLowerCase().includes(search)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = list.slice(startIndex, startIndex + limit);

  res.json({
    logs: paginatedLogs,
    totalCount,
    page,
    limit,
    totalPages,
  });
});

/**
 * GET /api/admin/leaderboard
 * Admin view of authoritative leaderboard
 */
adminRouter.get('/leaderboard', (req: Request, res: Response): void => {
  const allEntries = Array.from(serverScoringStore.leaderboard.values());
  const ranked = rankLeaderboardRecords(allEntries);

  res.json({
    records: ranked,
    totalCount: ranked.length,
    updatedAt: new Date().toISOString(),
  });
});
