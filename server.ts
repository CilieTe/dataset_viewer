import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 配置上传目录
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `upload_${timestamp}_${safeName}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.jsonl')) {
      cb(null, true);
    } else {
      cb(new Error('Only .jsonl files are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

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
  isTemporary?: boolean;
  uploadedAt?: string;
}

// Store all datasets
const datasets: Record<string, DatasetInfo> = {};

// Load a single dataset file
function loadDatasetFile(filename: string, isUpload = false): { rows: ParsedRow[]; metricSources: MetricSource[] } {
  const datasetPath = isUpload 
    ? path.join(UPLOAD_DIR, filename)
    : path.join(__dirname, 'dataset', filename);
  
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
  return convertToRows(data, filename.replace('.jsonl', '').replace(/^upload_\d+_/, 'upload_'));
}

// Clean up temporary dataset
function cleanupTemporaryDataset(name: string) {
  const ds = datasets[name];
  if (ds?.isTemporary) {
    const filePath = path.join(UPLOAD_DIR, ds.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    delete datasets[name];
    console.log(`Cleaned up temporary dataset: ${name}`);
  }
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
  
  // Helper functions for parsing guide reviews
  function parseGuideResult(content: string): number {
    if (content.includes('result: yes')) return 1;      // pass
    if (content.includes('result: no')) return -1;      // error
    return 0; // irrelevant / unknown
  }

  function extractAnalysis(content: string): string {
    // 提取 analysis 部分（result 和 recommend 之间的内容）
    const lines = content.split('\n');
    const result: string[] = [];
    let started = false;
    for (const line of lines) {
      if (line.startsWith('result:')) {
        started = true;
        continue;
      }
      if (line.startsWith('recommend:')) {
        break;
      }
      if (started) {
        result.push(line);
      }
    }
    return result.join('\n').trim();
  }

  function extractRecommend(content: string): string | null {
    const match = content.match(/recommend:\s*(.+)/s);
    return match ? match[1].trim() : null;
  }

  for (const item of data) {
    // 放宽过滤条件：也支持只有 review 没有 evaluate 的数据
    const evalTurns = item.dialog.filter(t => 
      t.role === 'assistant' && 
      (t.evaluate || (t.review?.review && t.review.review.length > 0))
    );
    
    if (evalTurns.length === 0) continue;
    
    for (const turn of evalTurns) {
      // 处理 guide reviews
      const guideReviews = turn.review?.review?.filter(r => 
        r.name.includes('guide') || r.name.includes('G0') || r.name.includes('G1')
      ) || [];

      // 构建 guideReviews 数组
      const guideReviewsData = guideReviews.map(r => ({
        name: r.name,
        result: parseGuideResult(r.content),
        analysis: extractAnalysis(r.content),
        recommend: extractRecommend(r.content)
      }));

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
          tags: turn.tags || [],
          guideReviews: guideReviewsData
        })
      };
      
      row['ground_truth'] = turn.content;
      
      // 如果没有 evaluate 但有 review，创建"未知模型"
      if (!turn.evaluate && guideReviews.length > 0) {
        const suffix = 'unknown_model';
        row[`model_${suffix}`] = '未知模型';
        // 从第一个 review 的 recommend 中提取回复内容
        const firstReview = guideReviews[0];
        const recommend = extractRecommend(firstReview.content);
        row[`conversation_${suffix}`] = recommend || '（无模型回复内容）';
        
        // 为每个 guide 模型存储结果 (-1, 0, 1)
        for (const guide of guideReviews) {
          const guideKey = guide.name.replace(/[^a-zA-Z0-9]/g, '_');
          const result = parseGuideResult(guide.content);
          row[`metric_${guideKey}_${suffix}`] = result;
          
          // 发现新的 metric source
          if (!discoveredSources.has(guideKey)) {
            discoveredSources.set(guideKey, {
              name: guide.name,
              key: guideKey,
              type: 'accuracy'
            });
          }
        }
      }
      
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
    guideResults: number[];
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
            guideResults: [],
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

        // For guide sources (-1, 0, 1), collect results
        if (sourceKey.includes('G0') || sourceKey.includes('G1') || sourceKey.includes('guide')) {
          modelStats[suffix].guideResults.push(score);
        }

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
      guideResults: stats.guideResults,
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

// Upload JSONL file
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Upload failed' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    try {
      // 解析上传的文件
      const result = loadDatasetFile(req.file.filename, true);
      
      if (result.rows.length === 0) {
        fs.unlinkSync(req.file.path); // 删除空文件
        return res.json({ 
          success: false, 
          error: 'No valid data found in file' 
        });
      }
      
      // 创建临时 dataset
      const tempName = `upload_${Date.now()}`;
      datasets[tempName] = {
        filename: req.file.filename,
        rowCount: result.rows.length,
        rows: result.rows,
        metricSources: result.metricSources,
        isTemporary: true,
        uploadedAt: new Date().toISOString()
      };
      
      // 1 小时后清理临时文件
      setTimeout(() => {
        cleanupTemporaryDataset(tempName);
      }, 60 * 60 * 1000);
      
      res.json({
        success: true,
        tempDatasetName: tempName,
        rowCount: result.rows.length,
        sources: result.metricSources.map(s => s.name)
      });
      
    } catch (e) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ 
        success: false, 
        error: `Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}` 
      });
    }
  });
});

// Delete uploaded dataset
app.delete('/api/upload/:name', (req, res) => {
  cleanupTemporaryDataset(req.params.name);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${Object.keys(datasets).length} datasets`);
});
