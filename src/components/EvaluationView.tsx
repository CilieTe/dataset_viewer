import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { 
  BarChart3, 
  Languages, 
  Hash, 
  Trophy, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  GitCompare,
  Download,
  Loader2,
  Tags,
  Minus,
  X
} from 'lucide-react';

interface EvaluationViewProps {
  summary: any;
  availableModels: Array<{ suffix: string; name: string }>;
  isDark?: boolean;
}

// Tag statistics types
interface TagStats {
  pass: number;      // 1
  error: number;     // -1
  irrelevant: number; // 0
  total: number;
}

interface ModelTagStats {
  suffix: string;
  name: string;
  stats: TagStats;
}

// Calculate tag statistics from tagResults array
function calculateTagStats(tagResults: number[]): TagStats {
  const stats: TagStats = { pass: 0, error: 0, irrelevant: 0, total: tagResults.length };
  
  tagResults.forEach(tag => {
    if (tag === 1) stats.pass++;
    else if (tag === -1) stats.error++;
    else if (tag === 0) stats.irrelevant++;
  });
  
  return stats;
}

// Get all models with tag statistics
function getModelsWithTagStats(models: any[]): ModelTagStats[] {
  return models
    .filter((m: any) => m.tagResults && m.tagResults.length > 0)
    .map((m: any) => ({
      suffix: m.suffix,
      name: m.name,
      stats: calculateTagStats(m.tagResults)
    }));
}

// Calculate aggregate tag statistics across all models
function getAggregateTagStats(models: ModelTagStats[]): TagStats {
  const aggregate: TagStats = { pass: 0, error: 0, irrelevant: 0, total: 0 };
  
  models.forEach(model => {
    aggregate.pass += model.stats.pass;
    aggregate.error += model.stats.error;
    aggregate.irrelevant += model.stats.irrelevant;
    aggregate.total += model.stats.total;
  });
  
  return aggregate;
}

