import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all dataset files
const datasetDir = path.join(__dirname, 'dataset');
const files = fs.readdirSync(datasetDir).filter(f => f.endsWith('.jsonl'));

const allData = {
  datasets: [],
  allRows: []
};

for (const file of files) {
  console.log(`Processing ${file}...`);
  const content = fs.readFileSync(path.join(datasetDir, file), 'utf-8');
  const lines = content.trim().split('\n');
  const rows = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      const evalTurns = item.dialog?.filter(t => t.role === 'assistant' && t.evaluate) || [];
      
      for (const turn of evalTurns) {
        const row = {
          id: `${item.id}_turn_${turn.turn_index}`,
          session_id: item.id,
          turn: turn.turn_index,
          language: item.meta?.chat_lang || 'en',
          dataset: file.replace('.jsonl', ''),
          full_conversation: item.dialog,
          conv_metadata: {
            type: item.type,
            tools: Object.keys(item.tools || {}),
            tags: turn.tags || []
          },
          ground_truth: turn.content
        };
        
        if (turn.evaluate) {
          for (const [modelName, output] of Object.entries(turn.evaluate)) {
            const suffix = modelName.replace(/[^a-zA-Z0-9]/g, '_');
            row[`model_${suffix}`] = modelName;
            row[`conversation_${suffix}`] = output.content;
            row[`accuracy_${suffix}`] = output.metrics?.tool_acc?.score === 1.0 ? 1 : 0;
            row[`score_${suffix}`] = output.metrics?.meteor?.score?.toFixed(3) || '0';
            row[`match_acc_${suffix}`] = output.metrics?.match_acc?.score?.toFixed(3) || '0';
          }
        }
        
        rows.push(row);
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  }
  
  allData.datasets.push({
    name: file.replace('.jsonl', ''),
    rowCount: rows.length
  });
  allData.allRows.push(...rows);
}

console.log(`\nTotal: ${allData.allRows.length} rows from ${allData.datasets.length} datasets`);

