import React from 'react';
import { clsx } from 'clsx';
import { Moon, Sun, Monitor, Rows3 } from 'lucide-react';
import { Theme } from '../../types/filters';

interface SettingsPanelProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isDark?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function SettingsPanel({ 
  pageSize, 
  onPageSizeChange, 
  isDark = false,
  theme = 'auto',
  onThemeChange 
}: SettingsPanelProps) {
  const handleThemeChange = (newTheme: Theme) => {
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const themeOptions: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'auto', icon: Monitor, label: 'Auto' },
  ];

  return (
    <div className={clsx(
      "p-4 space-y-6 transition-colors duration-200",
      isDark ? "text-neutral-100" : "text-neutral-900"
    )}>
      <h3 className={clsx(
        "text-sm font-semibold",
        isDark ? "text-neutral-100" : "text-neutral-900"
      )}>Settings</h3>

      {/* Page Size */}
      <div className="space-y-2">
        <label className={clsx(
          "text-xs font-medium uppercase tracking-wider flex items-center gap-2",
          isDark ? "text-neutral-400" : "text-neutral-500"
        )}>
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
                  ? isDark 
                    ? "bg-indigo-900/50 border-indigo-500 text-indigo-300"
                    : "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : isDark
                    ? "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600"
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
        <label className={clsx(
          "text-xs font-medium uppercase tracking-wider",
          isDark ? "text-neutral-400" : "text-neutral-500"
        )}>
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
                  ? isDark
                    ? "border-indigo-500 bg-indigo-900/50 text-indigo-300"
                    : "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : isDark
                    ? "border-neutral-700 text-neutral-400 hover:border-neutral-600"
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
      <div className={clsx(
        "pt-4 border-t",
        isDark ? "border-neutral-700" : "border-neutral-200"
      )}>
        <h4 className={clsx(
          "text-xs font-medium uppercase tracking-wider mb-3",
          isDark ? "text-neutral-400" : "text-neutral-500"
        )}>
          Keyboard Shortcuts
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>Toggle sidebar</span>
            <kbd className={clsx(
              "px-2 py-0.5 rounded text-xs font-mono",
              isDark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100"
            )}>[</kbd>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>Next page</span>
            <kbd className={clsx(
              "px-2 py-0.5 rounded text-xs font-mono",
              isDark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100"
            )}>→</kbd>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>Previous page</span>
            <kbd className={clsx(
              "px-2 py-0.55 rounded text-xs font-mono",
              isDark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100"
            )}>←</kbd>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>Search</span>
            <kbd className={clsx(
              "px-2 py-0.5 rounded text-xs font-mono",
              isDark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100"
            )}>/</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}