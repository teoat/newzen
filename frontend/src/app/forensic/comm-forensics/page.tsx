'use client';

import React, { useState } from 'react';
import { Upload, FileText, MessageCircle, Mail } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import CommTransactionTimeline from './CommTransactionTimeline';
import {
  commForensicsService,
  CommunicationType
} from '../../../services/CommForensicsService';
import { useProject } from '../../../store/useProject';
import { RoleGuard } from '../../../components/auth/RoleGuard';

type ProcessingStage = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'linking' | 'complete' | 'error';

export default function CommForensicsPage() {
  const { activeProjectId } = useProject();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<CommunicationType>(CommunicationType.WHATSAPP);
  const [mapping, setMapping] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!activeProjectId) return;

    try {
      setProcessingStage('uploading');
      setProcessingMessage('Uploading file...');
      setProcessingProgress(10);
      setUploading(true);
      
      const result = await commForensicsService.uploadCommunicationExport(
        activeProjectId,
        file,
        selectedType
      );
      
      setProcessingProgress(40);
      setProcessingStage('parsing');
      setProcessingMessage(`Parsing ${result.total_messages} messages...`);
      
      // Simulate parsing progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingProgress(60);
      
      setProcessingStage('analyzing');
      setProcessingMessage('Running NLP analysis with Gemini AI...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingProgress(90);
      
      setProcessingStage('complete');
      setProcessingMessage('Processing complete!');
      setProcessingProgress(100);
      setUploadResult(result);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setProcessingStage('idle');
        setProcessingProgress(0);
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setProcessingStage('error');
      setProcessingMessage(error instanceof Error ? error.message : 'Failed to upload communication export');
      alert('Failed to upload communication export');
    } finally {
      setUploading(false);
    }
  };

  const handleAutoMap = async () => {
    if (!activeProjectId) return;

    try {
      setMapping(true);
      const result = await commForensicsService.mapCommunicationsToTransactions(
        activeProjectId,
        { time_window_hours: 24, min_confidence: 0.5 }
      );
      alert(`Mapped ${result.total_links} links (${result.high_confidence_links} high confidence)`);
    } catch (error) {
      console.error('Mapping failed:', error);
      alert('Failed to map communications to transactions');
    } finally {
      setMapping(false);
    }
  };

  const getSourceIcon = (type: CommunicationType) => {
    switch (type) {
      case CommunicationType.EMAIL:
        return <Mail className="w-5 h-5" />;
      case CommunicationType.WHATSAPP:
      case CommunicationType.SIGNAL:
      case CommunicationType.TELEGRAM:
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'INVESTIGATOR']}>
      <ForensicPageLayout
        title="Communication Forensics"
        subtitle="Multimodal Comm Ingestion & Intent-Signal Fusion"
        icon={MessageCircle}
      >
        <div className="p-6 space-y-8">
          {/* Upload Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-black text-white mb-4">Upload Communication Export</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Communication Source
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(CommunicationType).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedType === type
                          ? 'bg-indigo-500/20 border-indigo-500 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {getSourceIcon(type)}
                      <span className="text-sm font-bold capitalize">{type.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Upload File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.json,.html,.zip,.pst"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploading}
                    className="hidden"
                    id="comm-upload"
                  />
                  <label
                    htmlFor="comm-upload"
                    className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      uploading
                        ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed'
                        : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50'
                    }`}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-500 mb-2" />
                        <span className="text-sm text-slate-400">Click to upload</span>
                        <span className="text-xs text-slate-600 mt-1">
                          TXT, JSON, HTML, ZIP, or PST
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {uploadResult && processingStage === 'idle' && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-sm text-emerald-400">
                      ✓ Uploaded {uploadResult.total_messages} messages
                    </p>
                  </div>
                )}
                
                {processingStage !== 'idle' && (
                  <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                          processingStage === 'error' ? 'bg-red-500' :
                          processingStage === 'complete' ? 'bg-emerald-500' :
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    
                    {/* Stage Indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {processingStage === 'error' ? (
                          <>
                            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-white text-xs">✕</span>
                            </div>
                            <span className="text-sm text-red-400 font-medium">{processingMessage}</span>
                          </>
                        ) : processingStage === 'complete' ? (
                          <>
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-sm text-emerald-400 font-medium">{processingMessage}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                            <span className="text-sm text-indigo-400 font-medium">{processingMessage}</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{processingProgress}%</span>
                    </div>
                    
                    {/* Stage Steps */}
                    <div className="flex items-center gap-2 pt-2">
                      {(['uploading', 'parsing', 'analyzing', 'complete'] as const).map((stage, idx) => (
                        <div key={stage} className="flex items-center gap-2 flex-1">
                          <div className={`h-1 flex-1 rounded-full ${
                            processingStage === stage ? 'bg-indigo-500' :
                            ['uploading', 'parsing', 'analyzing', 'linking', 'complete'].indexOf(processingStage) > idx ? 'bg-emerald-500' :
                            'bg-slate-700'
                          }`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Map Button */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <button
                onClick={handleAutoMap}
                disabled={mapping || !activeProjectId}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
              >
                {mapping ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Mapping Communications...
                  </span>
                ) : (
                  'Auto-Map to Transactions'
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Automatically link communications to financial transactions using NLP and temporal analysis
              </p>
            </div>
          </div>

          {/* Timeline View */}
          {activeProjectId && <CommTransactionTimeline projectId={activeProjectId} />}
        </div>
      </ForensicPageLayout>
    </RoleGuard>
  );
}
