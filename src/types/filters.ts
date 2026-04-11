export interface FilterState {
  models: string[];
  languages: string[];
  metricSource: string;
  scoreRange: [number, number];
  evaluationTags: number[]; // -1, 0, 1 的多选数组
  searchQuery: string;
  datasets: string[];
  turns: number[]; // ← 新增：turn 筛选
}

export interface MetricConfig {
  min: number;
  max: number;
  step: number;
  label: string;
  unit: string;
}

export const METRIC_CONFIG: Record<string, MetricConfig> = {
  meteor: { min: 0, max: 1, step: 0.01, label: 'METEOR Score', unit: '' },
  tool_acc: { min: 0, max: 1, step: 0.01, label: 'Tool Accuracy', unit: '' },
  call_halluc_acc: { min: 0, max: 1, step: 0.01, label: 'Hallucination Check', unit: '' },
  match_acc: { min: 0, max: 1, step: 0.01, label: 'Match Accuracy', unit: '' },
  ppl: { min: 0, max: 100, step: 0.1, label: 'Perplexity', unit: '' },
  tags: { min: -1, max: 1, step: 1, label: 'Evaluation Tags', unit: '' },
  'deepseek-v3.2-guide': { min: 1, max: 5, step: 0.1, label: 'DeepSeek V3.2 Guide', unit: '' },
};

export const DEFAULT_METRIC = 'meteor';

export type SidebarModule = 'datasets' | 'filters' | 'search' | 'settings' | 'editor' | 'evaluation';

export type Theme = 'light' | 'dark' | 'auto';
