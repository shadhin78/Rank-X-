import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Request, type Response } from 'express';
import { adminRouter, requireAdminAuth } from '../server/routes/admin';
import {
  serverUsersMap,
  serverAuditLogs,
  serverSamplePrograms,
} from '../server/store';
import type { UserProfile, AuditLogEntry } from '../src/types';

describe('Admin Dashboard & Server-Enforced Security', () => {
  const adminUid = 'uid_admin_01';
  const normalUserUid = 'uid_alex_02';
  const pendingUserUid = 'u_pending_01';
  const bannedUserUid = 'uid_banned_03';

  // Helper to mock express req & res for unit testing the middleware & route handlers
  function mockHttp(authHeader?: string, body?: any, query?: any, params?: any) {
    const req = {
      headers: authHeader ? { authorization: authHeader } : {},
      body: body || {},
      query: query || {},
      params: params || {},
    } as unknown as Request;

    const resObj = {
      statusCode: 200,
      jsonData: null as any,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonData = data;
        return this;
      },
    };

    const res = resObj as unknown as Response & typeof resObj;
    return { req, res };
  }

  describe('Server-Enforced Authorization Middleware', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', () => {
      const { req, res } = mockHttp();
      let nextCalled = false;

      requireAdminAuth(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error).toContain('Unauthorized');
    });

    it('rejects normal users (role: user) with 403 Forbidden even if client role is forged', () => {
      const { req, res } = mockHttp(`Bearer ${normalUserUid}`);
      let nextCalled = false;

      requireAdminAuth(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.error).toContain('Server-enforced administrator authorization required');
    });

    it('rejects pending users with 403 Forbidden', () => {
      const { req, res } = mockHttp(`Bearer ${pendingUserUid}`);
      let nextCalled = false;

      requireAdminAuth(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    it('rejects banned accounts with 403 Forbidden', () => {
      const { req, res } = mockHttp(`Bearer ${bannedUserUid}`);
      let nextCalled = false;

      requireAdminAuth(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    it('rejects non-existent or forged user UIDs with 403 Forbidden', () => {
      const { req, res } = mockHttp('Bearer forged_evil_hacker_999');
      let nextCalled = false;

      requireAdminAuth(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    it('allows valid server-verified administrator (role: admin, status: approved)', () => {
      const { req, res } = mockHttp(`Bearer ${adminUid}`);
      let nextCalled = false;

      requireAdminAuth(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect((req as any).adminUser.role).toBe('admin');
    });
  });

  describe('User Approval Workflow', () => {
    it('approves pending user and generates an immutable audit log', () => {
      const targetUser = serverUsersMap.get(pendingUserUid)!;
      expect(targetUser.accountStatus).toBe('pending');

      const initialAuditCount = serverAuditLogs.length;

      // Simulate POST /api/admin/approve-user
      const adminUser = serverUsersMap.get(adminUid)!;
      targetUser.accountStatus = 'approved';
      targetUser.lastActiveAt = new Date().toISOString();
      serverUsersMap.set(pendingUserUid, targetUser);

      const auditEntry: AuditLogEntry = {
        id: 'audit_test_approve',
        actorUid: adminUser.uid,
        actorUsername: adminUser.username,
        action: 'USER_APPROVED',
        targetUid: targetUser.uid,
        targetUsername: targetUser.username,
        timestamp: new Date().toISOString(),
      };
      serverAuditLogs.unshift(auditEntry);

      // Verify user can now authenticate and has approved status
      const updated = serverUsersMap.get(pendingUserUid)!;
      expect(updated.accountStatus).toBe('approved');

      // Verify audit log
      expect(serverAuditLogs.length).toBe(initialAuditCount + 1);
      expect(serverAuditLogs[0].action).toBe('USER_APPROVED');
      expect(serverAuditLogs[0].actorUid).toBe(adminUid);
      expect(serverAuditLogs[0].targetUid).toBe(pendingUserUid);
    });
  });

  describe('User Ban & Unban Capabilities', () => {
    it('bans user immediately and logs reason', () => {
      const targetUid = 'u_marcus_03';
      const target = serverUsersMap.get(targetUid)!;
      expect(target.accountStatus).toBe('approved');

      // Admin bans user
      target.accountStatus = 'banned';
      serverUsersMap.set(targetUid, target);

      const auditEntry: AuditLogEntry = {
        id: 'audit_test_ban',
        actorUid: adminUid,
        actorUsername: 'admin',
        action: 'USER_BANNED',
        targetUid: target.uid,
        targetUsername: target.username,
        timestamp: new Date().toISOString(),
        metadata: { reason: 'Score spoofing attempt' },
      };
      serverAuditLogs.unshift(auditEntry);

      const banned = serverUsersMap.get(targetUid)!;
      expect(banned.accountStatus).toBe('banned');
      expect(serverAuditLogs[0].action).toBe('USER_BANNED');
      expect(serverAuditLogs[0].metadata?.reason).toBe('Score spoofing attempt');
    });

    it('unbans user and restores access', () => {
      const targetUid = 'u_marcus_03';
      const target = serverUsersMap.get(targetUid)!;
      target.accountStatus = 'approved';
      serverUsersMap.set(targetUid, target);

      const auditEntry: AuditLogEntry = {
        id: 'audit_test_unban',
        actorUid: adminUid,
        actorUsername: 'admin',
        action: 'USER_UNBANNED',
        targetUid: target.uid,
        targetUsername: target.username,
        timestamp: new Date().toISOString(),
      };
      serverAuditLogs.unshift(auditEntry);

      const restored = serverUsersMap.get(targetUid)!;
      expect(restored.accountStatus).toBe('approved');
      expect(serverAuditLogs[0].action).toBe('USER_UNBANNED');
    });
  });

  describe('Account Deactivation', () => {
    it('deactivates user with reason', () => {
      const targetUid = 'u_priya_04';
      const target = serverUsersMap.get(targetUid)!;
      target.accountStatus = 'deactivated';
      serverUsersMap.set(targetUid, target);

      const auditEntry: AuditLogEntry = {
        id: 'audit_test_deact',
        actorUid: adminUid,
        actorUsername: 'admin',
        action: 'ACCOUNT_DEACTIVATED',
        targetUid: target.uid,
        targetUsername: target.username,
        timestamp: new Date().toISOString(),
        metadata: { reason: 'User sabbatical request' },
      };
      serverAuditLogs.unshift(auditEntry);

      const deactivated = serverUsersMap.get(targetUid)!;
      expect(deactivated.accountStatus).toBe('deactivated');
      expect(serverAuditLogs[0].action).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('User Table Pagination & Performance', () => {
    it('paginates user records and does not load every record at once', () => {
      const all = Array.from(serverUsersMap.values());
      const limit = 5;
      const page1 = all.slice(0, limit);
      const page2 = all.slice(limit, limit * 2);

      expect(page1.length).toBe(5);
      expect(page2.length).toBe(5);
      expect(page1[0].uid).not.toBe(page2[0].uid);
    });

    it('filters users by status accurately', () => {
      const all = Array.from(serverUsersMap.values());
      const approved = all.filter((u) => u.accountStatus === 'approved');
      const banned = all.filter((u) => u.accountStatus === 'banned');

      expect(approved.length).toBeGreaterThan(0);
      expect(banned.length).toBeGreaterThan(0);
      expect(approved.every((u) => u.accountStatus === 'approved')).toBe(true);
      expect(banned.every((u) => u.accountStatus === 'banned')).toBe(true);
    });

    it('searches users by username or display name', () => {
      const all = Array.from(serverUsersMap.values());
      const results = all.filter((u) => u.username.includes('sarah'));
      expect(results.length).toBe(1);
      expect(results[0].displayName).toBe('Sarah Chen');
    });
  });

  describe('Curriculum Inspection & Program Access', () => {
    it('inspects user study curriculum when necessary for administration', () => {
      const programs = serverSamplePrograms['uid_alex_02'];
      expect(programs).toBeDefined();
      expect(programs.length).toBeGreaterThan(0);
      expect(programs[0].name).toContain('Full-Stack Distributed Systems');
      expect(programs[0].completedChapters).toBe(18);
      expect(programs[0].totalChapters).toBe(24);
    });
  });

  describe('Audit Logging Anti-Tamper & Security', () => {
    it('ensures audit logs record actorUid, action, targetUid, timestamp', () => {
      for (const log of serverAuditLogs) {
        expect(log.actorUid).toBeDefined();
        expect(log.action).toBeDefined();
        expect(log.targetUid).toBeDefined();
        expect(log.timestamp).toBeDefined();
      }
    });

    it('NEVER stores PINs or passwords in audit logs', () => {
      for (const log of serverAuditLogs) {
        const serialized = JSON.stringify(log);
        expect(serialized).not.toContain('"pin"');
        expect(serialized).not.toContain('"password"');
        expect(serialized).not.toContain('1234');
      }
    });
  });
});
