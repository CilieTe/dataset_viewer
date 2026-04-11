import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { MessageSquare, CheckCircle2, XCircle, MinusCircle, GripVertical } from 'lucide-react';

interface DataTableProps {
  data: any[];
  models: Array<{ suffix: string; name: string }>;
  onRowClick: (row: any) => void;
  isDark?: boolean;
  metricSource?: string;
  datasetName?: string; // 用于区分不同数据集的排序
}

const STORAGE_KEY = 'dataset-viewer-model-order';

export function DataTable({ data, models, onRowClick, isDark = false, metricSource = 'meteor', datasetName = 'default' }: DataTableProps) {
  // 模型排序状态
  const [orderedModels, setOrderedModels] = useState<Array<{ suffix: string; name: string }>>(models);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 从 localStorage 加载排序
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const allOrders = JSON.parse(saved);
        const savedOrder = allOrders[datasetName];
        if (savedOrder && Array.isArray(savedOrder)) {
          // 只保留当前数据中存在的模型，按保存的顺序排列
          const ordered = savedOrder
            .filter((suffix: string) => models.some(m => m.suffix === suffix))
            .map((suffix: string) => models.find(m => m.suffix === suffix)!)
            .filter(Boolean);
          // 添加新出现的模型（不在保存排序中的）
          const newModels = models.filter(m => !savedOrder.includes(m.suffix));
          setOrderedModels([...ordered, ...newModels]);
        } else {
          setOrderedModels(models);
        }
      } catch {
        setOrderedModels(models);
      }
    } else {
      setOrderedModels(models);
    }
  }, [models, datasetName]);

  // 保存排序到 localStorage
  const saveOrder = (newOrder: Array<{ suffix: string; name: string }>) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const allOrders = saved ? JSON.parse(saved) : {};
    allOrders[datasetName] = newOrder.map(m => m.suffix);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allOrders));
  };

  // 拖拽开始
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  // 拖拽离开
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 放置
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...orderedModels];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    
    setOrderedModels(newOrder);
    saveOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 重置排序
  const handleResetOrder = () => {
    setOrderedModels(models);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const allOrders = JSON.parse(saved);
      delete allOrders[datasetName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allOrders));
    }
  };

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
    
    const messagesUpToTurn = conversation.slice(0, currentTurn * 2);
    
    for (let i = messagesUpToTurn.length - 1; i >= 0; i--) {
      if (messagesUpToTurn[i].role === 'user') {
        return messagesUpToTurn[i].content;
      }
    }
    return messagesUpToTurn[messagesUpToTurn.length - 1]?.content || 'No context available';
  };

  // Get background color based on metric source and score
  const getScoreBackground = (score: number | undefined | null, source: string) => {
    if (score === undefined || score === null) {
      return isDark ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-50 border-neutral-200';
    }

    if (source === 'tags') {
      // New mapping: Pass(1)=green, Error(-1)=red, Invalid(0)=yellow, Null=null/undefined=gray
      if (score === 1) {
        return isDark 
          ? 'bg-green-500/15 border-green-500/40 group-hover:border-green-500/60' 
          : 'bg-green-50/50 border-green-200 group-hover:border-green-300';
      }
      if (score === -1) {
        return isDark 
          ? 'bg-red-500/15 border-red-500/40 group-hover:border-red-500/60' 
          : 'bg-red-50/50 border-red-200 group-hover:border-red-300';
      }
      if (score === 0) {
        // Invalid (0) → yellow/amber
        return isDark 
          ? 'bg-amber-500/15 border-amber-500/40 group-hover:border-amber-500/60' 
          : 'bg-amber-50/50 border-amber-200 group-hover:border-amber-300';
      }
      // Fallback for other values
      return isDark 
        ? 'bg-neutral-600/30 border-neutral-500/40 group-hover:border-neutral-500/60' 
        : 'bg-neutral-100/50 border-neutral-300 group-hover:border-neutral-400';
    } else if (source === 'deepseek-v3.2-guide') {
      const colorMap: Record<number, string> = isDark ? {
        1: 'bg-red-400/10 border-red-400/30',
        2: 'bg-orange-400/10 border-orange-400/30',
        3: 'bg-yellow-400/10 border-yellow-400/30',
        4: 'bg-lime-400/10 border-lime-400/30',
        5: 'bg-emerald-400/10 border-emerald-400/30',
      } : {
        1: 'bg-red-50/70 border-red-200',
        2: 'bg-orange-50/70 border-orange-200',
        3: 'bg-yellow-50/70 border-yellow-200',
        4: 'bg-lime-50/70 border-lime-200',
        5: 'bg-emerald-50/70 border-emerald-200',
      };
      
      const roundedScore = Math.round(score);
      const colorClass = colorMap[roundedScore] || colorMap[3];
      return `${colorClass} group-hover:border-opacity-60`;
    } else {
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
  const getStatusDisplay = (score: number | undefined | null, source: string) => {
    if (score === undefined || score === null) {
      return { label: 'Null', icon: <MinusCircle className="w-3.5 h-3.5 text-neutral-400" />, color: isDark ? 'text-neutral-400' : 'text-neutral-500' };
    }

    if (source === 'tags') {
      // New mapping: Pass(1)=green, Error(-1)=red, Invalid(0)=yellow, Null=null/undefined=gray
      if (score === 1) {
        return { label: 'Pass', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />, color: isDark ? 'text-green-300' : 'text-green-700' };
      }
      if (score === -1) {
        return { label: 'Error', icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, color: isDark ? 'text-red-300' : 'text-red-700' };
      }
      if (score === 0) {
        return { label: 'Invalid', icon: <MinusCircle className="w-3.5 h-3.5 text-amber-500" />, color: isDark ? 'text-amber-300' : 'text-amber-700' };
      }
      // Fallback for other values
      return { label: 'Unknown', icon: <MinusCircle className="w-3.5 h-3.5 text-neutral-400" />, color: isDark ? 'text-neutral-300' : 'text-neutral-600' };
    } else if (source === 'deepseek-v3.2-guide') {
      return { label: score.toFixed(1), icon: null, color: isDark ? 'text-neutral-200' : 'text-neutral-700' };
    } else {
      const isPass = score >= 0.5;
      return isPass 
        ? { label: 'Pass', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, color: isDark ? 'text-emerald-300' : 'text-emerald-700' }
        : { label: 'Fail', icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, color: isDark ? 'text-red-300' : 'text-red-700' };
    }
  };

  // Fixed layout: Metadata 180px + Context 280px + Models equal share
  const modelCount = orderedModels.length;
  const fixedWidth = 460;
  const modelMinWidth = 320;
  const tableMinWidth = fixedWidth + modelCount * modelMinWidth;

  // 检查是否自定义了顺序
  const isCustomOrder = orderedModels.some((m, i) => m.suffix !== models[i]?.suffix);

  return (
    <div className="overflow-x-auto">
      <table 
        className="w-full text-left border-collapse table-fixed" 
        style={{ minWidth: `${tableMinWidth}px` }}
      >
        <colgroup>
          <col style={{ width: '180px' }} />
          <col style={{ width: '280px' }} />
          {orderedModels.map((model) => (
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
            <th className="p-3 font-medium">
              <div className="flex items-center justify-between">
                <span>Metadata</span>
                {isCustomOrder && (
                  <button
                    onClick={handleResetOrder}
                    className={clsx(
                      "text-[10px] px-2 py-0.5 rounded transition-colors",
                      isDark 
                        ? "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700" 
                        : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200"
                    )}
                    title="Reset column order"
                  >
                    Reset Order
                  </button>
                )}
              </div>
            </th>
            <th className="p-3 font-medium">Context</th>
            {orderedModels.map((model, index) => (
              <th 
                key={model.suffix} 
                className={clsx(
                  "p-3 font-medium transition-colors",
                  dragOverIndex === index && (isDark ? "bg-indigo-500/20" : "bg-indigo-50"),
                  draggedIndex === index && "opacity-50"
                )}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                title="Drag to reorder columns"
              >
                <div className={clsx(
                  "flex items-center gap-1 cursor-move group",
                  isDark ? "hover:text-neutral-200" : "hover:text-neutral-700"
                )}>
                  <GripVertical className={clsx(
                    "w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity",
                    isDark ? "text-neutral-500" : "text-neutral-400"
                  )} />
                  <div className="truncate flex-1" title={model.name}>{model.name}</div>
                </div>
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

              {/* Model Columns - Ordered by user preference */}
              {orderedModels.map((model) => {
                const suffix = model.suffix;
                const score = row[`score_${metricSource}_${suffix}`];
                const response = row[`conversation_${suffix}`];
                const status = getStatusDisplay(score, metricSource);
                const bgClass = getScoreBackground(score, metricSource);
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
