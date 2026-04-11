import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  Database, 
  Upload, 
  Check, 
  FileJson,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface DatasetInfo {
  name: string;
  filename: string;
  rowCount: number;
}

interface DatasetPanelProps {
  selectedDatasets: string[];
  onDatasetsChange: (datasets: string[]) => void;
  isDark?: boolean;
}

export function DatasetPanel({
  selectedDatasets,
  onDatasetsChange,
  isDark = false,
}: DatasetPanelProps) {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/datasets');
      const data = await res.json();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.jsonl')) {
      alert('Only .jsonl files are allowed');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      await fetchDatasets();
      
      const result = await res.json();
      if (result.datasetName && !selectedDatasets.includes(result.datasetName)) {
        onDatasetsChange([...selectedDatasets, result.datasetName]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete dataset "${name}"?`)) return;
    
    try {
      const res = await fetch(`/api/datasets/${name}`, { method: 'DELETE' });
      if (res.ok) {
        onDatasetsChange(selectedDatasets.filter(d => d !== name));
        await fetchDatasets();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const toggleDataset = (name: string) => {
    if (selectedDatasets.includes(name)) {
      onDatasetsChange(selectedDatasets.filter(d => d !== name));
    } else {
      onDatasetsChange([...selectedDatasets, name]);
    }
  };

  const selectAll = () => {
    onDatasetsChange(datasets.map(d => d.name));
  };

  const clearAll = () => {
    onDatasetsChange([]);
  };

  const themeClasses = {
    text: isDark ? 'text-neutral-100' : 'text-neutral-900',
    textSecondary: isDark ? 'text-neutral-400' : 'text-neutral-500',
    textMuted: isDark ? 'text-neutral-500' : 'text-neutral-400',
    bg: isDark ? 'bg-neutral-800' : 'bg-white',
    bgSecondary: isDark ? 'bg-neutral-700' : 'bg-neutral-50',
    border: isDark ? 'border-neutral-600' : 'border-neutral-200',
    hover: isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-50',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={clsx("text-sm font-semibold flex items-center gap-2", themeClasses.text)}>
          <Database className="w-4 h-4" />
          Datasets
        </h3>
        <button
          onClick={fetchDatasets}
          disabled={loading}
          className={themeClasses.textMuted}
          title="Refresh"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={clsx(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          dragOver 
            ? "border-indigo-500 bg-indigo-500/10" 
            : clsx(themeClasses.border, isDark ? "hover:border-neutral-500" : "hover:border-neutral-400")
        )}
      >
        <Upload className={clsx("w-6 h-6 mx-auto mb-2", themeClasses.textMuted)} />
        <p className={clsx("text-xs mb-2", themeClasses.textSecondary)}>
          Drop .jsonl file here or click to upload
        </p>
        <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors">
          <FileJson className="w-3.5 h-3.5" />
          Select File
          <input
            type="file"
            accept=".jsonl"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
        {uploading && (
          <p className="text-xs text-indigo-600 mt-2">Uploading...</p>
        )}
      </div>

      {/* Selection Actions */}
      {datasets.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className={themeClasses.textSecondary}>
            {selectedDatasets.length} of {datasets.length} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-indigo-600 hover:text-indigo-700"
            >
              All
            </button>
            <span className={themeClasses.textMuted}>|</span>
            <button
              onClick={clearAll}
              className={themeClasses.textSecondary}
            >
              None
            </button>
          </div>
        </div>
      )}

      {/* Dataset List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {datasets.length === 0 ? (
          <p className={clsx("text-sm text-center py-4", themeClasses.textMuted)}>
            No datasets available
          </p>
        ) : (
          datasets.map((dataset) => {
            const isSelected = selectedDatasets.includes(dataset.name);
            return (
              <div
                key={dataset.name}
                onClick={() => toggleDataset(dataset.name)}
                className={clsx(
                  "group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border",
                  isSelected
                    ? clsx(
                        isDark ? "bg-indigo-500/20 border-indigo-500/50" : "bg-indigo-50 border-indigo-200"
                      )
                    : clsx(themeClasses.bg, themeClasses.border, themeClasses.hover)
                )}
              >
                <div className={clsx(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-indigo-600 border-indigo-600"
                    : themeClasses.border
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-medium truncate", themeClasses.text)}>
                    {dataset.name}
                  </p>
                  <p className={clsx("text-xs", themeClasses.textMuted)}>
                    {dataset.rowCount.toLocaleString()} rows
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(dataset.name, e)}
                  className={clsx(
                    "opacity-0 group-hover:opacity-100 p-1 transition-all",
                    isDark ? "text-neutral-500 hover:text-red-400" : "text-neutral-400 hover:text-red-500"
                  )}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
