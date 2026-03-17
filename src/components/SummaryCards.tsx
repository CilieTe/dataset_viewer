import React from 'react';
import { BarChart3, Languages, Hash, Trophy, Target } from 'lucide-react';
import { clsx } from 'clsx';

interface SummaryProps {
  summary: {
    totalRows: number;
    testpointDistribution: Record<string, number>;
    languageDistribution: Record<string, number>;
    turnRange: { min: number; max: number };
    models: Array<{
      suffix: string;
      name: string;
      passRate: number;
      avgScore: number;
      avgMatchAcc?: number;
    }>;
  };
}

export function SummaryCards({ summary }: SummaryProps) {
  // Handle undefined/null summary gracefully
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  // Sort models by pass rate for display
  const sortedModels = [...(summary.models || [])].sort((a, b) => b.passRate - a.passRate);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Testpoint Distribution */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 text-neutral-500 mb-3">
          <BarChart3 className="w-4 h-4" />
          <h3 className="text-sm font-medium uppercase tracking-wider">Testpoints</h3>
        </div>
        <div className="space-y-2 flex-1">
          {Object.entries(summary.testpointDistribution || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([key, count]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2 text-neutral-700">{key}</span>
                <span className="font-mono text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {count} ({((count / (summary.totalRows || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Language Distribution */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 text-neutral-500 mb-3">
          <Languages className="w-4 h-4" />
          <h3 className="text-sm font-medium uppercase tracking-wider">Languages</h3>
        </div>
        <div className="space-y-2 flex-1">
          {Object.entries(summary.languageDistribution || {})
            .sort(([, a], [, b]) => b - a)
            .map(([key, count]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="uppercase text-neutral-700">{key}</span>
                <span className="font-mono text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {((count / (summary.totalRows || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Turn Range */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 text-neutral-500 mb-3">
          <Hash className="w-4 h-4" />
          <h3 className="text-sm font-medium uppercase tracking-wider">Turns</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-light tracking-tight">
              {(summary.turnRange?.min ?? 0)} - {(summary.turnRange?.max ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">Min - Max</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-xs text-neutral-500">
            {(summary.totalRows || 0).toLocaleString()} evaluation rows
          </span>
        </div>
      </div>

      {/* Model Performance */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 text-neutral-500 mb-3">
          <Trophy className="w-4 h-4" />
          <h3 className="text-sm font-medium uppercase tracking-wider">Model Performance</h3>
        </div>
        <div className="space-y-3 flex-1 overflow-auto max-h-[200px]">
          {sortedModels.map((model) => (
            <div key={model.suffix} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate pr-2 text-neutral-700" title={model.name}>
                  {model.name?.length > 25 ? model.name.substring(0, 25) + '...' : (model.name || model.suffix)}
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  {((model.passRate || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    (model.passRate || 0) >= 0.8 ? "bg-emerald-500" :
                    (model.passRate || 0) >= 0.5 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${(model.passRate || 0) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>METEOR: {((model.avgScore || 0) * 100).toFixed(1)}%</span>
                {model.avgMatchAcc !== undefined && (
                  <span>Match: {(model.avgMatchAcc * 100).toFixed(1)}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
