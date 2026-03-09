import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Types
interface DialogTurn {
  turn_index: number;
  role: string;
  content: string;
  tags?: string[];
  review?: any;
  settings?: any;
  laep?: any;
  loss?: boolean;
  evaluate?: Record<string, ModelOutput>;
}

interface ModelOutput {
  content: string;
  metrics?: Record<string, { score: number; meta?: any }>;
  meta?: any;
}

interface MetricSource {
  name: string;
  key: string; // e.g., "meteor", "deepseek-v3.2-guide"
  type: 'score' | 'accuracy' | 'other';
}

interface DatasetRow {
  id: string;
  type: string;
  dialog: DialogTurn[];
  tools: any;
  meta: {
    chat_lang: string;
    description?: string;
  };
}

interface ParsedRow {
  id: string;
  session_id: string;
  turn: number;
  language: string;
  dataset: string;
  indicator: string;
  full_conversation: string;
  conv_metadata: string;
  [key: string]: any;
}

interface DatasetInfo {
  filename: string;
  rowCount: number;
  rows: ParsedRow[];
  metricSources: MetricSource[];
}

// Store all datasets
const datasets: Record<string, DatasetInfo> = {};

// Load a single dataset file
function loadDatasetFile(filename: string): { rows: ParsedRow[]; metricSources: MetricSource[] } {
  const datasetPath = path.join(__dirname, 'dataset', filename);
  
  if (!fs.existsSync(datasetPath)) {
    console.warn('Dataset file not found:', datasetPath);
    return { rows: [], metricSources: [] };
  }
  
  const data: DatasetRow[] = [];
  const lines = fs.readFileSync(datasetPath, 'utf-8').trim().split('\n');
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        data.push(JSON.parse(line));
      } catch (e) {
        console.error('Failed to parse line:', e);
      }
    }
  }
  
  console.log(`Loaded ${data.length} rows from ${filename}`);
  return convertToRows(data, filename.replace('.jsonl', ''));
}

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
      
      row['ground_truth'] = turn.content;
      
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

// Load all datasets
function loadAllDatasets() {
  const datasetDir = path.join(__dirname, 'dataset');
  const files = fs.readdirSync(datasetDir).filter(f => f.endsWith('.jsonl'));

  for (const file of files) {
    const { rows, metricSources } = loadDatasetFile(file);
    datasets[file.replace('.jsonl', '')] = {
      filename: file,
      rowCount: rows.length,
      rows,
      metricSources
    };
    console.log(`  ${file}: ${rows.length} rows, sources: [${metricSources.map(s => s.key).join(', ')}]`);
  }

  console.log(`\nLoaded ${files.length} datasets total`);
}

// Get rows based on dataset filter
function getRows(datasetFilter: 'all' | string): ParsedRow[] {
  if (datasetFilter === 'all') {
    return Object.values(datasets).flatMap(d => d.rows);
  }
  return datasets[datasetFilter]?.rows || [];
}

// Extract all unique models from rows
function extractModels(rows: ParsedRow[]): Array<{suffix: string, name: string}> {
  const modelMap = new Map<string, string>();
  
  for (const row of rows) {
    Object.keys(row).forEach(key => {
      if (key.startsWith('model_')) {
        const suffix = key.substring(6);
        const name = row[key];
        if (!modelMap.has(suffix)) {
          modelMap.set(suffix, name);
        }
      }
    });
  }
  
  return Array.from(modelMap.entries()).map(([suffix, name]) => ({ suffix, name }));
}

// Extract available metric sources from rows
function extractMetricSources(rows: ParsedRow[]): MetricSource[] {
  const sources = new Map<string, MetricSource>();
  
  // Known metric patterns
  const knownMetrics: Record<string, { type: 'score' | 'accuracy'; displayName: string }> = {
    'meteor': { type: 'score', displayName: 'METEOR' },
    'tool_acc': { type: 'accuracy', displayName: 'Tool Accuracy' },
    'call_halluc_acc': { type: 'accuracy', displayName: 'Call Hallucination' },
    'match_acc': { type: 'accuracy', displayName: 'Match Accuracy' },
    'ppl': { type: 'score', displayName: 'Perplexity' }
  };
  
  for (const row of rows) {
    // Check the first model's metrics to discover sources
    const modelKey = Object.keys(row).find(k => k.startsWith('model_'));
    if (!modelKey) continue;
    
    const suffix = modelKey.substring(6);
    const scoreKey = `score_${suffix}`;
    
    // Check raw metrics from evaluate field (stored in row during conversion)
    // We need to look at the actual metric keys available
    Object.keys(row).forEach(key => {
      // Look for metric keys like "metric_meteor_modelName" or similar pattern
      // Actually, we stored metrics as score_, accuracy_ etc.
    });
    
    // Alternative: scan through all row keys to find metric sources
    for (const key of Object.keys(row)) {
      if (key.startsWith('score_') || key.startsWith('accuracy_')) {
        // This is a metric field, determine source
        // The original metric name would need to be stored
      }
    }
  }
  
  // For now, detect based on row structure - check if non-standard metrics exist
  const sampleRow = rows.find(r => Object.keys(r).some(k => k.startsWith('model_')));
  if (sampleRow) {
    // Check for any keys that might indicate custom metrics
    // Look at first model and check what metrics are available
    const firstModelKey = Object.keys(sampleRow).find(k => k.startsWith('model_'));
    if (firstModelKey) {
      // Default sources
      sources.set('meteor', { name: 'METEOR (Auto)', key: 'meteor', type: 'score' });
      sources.set('tool_acc', { name: 'Tool Accuracy', key: 'tool_acc', type: 'accuracy' });
      
      // Check for deepseek-v3.2-guide or similar guide metrics
      // We need to check the original evaluate data
      // Since we flattened it, we need to check if there are any special metric keys
      
      // For guide-type metrics, they would have been in evaluate.metrics
      // and would have scores like "deepseek-v3.2-guide.score"
      // We need to track this during conversion
    }
  }
  
  return Array.from(sources.values());
}

