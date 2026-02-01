'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle } from 'lucide-react';

interface FileUploadZoneProps {
  title: string;
  file: File | null;
  icon: string;
  isDragActive: boolean;
  acceptedFiles: File[];
  getRootProps: ReturnType<typeof useDropzone>['getRootProps'];
  getInputProps: ReturnType<typeof useDropzone>['getInputProps'];
  description: string;
}

export function FileUploadZone({
  title,
  file,
  icon,
  isDragActive,
  getRootProps,
  getInputProps,
  description,
}: FileUploadZoneProps) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
          {icon}
        </span>
        {title}
      </h3>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-500/50'}
          ${file ? 'border-emerald-500 bg-emerald-500/5' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="text-emerald-400">
            <div className="text-3xl mb-2">✓</div>
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="text-slate-400">
            <div className="text-3xl mb-2 opacity-50">{icon}</div>
            <p className="font-medium">{title}</p>
            <p className="text-sm mt-1">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface UploadStepProps {
  bankFile: File | null;
  analysisFile: File | null;
  onDropBank: (files: File[]) => void;
  onDropAnalysis: (files: File[]) => void;
  onRunRawAnalysis: () => void;
  onRunComparison: () => void;
}

export function UploadStep({
  bankFile,
  analysisFile,
  onDropBank,
  onDropAnalysis,
  onRunRawAnalysis,
  onRunComparison,
}: UploadStepProps) {
  const onDropBankCb = useCallback((files: File[]) => onDropBank(files), [onDropBank]);
  const onDropAnalysisCb = useCallback((files: File[]) => onDropAnalysis(files), [onDropAnalysis]);

  const { getRootProps: getBankRootProps, getInputProps: getBankInputProps, isDragActive: isBankDragActive } = useDropzone({
    onDrop: onDropBankCb,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const { getRootProps: getAnalysisRootProps, getInputProps: getAnalysisInputProps, isDragActive: isAnalysisDragActive } = useDropzone({
    onDrop: onDropAnalysisCb,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
        <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { num: 1, title: 'Upload Raw Data', desc: 'Bank statement with transaction details' },
            { num: 2, title: 'Pattern Discovery', desc: 'App finds suspicious patterns independently' },
            { num: 3, title: 'Upload Your Analysis', desc: 'Your findings with project TRUE/FALSE' },
            { num: 4, title: 'Compare & Review', desc: 'See agreements and disagreements' },
          ].map((item) => (
            <div key={item.num} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-blue-300 font-bold shrink-0 text-sm">
                {item.num}
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FileUploadZone
          title="Raw Bank Statement"
          file={bankFile}
          icon="📊"
          isDragActive={isBankDragActive}
          acceptedFiles={[]}
          getRootProps={getBankRootProps}
          getInputProps={getBankInputProps}
          description="Needs: No, Tanggal, Uraian, Kredit, Debit"
        />
        <FileUploadZone
          title="Your Analysis (Optional)"
          file={analysisFile}
          icon="📋"
          isDragActive={isAnalysisDragActive}
          acceptedFiles={[]}
          getRootProps={getAnalysisRootProps}
          getInputProps={getAnalysisInputProps}
          description="Needs: No, Proyek (TRUE/FALSE), Comment"
        />
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRunRawAnalysis}
          disabled={!bankFile}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed
            text-white font-semibold rounded-xl transition-all"
        >
          🔍 Analyze Raw Data Only
        </button>
        <button
          onClick={onRunComparison}
          disabled={!bankFile || !analysisFile}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
            disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed
            text-white font-semibold rounded-xl transition-all"
        >
          ⚖️ Compare Against My Analysis
        </button>
      </div>
    </div>
  );
}
