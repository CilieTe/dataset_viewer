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
    setMetricSource: (source: string) => void;
    setScoreRange: (range: [number, number]) => void;
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
  availableDatasets: string[];
  availableMetricSources: string[];
  summary?: any;
  isDark?: boolean;
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
  availableDatasets,
  availableMetricSources,
  summary,
  isDark = false,
}: SidebarProps) {
  const renderPanel = () => {
    switch (activeModule) {
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
            metricSource={filters.metricSource}
            scoreRange={filters.scoreRange}
            availableModels={availableModels}
            availableLanguages={availableLanguages}
            availableMetricSources={availableMetricSources}
            onModelsChange={onFiltersChange.setModels}
            onLanguagesChange={onFiltersChange.setLanguages}
            onMetricSourceChange={onFiltersChange.setMetricSource}
            onScoreRangeChange={onFiltersChange.setScoreRange}
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
          />
        );
      case 'evaluation':
        return <EvaluationPanel summary={summary} isDark={isDark} />;
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
