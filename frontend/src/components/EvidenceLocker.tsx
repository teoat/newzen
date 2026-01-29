'use client';

import React, { useState } from 'react';

interface EvidenceLockerProps {
  transactionId: string;
  isLocked: boolean;
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7900';

export default function EvidenceLocker({ transactionId, isLocked, onSuccess }: EvidenceLockerProps) {
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Auto upload
      await uploadProof(selectedFile);
    }
  };

  const uploadProof = async (f: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', f);
    formData.append('file_type', 'image'); // Default to receipt image
    formData.append('transaction_id', transactionId);

    try {
      const res = await fetch(`${API_URL}/api/v1/evidence/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        // File reset handled by parent component
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error unlocking");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`mt-2 p-3 rounded-lg border-2 border-dashed transition-all relative overflow-hidden ${isLocked ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-700 bg-slate-900/50'}`}>
      
      {uploading && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
           <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isSuccess ? (
        <div className="flex items-center gap-2 text-emerald-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold">Proof Hashed & Locked</span>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center cursor-pointer group">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
              <svg className={`w-4 h-4 ${isLocked ? 'text-orange-500' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{isLocked ? "Drag Receipt to Unlock" : "Attach Supporting Doc"}</span>
           </div>
           <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
        </label>
      )}
    </div>
  );
}
