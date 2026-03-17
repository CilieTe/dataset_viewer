import React from 'react';
import { clsx } from 'clsx';
import { X, Check } from 'lucide-react';
import { METRIC_CONFIG } from '../../types/filters';

interface FilterPanelProps {
  selectedModels: string[];
  selectedLanguages: string[];
  metricSource: string;
  scoreRange: [number, number];
  availableModels: Array<{ suffix: string; name: string }>;
  availableLanguages: string[];
  availableMetricSources: string[];
  onModelsChange: (models: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
  onMetricSourceChange: (source: string) => void;
  onScoreRangeChange: (range: [number, number]) => void;
  onReset: () => void;
  isDark?: boolean;
}

export function FilterPanel({
  selectedModels,
  selectedLanguages,
  metricSource,
  scoreRange,
  availableModels,
  availableLanguages,
  availableMetricSources,
  onModelsChange,
  onLanguagesChange,
  onMetricSourceChange,
  onScoreRangeChange,
  onReset,
  isDark = false,
}: FilterPanelProps) {
  const config = METRIC_CONFIG[metricSource] || { min: 0, max: 1, step: 0.01, label: metricSource, unit: '' };
  const hasFilters = selectedModels.length > 0 || selectedLanguages.length > 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Filters</h3>
        {hasFilters && (
          <button
            onClick={onReset}
            className="text-xs text-neutral-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Metric Source */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Metric Source
        </label>
        <div className="grid grid-cols-1 gap-2">
          {availableMetricSources.map((source) => (
            <button
              key={source}
              onClick={() => onMetricSourceChange(source)}
              className={clsx(
                "flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all",
                metricSource === source
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
              )}
            >
              <span>{METRIC_CONFIG[source]?.label || source}</span>
              {metricSource === source && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Score Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {config.label} Range
          </label>
          <span className="text-xs text-neutral-600 font-mono">
            {scoreRange[0].toFixed(2)} - {scoreRange[1].toFixed(2)} {config.unit}
          </span>
        </div>
        
        {/* Dual Slider Simulation */}
        <div className="space-y-3">
          <div className="relative h-2 bg-neutral-200 rounded-full">
            <div 
              className="absolute h-full bg-indigo-500 rounded-full"
              style={{
                left: `${((scoreRange[0] - config.min) / (config.max - config.min)) * 100}%`,
                right: `${100 - ((scoreRange[1] - config.min) / (config.max - config.min)) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={scoreRange[0]}
              min={config.min}
              max={scoreRange[1]}
              step={config.step}
              onChange={(e) => onScoreRangeChange([Number(e.target.value), scoreRange[1]])}
              className="w-20 px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <span className="text-neutral-400 self-center">-</span>
            <input
              type="number"
              value={scoreRange[1]}
              min={scoreRange[0]}
              max={config.max}
              step={config.step}
              onChange={(e) => onScoreRangeChange([scoreRange[0], Number(e.target.value)])}
              className="w-20 px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Model Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Models ({availableModels.length})
        </label>
        <div className="max-h-40 overflow-y-auto border border-neutral-200 rounded-lg p-2 space-y-1">
          {availableModels.map((model) => (
            <label
              key={model.suffix}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedModels.includes(model.suffix)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onModelsChange([...selectedModels, model.suffix]);
                  } else {
                    onModelsChange(selectedModels.filter(m => m !== model.suffix));
                  }
                }}
                className="w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-neutral-700 truncate">{model.name}</span>
            </label>
          ))}
        </div>
        {selectedModels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {selectedModels.slice(0, 3).map((suffix) => {
              const model = availableModels.find(m => m.suffix === suffix);
              return (
                <span
                  key={suffix}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                >
                  {model?.name?.split('-')[0] || suffix}
                  <button
                    onClick={() => onModelsChange(selectedModels.filter(m => m !== suffix))}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedModels.length > 3 && (
              <span className="text-xs text-neutral-500">+{selectedModels.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Language Filter */}
      {availableLanguages.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Languages
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  if (selectedLanguages.includes(lang)) {
                    onLanguagesChange(selectedLanguages.filter(l => l !== lang));
                  } else {
                    onLanguagesChange([...selectedLanguages, lang]);
                  }
                }}
                className={clsx(
                  "px-2.5 py-1 text-xs rounded-full border transition-all",
                  selectedLanguages.includes(lang)
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
