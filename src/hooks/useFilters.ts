import { useState, useCallback, useEffect } from 'react';
import { FilterState, DEFAULT_METRIC, METRIC_CONFIG } from '../types/filters';

const STORAGE_KEY = 'dataset-viewer-filters';

const defaultFilters: FilterState = {
  models: [],
  languages: [],
  metricSource: DEFAULT_METRIC,
  scoreRange: [0, 1],
  evaluationTags: [-1, 0, 1], // 默认全选
  searchQuery: '',
  datasets: [],
  turns: [], // ← 新增：默认不筛选任何 turn
  loss: ['null'], // ← 新增：默认选中 null（loss = null）
};

export function useFilters(availableMetricSources: string[] = []) {
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultFilters, ...JSON.parse(saved) };
        } catch {
          return defaultFilters;
        }
      }
    }
    return defaultFilters;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // Update score range when metric source changes
  useEffect(() => {
    if (availableMetricSources.length > 0 && !availableMetricSources.includes(filters.metricSource)) {
      // If current metric source is not available, switch to the first available one
      const newSource = availableMetricSources[0];
      const config = METRIC_CONFIG[newSource] || { min: 0, max: 1, step: 0.01 };
      setFilters(prev => ({
        ...prev,
        metricSource: newSource,
        scoreRange: [config.min, config.max],
      }));
    }
  }, [availableMetricSources, filters.metricSource]);

  const setModels = useCallback((models: string[]) => {
    setFilters(prev => ({ ...prev, models }));
  }, []);

  const setLanguages = useCallback((languages: string[]) => {
    setFilters(prev => ({ ...prev, languages }));
  }, []);

  const setMetricSource = useCallback((metricSource: string) => {
    const config = METRIC_CONFIG[metricSource] || { min: 0, max: 1, step: 0.01 };
    setFilters(prev => ({
      ...prev,
      metricSource,
      scoreRange: [config.min, config.max],
    }));
  }, []);

  const setScoreRange = useCallback((scoreRange: [number, number]) => {
    setFilters(prev => ({ ...prev, scoreRange }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);

  const setDatasets = useCallback((datasets: string[]) => {
    setFilters(prev => ({ ...prev, datasets }));
  }, []);

  const setEvaluationTags = useCallback((evaluationTags: number[]) => {
    setFilters(prev => ({ ...prev, evaluationTags }));
  }, []);

  const setTurns = useCallback((turns: number[]) => {
    setFilters(prev => ({ ...prev, turns }));
  }, []);

  const setLoss = useCallback((loss: ('null' | 'false')[]) => {
    setFilters(prev => ({ ...prev, loss }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = filters.models.length > 0 || 
    filters.languages.length > 0 || 
    filters.datasets.length > 0 ||
    filters.turns.length > 0 ||
    filters.loss.length !== 2 || // loss 筛选不是全选
    filters.metricSource !== DEFAULT_METRIC;

  const getMetricConfig = useCallback((source: string) => {
    return METRIC_CONFIG[source] || { min: 0, max: 1, step: 0.01, label: source, unit: '' };
  }, []);

  return {
    filters,
    setModels,
    setLanguages,
    setMetricSource,
    setScoreRange,
    setEvaluationTags,
    setSearchQuery,
    setDatasets,
    setTurns,
    setLoss,
    resetFilters,
    hasActiveFilters,
    getMetricConfig,
  };
}
