import React from 'react';
import { Edit3, Sparkles, Database, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';

interface EditorPanelProps {
  isDark?: boolean;
}

export function EditorPanel({ isDark = false }: EditorPanelProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-neutral-900">Dataset Editor</h3>
      
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
          <Edit3 className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-700">Coming Soon</p>
          <p className="text-xs text-neutral-500 max-w-[200px] mx-auto">
            Advanced dataset editing features are in development
          </p>
        </div>
      </div>

      {/* Future Features Preview */}
      <div className="space-y-2 pt-4 border-t border-neutral-200">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Planned Features
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50 text-neutral-600">
            <Database className="w-4 h-4" />
            <span className="text-sm">Batch editing</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50 text-neutral-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">AI-assisted labeling</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50 text-neutral-600">
            <GitBranch className="w-4 h-4" />
            <span className="text-sm">Version control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
