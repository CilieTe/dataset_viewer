import React from 'react';
import { clsx } from 'clsx';
import { 
  Database, 
  Filter, 
  Search, 
  Settings, 
  Edit3, 
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { SidebarModule } from '../../types/filters';

interface SidebarToggleProps {
  panelCollapsed: boolean;
  onTogglePanel: () => void;
  activeModule: SidebarModule;
  onModuleChange: (module: SidebarModule) => void;
  hasActiveFilters?: boolean;
  hasActiveDatasets?: boolean;
  isDark?: boolean;
}

const MODULES: { id: SidebarModule; icon: React.ElementType; label: string }[] = [
  { id: 'datasets', icon: Database, label: 'Datasets' },
  { id: 'filters', icon: Filter, label: 'Filters' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'editor', icon: Edit3, label: 'Editor' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function SidebarToggle({ 
  panelCollapsed,
  onTogglePanel,
  activeModule, 
  onModuleChange,
  hasActiveFilters,
  hasActiveDatasets,
  isDark = false,
}: SidebarToggleProps) {
  return (
    <div className={clsx(
      "flex flex-col border-r w-14 shrink-0 transition-colors duration-200",
      isDark 
        ? "bg-neutral-800 border-neutral-700" 
        : "bg-white border-neutral-200"
    )}>
      {/* Module Icons */}
      <div className="flex-1 py-4 flex flex-col gap-1">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          const showBadge = (module.id === 'filters' && hasActiveFilters) || 
                           (module.id === 'datasets' && hasActiveDatasets);
          
          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={clsx(
                "relative flex items-center justify-center py-3 mx-1 rounded-lg transition-all duration-200",
                isActive 
                  ? clsx(
                      isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                    )
                  : clsx(
                      isDark 
                        ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" 
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                    )
              )}
              title={module.label}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-neutral-800" />
                )}
              </div>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel Toggle Button - Using PanelLeft icons */}
      <button
        onClick={onTogglePanel}
        className={clsx(
          "flex items-center justify-center h-12 border-t transition-colors",
          isDark 
            ? "border-neutral-700 hover:bg-neutral-700" 
            : "border-neutral-200 hover:bg-neutral-50"
        )}
        title={panelCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {panelCollapsed ? (
          <PanelLeftOpen className={clsx("w-5 h-5", isDark ? "text-neutral-400" : "text-neutral-500")} />
        ) : (
          <PanelLeftClose className={clsx("w-5 h-5", isDark ? "text-neutral-400" : "text-neutral-500")} />
        )}
      </button>
    </div>
  );
}