// Compare two models head-to-head
function compareModels(modelA: string, modelB: string, rows: ParsedRow[]) {
  const suffixA = modelA.replace(/[^a-zA-Z0-9]/g, '_');
  const suffixB = modelB.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Filter rows where both models participated AND at least one has a non-zero score
  const validRows = rows.filter(row => {
    const hasA = row[`model_${suffixA}`] !== undefined;
    const hasB = row[`model_${suffixB}`] !== undefined;
    if (!hasA || !hasB) return false;
    const scoreA = parseFloat(row[`score_${suffixA}`] || '0');
    const scoreB = parseFloat(row[`score_${suffixB}`] || '0');
    return scoreA > 0 || scoreB > 0; // At least one has a valid score
  });
  
  if (validRows.length === 0) {
    return null;
  }
  
  let aWins = 0, bWins = 0, ties = 0;
  let aPass = 0, bPass = 0;
  let aTotalScore = 0, bTotalScore = 0;
  let aScoredCount = 0, bScoredCount = 0;
  
  for (const row of validRows) {
    const scoreA = parseFloat(row[`score_${suffixA}`] || '0');
    const scoreB = parseFloat(row[`score_${suffixB}`] || '0');
    
    // Handle comparison: if tied, both get a "win" for win rate calculation
    // This means tied samples count toward both models' win rates
    if (scoreA > scoreB) {
      aWins++;
    } else if (scoreB > scoreA) {
      bWins++;
    } else {
      // Tie - both models performed equally well
      ties++;
    }
    
    if (row[`accuracy_${suffixA}`] === 1) aPass++;
    if (row[`accuracy_${suffixB}`] === 1) bPass++;
    
    // Only count score in average if it's non-zero
    if (scoreA > 0) { aTotalScore += scoreA; aScoredCount++; }
    if (scoreB > 0) { bTotalScore += scoreB; bScoredCount++; }
  }
  
  const total = validRows.length;
  
  return {
    totalSamples: total,
    modelA: { name: modelA, suffix: suffixA },
    modelB: { name: modelB, suffix: suffixB },
    winRateA: aWins / total,
    winRateB: bWins / total,
    tieRate: ties / total,
    passRateA: aPass / total,
    passRateB: bPass / total,
    avgScoreA: aScoredCount > 0 ? aTotalScore / aScoredCount : 0,
    avgScoreB: bScoredCount > 0 ? bTotalScore / bScoredCount : 0
  };
}

// Load all datasets on startup
loadAllDatasets();

// API Routes

// Get list of datasets
app.get('/api/datasets', (req, res) => {
  const list = Object.entries(datasets).map(([name, info]) => ({
    name,
    filename: info.filename,
    rowCount: info.rowCount
  }));
  res.json(list);
});

// Get models (optionally filtered by dataset)
app.get('/api/models', (req, res) => {
  const datasetFilter = (req.query.dataset as string) || 'all';
  const rows = getRows(datasetFilter);
  const models = extractModels(rows);
  res.json(models);
});

// Get metric sources for a dataset
app.get('/api/metric-sources', (req, res) => {
  const datasetFilter = (req.query.dataset as string) || 'all';
  
  if (datasetFilter === 'all') {
    // Aggregate sources from all datasets
    const allSources = new Map<string, MetricSource>();
    Object.values(datasets).forEach(ds => {
      ds.metricSources.forEach(source => {
        if (!allSources.has(source.key)) {
          allSources.set(source.key, source);
        }
      });
    });
    res.json(Array.from(allSources.values()));
  } else {
    const ds = datasets[datasetFilter];
    res.json(ds?.metricSources || []);
  }
});

