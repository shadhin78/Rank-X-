/**
 * Admin Service
 * Client-side communication service for server-enforced administrative actions.
 * All operations require valid server-enforced admin authorization.
 */

import { firebaseAuth } from '@/src/lib/firebase';
import { authService } from '@/src/services/authService';
import type {
  UserProfile,
  AuditLogEntry,
  AdminOverviewStats,
  AdminPaginatedUsers,
  AdminUserDetailPerformance,
  StudyProgram,
  LeaderboardRecord,
} from '@/src/types';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
}

type AdminEventListener = (event: { action: string; targetUid: string }) => void;
const listeners = new Set<AdminEventListener>();

export const adminService = {
  /**
   * Subscribes to real-time administrative status changes
   */
  subscribe(listener: AdminEventListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Broadcasts an administrative change event locally
   */
  broadcast(action: string, targetUid: string): void {
    listeners.forEach((fn) => {
      try {
        fn({ action, targetUid });
      } catch (err) {
        console.error('Admin listener error:', err);
      }
    });
  },

  /**
   * Builds Authorization headers using the authenticated user's token or session UID.
   * Server validates whether this UID is an approved administrator.
   */
  async getAuthHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      if (firebaseAuth.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          return headers;
        }
      }
    } catch {
      // Fallback to session token
    }

    const session = authService.getStoredSession();
    if (session?.uid) {
      headers['Authorization'] = `Bearer ${session.uid}`;
    }

    return headers;
  },

  /**
   * Fetch overview metrics and recent audit activity
   */
  async getOverviewStats(): Promise<AdminOverviewStats> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/stats', {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch admin stats (${res.status})`);
    }

    return res.json();
  },

  /**
   * Fetch paginated list of users with search and filter
   */
  async getUsers(params: GetUsersParams = {}): Promise<AdminPaginatedUsers> {
    const headers = await this.getAuthHeaders();
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);

    const res = await fetch(`/api/admin/users?${query.toString()}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch users (${res.status})`);
    }

    return res.json();
  },

  /**
   * Server-enforced approval of pending user.
   * After approval, user can log in.
   */
  async approveUser(targetUid: string): Promise<UserProfile> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve user');
    }

    const data = await res.json();
    this.broadcast('USER_APPROVED', targetUid);
    return data.user;
  },

  /**
   * Server-enforced ban of user.
   * User immediately loses access.
   */
  async banUser(targetUid: string, reason?: string): Promise<UserProfile> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to ban user');
    }

    const data = await res.json();
    this.broadcast('USER_BANNED', targetUid);

    // If current user is the banned user, update local session
    const current = authService.getStoredSession();
    if (current && current.uid === targetUid) {
      current.accountStatus = 'banned';
      localStorage.setItem('studyrank_auth_profile', JSON.stringify(current));
    }

    return data.user;
  },

  /**
   * Server-enforced unban of user.
   * Restores user access.
   */
  async unbanUser(targetUid: string): Promise<UserProfile> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/unban-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to unban user');
    }

    const data = await res.json();
    this.broadcast('USER_UNBANNED', targetUid);
    return data.user;
  },

  /**
   * Server-enforced account deactivation.
   */
  async deactivateUser(targetUid: string, reason?: string): Promise<UserProfile> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/deactivate-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to deactivate user');
    }

    const data = await res.json();
    this.broadcast('ACCOUNT_DEACTIVATED', targetUid);
    return data.user;
  },

  /**
   * Server-enforced role update (admin / user)
   */
  async toggleRole(targetUid: string, role: 'admin' | 'user'): Promise<UserProfile> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/toggle-role', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, role }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle user role');
    }

    const data = await res.json();
    this.broadcast('USER_ROLE_CHANGED', targetUid);
    return data.user;
  },

  /**
   * View user performance, points breakdown, streak, rank, and recent activity
   */
  async getUserPerformance(targetUid: string): Promise<AdminUserDetailPerformance> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/admin/user-details/${targetUid}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch user performance');
    }

    return res.json();
  },

  /**
   * Inspect user study curriculum and chapters when necessary for administration
   */
  async inspectUserPrograms(targetUid: string): Promise<{ user: UserProfile; programs: StudyProgram[] }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`/api/admin/user-programs/${targetUid}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to inspect user programs');
    }

    const data = await res.json();
    this.broadcast('PROGRAM_INSPECTED', targetUid);
    return data;
  },

  /**
   * Fetch paginated audit log stream
   */
  async getAuditLogs(params: GetAuditLogsParams = {}): Promise<{
    logs: AuditLogEntry[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const headers = await this.getAuthHeaders();
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.action) query.set('action', params.action);
    if (params.search) query.set('search', params.search);

    const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch audit logs');
    }

    return res.json();
  },

  /**
   * Fetch admin view of leaderboard
   */
  async getLeaderboard(): Promise<{
    records: LeaderboardRecord[];
    totalCount: number;
    updatedAt: string;
  }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/leaderboard', {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch leaderboard');
    }

    return res.json();
  },
};
