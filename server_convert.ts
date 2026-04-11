// Convert dataset to flat rows and discover metric sources
function convertToRows(data: DatasetRow[], datasetName: string): { rows: ParsedRow[]; metricSources: MetricSource[] } {
  const rows: ParsedRow[] = [];
  const discoveredSources = new Map<string, MetricSource>();
  
  // Known metric patterns with their display names
  const knownMetrics: Record<string, { type: 'score' | 'accuracy'; displayName: string }> = {
    'meteor': { type: 'score', displayName: 'METEOR (Similarity)' },
    'tool_acc': { type: 'accuracy', displayName: 'Tool Call Accuracy' },
    'call_halluc_acc': { type: 'accuracy', displayName: 'Hallucination Check' },
    'match_acc': { type: 'accuracy', displayName: 'Match Accuracy' },
    'ppl': { type: 'score', displayName: 'Perplexity' }
  };
  
  for (const item of data) {
    const evalTurns = item.dialog.filter(t => t.role === 'assistant' && t.evaluate);
    
    if (evalTurns.length === 0) continue;
    
    for (const turn of evalTurns) {
      const row: ParsedRow = {
        id: `${item.id}_turn_${turn.turn_index}`,
        session_id: item.id,
        turn: turn.turn_index,
        language: item.meta?.chat_lang || 'en',
        dataset: datasetName,
        indicator: 'response_quality',
        full_conversation: JSON.stringify(item.dialog),
        conv_metadata: JSON.stringify({
          type: item.type,
          tools: Object.keys(item.tools || {}),
          tags: turn.tags || []
        })
      };
      
      // Add ground truth
      row['ground_truth'] = turn.content;
      
      // Add model outputs and metrics
      if (turn.evaluate) {
        for (const [modelName, output] of Object.entries(turn.evaluate)) {
          const suffix = modelName.replace(/[^a-zA-Z0-9]/g, '_');
          row[`model_${suffix}`] = modelName;
          row[`conversation_${suffix}`] = output.content;
          
          // Process all metrics from this model output
          if (output.metrics) {
            for (const [metricKey, metricData] of Object.entries(output.metrics)) {
              // Discover new metric sources
              if (!discoveredSources.has(metricKey)) {
                if (knownMetrics[metricKey]) {
                  discoveredSources.set(metricKey, {
                    name: knownMetrics[metricKey].displayName,
                    key: metricKey,
                    type: knownMetrics[metricKey].type
                  });
                } else {
                  // Unknown metric - treat as score type by default
                  // This catches things like "deepseek-v3.2-guide"
                  discoveredSources.set(metricKey, {
                    name: metricKey,
                    key: metricKey,
                    type: 'score'
                  });
                }
              }
              
              // Store the metric value with a unique key
              const value = typeof metricData === 'object' && metricData !== null 
                ? (metricData as any).score 
                : metricData;
              row[`metric_${metricKey}_${suffix}`] = value;
              
              // Also store backwards-compatible keys for meteor/tool_acc
              if (metricKey === 'meteor') {
                row[`score_${suffix}`] = value?.toFixed?.(3) || '0';
              } else if (metricKey === 'tool_acc' || metricKey === 'call_halluc_acc') {
                row[`accuracy_${suffix}`] = value === 1.0 ? 1 : 0;
              } else if (metricKey === 'match_acc') {
                row[`match_acc_${suffix}`] = value?.toFixed?.(3) || '0';
              }
            }
          }
        }
      }
      
      rows.push(row);
    }
  }
  
  return { rows, metricSources: Array.from(discoveredSources.values()) };
}