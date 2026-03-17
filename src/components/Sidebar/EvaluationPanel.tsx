import React, { useState, useEffect, useMemo } from 'react';
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
  XCircle,
  GitCompare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ModelInfo {
  suffix: string;
  name: string;
  passRate: number;
  avgScore: number;
  avgMatchAcc?: number;
}

interface SummaryData {
  totalRows: number;
  testpointDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  turnRange: { min: number; max: number };
  models: ModelInfo[];
}

interface EvaluationPanelProps {
  summary: SummaryData | null;
  isDark?: boolean;
}

interface ComparisonResult {
  modelA: ModelInfo;
  modelB: ModelInfo;
  winner: 'A' | 'B' | 'tie';
  passRateDiff: number;
  scoreDiff: number;
}

export function EvaluationPanel({ summary, isDark = false }: EvaluationPanelProps) {
  const [compareOpen, setCompareOpen] = useState(false);
  const [modelA, setModelA] = useState<string>('');
  const [modelB, setModelB] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const sortedModels = useMemo(() => {
    if (!summary?.models) return [];
    return [...summary.models].sort((a, b) => b.passRate - a.passRate);
  }, [summary]);

  const bestModel = sortedModels[0];
  const worstModel = sortedModels[sortedModels.length - 1];

  // Get hardest testpoint (lowest overall pass rate)
  const hardestTestpoint = useMemo(() => {
    if (!summary?.testpointDistribution) return null;
    // This is a simplified calculation - in reality you'd need pass rates per testpoint
    const entries = Object.entries(summary.testpointDistribution);
    return entries.length > 0 ? entries.sort((a, b) => a[1] - b[1])[0] : null;
  }, [summary]);

  const handleCompare = () => {
    const mA = summary?.models.find(m => m.suffix === modelA);
    const mB = summary?.models.find(m => m.suffix === modelB);
    if (!mA || !mB) return;

    const passRateDiff = mA.passRate - mB.passRate;
    const scoreDiff = mA.avgScore - mB.avgScore;
    
    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (passRateDiff > 0.05) winner = 'A';
    else if (passRateDiff < -0.05) winner = 'B';

    setComparison({
      modelA: mA,
      modelB: mB,
      winner,
      passRateDiff,
      scoreDiff
    });
  };

  if (!summary) {
    return (
      <div className="p-4">
        <p className="text-sm text-neutral-400">Loading evaluation data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto max-h-full">
      <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Evaluation
      </h3>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg border border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase">Total Rows</p>
          <p className="text-xl font-semibold text-neutral-900">
            {summary.totalRows?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase">Models</p>
          <p className="text-xl font-semibold text-neutral-900">
            {summary.models?.length || 0}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase">Languages</p>
          <p className="text-xl font-semibold text-neutral-900">
            {Object.keys(summary.languageDistribution || {}).length}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase">Testpoints</p>
          <p className="text-xl font-semibold text-neutral-900">
            {Object.keys(summary.testpointDistribution || {}).length}
          </p>
        </div>
      </div>

      {/* Turn Range */}
      <div className="bg-white p-3 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2 text-neutral-500 mb-2">
          <Hash className="w-4 h-4" />
          <span className="text-xs font-medium uppercase">Turn Range</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{summary.turnRange?.min}</span>
          <span className="text-neutral-400">-</span>
          <span className="text-2xl font-semibold">{summary.turnRange?.max}</span>
        </div>
      </div>

      {/* Model Performance */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5" />
          Model Performance
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sortedModels.map((model, index) => (
            <div key={model.suffix} className="bg-white p-3 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-slate-100 text-slate-700" :
                    index === 2 ? "bg-orange-100 text-orange-800" :
                    "bg-neutral-100 text-neutral-600"
                  )}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[120px]" title={model.name}>
                    {model.name}
                  </span>
                </div>
                <span className="text-sm font-mono">
                  {(model.passRate * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    model.passRate >= 0.8 ? "bg-emerald-500" :
                    model.passRate >= 0.5 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${model.passRate * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>Score: {(model.avgScore * 100).toFixed(1)}%</span>
                {model.avgMatchAcc !== undefined && (
                  <span>Match: {(model.avgMatchAcc * 100).toFixed(1)}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Comparison */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setCompareOpen(!compareOpen)}
          className="w-full flex items-center justify-between p-3 bg-white hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Model Comparison
          </span>
          {compareOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </button>
        
        {compareOpen && (
          <div className="p-3 border-t border-neutral-200 space-y-3">
            <div className="space-y-2">
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Model A</option>
                {summary.models?.map(m => (
                  <option key={m.suffix} value={m.suffix}>{m.name}</option>
                ))}
              </select>
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Model B</option>
                {summary.models?.map(m => (
                  <option key={m.suffix} value={m.suffix}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={handleCompare}
                disabled={!modelA || !modelB || modelA === modelB}
                className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Compare
              </button>
            </div>

            {comparison && (
              <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {comparison.modelA.name}
                  </span>
                  <span className={clsx(
                    "text-xs font-bold",
                    comparison.winner === 'A' ? "text-emerald-600" :
                    comparison.winner === 'B' ? "text-red-600" : "text-neutral-500"
                  )}>
                    {comparison.winner === 'A' ? 'WINNER' :
                     comparison.winner === 'B' ? 'LOSER' : 'TIE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Pass Rate</span>
                  <span className={clsx(
                    comparison.passRateDiff > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {(comparison.modelA.passRate * 100).toFixed(1)}%
                    {comparison.passRateDiff !== 0 && (
                      <span className="ml-1">
                        ({comparison.passRateDiff > 0 ? '+' : ''}
                        {(comparison.passRateDiff * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Avg Score</span>
                  <span className={clsx(
                    comparison.scoreDiff > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {(comparison.modelA.avgScore * 100).toFixed(1)}%
                    {comparison.scoreDiff !== 0 && (
                      <span className="ml-1">
                        ({comparison.scoreDiff > 0 ? '+' : ''}
                        {(comparison.scoreDiff * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <span className="text-sm font-medium truncate max-w-[100px] block">
                    {comparison.modelB.name}
                  </span>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-neutral-500">Pass Rate</span>
                    <span>{(comparison.modelB.passRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Avg Score</span>
                    <span>{(comparison.modelB.avgScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Insights
        </h4>
        <div className="space-y-2">
          {bestModel && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                <strong className="text-neutral-900">{bestModel.name}</strong> performs best with{' '}
                {(bestModel.passRate * 100).toFixed(0)}% pass rate
              </span>
            </div>
          )}
          {worstModel && worstModel.passRate < 0.5 && (
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                <strong className="text-neutral-900">{worstModel.name}</strong> needs attention with only{' '}
                {(worstModel.passRate * 100).toFixed(0)}% pass rate
              </span>
            </div>
          )}
          {summary.models?.length > 1 && (
            <div className="flex items-start gap-2 text-sm">
              <Target className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span className="text-neutral-700">
                Performance gap:{' '}
                {((sortedModels[0]?.passRate - sortedModels[sortedModels.length - 1]?.passRate) * 100).toFixed(0)}
                % between best and worst models
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Language Distribution */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
          <Languages className="w-3.5 h-3.5" />
          Languages
        </h4>
        <div className="space-y-1">
          {Object.entries(summary.languageDistribution || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([lang, count]) => (
              <div key={lang} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700 uppercase">{lang}</span>
                <span className="text-xs text-neutral-500">
                  {((count / summary.totalRows) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