export function EvaluationView({ summary, availableModels, isDark = false }: EvaluationViewProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [compareModelA, setCompareModelA] = useState<string>('');
  const [compareModelB, setCompareModelB] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'analysis' | 'tags'>('overview');

  const sortedModels = useMemo(() => {
    if (!summary?.models) return [];
    return [...summary.models].sort((a: any, b: any) => b.passRate - a.passRate);
  }, [summary]);

  // Calculate tag statistics
  const modelsWithTagStats = useMemo(() => {
    return getModelsWithTagStats(summary?.models || []);
  }, [summary]);

  const aggregateTagStats = useMemo(() => {
    return getAggregateTagStats(modelsWithTagStats);
  }, [modelsWithTagStats]);

  const hasTagData = modelsWithTagStats.length > 0;

  const bestModel = sortedModels[0];
  const worstModel = sortedModels[sortedModels.length - 1];

  const handleExport = () => {
    if (!summary) return;
    const data = {
      summary: {
        totalRows: summary.totalRows,
        models: summary.models,
        languageDistribution: summary.languageDistribution,
        testpointDistribution: summary.testpointDistribution,
        tagStatistics: {
          aggregate: aggregateTagStats,
          byModel: modelsWithTagStats
        }
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const themeClasses = {
    bg: isDark ? 'bg-neutral-800' : 'bg-white',
    bgSecondary: isDark ? 'bg-neutral-700' : 'bg-neutral-50',
    text: isDark ? 'text-neutral-100' : 'text-neutral-900',
    textSecondary: isDark ? 'text-neutral-300' : 'text-neutral-500',
    border: isDark ? 'border-neutral-700' : 'border-neutral-200',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={clsx("text-2xl font-semibold", themeClasses.text)}>Evaluation Dashboard</h2>
          <p className={clsx("mt-1", themeClasses.textSecondary)}>Comprehensive analysis of model performance</p>
        </div>
        <button
          onClick={handleExport}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
            themeClasses.bg,
            themeClasses.border,
            isDark ? "hover:bg-neutral-700" : "hover:bg-neutral-50"
          )}
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className={clsx("flex gap-2 border-b", themeClasses.border)}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'comparison', label: 'Model Comparison', icon: GitCompare },
          { id: 'analysis', label: 'Deep Analysis', icon: TrendingUp },
          { id: 'tags', label: 'Tag Statistics', icon: Tags, badge: hasTagData ? modelsWithTagStats.length : undefined },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === id
                ? "border-indigo-500 text-indigo-600"
                : clsx("border-transparent", themeClasses.textSecondary, "hover:text-neutral-700")
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge !== undefined && (
              <span className={clsx(
                "ml-1 px-2 py-0.5 text-xs rounded-full",
                activeTab === id 
                  ? "bg-indigo-100 text-indigo-700" 
                  : isDark ? "bg-neutral-700 text-neutral-300" : "bg-neutral-200 text-neutral-600"
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Rows"
              value={summary.totalRows?.toLocaleString()}
              icon={Hash}
              isDark={isDark}
            />
            <StatCard
              label="Models Evaluated"
              value={summary.models?.length}
              icon={Trophy}
              isDark={isDark}
            />
            <StatCard
              label="Languages"
              value={Object.keys(summary.languageDistribution || {}).length}
              icon={Languages}
              isDark={isDark}
            />
            <StatCard
              label="Testpoints"
              value={Object.keys(summary.testpointDistribution || {}).length}
              icon={Target}
              isDark={isDark}
            />
          </div>

          {/* Tag Statistics Summary Card (if data exists) */}
          {hasTagData && (
            <div className={clsx("rounded-xl border p-4", themeClasses.bg, themeClasses.border)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={clsx("font-semibold flex items-center gap-2", themeClasses.text)}>
                  <Tags className="w-5 h-5 text-indigo-500" />
                  Evaluation Tag Distribution
                </h3>
                <button
                  onClick={() => setActiveTab('tags')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Details →
                </button>
              </div>
              <TagDistributionBar stats={aggregateTagStats} isDark={isDark} showLegend />
            </div>
          )}

          {/* Model Rankings */}
          <div className={clsx("rounded-xl border overflow-hidden", themeClasses.bg, themeClasses.border)}>
            <div className={clsx("p-4 border-b", themeClasses.border)}>
              <h3 className={clsx("font-semibold flex items-center gap-2", themeClasses.text)}>
                <Trophy className="w-5 h-5 text-amber-500" />
                Model Rankings
              </h3>
            </div>
            <div className={clsx("divide-y", themeClasses.border)}>
              {sortedModels.map((model: any, index: number) => (
                <div key={model.suffix} className="p-4 flex items-center gap-4">
                  <span className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-slate-100 text-slate-700" :
                    index === 2 ? "bg-orange-100 text-orange-800" :
                    "bg-neutral-100 text-neutral-600"
                  )}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className={clsx("font-medium", themeClasses.text)}>{model.name}</p>
                    <div className={clsx("flex items-center gap-4 mt-1 text-sm", themeClasses.textSecondary)}>
                      <span>Pass Rate: {(model.passRate * 100).toFixed(1)}%</span>
                      <span>Avg Score: {(model.avgScore * 100).toFixed(1)}%</span>
                      {model.avgMatchAcc !== undefined && (
                        <span>Match Acc: {(model.avgMatchAcc * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="w-32">
                    <div className={clsx("h-2 rounded-full overflow-hidden", isDark ? "bg-neutral-700" : "bg-neutral-100")}>
                      <div
                        className={clsx(
                          "h-full rounded-full",
                          model.passRate >= 0.8 ? "bg-emerald-500" :
                          model.passRate >= 0.5 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${model.passRate * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Distribution */}
          <div className={clsx("rounded-xl border p-4", themeClasses.bg, themeClasses.border)}>
            <h3 className={clsx("font-semibold mb-4 flex items-center gap-2", themeClasses.text)}>
              <Languages className="w-5 h-5 text-indigo-500" />
              Language Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.languageDistribution || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([lang, count]) => (
                  <div key={lang} className={clsx(
                    "flex items-center justify-between p-3 rounded-lg",
                    isDark ? "bg-neutral-700" : "bg-neutral-50"
                  )}>
                    <span className={clsx("font-medium uppercase", themeClasses.text)}>{lang}</span>
                    <span className={clsx("text-sm", themeClasses.textSecondary)}>
                      {((count as number) / summary.totalRows * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tag Statistics Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          {hasTagData ? (
            <>
              {/* Aggregate Tag Statistics */}
              <div className={clsx("rounded-xl border p-4", themeClasses.bg, themeClasses.border)}>
                <h3 className={clsx("font-semibold mb-4 flex items-center gap-2", themeClasses.text)}>
                  <Tags className="w-5 h-5 text-indigo-500" />
                  Overall Tag Distribution
                </h3>
                <div className="space-y-4">
                  <TagDistributionBar stats={aggregateTagStats} isDark={isDark} showLegend />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <TagStatCard 
                      label="Pass (1)" 
                      count={aggregateTagStats.pass} 
                      total={aggregateTagStats.total}
                      color="emerald"
                      isDark={isDark}
                    />
                    <TagStatCard 
                      label="Error (-1)" 
                      count={aggregateTagStats.error} 
                      total={aggregateTagStats.total}
                      color="red"
                      isDark={isDark}
                    />
                    <TagStatCard 
                      label="Irrelevant (0)" 
                      count={aggregateTagStats.irrelevant} 
                      total={aggregateTagStats.total}
                      color="neutral"
                      isDark={isDark}
                    />
                  </div>
                </div>
              </div>

              {/* Per-Model Tag Statistics */}
              <div className={clsx("rounded-xl border overflow-hidden", themeClasses.bg, themeClasses.border)}>
                <div className={clsx("p-4 border-b", themeClasses.border)}>
                  <h3 className={clsx("font-semibold flex items-center gap-2", themeClasses.text)}>
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                    Tag Distribution by Model
                  </h3>
                </div>
                <div className={clsx("divide-y", themeClasses.border)}>
                  {modelsWithTagStats.map((model) => (
                    <div key={model.suffix} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className={clsx("font-medium", themeClasses.text)}>{model.name}</p>
                        <span className={clsx("text-sm", themeClasses.textSecondary)}>
                          {model.stats.total} evaluations
                        </span>
                      </div>
                      <TagDistributionBar stats={model.stats} isDark={isDark} compact />
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div className="text-emerald-600">
                          Pass: {model.stats.pass} ({((model.stats.pass / model.stats.total) * 100).toFixed(1)}%)
                        </div>
                        <div className="text-red-600">
                          Error: {model.stats.error} ({((model.stats.error / model.stats.total) * 100).toFixed(1)}%)
                        </div>
                        <div className={isDark ? "text-neutral-400" : "text-neutral-500"}>
                          Irrel: {model.stats.irrelevant} ({((model.stats.irrelevant / model.stats.total) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={clsx("rounded-xl border p-8 text-center", themeClasses.bg, themeClasses.border)}>
              <Tags className={clsx("w-12 h-12 mx-auto mb-4", themeClasses.textSecondary)} />
              <h3 className={clsx("font-semibold mb-2", themeClasses.text)}>No Tag Data Available</h3>
              <p className={themeClasses.textSecondary}>
                This dataset doesn't contain evaluation tags. Tags are typically available when using the "tags" metric source.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className={clsx("rounded-xl border p-4", themeClasses.bg, themeClasses.border)}>
            <h3 className={clsx("font-semibold mb-4", themeClasses.text)}>Select Models to Compare</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={clsx("text-sm mb-2 block", themeClasses.textSecondary)}>Model A</label>
                <select
                  value={compareModelA}
                  onChange={(e) => setCompareModelA(e.target.value)}
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none",
                    themeClasses.bg,
                    themeClasses.border,
                    themeClasses.text
                  )}
                >
                  <option value="">Select a model</option>
                  {sortedModels.map((m: any) => (
                    <option key={m.suffix} value={m.suffix}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={clsx("text-sm mb-2 block", themeClasses.textSecondary)}>Model B</label>
                <select
                  value={compareModelB}
                  onChange={(e) => setCompareModelB(e.target.value)}
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none",
                    themeClasses.bg,
                    themeClasses.border,
                    themeClasses.text
                  )}
                >
                  <option value="">Select a model</option>
                  {sortedModels.map((m: any) => (
                    <option key={m.suffix} value={m.suffix}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {compareModelA && compareModelB && compareModelA !== compareModelB && (
            <ModelComparisonResult
              modelA={sortedModels.find((m: any) => m.suffix === compareModelA)}
              modelB={sortedModels.find((m: any) => m.suffix === compareModelB)}
              isDark={isDark}
            />
          )}
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Insights */}
          <div className={clsx("rounded-xl border p-4", themeClasses.bg, themeClasses.border)}>
            <h3 className={clsx("font-semibold mb-4 flex items-center gap-2", themeClasses.text)}>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Key Insights
            </h3>
            <div className="space-y-3">
              {bestModel && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-900 dark:text-emerald-300">Best Performing Model</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {bestModel.name} achieves {(bestModel.passRate * 100).toFixed(1)}% pass rate
                      with an average score of {(bestModel.avgScore * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
              {worstModel && worstModel.passRate < 0.5 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-300">Needs Improvement</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {worstModel.name} has a low pass rate of {(worstModel.passRate * 100).toFixed(1)}%
                      and may require further optimization
                    </p>
                  </div>
                </div>
              )}
              {sortedModels.length > 1 && (
                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-indigo-900 dark:text-indigo-300">Performance Gap</p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400">
                      There's a {((sortedModels[0]?.passRate - sortedModels[sortedModels.length - 1]?.passRate) * 100).toFixed(1)}
                      % performance gap between the best and worst models
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Turn Range */}
          <div className={clsx("rounded-xl border p-4", themeClasses.bg, themeClasses.border)}>
            <h3 className={clsx("font-semibold mb-4", themeClasses.text)}>Turn Distribution</h3>
            <div className="flex items-center gap-4">
              <div className={clsx("text-center p-4 rounded-lg", isDark ? "bg-neutral-700" : "bg-neutral-50")}>
                <p className={clsx("text-3xl font-bold", themeClasses.text)}>{summary.turnRange?.min}</p>
                <p className={clsx("text-sm", themeClasses.textSecondary)}>Min Turns</p>
              </div>
              <div className={clsx("flex-1 h-2 rounded-full", isDark ? "bg-neutral-700" : "bg-neutral-100")}>
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <div className={clsx("text-center p-4 rounded-lg", isDark ? "bg-neutral-700" : "bg-neutral-50")}>
                <p className={clsx("text-3xl font-bold", themeClasses.text)}>{summary.turnRange?.max}</p>
                <p className={clsx("text-sm", themeClasses.textSecondary)}>Max Turns</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tag Distribution Bar Component
function TagDistributionBar({ 
  stats, 
  isDark, 
  showLegend = false,
  compact = false
}: { 
  stats: TagStats; 
  isDark: boolean; 
  showLegend?: boolean;
  compact?: boolean;
}) {
  const total = stats.total || 1; // Avoid division by zero
  const passPct = (stats.pass / total) * 100;
  const errorPct = (stats.error / total) * 100;
  const irrelevantPct = (stats.irrelevant / total) * 100;

  const height = compact ? 'h-2' : 'h-4';

  return (
    <div className="space-y-2">
      {/* Stacked Bar */}
      <div className={clsx("w-full rounded-full overflow-hidden flex", height, isDark ? "bg-neutral-700" : "bg-neutral-100")}>
        {passPct > 0 && (
          <div 
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${passPct}%` }}
            title={`Pass: ${stats.pass} (${passPct.toFixed(1)}%)`}
          />
        )}
        {errorPct > 0 && (
          <div 
            className="bg-red-500 h-full transition-all"
            style={{ width: `${errorPct}%` }}
            title={`Error: ${stats.error} (${errorPct.toFixed(1)}%)`}
          />
        )}
        {irrelevantPct > 0 && (
          <div 
            className={clsx("h-full transition-all", isDark ? "bg-neutral-500" : "bg-neutral-400")}
            style={{ width: `${irrelevantPct}%` }}
            title={`Irrelevant: ${stats.irrelevant} (${irrelevantPct.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>
              Pass (1): {stats.pass}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>
              Error (-1): {stats.error}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={clsx("w-3 h-3 rounded-full", isDark ? "bg-neutral-500" : "bg-neutral-400")} />
            <span className={isDark ? "text-neutral-300" : "text-neutral-600"}>
              Irrelevant (0): {stats.irrelevant}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Tag Stat Card Component
function TagStatCard({ 
  label, 
  count, 
  total, 
  color, 
  isDark 
}: { 
  label: string; 
  count: number; 
  total: number;
  color: 'emerald' | 'red' | 'neutral';
  isDark: boolean;
}) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  
  const colorClasses = {
    emerald: {
      bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: isDark ? 'border-emerald-800' : 'border-emerald-200',
      number: 'text-emerald-600 dark:text-emerald-400'
    },
    red: {
      bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
      text: 'text-red-700 dark:text-red-400',
      border: isDark ? 'border-red-800' : 'border-red-200',
      number: 'text-red-600 dark:text-red-400'
    },
    neutral: {
      bg: isDark ? 'bg-neutral-700' : 'bg-neutral-100',
      text: isDark ? 'text-neutral-300' : 'text-neutral-600',
      border: isDark ? 'border-neutral-600' : 'border-neutral-200',
      number: isDark ? 'text-neutral-400' : 'text-neutral-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={clsx("p-4 rounded-lg border text-center", colors.bg, colors.border)}>
      <p className={clsx("text-sm mb-1", colors.text)}>{label}</p>
      <p className={clsx("text-2xl font-bold", colors.number)}>{count}</p>
      <p className={clsx("text-xs mt-1", colors.text)}>{percentage}% of total</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, isDark }: { label: string; value: string | number; icon: any; isDark: boolean }) {
  return (
    <div className={clsx(
      "p-4 rounded-xl border",
      isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
    )}>
      <div className={clsx(
        "flex items-center gap-2 mb-2",
        isDark ? "text-neutral-400" : "text-neutral-500"
      )}>
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className={clsx("text-2xl font-semibold", isDark ? "text-neutral-100" : "text-neutral-900")}>
        {value}
      </p>
    </div>
  );
}

function ModelComparisonResult({ modelA, modelB, isDark }: { modelA: any; modelB: any; isDark: boolean }) {
  if (!modelA || !modelB) return null;

  const passRateDiff = modelA.passRate - modelB.passRate;
  const scoreDiff = modelA.avgScore - modelB.avgScore;
  const winner = passRateDiff > 0.05 ? 'A' : passRateDiff < -0.05 ? 'B' : 'tie';

  const themeClasses = {
    bg: isDark ? 'bg-neutral-800' : 'bg-white',
    text: isDark ? 'text-neutral-100' : 'text-neutral-900',
    textSecondary: isDark ? 'text-neutral-300' : 'text-neutral-500',
    border: isDark ? 'border-neutral-700' : 'border-neutral-200',
    bgSecondary: isDark ? 'bg-neutral-700' : 'bg-neutral-50',
  };

  return (
    <div className={clsx("rounded-xl border overflow-hidden", themeClasses.bg, themeClasses.border)}>
      <div className={clsx("p-4 border-b", themeClasses.border)}>
        <h3 className={clsx("font-semibold", themeClasses.text)}>Comparison Results</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Model A */}
          <div className={clsx(
            "p-4 rounded-lg",
            winner === 'A' 
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700" 
              : themeClasses.bgSecondary
          )}>
            <p className={clsx("font-semibold mb-2", themeClasses.text)}>{modelA.name}</p>
            {winner === 'A' && (
              <span className="inline-block px-2 py-1 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-full mb-2">
                Winner
              </span>
            )}
            <div className={clsx("space-y-1 text-sm", themeClasses.textSecondary)}>
              <p>Pass Rate: {(modelA.passRate * 100).toFixed(1)}%</p>
              <p>Avg Score: {(modelA.avgScore * 100).toFixed(1)}%</p>
              {modelA.avgMatchAcc !== undefined && (
                <p>Match Acc: {(modelA.avgMatchAcc * 100).toFixed(1)}%</p>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center">
            <span className={clsx("text-2xl font-bold", isDark ? "text-neutral-600" : "text-neutral-300")}>VS</span>
            {winner === 'tie' && (
              <span className="mt-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-sm rounded-full">
                Tie
              </span>
            )}
          </div>

          {/* Model B */}
          <div className={clsx(
            "p-4 rounded-lg",
            winner === 'B' 
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700" 
              : themeClasses.bgSecondary
          )}>
            <p className={clsx("font-semibold mb-2", themeClasses.text)}>{modelB.name}</p>
            {winner === 'B' && (
              <span className="inline-block px-2 py-1 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-full mb-2">
                Winner
              </span>
            )}
            <div className={clsx("space-y-1 text-sm", themeClasses.textSecondary)}>
              <p>Pass Rate: {(modelB.passRate * 100).toFixed(1)}%</p>
              <p>Avg Score: {(modelB.avgScore * 100).toFixed(1)}%</p>
              {modelB.avgMatchAcc !== undefined && (
                <p>Match Acc: {(modelB.avgMatchAcc * 100).toFixed(1)}%</p>
              )}
            </div>
          </div>
        </div>

        {/* Differences */}
        <div className={clsx("mt-4 pt-4 border-t", themeClasses.border)}>
          <p className={clsx("text-sm mb-2", themeClasses.textSecondary)}>Differences</p>
          <div className="grid grid-cols-2 gap-4">
            <div className={clsx("flex items-center justify-between p-2 rounded", themeClasses.bgSecondary)}>
              <span className={clsx("text-sm", themeClasses.textSecondary)}>Pass Rate</span>
              <span className={clsx(
                "font-medium",
                passRateDiff > 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {passRateDiff > 0 ? '+' : ''}{(passRateDiff * 100).toFixed(1)}%
              </span>
            </div>
            <div className={clsx("flex items-center justify-between p-2 rounded", themeClasses.bgSecondary)}>
              <span className={clsx("text-sm", themeClasses.textSecondary)}>Avg Score</span>
              <span className={clsx(
                "font-medium",
                scoreDiff > 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {scoreDiff > 0 ? '+' : ''}{(scoreDiff * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
