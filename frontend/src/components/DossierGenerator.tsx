'use client';

import React, { useState } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DossierGeneratorProps {
  projectId?: string;
}

import { useDossier } from '@/hooks/useDossier';

interface DossierGeneratorProps {
  projectId?: string;
}

export default function DossierGenerator({ projectId = 'ZENITH-001' }: DossierGeneratorProps) {
  const { generateDossier, loading, error, success, progress } = useDossier();

  const [options, setOptions] = useState({
    includeTransactions: true,
    includeEntities: true,
    includeForensicAnalysis: true,
  });

  const handleGenerate = () => {
    generateDossier(projectId, options);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600/20 rounded-lg">
          <FileText className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Court-Ready Dossier</h3>
          <p className="text-sm text-slate-400">Professional evidence package generator</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed">
          Generate a comprehensive, court-admissible PDF report containing executive summaries,
          forensic findings, transaction ledgers, entity registries, and methodology documentation.
          Includes QR code verification for authenticity.
        </p>
      </div>

      {/* Options */}
      <div className="mb-6 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Include Sections
        </p>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={options.includeTransactions}
            onChange={(e) => setOptions({ ...options, includeTransactions: e.target.checked })}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
            Transaction Ledger (Complete audit trail)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={options.includeEntities}
            onChange={(e) => setOptions({ ...options, includeEntities: e.target.checked })}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
            Entity Registry (All parties with aliases)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={options.includeForensicAnalysis}
            onChange={(e) => setOptions({ ...options, includeForensicAnalysis: e.target.checked })}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
            Forensic Analysis (Risk scores & findings)
          </span>
        </label>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Generating dossier...</span>
            <span className="text-xs text-indigo-400 font-semibold">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-300">Dossier generated successfully!</p>
            <p className="text-xs text-green-400/80">Your download should begin automatically.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300">Generation failed</p>
            <p className="text-xs text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating Dossier...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Generate Court-Ready Dossier</span>
          </>
        )}
      </button>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Project ID: {projectId}</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            API Ready
          </span>
        </div>
      </div>
    </div>
  );
}
