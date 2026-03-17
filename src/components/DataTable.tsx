import React from 'react';
import { clsx } from 'clsx';
import { MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

interface DataTableProps {
  data: any[];
  models: Array<{ suffix: string; name: string }>;
  onRowClick: (row: any) => void;
  isDark?: boolean;
}

export function DataTable({ data, models, onRowClick, isDark = false }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className={clsx("p-8 text-center", isDark ? "text-neutral-400" : "text-neutral-500")}>
        No data available.
      </div>
    );
  }

  // Helper to get last user message as context
  const getContext = (conversation: any[]) => {
    if (!conversation || conversation.length === 0) return 'No context available';
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].role === 'user') {
        return conversation[i].content;
      }
    }
    return conversation[conversation.length - 1]?.content || 'No context available';
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
                    {getContext(row.full_conversation)}
                  </div>
                </div>
              </td>

              {/* Model Columns - Strict Equal Width */}
              {models.map((model) => {
                const suffix = model.suffix;
                const isPass = row[`accuracy_${suffix}`] === 1;
                const score = row[`score_${suffix}`];
                const matchAcc = row[`match_acc_${suffix}`];
                const response = row[`conversation_${suffix}`];

                return (
                  <td 
                    key={suffix} 
                    className="p-3 align-top"
                  >
                    <div className={clsx(
                      "border rounded p-2 h-full flex flex-col transition-colors min-h-[100px]",
                      isPass 
                        ? clsx(
                            isDark 
                              ? "bg-emerald-500/10 border-emerald-500/30 group-hover:border-emerald-500/50" 
                              : "bg-emerald-50/30 border-emerald-100 group-hover:border-emerald-200"
                          )
                        : clsx(
                            isDark 
                              ? "bg-red-500/10 border-red-500/30 group-hover:border-red-500/50" 
                              : "bg-red-50/30 border-red-100 group-hover:border-red-200"
                          )
                    )}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                          {isPass ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className={clsx(
                            "text-[10px] font-medium uppercase",
                            isPass 
                              ? (isDark ? "text-emerald-300" : "text-emerald-700")
                              : (isDark ? "text-red-300" : "text-red-700")
                          )}>
                            {isPass ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                        {score && (
                          <span className={clsx(
                            "font-mono text-[10px] px-1 py-0.5 rounded border",
                            isDark 
                              ? "text-neutral-300 bg-neutral-800 border-neutral-600" 
                              : "text-neutral-500 bg-white border-neutral-200"
                          )} title="METEOR Score">
                            {score}
                          </span>
                        )}
                      </div>
                      <div className={clsx(
                        "text-xs line-clamp-3 leading-relaxed flex-1",
                        isDark ? "text-neutral-300" : "text-neutral-700"
                      )}>
                        {response || <span className={isDark ? "text-neutral-500 italic" : "text-neutral-400 italic"}>No response</span>}
                      </div>
                      {matchAcc && parseFloat(matchAcc) < 1 && (
                        <div className={clsx(
                          "mt-1.5 text-[10px] px-1.5 py-0.5 rounded",
                          isDark ? "text-amber-300 bg-amber-500/20" : "text-amber-600 bg-amber-50"
                        )}>
                          Match: {matchAcc}
                        </div>
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