// Compare two models
app.get('/api/compare', (req, res) => {
  const { modelA, modelB, dataset } = req.query;
  
  if (!modelA || !modelB) {
    return res.status(400).json({ error: 'modelA and modelB are required' });
  }
  
  const datasetFilter = (dataset as string) || 'all';
  const rows = getRows(datasetFilter);
  const result = compareModels(modelA as string, modelB as string, rows);
  
  if (!result) {
    return res.json({ 
      error: 'No common samples found for these models in the selected dataset' 
    });
  }
  
  res.json(result);
});

// Schema summary - supports metric source selection
app.get('/api/schema-summary', (req, res) => {
  const datasetFilter = (req.query.dataset as string) || 'all';
  const sourceKey = (req.query.source as string) || 'meteor'; // Default to meteor
  const rows = getRows(datasetFilter);

  const totalRows = rows.length;
  const datasetCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  let maxTurn = 0;
  let minTurn = Infinity;

  const modelStats: Record<string, {
    passCount: number;
    totalScore: number;
    count: number;
    name: string;
    totalMatchAcc: number;
    winCount: number;
    scoredCount: number;
  }> = {};

  let validScoredRows = 0;

  rows.forEach(row => {
    datasetCounts[row.dataset] = (datasetCounts[row.dataset] || 0) + 1;
    languageCounts[row.language] = (languageCounts[row.language] || 0) + 1;
    maxTurn = Math.max(maxTurn, row.turn);
    minTurn = Math.min(minTurn, row.turn);

    const rowScores: { suffix: string; score: number }[] = [];
    let hasAnyScore = false;

    Object.keys(row).forEach(key => {
      if (key.startsWith('model_')) {
        const suffix = key.substring(6);
        const modelName = row[key];
        if (!modelStats[suffix]) {
          modelStats[suffix] = {
            passCount: 0,
            totalScore: 0,
            totalMatchAcc: 0,
            count: 0,
            winCount: 0,
            scoredCount: 0,
            name: modelName
          };
        }
        modelStats[suffix].count++;
        if (row[`accuracy_${suffix}`] === 1) {
          modelStats[suffix].passCount++;
        }

        // Get score from the selected source
        const metricValue = row[`metric_${sourceKey}_${suffix}`];
        // If source doesn't exist for this row, use 0 (not fallback to METEOR)
        const score = typeof metricValue === 'number' ? metricValue : 0;

        if (score > 0) {
          modelStats[suffix].totalScore += score;
          modelStats[suffix].scoredCount++;
          hasAnyScore = true;
        }
        if (row[`match_acc_${suffix}`]) {
          modelStats[suffix].totalMatchAcc += parseFloat(row[`match_acc_${suffix}`]);
        }
        rowScores.push({ suffix, score });
      }
    });

    // Count wins - all models with max score get a win (handles ties)
    const maxScore = Math.max(...rowScores.map(s => s.score), 0);
    if (maxScore > 0 && hasAnyScore) {
      validScoredRows++;
      const winners = rowScores.filter(s => s.score === maxScore);
      winners.forEach(w => modelStats[w.suffix].winCount++);
    }
  });

  const modelsSummary = Object.keys(modelStats).map(suffix => {
    const stats = modelStats[suffix];
    return {
      suffix,
      name: stats.name,
      passRate: stats.count > 0 ? (stats.passCount / stats.count) : 0,
      avgScore: stats.scoredCount > 0 ? (stats.totalScore / stats.scoredCount) : 0,
      avgMatchAcc: stats.count > 0 ? (stats.totalMatchAcc / stats.count) : 0,
      winRate: validScoredRows > 0 ? (stats.winCount / validScoredRows) : 0,
    };
  });

  res.json({
    totalRows,
    validScoredRows,
    currentSource: sourceKey,
    datasetDistribution: datasetCounts,
    languageDistribution: languageCounts,
    turnRange: { min: minTurn === Infinity ? 0 : minTurn, max: maxTurn },
    models: modelsSummary
  });
});

// Get rows with pagination
app.get('/api/rows', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const datasetFilter = (req.query.dataset as string) || 'all';
  
  const rows = getRows(datasetFilter);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  const paginatedData = rows.slice(start, end).map(row => {
    return {
      ...row,
      full_conversation: JSON.parse(row.full_conversation || '[]'),
      conv_metadata: JSON.parse(row.conv_metadata || '{}')
    };
  });

  res.json({
    data: paginatedData,
    total: rows.length,
    page,
    pageSize,
    totalPages: Math.ceil(rows.length / pageSize)
  });
});

// Get single row
app.get('/api/rows/:id', (req, res) => {
  const allRows = getRows('all');
  const row = allRows.find(r => r.id === req.params.id);
  if (row) {
    res.json({
      ...row,
      full_conversation: JSON.parse(row.full_conversation || '[]'),
      conv_metadata: JSON.parse(row.conv_metadata || '{}')
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Serve static HTML
app.use(express.static('.'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${Object.keys(datasets).length} datasets`);
});
