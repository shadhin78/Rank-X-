import { create } from 'zustand';
import type { UserProfile } from '@/src/types';
import { authService } from '@/src/services/authService';

interface AppState {
  // Theme state
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // Layout UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;

  // Active user session
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  updateScoreSummary: (summary: {
    totalPoints: number;
    studyPoints: number;
    habitPoints: number;
    streak: number;
  }) => void;
  isAdmin: boolean;
  toggleAdminMode: () => void;
}

const storedSession = authService.getStoredSession();

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studyrank_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),

  currentUser: storedSession,
  setCurrentUser: (user) =>
    set({
      currentUser: user,
      isAdmin: user?.role === 'admin',
    }),
  updateScoreSummary: (summary) =>
    set((state) => {
      if (!state.currentUser) return state;
      const updatedUser: UserProfile = {
        ...state.currentUser,
        totalPoints: summary.totalPoints,
        studyPoints: summary.studyPoints,
        habitPoints: summary.habitPoints,
        streak: summary.streak,
        lastActiveAt: new Date().toISOString(),
      };
      localStorage.setItem('studyrank_auth_profile', JSON.stringify(updatedUser));
      return { currentUser: updatedUser };
    }),
  isAdmin: storedSession?.role === 'admin',
  toggleAdminMode: () =>
    set((state) => {
      const nextAdmin = !state.isAdmin;
      const updatedUser = state.currentUser
        ? {
            ...state.currentUser,
            role: (nextAdmin ? 'admin' : 'user') as 'admin' | 'user',
          }
        : null;
      if (updatedUser) {
        localStorage.setItem('studyrank_auth_profile', JSON.stringify(updatedUser));
      }
      return {
        isAdmin: nextAdmin,
        currentUser: updatedUser,
      };
    }),
}));
