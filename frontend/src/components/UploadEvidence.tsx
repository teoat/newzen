'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function UploadEvidence() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('pdf');
  const [uploading, setUploading] = useState(false);
interface UploadResult {
  extracted_text: string;
  success: boolean;
  file_id?: string;
}

  const [result, setResult] = useState<UploadResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    try {
      const response = await fetch('http://localhost:7900/api/v1/evidence/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Is the backend running?');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <h3 className="text-xl font-semibold mb-2">Ingest Multimodal Evidence</h3>
      <p className="text-sm text-slate-400">Upload bank statements, chat logs, journals, or media for RAG-assisted reconciliation.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500 font-bold">File Target</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500 font-bold">Document Type</label>
          <select 
            value={fileType} 
            onChange={(e) => setFileType(e.target.value)}
            className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-slate-200"
          >
            <option value="pdf">Bank Statement (PDF)</option>
            <option value="journal">Expense Journal</option>
            <option value="chat">Chat History</option>
            <option value="image">Photo / Receipt</option>
            <option value="video">Video Evidence</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Indexing for RAG...
          </>
        ) : 'Ingest Document'}
      </button>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
        >
          <p className="text-xs text-emerald-400 font-bold uppercase mb-1">RAG Analysis Success</p>
           <p className="text-sm text-slate-300 italic">&quot;{result.extracted_text}&quot;</p>
        </motion.div>
      )}
    </div>
  );
}
