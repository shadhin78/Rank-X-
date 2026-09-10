import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Responsive Application Shell
 * Organizes Desktop Sidebar, Header, Mobile Navigation, and Main Content Container.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent App Header */}
        <Header />

        {/* Scrollable Container with Mobile-Safe Bottom Padding */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation & Slide-over Menu */}
      <MobileNav />
    </div>
  );
}