// Generate static HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dataset Viewer - Static</title>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  </style>
</head>
<body class="bg-neutral-50 text-neutral-900 font-sans">
  <div id="root"></div>
  <script>
    window.STATIC_DATA = ${JSON.stringify(allData)};
  </script>
  <script type="text/babel">
    const { useState, useEffect } = React;

    function ControlBar({ datasets, models, selectedDataset, setSelectedDataset, modelA, setModelA, modelB, setModelB }) {
      return (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-500">Dataset:</label>
              <select value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)}
                className="px-3 py-1.5 rounded border border-neutral-200 text-sm">
                <option value="all">All Datasets</option>
                {datasets.map(d => <option key={d.name} value={d.name}>{d.name} ({d.rowCount})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-500">Compare:</label>
              <select value={modelA} onChange={e => setModelA(e.target.value)} className="px-3 py-1.5 rounded border text-sm">
                <option value="">Select Model A</option>
                {models.map(m => <option key={m.suffix} value={m.name}>{m.name}</option>)}
              </select>
              <span className="text-neutral-400">vs</span>
              <select value={modelB} onChange={e => setModelB(e.target.value)} className="px-3 py-1.5 rounded border text-sm">
                <option value="">Select Model B</option>
                {models.map(m => <option key={m.suffix} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      );
    }

    function ComparisonCard({ comparison }) {
      if (!comparison) return <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-sm text-neutral-400">Select two models to compare</p></div>;
      if (comparison.error) return <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-sm text-red-500">{comparison.error}</p></div>;
      const { modelA, modelB, totalSamples, winRateA, winRateB, tieRate, passRateA, passRateB, avgScoreA, avgScoreB } = comparison;
      return (
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium uppercase text-neutral-500 mb-2">Head-to-Head Comparison</h3>
          <p className="text-xs text-neutral-400 mb-4">{totalSamples} common samples</p>
          <div className="mb-4">
            <div className="text-xs text-neutral-500 mb-2">Win Rate (METEOR)</div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-indigo-500" style={{width: winRateA * 100 + '%'}} />
              <div className="bg-slate-300" style={{width: tieRate * 100 + '%'}} />
              <div className="bg-amber-500" style={{width: winRateB * 100 + '%'}} />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-indigo-600">{modelA.name}: {(winRateA*100).toFixed(1)}%</span>
              <span className="text-slate-500">Tie: {(tieRate*100).toFixed(1)}%</span>
              <span className="text-amber-600">{modelB.name}: {(winRateB*100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-neutral-600">{modelA.name} Pass:</span> <span className="font-mono">{(passRateA*100).toFixed(1)}%</span></div>
            <div><span className="text-neutral-600">{modelB.name} Pass:</span> <span className="font-mono">{(passRateB*100).toFixed(1)}%</span></div>
            <div><span className="text-neutral-600">{modelA.name} METEOR:</span> <span className="font-mono">{avgScoreA.toFixed(3)}</span></div>
            <div><span className="text-neutral-600">{modelB.name} METEOR:</span> <span className="font-mono">{avgScoreB.toFixed(3)}</span></div>
          </div>
        </div>
      );
    }

    function SummaryCards({ summary }) {
      if (!summary) return <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-neutral-100 rounded-xl" />)}</div>;
      const sortedByPass = [...summary.models].sort((a, b) => b.passRate - a.passRate);
      const sortedByWin = [...summary.models].sort((a, b) => b.winRate - a.winRate);
      const sortedByScore = [...summary.models].sort((a, b) => b.avgScore - a.avgScore);
      const maxScore = Math.max(...summary.models.map(m => m.avgScore), 0.001);
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="text-sm font-medium uppercase text-neutral-500 mb-4">Accuracy (Pass)</h3>
            <div className="space-y-3 max-h-[250px] overflow-auto">
              {sortedByPass.map(m => (
                <div key={m.suffix}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{m.name}</span>
                    <span className="font-mono">{(m.passRate*100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={'h-full ' + (m.passRate>=0.8?'bg-emerald-500':m.passRate>=0.5?'bg-amber-500':'bg-red-500')} style={{width: m.passRate*100 + '%'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="text-sm font-medium uppercase text-neutral-500 mb-4">Win Rate</h3>
            <div className="space-y-3 max-h-[250px] overflow-auto">
              {sortedByWin.map(m => (
                <div key={m.suffix}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{m.name}</span>
                    <span className="font-mono">{(m.winRate*100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{width: m.winRate*100 + '%'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="text-sm font-medium uppercase text-neutral-500 mb-4">METEOR Score</h3>
            <div className="space-y-3 max-h-[250px] overflow-auto">
              {sortedByScore.map(m => (
                <div key={m.suffix}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{m.name}</span>
                    <span className="font-mono">{m.avgScore.toFixed(3)}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{width: (m.avgScore/maxScore)*100 + '%'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    function DataTable({ data, models, onRowClick }) {
      if (!data?.length) return <div className="p-8 text-center text-neutral-500">No data</div>;
      const getContext = (conv) => {
        if (!conv?.length) return 'No context';
        for (let i = conv.length-1; i>=0; i--) if (conv[i].role==='user') return conv[i].content;
        return conv[conv.length-1]?.content;
      };
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-neutral-50 border-b text-xs uppercase text-neutral-500">
                <th className="p-4 w-56">Metadata</th>
                <th className="p-4 w-[300px]">Context</th>
                {models.map(m => <th key={m.suffix} className="p-4 w-[400px]"><div className="truncate">{m.name}</div></th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(row => (
                <tr key={row.id} className="hover:bg-neutral-50 cursor-pointer" onClick={()=>onRowClick(row)}>
                  <td className="p-4 align-top">
                    <div className="font-mono text-xs truncate">{row.id}</div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 break-all">{row.dataset}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 uppercase">{row.language}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600">Turn {row.turn}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="bg-neutral-50 border rounded-lg p-3">
                      <div className="text-xs text-neutral-500 mb-1">Last User Message</div>
                      <div className="text-sm text-neutral-700 line-clamp-3">{getContext(row.full_conversation)}</div>
                    </div>
                  </td>
                  {models.map(model => {
                    const s = model.suffix;
                    const isPass = row['accuracy_' + s] === 1;
                    const score = row['score_' + s];
                    const resp = row['conversation_' + s];
                    return (
                      <td key={s} className="p-4 align-top">
                        <div className={'border rounded-lg p-3 h-full ' + (isPass?'bg-emerald-50/30 border-emerald-100':'bg-red-50/30 border-red-100')}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={'text-xs font-medium ' + (isPass?'text-emerald-700':'text-red-700')}>{isPass?'✓ Pass':'✗ Fail'}</span>
                            {score && <span className="text-xs font-mono bg-white px-1.5 rounded border">M:{score}</span>}
                          </div>
                          <div className="text-sm text-neutral-700 line-clamp-4">{resp || <em className="text-neutral-400">No response</em>}</div>
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

    function processSummary(rows) {
      const datasetCounts = {}, languageCounts = {}, modelStats = {};
      let maxTurn = 0, minTurn = Infinity;
      let validScoredRows = 0;
      
      rows.forEach(row => {
        datasetCounts[row.dataset] = (datasetCounts[row.dataset] || 0) + 1;
        languageCounts[row.language] = (languageCounts[row.language] || 0) + 1;
        maxTurn = Math.max(maxTurn, row.turn);
        minTurn = Math.min(minTurn, row.turn);
        
        // Collect all scores for this row
        const rowScores = [];
        Object.keys(row).forEach(key => {
          if (key.startsWith('model_')) {
            const suffix = key.substring(6);
            const modelName = row[key];
            if (!modelStats[suffix]) modelStats[suffix] = { passCount: 0, totalScore: 0, count: 0, winCount: 0, scoredCount: 0, name: modelName };
            modelStats[suffix].count++;
            if (row['accuracy_' + suffix] === 1) modelStats[suffix].passCount++;
            const score = parseFloat(row['score_' + suffix] || '0');
            if (score > 0) {
              modelStats[suffix].totalScore += score;
              modelStats[suffix].scoredCount++;
            }
            rowScores.push({ suffix, score });
          }
        });
        
        // Count wins - all models with max score get a win (handles ties)
        const maxScore = Math.max(...rowScores.map(s => s.score), 0);
        if (maxScore > 0) {
          validScoredRows++;
          const winners = rowScores.filter(s => s.score === maxScore);
          winners.forEach(w => modelStats[w.suffix].winCount++);
        }
      });
      return {
        totalRows: rows.length,
        scoredRows: validScoredRows,
        datasetDistribution: datasetCounts,
        languageDistribution: languageCounts,
        turnRange: { min: minTurn === Infinity ? 0 : minTurn, max: maxTurn },
        models: Object.keys(modelStats).map(suffix => ({
          suffix, name: modelStats[suffix].name,
          passRate: modelStats[suffix].count > 0 ? (modelStats[suffix].passCount / modelStats[suffix].count) : 0,
          avgScore: modelStats[suffix].scoredCount > 0 ? (modelStats[suffix].totalScore / modelStats[suffix].scoredCount) : 0,
          winRate: validScoredRows > 0 ? (modelStats[suffix].winCount / validScoredRows) : 0,
        }))
      };
    }

    function extractModels(rows) {
      const modelMap = new Map();
      rows.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key.startsWith('model_')) {
            const suffix = key.substring(6);
            const name = row[key];
            if (!modelMap.has(suffix)) modelMap.set(suffix, name);
          }
        });
      });
      return Array.from(modelMap.entries()).map(([suffix, name]) => ({ suffix, name }));
    }

    function compareModels(modelA, modelB, rows) {
      const suffixA = modelA.replace(/[^a-zA-Z0-9]/g, '_');
      const suffixB = modelB.replace(/[^a-zA-Z0-9]/g, '_');
      // Filter rows where both models exist AND at least one has a non-zero score
      const validRows = rows.filter(row => {
        const hasA = row['model_' + suffixA] !== undefined;
        const hasB = row['model_' + suffixB] !== undefined;
        if (!hasA || !hasB) return false;
        const scoreA = parseFloat(row['score_' + suffixA] || '0');
        const scoreB = parseFloat(row['score_' + suffixB] || '0');
        return scoreA > 0 || scoreB > 0; // At least one has a valid score
      });
      if (validRows.length === 0) return { error: 'No common samples with valid scores' };
      
      let aWins = 0, bWins = 0, ties = 0, aPass = 0, bPass = 0, aTotalScore = 0, bTotalScore = 0;
      let aScoredCount = 0, bScoredCount = 0;
      
      validRows.forEach(row => {
        const scoreA = parseFloat(row['score_' + suffixA] || '0');
        const scoreB = parseFloat(row['score_' + suffixB] || '0');
        if (scoreA > scoreB) aWins++; 
        else if (scoreB > scoreA) bWins++; 
        else ties++;
        
        if (row['accuracy_' + suffixA] === 1) aPass++;
        if (row['accuracy_' + suffixB] === 1) bPass++;
        
        // Only count score in average if it's non-zero
        if (scoreA > 0) { aTotalScore += scoreA; aScoredCount++; }
        if (scoreB > 0) { bTotalScore += scoreB; bScoredCount++; }
      });
      
      return {
        totalSamples: validRows.length,
        modelA: { name: modelA }, modelB: { name: modelB },
        winRateA: aWins / validRows.length, 
        winRateB: bWins / validRows.length, 
        tieRate: ties / validRows.length,
        passRateA: aPass / validRows.length, 
        passRateB: bPass / validRows.length,
        avgScoreA: aScoredCount > 0 ? aTotalScore / aScoredCount : 0, 
        avgScoreB: bScoredCount > 0 ? bTotalScore / bScoredCount : 0
      };
    }

    function App() {
      const [summary, setSummary] = useState(null);
      const [data, setData] = useState([]);
      const [page, setPage] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [datasets, setDatasets] = useState([]);
      const [models, setModels] = useState([]);
      const [selectedDataset, setSelectedDataset] = useState('all');
      const [modelA, setModelA] = useState('');
      const [modelB, setModelB] = useState('');
      const [comparison, setComparison] = useState(null);
      const rawData = window.STATIC_DATA;

      useEffect(() => { setDatasets(rawData.datasets); }, []);

      useEffect(() => {
        const rows = selectedDataset === 'all' ? rawData.allRows : rawData.allRows.filter(r => r.dataset === selectedDataset);
        setSummary(processSummary(rows));
        setModels(extractModels(rows));
        setPage(1);
        setData(rows.slice(0, 20));
        setTotalPages(Math.ceil(rows.length / 20));
      }, [selectedDataset]);

      useEffect(() => {
        const rows = selectedDataset === 'all' ? rawData.allRows : rawData.allRows.filter(r => r.dataset === selectedDataset);
        setData(rows.slice((page-1)*20, page*20));
      }, [page, selectedDataset]);

      useEffect(() => {
        if (modelA && modelB) {
          const rows = selectedDataset === 'all' ? rawData.allRows : rawData.allRows.filter(r => r.dataset === selectedDataset);
          setComparison(compareModels(modelA, modelB, rows));
        } else setComparison(null);
      }, [modelA, modelB, selectedDataset]);

      return (
        <div className="min-h-screen">
          <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <h1 className="text-xl font-semibold">Dataset Viewer</h1>
              <div className="text-sm text-neutral-500">{summary ? summary.totalRows.toLocaleString() + ' rows' : 'Loading...'}</div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto p-6 space-y-4">
            <ControlBar datasets={datasets} models={models} selectedDataset={selectedDataset} setSelectedDataset={setSelectedDataset}
              modelA={modelA} setModelA={setModelA} modelB={modelB} setModelB={setModelB} />
            {(modelA && modelB) && <ComparisonCard comparison={comparison} />}
            <SummaryCards summary={summary} />
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-neutral-50/50">
                <h2 className="font-medium">Dataset Rows</h2>
                <div className="flex items-center gap-2 text-sm">
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 rounded border hover:bg-neutral-50 disabled:opacity-50">Previous</button>
                  <span className="text-neutral-500">Page {page} of {totalPages}</span>
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 rounded border hover:bg-neutral-50 disabled:opacity-50">Next</button>
                </div>
              </div>
              <DataTable data={data} models={summary?.models||[]} onRowClick={()=>{}} />
            </div>
          </main>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'viewer-static.html'), html);
console.log('\nStatic HTML generated: viewer-static.html');
console.log('You can open this file directly in a browser or share it with others.');
