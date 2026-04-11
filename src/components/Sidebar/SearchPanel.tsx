import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchPanelProps {
  searchQuery: string;
  onSearchApply: (query: string) => void;
  isDark?: boolean;
}

export function SearchPanel({ searchQuery, onSearchApply, isDark = false }: SearchPanelProps) {
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleSearch = () => {
    onSearchApply(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onSearchApply('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-neutral-900">Search</h3>

      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in dataset..."
            className="w-full pl-9 pr-9 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      <div className="text-xs text-neutral-500 space-y-1">
        <p>Search across:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-1">
          <li>Session ID / Row ID</li>
          <li>Model names</li>
          <li>Ground truth content</li>
          <li>Model responses</li>
          <li>Full conversation text</li>
        </ul>
      </div>
    </div>
  );
}
