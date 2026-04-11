import React from 'react';
import { clsx } from 'clsx';
import { SidebarToggle } from './SidebarToggle';
import { FilterPanel } from './FilterPanel';
import { SearchPanel } from './SearchPanel';
import { SettingsPanel } from './SettingsPanel';
import { EditorPanel } from './EditorPanel';
import { DatasetPanel } from './DatasetPanel';
import { EvaluationPanel } from './EvaluationPanel';
import { SidebarModule, FilterState } from '../../types/filters';

interface SidebarProps {
  panelCollapsed: boolean;
  onTogglePanel: () => void;
  activeModule: SidebarModule;
  onModuleChange: (module: SidebarModule) => void;
  filters: FilterState;
  onFiltersChange: {
    setModels: (models: string[]) => void;
    setLanguages: (languages: string[]) => void;
    setDatasets: (datasets: string[]) => void;
    setTurns: (turns: number[]) => void;
    setMetricSource: (source: string) => void;
    setScoreRange: (range: [number, number]) => void;
    setEvaluationTags: (tags: number[]) => void;
    setSearchQuery: (query: string) => void;
    resetFilters: () => void;
  };
  onSearchApply?: (query: string) => void;
  appliedSearchQuery?: string;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasActiveFilters: boolean;
  availableModels: Array<{ suffix: string; name: string }>;
  availableLanguages: string[];
  availableTurns: number[];
  availableDatasets: string[];
  availableMetricSources: string[];
  summary?: any;
  isDark?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  onThemeChange?: (theme: 'light' | 'dark' | 'auto') => void;
}

export function Sidebar({
  panelCollapsed,
  onTogglePanel,
  activeModule,
  onModuleChange,
  filters,
  onFiltersChange,
  onSearchApply,
  appliedSearchQuery,
  pageSize,
  onPageSizeChange,
  hasActiveFilters,
  availableModels,
  availableLanguages,
  availableTurns,
  availableDatasets,
  availableMetricSources,
  summary,
  isDark = false,
  theme = 'auto',
  onThemeChange,
}: SidebarProps) {
  const renderPanel = () => {
    // 在 Evaluation 页面时，默认显示 Filters 面板
    // Dataset/Filters 视图都显示 Filters 面板
    const effectiveModule = activeModule === 'evaluation' ? 'filters' : activeModule;
    
    switch (effectiveModule) {
      case 'datasets':
        return (
          <DatasetPanel
            selectedDatasets={filters.datasets}
            onDatasetsChange={onFiltersChange.setDatasets}
            isDark={isDark}
          />
        );
      case 'filters':
        return (
          <FilterPanel
            selectedModels={filters.models}
            selectedLanguages={filters.languages}
            selectedTurns={filters.turns}
            metricSource={filters.metricSource}
            scoreRange={filters.scoreRange}
            evaluationTags={filters.evaluationTags}
            availableModels={availableModels}
            availableLanguages={availableLanguages}
            availableTurns={availableTurns}
            availableMetricSources={availableMetricSources}
            onModelsChange={onFiltersChange.setModels}
            onLanguagesChange={onFiltersChange.setLanguages}
            onTurnsChange={onFiltersChange.setTurns}
            onMetricSourceChange={onFiltersChange.setMetricSource}
            onScoreRangeChange={onFiltersChange.setScoreRange}
            onEvaluationTagsChange={onFiltersChange.setEvaluationTags}
            onReset={onFiltersChange.resetFilters}
            isDark={isDark}
          />
        );
      case 'search':
        return (
          <SearchPanel
            searchQuery={appliedSearchQuery || ''}
            onSearchApply={onSearchApply || (() => {})}
            isDark={isDark}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            isDark={isDark}
            theme={theme}
            onThemeChange={onThemeChange}
          />
        );
      case 'editor':
        return <EditorPanel isDark={isDark} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Icon Bar - Always visible */}
      <SidebarToggle
        panelCollapsed={panelCollapsed}
        onTogglePanel={onTogglePanel}
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        hasActiveFilters={hasActiveFilters}
        hasActiveDatasets={filters.datasets.length > 0}
        isDark={isDark}
      />

      {/* Panel Content - Collapsible */}
      <div
        className={clsx(
          "border-r overflow-y-auto transition-all duration-300 ease-in-out",
          panelCollapsed ? "w-0 opacity-0" : "w-72 opacity-100",
          isDark 
            ? "bg-neutral-800 border-neutral-700" 
            : "bg-neutral-50 border-neutral-200"
        )}
      >
        {!panelCollapsed && renderPanel()}
      </div>
    </div>
  );
}
