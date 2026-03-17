import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Moon, Sun, Monitor, Rows3 } from 'lucide-react';
import { Theme } from '../../types/filters';

interface SettingsPanelProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isDark?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function SettingsPanel({ pageSize, onPageSizeChange, isDark = false }: SettingsPanelProps) {
  const [theme, setTheme] = useState<Theme>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('theme') as Theme;
      if (currentTheme === 'auto' || !currentTheme) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const themeOptions: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'auto', icon: Monitor, label: 'Auto' },
  ];

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-sm font-semibold text-neutral-900">Settings</h3>

      {/* Page Size */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
          <Rows3 className="w-3.5 h-3.5" />
          Rows per page
        </label>
        <div className="flex gap-2">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => onPageSizeChange(size)}
              className={clsx(
                "px-3 py-1.5 text-sm rounded-lg border transition-all",
                pageSize === size
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={clsx(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                theme === value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="pt-4 border-t border-neutral-200">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
          Keyboard Shortcuts
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Toggle sidebar</span>
            <kbd className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-mono">[</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Next page</span>
            <kbd className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-mono">→</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Previous page</span>
            <kbd className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-mono">←</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Search</span>
            <kbd className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-mono">/</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
