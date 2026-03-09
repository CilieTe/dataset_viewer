import React, { useEffect, useState } from 'react';
import { X, User, Bot, CheckCircle2, XCircle, MessageSquare, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface ConversationDrawerProps {
  row: any;
  onClose: () => void;
}

export function ConversationDrawer({ row, onClose }: ConversationDrawerProps) {
  const [activeTab, setActiveTab] = useState('context');

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!row) return null;

  // Extract models with full suffix handling
  const models = Object.keys(row)
    .filter(key => key.startsWith('model_'))
    .map(key => {
      const suffix = key.substring(6); // Remove 'model_' prefix
      return {
        suffix,
        name: row[key],
        response: row[`conversation_${suffix}`],
        isPass: row[`accuracy_${suffix}`] === 1,
        score: row[`score_${suffix}`],
        matchAcc: row[`match_acc_${suffix}`]
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score

  // Find the ground truth response
  const groundTruth = row.ground_truth;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Conversation Details</h2>
            <div className="font-mono text-xs text-neutral-500 mt-1">{row.id}</div>
            <div className="flex gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 uppercase">
                {row.testpoint}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 uppercase">
                Turn {row.turn}
              </span>
              {row.conv_metadata?.tags?.map((tag: string, idx: number) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-200 transition-colors text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-neutral-200 flex gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('context')}
            className={clsx(
              "py-3 border-b-2 transition-colors",
              activeTab === 'context' 
                ? "border-indigo-500 text-indigo-600" 
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            Full Conversation
          </button>
          <button
            onClick={() => setActiveTab('groundtruth')}
            className={clsx(
              "py-3 border-b-2 transition-colors",
              activeTab === 'groundtruth' 
                ? "border-emerald-500 text-emerald-600" 
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            Ground Truth
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={clsx(
              "py-3 border-b-2 transition-colors",
              activeTab === 'models' 
                ? "border-indigo-500 text-indigo-600" 
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            Model Responses ({models.length})
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={clsx(
              "py-3 border-b-2 transition-colors",
              activeTab === 'metadata' 
                ? "border-indigo-500 text-indigo-600" 
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            Metadata
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30">
          {activeTab === 'context' && (
            <div className="space-y-4">
              {row.full_conversation?.map((msg: any, idx: number) => (
                <div 
                  key={idx} 
                  className={clsx(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-indigo-100 text-indigo-600" : 
                    msg.role === 'system' ? "bg-amber-100 text-amber-600" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : 
                     msg.role === 'system' ? <Terminal className="w-4 h-4" /> :
                     <Bot className="w-4 h-4" />}
                  </div>
                  <div className={clsx(
                    "max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-sm" 
                      : msg.role === 'system'
                      ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm"
                      : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm"
                  )}>
                    {msg.content}
                    {msg.evaluate && (
                      <div className="mt-2 pt-2 border-t border-neutral-200/50 text-xs text-neutral-500">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {Object.keys(msg.evaluate).length} model responses available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'groundtruth' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-semibold">Ground Truth Response</h3>
              </div>
              <div className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap bg-white rounded-lg p-4 border border-emerald-100">
                {groundTruth || <span className="text-neutral-400 italic">No ground truth available.</span>}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4">
              {models.map((model) => (
                <div key={model.suffix} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                  <div className={clsx(
                    "px-4 py-3 border-b flex items-center justify-between",
                    model.isPass ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                  )}>
                    <div className="flex items-center gap-2">
                      {model.isPass ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <h3 className="font-semibold text-neutral-900">{model.name}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {model.score && (
                        <span className="font-mono text-xs font-medium text-neutral-500 bg-white px-2 py-1 rounded border border-neutral-200 shadow-sm" title="METEOR Score">
                          METEOR: {model.score}
                        </span>
                      )}
                      {model.matchAcc && (
                        <span className={clsx(
                          "font-mono text-xs font-medium px-2 py-1 rounded border shadow-sm",
                          parseFloat(model.matchAcc) === 1 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          Match: {model.matchAcc}
                        </span>
                      )}
                      <span className={clsx(
                        "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                        model.isPass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {model.isPass ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">
                    {model.response || <span className="text-neutral-400 italic">No response provided.</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">Raw Data</h3>
              <pre className="text-xs font-mono text-neutral-700 bg-neutral-50 p-4 rounded-lg overflow-x-auto border border-neutral-200">
                {JSON.stringify(row, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
