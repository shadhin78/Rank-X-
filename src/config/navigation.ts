export interface NavItemConfig {
  title: string;
  href: string;
  iconName: 'LayoutDashboard' | 'BookOpen' | 'CheckCircle2' | 'Trophy' | 'User' | 'Settings' | 'ShieldAlert' | 'Users' | 'UserCheck' | 'Activity';
  badge?: string;
  adminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const navigationConfig: {
  main: NavSection;
  competition: NavSection;
  account: NavSection;
  admin: NavSection;
} = {
  main: {
    title: 'Workspace',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
      },
      {
        title: 'Study Programs',
        href: '/programs',
        iconName: 'BookOpen',
      },
      {
        title: 'Daily Habits',
        href: '/habits',
        iconName: 'CheckCircle2',
      },
    ],
  },
  competition: {
    title: 'Competition',
    items: [
      {
        title: 'Leaderboard',
        href: '/leaderboard',
        iconName: 'Trophy',
        badge: 'Live',
      },
    ],
  },
  account: {
    title: 'Personal',
    items: [
      {
        title: 'My Profile',
        href: '/profile',
        iconName: 'User',
      },
      {
        title: 'Settings',
        href: '/settings',
        iconName: 'Settings',
      },
    ],
  },
  admin: {
    title: 'Administration',
    items: [
      {
        title: 'Admin Console',
        href: '/admin',
        iconName: 'ShieldAlert',
        adminOnly: true,
      },
      {
        title: 'Manage Users',
        href: '/admin/users',
        iconName: 'Users',
        adminOnly: true,
      },
      {
        title: 'Approvals',
        href: '/admin/approvals',
        iconName: 'UserCheck',
        adminOnly: true,
        badge: '3',
      },
      {
        title: 'Audit Activity',
        href: '/admin/activity',
        iconName: 'Activity',
        adminOnly: true,
      },
    ],
  },
};
