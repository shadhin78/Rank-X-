import { useEffect } from 'react';
import { useAppStore } from '@/src/store';

/**
 * Hook to synchronize and toggle theme
 */
export function useTheme() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  useEffect(() => {
    // Hydrate saved preference or system preference
    const saved = localStorage.getItem('studyrank_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
    } else {
      // Default to dark for sleek productivity styling
      setTheme('dark');
    }
  }, [setTheme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
