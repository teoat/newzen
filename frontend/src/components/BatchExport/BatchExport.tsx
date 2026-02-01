'use client';

import { useCallback, useRef, useState } from 'react';
import { X, Download, File, Check, Loader2, AlertCircle } from 'lucide-react';
import type { EvidenceItem } from '../../store/useInvestigation';

interface BatchExportProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  evidenceItems: EvidenceItem[];
}

type ExportFormat = 'zip' | 'individual' | 'json';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
}

const exportOptions: ExportOption[] = [
  { id: 'zip', label: 'ZIP Archive', description: 'Download all files in a compressed archive' },
  { id: 'individual', label: 'Individual Files', description: 'Download files separately' },
  { id: 'json', label: 'JSON Metadata Only', description: 'Export evidence metadata as JSON' },
];

export function BatchExport({ isOpen, onClose, investigationId, evidenceItems }: BatchExportProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<ExportFormat>('zip');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(evidenceItems.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;

    setStatus('loading');
    setError(null);
    setProgress({ current: 0, total: selectedIds.size });

    try {
      const response = await fetch('/api/export/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigationId,
          evidenceIds: Array.from(selectedIds),
          format: exportFormat,
          includeMetadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      if (exportFormat === 'json') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence-export-${investigationId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence-export-${investigationId}-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setStatus('success');
      setProgress(null);
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Export failed');
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Batch Export Evidence</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {selectedIds.size} of {evidenceItems.length} items selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={deselectAll}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg mb-4">
            {evidenceItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-b border-white/5 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="w-4 h-4 rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                <File className="w-4 h-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.type} • {item.sourceTool}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-sm font-medium text-slate-300">Export Format</p>
            <div className="grid grid-cols-3 gap-2">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setExportFormat(option.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    exportFormat === option.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{option.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
            />
            <div>
              <p className="text-sm font-medium text-white">Include metadata JSON</p>
              <p className="text-xs text-slate-500">Export evidence details alongside files</p>
            </div>
          </label>

          {status === 'loading' && progress && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Exporting...</span>
                <span className="text-white">{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-emerald-400">Export completed successfully!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0 || status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {selectedIds.size} Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
