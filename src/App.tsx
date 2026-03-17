/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { DataTable } from './components/DataTable';
import { ConversationDrawer } from './components/ConversationDrawer';
import { Sidebar } from './components/Sidebar';
import { EvaluationView } from './components/EvaluationView';
import { useFilters } from './hooks/useFilters';
import { SidebarModule } from './types/filters';
import { Loader2, Database, BarChart3, Moon, Sun, Github, BookOpen, Keyboard } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  const [summary, setSummary] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [pageSize, setPageSize] = useState(20);

  // Search state (applied explicitly via search button)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  // Sidebar state
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState<SidebarModule>('datasets');
  
  // Available options from data
  const [availableModels, setAvailableModels] = useState<Array<{ suffix: string; name: string }>>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [availableMetricSources, setAvailableMetricSources] = useState<string[]>([]);

  // Dark mode state
  const [isDark, setIsDark] = useState(false);

  // Filters
  const {
    filters,
    setModels,
    setLanguages,
    setDatasets,
    setMetricSource,
    setScoreRange,
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
    getMetricConfig,
  } = useFilters(availableMetricSources);

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (savedTheme === 'auto' || !savedTheme) {
        const newDark = mediaQuery.matches;
        setIsDark(newDark);
        document.documentElement.classList.toggle('dark', newDark);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchMetricSources();
  }, []);

  // Fetch data when page or pageSize changes
  useEffect(() => {
    fetchData(page, pageSize);
  }, [page, pageSize]);

  // Fetch data when filters change (and reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchData(1, pageSize);
  }, [filters.models, filters.languages, filters.datasets, filters.metricSource]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setPanelCollapsed(prev => !prev);
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setActiveModule('search');
        setPanelCollapsed(false);
      }
      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        setPage(p => Math.max(1, p - 1));
      }
      if (e.key === 'ArrowRight' && e.ctrlKey) {
        setPage(p => Math.min(totalPages, p + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  const fetchMetricSources = async () => {
    try {
      const res = await fetch('/api/metric-sources');
      const sources = await res.json();
      setAvailableMetricSources(sources.map((s: any) => s.key));
    } catch (error) {
      console.error('Failed to fetch metric sources:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.metricSource) {
        params.append('source', filters.metricSource);
      }
      const res = await fetch(`/api/schema-summary?${params}`);
      const json = await res.json();
      setSummary(json);
      
      if (json.models) {
        setAvailableModels(json.models.map((m: any) => ({ suffix: m.suffix, name: m.name })));
      }
      if (json.languageDistribution) {
        setAvailableLanguages(Object.keys(json.languageDistribution));
      }
      if (json.datasetDistribution) {
        setAvailableDatasets(Object.keys(json.datasetDistribution));
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchData = async (pageNum: number, size: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        page_size: String(size),
      });

      if (filters.models.length > 0) {
        params.append('models', filters.models.join(','));
      }
      if (filters.languages.length > 0) {
        params.append('languages', filters.languages.join(','));
      }
      if (filters.datasets.length > 0) {
        params.append('datasets', filters.datasets.join(','));
      }
      if (appliedSearchQuery.trim()) {
        params.append('search', appliedSearchQuery.trim());
      }

      const url = `/api/rows?${params}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json.data);
      setTotalPages(json.totalPages);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // Render main content based on active module
  const renderMainContent = () => {
    if (activeModule === 'evaluation') {
      return (
        <div className="flex-1 p-6 overflow-auto">
          <EvaluationView summary={summary} availableModels={availableModels} isDark={isDark} />
        </div>
      );
    }

    return (
      <>
        {/* Table Container */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className={clsx(
            "h-full border rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors duration-200",
            isDark 
              ? "bg-neutral-800 border-neutral-700" 
              : "bg-white border-neutral-200"
          )}>
            {/* Table Header */}
            <div className={clsx(
              "p-4 border-b flex justify-between items-center shrink-0 transition-colors duration-200",
              isDark 
                ? "border-neutral-700 bg-neutral-800/50" 
                : "border-neutral-200 bg-neutral-50/50"
            )}>
              <div className="flex items-center gap-4">
                <h2 className={clsx("font-medium", isDark ? "text-neutral-100" : "text-neutral-900")}>
                  Dataset Rows
                </h2>
                {hasActiveFilters && (
                  <span className="text-sm text-indigo-600 font-medium">
                    Filters active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className={clsx(
                    "px-3 py-1.5 rounded-md border transition-colors",
                    isDark 
                      ? "border-neutral-600 hover:bg-neutral-700 disabled:opacity-50" 
                      : "border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
                  )}
                >
                  Previous
                </button>
                <span className={isDark ? "text-neutral-400" : "text-neutral-500"}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className={clsx(
                    "px-3 py-1.5 rounded-md border transition-colors",
                    isDark 
                      ? "border-neutral-600 hover:bg-neutral-700 disabled:opacity-50" 
                      : "border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
                  )}
                >
                  Next
                </button>
              </div>
            </div>
            
            {/* Table */}
            <div className="flex-1 overflow-auto relative">
              {loading && (
                <div className={clsx(
                  "absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 transition-colors duration-200",
                  isDark ? "bg-neutral-900/80" : "bg-white/80"
                )}>
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                </div>
              )}
              <DataTable 
                data={data} 
                models={summary?.models || []} 
                onRowClick={setSelectedRow}
                isDark={isDark}
              />
            </div>

            {/* Footer hint */}
            <div className={clsx(
              "px-4 py-2 border-t text-xs shrink-0 transition-colors duration-200",
              isDark 
                ? "border-neutral-700 bg-neutral-800/50 text-neutral-500" 
                : "border-neutral-200 bg-neutral-50/50 text-neutral-400"
            )}>
              Press <kbd className={clsx(
                "px-1.5 py-0.5 rounded font-mono",
                isDark ? "bg-neutral-700" : "bg-white"
              )}>[</kbd> to toggle panel
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={clsx(
      "min-h-screen font-sans flex flex-col transition-colors duration-200",
      isDark 
        ? "bg-neutral-900 text-neutral-100" 
        : "bg-neutral-50 text-neutral-900"
    )}>
      {/* Top Navigation - Simplified */}
      <nav className={clsx(
        "border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0 transition-colors duration-200",
        isDark 
          ? "border-neutral-700 bg-neutral-800" 
          : "border-neutral-200 bg-white"
      )}>
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isDark ? "bg-indigo-500/20" : "bg-indigo-50"
          )}>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <h1 className={clsx("font-semibold text-lg tracking-tight", isDark ? "text-neutral-100" : "text-neutral-800")}>
            Dataset Viewer
          </h1>
        </div>

        {/* View Toggle */}
        <div className={clsx(
          "flex items-center gap-1 p-1 rounded-lg",
          isDark ? "bg-neutral-700" : "bg-neutral-100"
        )}>
          <button
            onClick={() => setActiveModule('datasets')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeModule !== 'evaluation'
                ? clsx(
                    "shadow-sm",
                    isDark ? "bg-neutral-600 text-neutral-100" : "bg-white text-neutral-900"
                  )
                : isDark ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <Database className="w-4 h-4" />
            Dataset
          </button>
          <button
            onClick={() => setActiveModule('evaluation')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeModule === 'evaluation'
                ? clsx(
                    "shadow-sm",
                    isDark ? "bg-neutral-600 text-neutral-100" : "bg-white text-neutral-900"
                  )
                : isDark ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Evaluation
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => {
              const newDark = !isDark;
              setIsDark(newDark);
              document.documentElement.classList.toggle('dark', newDark);
              localStorage.setItem('theme', newDark ? 'dark' : 'light');
            }}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" 
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setActiveModule('settings')}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" 
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Documentation */}
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" 
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
            title="Documentation"
          >
            <BookOpen className="w-4 h-4" />
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" 
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Stats Badge */}
          <div className={clsx(
            "ml-2 px-3 py-1.5 rounded-lg text-sm font-medium",
            isDark 
              ? "bg-neutral-700 text-neutral-300" 
              : "bg-neutral-100 text-neutral-600"
          )}>
            {summary ? `${summary.totalRows?.toLocaleString() || 0} rows` : 'Loading...'}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className={clsx(
        "flex-1 flex overflow-hidden transition-colors duration-200",
        isDark ? "bg-neutral-900" : "bg-neutral-50"
      )}>
        {/* Sidebar */}
        <Sidebar
          panelCollapsed={panelCollapsed}
          onTogglePanel={() => setPanelCollapsed(!panelCollapsed)}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          filters={filters}
          onFiltersChange={{
            setModels,
            setLanguages,
            setDatasets,
            setMetricSource,
            setScoreRange,
            setSearchQuery,
            resetFilters,
          }}
          onSearchApply={(query) => {
            setAppliedSearchQuery(query);
            setPage(1);
            fetchData(1, pageSize);
          }}
          appliedSearchQuery={appliedSearchQuery}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          hasActiveFilters={hasActiveFilters || appliedSearchQuery !== ''}
          availableModels={availableModels}
          availableLanguages={availableLanguages}
          availableDatasets={availableDatasets}
          availableMetricSources={availableMetricSources.length > 0 ? availableMetricSources : ['meteor']}
          summary={summary}
          isDark={isDark}
        />

        {/* Main Content */}
        <main className={clsx(
          "flex-1 flex flex-col overflow-hidden transition-colors duration-200",
          isDark ? "bg-neutral-900" : "bg-neutral-50"
        )}>
          {renderMainContent()}
        </main>
      </div>

      <AnimatePresence>
        {selectedRow && (
          <ConversationDrawer 
            row={selectedRow} 
            onClose={() => setSelectedRow(null)} 
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
