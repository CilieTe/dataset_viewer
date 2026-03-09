/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SummaryCards } from './components/SummaryCards';
import { DataTable } from './components/DataTable';
import { ConversationDrawer } from './components/ConversationDrawer';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [summary, setSummary] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/schema-summary');
      const json = await res.json();
      setSummary(json);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchData = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rows?page=${pageNum}&page_size=${pageSize}`);
      const json = await res.json();
      setData(json.data);
      setTotalPages(json.totalPages);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Local Preference Dataset Viewer</h1>
          <div className="text-sm text-neutral-500">
            {summary ? `${summary.totalRows.toLocaleString()} rows` : 'Loading...'}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {summary ? (
          <SummaryCards summary={summary} />
        ) : (
          <div className="h-32 bg-neutral-100 animate-pulse rounded-xl" />
        )}

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
            <h2 className="font-medium">Dataset Rows</h2>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-neutral-500 mx-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
          
          <div className="relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            )}
            <DataTable 
              data={data} 
              models={summary?.models || []} 
              onRowClick={setSelectedRow}
            />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedRow && (
          <ConversationDrawer 
            row={selectedRow} 
            onClose={() => setSelectedRow(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
