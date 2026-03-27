import React from 'react';
import { clsx } from 'clsx';
import { MessageSquare, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface DataTableProps {
  data: any[];
  models: Array<{ suffix: string; name: string }>;
  onRowClick: (row: any) => void;
  isDark?: boolean;
  metricSource?: string;
}

export function DataTable({ data, models, onRowClick, isDark = false, metricSource = 'meteor' }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className={clsx("p-8 text-center", isDark ? "text-neutral-400" : "text-neutral-500")}>
        No data available.
      </div>
    );
  }

  // Helper to get context up to current turn
  const getContext = (conversation: any[], currentTurn: number) => {
    if (!conversation || conversation.length === 0) return 'No context available';
    
    // Filter conversation up to current turn (each turn has user + assistant)
    // Turn 1: messages 0-1, Turn 2: messages 0-3, etc.
    const messagesUpToTurn = conversation.slice(0, currentTurn * 2);
    
    // Get last user message from filtered messages
    for (let i = messagesUpToTurn.length - 1; i >= 0; i--) {
      if (messagesUpToTurn[i].role === 'user') {
        return messagesUpToTurn[i].content;
      }
    }
    return messagesUpToTurn[messagesUpToTurn.length - 1]?.content || 'No context available';
  };

  // Get background color based on metric source and score
  const getScoreBackground = (score: number | undefined, source: string) => {
    if (score === undefined || score === null) {
      return isDark ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-50 border-neutral-200';
    }

    if (source === 'tags') {
      // Evaluation Tags: -1=error(red), 0=invalid(gray), 1=pass(green)
      switch (Math.round(score)) {
        case 1:
          return isDark 
            ? 'bg-green-500/15 border-green-500/40 group-hover:border-green-500/60' 
            : 'bg-green-50/50 border-green-200 group-hover:border-green-300';
        case -1:
          return isDark 
            ? 'bg-red-500/15 border-red-500/40 group-hover:border-red-500/60' 
            : 'bg-red-50/50 border-red-200 group-hover:border-red-300';
        case 0:
        default:
          return isDark 
            ? 'bg-neutral-600/30 border-neutral-500/40 group-hover:border-neutral-500/60' 
            : 'bg-neutral-100/50 border-neutral-300 group-hover:border-neutral-400';
      }
    } else if (source === 'deepseek-v3.2-guide') {
      // 5-color gradient from green to red, low saturation, high transparency
      // 1=best(green), 5=worst(red)
      const colorMap: Record<number, string> = isDark ? {
        1: 'bg-emerald-400/10 border-emerald-400/30',
        2: 'bg-lime-400/10 border-lime-400/30',
        3: 'bg-yellow-400/10 border-yellow-400/30',
        4: 'bg-orange-400/10 border-orange-400/30',
        5: 'bg-red-400/10 border-red-400/30',
      } : {
        1: 'bg-emerald-50/70 border-emerald-200',
        2: 'bg-lime-50/70 border-lime-200',
        3: 'bg-yellow-50/70 border-yellow-200',
        4: 'bg-orange-50/70 border-orange-200',
        5: 'bg-red-50/70 border-red-200',
      };
      
      const roundedScore = Math.round(score);
      const colorClass = colorMap[roundedScore] || colorMap[3];
      return `${colorClass} group-hover:border-opacity-60`;
    } else {
      // Default: pass/fail based on threshold
      const isPass = score >= 0.5;
      return isPass 
        ? clsx(
            isDark 
              ? "bg-emerald-500/10 border-emerald-500/30 group-hover:border-emerald-500/50" 
              : "bg-emerald-50/30 border-emerald-100 group-hover:border-emerald-200"
          )
        : clsx(
            isDark 
              ? "bg-red-500/10 border-red-500/30 group-hover:border-red-500/50" 
              : "bg-red-50/30 border-red-100 group-hover:border-red-200"
          );
    }
  };

  // Get status label and icon based on metric source
  const getStatusDisplay = (score: number | undefined, source: string) => {
    if (score === undefined || score === null) {
      return { label: 'N/A', icon: <MinusCircle className="w-3.5 h-3.5 text-neutral-400" />, color: 'text-neutral-400' };
    }

    if (source === 'tags') {
      switch (Math.round(score)) {
        case 1:
          return { label: 'Pass', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />, color: isDark ? 'text-green-300' : 'text-green-700' };
        case -1:
          return { label: 'Error', icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, color: isDark ? 'text-red-300' : 'text-red-700' };
        case 0:
        default:
          return { label: 'Invalid', icon: <MinusCircle className="w-3.5 h-3.5 text-neutral-400" />, color: isDark ? 'text-neutral-300' : 'text-neutral-600' };
      }
    } else {
      // For other metrics, show pass/fail based on threshold
      const isPass = score >= 0.5;
      return isPass 
        ? { label: 'Pass', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, color: isDark ? 'text-emerald-300' : 'text-emerald-700' }
        : { label: 'Fail', icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, color: isDark ? 'text-red-300' : 'text-red-700' };
    }
  };

  // Fixed layout: Metadata 180px + Context 280px + Models equal share
  const modelCount = models.length;
  const fixedWidth = 460; // 180 + 280
  const modelMinWidth = 320;
  const tableMinWidth = fixedWidth + modelCount * modelMinWidth;

  return (
    <div className="overflow-x-auto">
      <table 
        className="w-full text-left border-collapse table-fixed" 
        style={{ minWidth: `${tableMinWidth}px` }}
      >
        <colgroup>
          <col style={{ width: '180px' }} />
          <col style={{ width: '280px' }} />
          {models.map((model) => (
            <col 
              key={model.suffix} 
              style={{ width: `${100 / modelCount}%` }} 
            />
          ))}
        </colgroup>
        <thead>
          <tr className={clsx(
            "text-xs uppercase tracking-wider border-b",
            isDark 
              ? "bg-neutral-800/80 border-neutral-700 text-neutral-400" 
              : "bg-neutral-50/80 border-neutral-200 text-neutral-500"
          )}>
            <th className="p-3 font-medium">Metadata</th>
            <th className="p-3 font-medium">Context</th>
            {models.map((model) => (
              <th 
                key={model.suffix} 
                className="p-3 font-medium"
              >
                <div className="truncate" title={model.name}>{model.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={clsx(
          isDark ? "divide-neutral-800" : "divide-neutral-100"
        )}>
          {data.map((row) => (
            <tr 
              key={row.id} 
              className={clsx(
                "transition-colors cursor-pointer group",
                isDark ? "hover:bg-neutral-800/50" : "hover:bg-neutral-50/50"
              )}
              onClick={() => onRowClick(row)}
            >
              {/* Metadata Column - Fixed 180px */}
              <td className="p-3 align-top">
                <div className="space-y-1">
                  <div className={clsx("font-mono text-[10px] truncate", isDark ? "text-neutral-500" : "text-neutral-500")} title={row.id}>
                    {row.id.slice(0, 16)}...
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className={clsx(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase",
                      isDark ? "bg-neutral-700 text-neutral-300" : "bg-neutral-100 text-neutral-600"
                    )}>
                      {row.testpoint}
                    </span>
                    <span className={clsx(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase",
                      isDark ? "bg-neutral-700 text-neutral-300" : "bg-neutral-100 text-neutral-600"
                    )}>
                      {row.language}
                    </span>
                  </div>
                  <span className={clsx(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium",
                    isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"
                  )}>
                    T{row.turn}
                  </span>
                </div>
              </td>

              {/* Context Column - Fixed 280px */}
              <td className="p-3 align-top">
                <div className={clsx(
                  "border rounded p-2 relative transition-colors",
                  isDark 
                    ? "bg-neutral-800 border-neutral-600 group-hover:border-neutral-500" 
                    : "bg-neutral-50 border-neutral-200 group-hover:border-neutral-300"
                )}>
                  <div className={clsx(
                    "flex items-center gap-1.5 mb-1",
                    isDark ? "text-neutral-400" : "text-neutral-400"
                  )}>
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[10px] font-medium uppercase">User</span>
                  </div>
                  <div className={clsx(
                    "text-xs line-clamp-2 leading-relaxed",
                    isDark ? "text-neutral-300" : "text-neutral-700"
                  )}>
                    {getContext(row.full_conversation, row.turn)}
                  </div>
                </div>
              </td>

              {/* Model Columns - Strict Equal Width */}
              {models.map((model) => {
                const suffix = model.suffix;
                const score = row[`score_${metricSource}_${suffix}`];
                const response = row[`conversation_${suffix}`];
                const status = getStatusDisplay(score, metricSource);
                const bgClass = getScoreBackground(score, metricSource);

                // Check if metric source exists for this row
                const hasMetricSource = score !== undefined && score !== null;
                
                return (
                  <td 
                    key={suffix} 
                    className="p-3 align-top"
                  >
                    <div className={clsx(
                      "border rounded p-2 h-full flex flex-col transition-colors min-h-[100px]",
                      hasMetricSource ? bgClass : (isDark ? "bg-neutral-800/50 border-neutral-600" : "bg-neutral-100 border-neutral-300")
                    )}>
                      {!hasMetricSource ? (
                        <div className="flex-1 flex items-center justify-center">
                          <span className={clsx(
                            "text-sm font-medium",
                            isDark ? "text-neutral-400" : "text-neutral-500"
                          )}>
                            No Metric Source
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1">
                              {status.icon}
                              <span className={clsx(
                                "text-[10px] font-medium uppercase",
                                status.color
                              )}>
                                {status.label}
                              </span>
                            </div>
                            {/* Show score for non-tags metrics */}
                            {metricSource !== 'tags' && score !== undefined && (
                              <span className={clsx(
                                "font-mono text-[10px] px-1 py-0.5 rounded border",
                                isDark 
                                  ? "text-neutral-300 bg-neutral-800 border-neutral-600" 
                                  : "text-neutral-500 bg-white border-neutral-200"
                              )} title={metricSource}>
                                {typeof score === 'number' ? score.toFixed(2) : score}
                              </span>
                            )}
                          </div>
                          <div className={clsx(
                            "text-xs line-clamp-3 leading-relaxed flex-1",
                            isDark ? "text-neutral-300" : "text-neutral-700"
                          )}>
                            {response || <span className={isDark ? "text-neutral-500 italic" : "text-neutral-400 italic"}>No response</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
