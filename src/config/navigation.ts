export interface NavItemConfig {
  title: string;
  href: string;
  iconName: 'LayoutDashboard' | 'BookOpen' | 'CheckCircle2' | 'BarChart2' | 'Trophy' | 'User' | 'Settings' | 'ShieldAlert' | 'Users' | 'UserCheck' | 'Activity';
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
      {
        title: 'Analytics',
        href: '/analytics',
        iconName: 'BarChart2',
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
        title: 'Overview',
        href: '/admin',
        iconName: 'ShieldAlert',
        adminOnly: true,
      },
      {
        title: 'Users',
        href: '/admin/users',
        iconName: 'Users',
        adminOnly: true,
      },
      {
        title: 'Pending Approvals',
        href: '/admin/approvals',
        iconName: 'UserCheck',
        adminOnly: true,
      },
      {
        title: 'Leaderboard',
        href: '/admin/leaderboard',
        iconName: 'Trophy',
        adminOnly: true,
      },
      {
        title: 'Activity',
        href: '/admin/activity',
        iconName: 'Activity',
        adminOnly: true,
      },
    ],
  },
};
