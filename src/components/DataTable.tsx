import React from 'react';
import { clsx } from 'clsx';
import { MessageSquare, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: any[];
  models: Array<{ suffix: string; name: string }>;
  onRowClick: (row: any) => void;
}

export function DataTable({ data, models, onRowClick }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500">
        No data available.
      </div>
    );
  }

  // Helper to get last user message as context
  const getContext = (conversation: any[]) => {
    if (!conversation || conversation.length === 0) return 'No context available';
    // Find the last user message before the evaluated assistant turn
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].role === 'user') {
        return conversation[i].content;
      }
    }
    return conversation[conversation.length - 1]?.content || 'No context available';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-neutral-50/80 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
            <th className="p-4 font-medium w-48">Metadata</th>
            <th className="p-4 font-medium min-w-[200px]">Context</th>
            {models.map((model) => (
              <th key={model.suffix} className="p-4 font-medium min-w-[300px]">
                <div className="truncate" title={model.name}>{model.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {data.map((row) => (
            <tr 
              key={row.id} 
              className="hover:bg-neutral-50/50 transition-colors cursor-pointer group"
              onClick={() => onRowClick(row)}
            >
              {/* Metadata Column */}
              <td className="p-4 align-top">
                <div className="space-y-1">
                  <div className="font-mono text-xs text-neutral-900 truncate" title={row.id}>
                    {row.id}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 uppercase tracking-wider">
                      {row.testpoint}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 uppercase tracking-wider">
                      {row.language}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 uppercase tracking-wider">
                      Turn {row.turn}
                    </span>
                  </div>
                  {row.conv_metadata?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {row.conv_metadata.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>

              {/* Context Column */}
              <td className="p-4 align-top">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 relative group-hover:border-neutral-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">Last User Message</span>
                  </div>
                  <div className="text-sm text-neutral-700 line-clamp-3 leading-relaxed">
                    {getContext(row.full_conversation)}
                  </div>
                  <div className="mt-2 text-xs text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View full conversation <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </td>

              {/* Model Columns */}
              {models.map((model) => {
                const suffix = model.suffix;
                const isPass = row[`accuracy_${suffix}`] === 1;
                const score = row[`score_${suffix}`];
                const matchAcc = row[`match_acc_${suffix}`];
                const response = row[`conversation_${suffix}`];

                return (
                  <td key={suffix} className="p-4 align-top">
                    <div className={clsx(
                      "border rounded-lg p-3 h-full flex flex-col transition-colors",
                      isPass ? "bg-emerald-50/30 border-emerald-100 group-hover:border-emerald-200" : "bg-red-50/30 border-red-100 group-hover:border-red-200"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {isPass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={clsx(
                            "text-xs font-medium uppercase tracking-wider",
                            isPass ? "text-emerald-700" : "text-red-700"
                          )}>
                            {isPass ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {score && (
                            <span className="font-mono text-xs font-medium text-neutral-500 bg-white px-1.5 py-0.5 rounded border border-neutral-200 shadow-sm" title="METEOR Score">
                              M:{score}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-neutral-700 line-clamp-4 leading-relaxed flex-1">
                        {response || <span className="text-neutral-400 italic">No response</span>}
                      </div>
                      {matchAcc && parseFloat(matchAcc) < 1 && (
                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          Match Acc: {matchAcc}
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
