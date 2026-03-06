'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Upload, 
  FileText, 
  Search, 
  Link as LinkIcon, 
  Eye, 
  Download,
  AlertCircle,
  DatabaseZap,
  Fingerprint,
  Activity,
  Zap,
  Clock,
  Camera
} from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { authenticatedFetch } from '../../../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import PageFeatureCard from '../../components/PageFeatureCard';

interface EvidenceDoc {
  id: string;
  filename: string;
  file_type: string;
  file_hash: string;
  transaction_id?: string;
  created_at: string;
  risk_status: 'CLEAN' | 'FLAGGED';
}

export default function EvidenceLockerPage() {
  const { activeProjectId } = useProject();
  const { toast } = useToast();
  const [docs, setDocs] = useState<EvidenceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!activeProjectId) return;
    
    // Realization: Fetch from new API
    const fetchEvidence = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch(`/api/v1/forensic-tools/evidence/${activeProjectId}/list`);
            if (res.ok) {
                const data = await res.json();
                setDocs(data);
            }
        } catch (e) {
            console.error("Evidence fetch failed", e);
            toast("Failed to access Evidence Locker", "error");
        } finally {
            setLoading(false);
        }
    };
    fetchEvidence();
  }, [activeProjectId, toast]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId) return;

    setUploading(true);
    toast("Initiating Neural OCR Extraction...", "info");

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', file.type);
        
        const res = await authenticatedFetch(`/api/v1/evidence/${activeProjectId}/upload`, {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            toast("Visual Truth Link Established: Evidence Indexed.", "success");
            // Refresh logic here
        }
    } catch (e) {
        toast("Upload Failed: Security Handshake Terminated.", "error");
    } finally {
        setUploading(false);
    }
  };

  return (
    <ForensicPageLayout
      title="Sovereign Evidence Locker"
      subtitle="Visual Truth Bridge & Neural OCR"
      icon={Shield}
      headerActions={
        <div className="flex items-center gap-4">
            <div className="relative group">
                <input 
                    type="file" 
                    onChange={handleUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    disabled={uploading}
                />
                <Button className="h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    {uploading ? <Activity className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                    Capture Physical Truth
                </Button>
            </div>
        </div>
      }
    >
      <div className="p-10 space-y-10 h-full overflow-y-auto custom-scrollbar">
        <PageFeatureCard 
            phase={4}
            title="Visual Truth Bridge"
            description="The 'Handshake' between physical documents and the digital ledger. This module performs neural OCR to extract entities and amounts from photos/PDFs, linking them to transaction IDs."
            features={[
                "Neural OCR with handwriting recognition support",
                "Automated entity linking to project graph nodes",
                "SHA-256 fingerprinting for physical non-repudiation",
                "Secure multi-modal RAG search capabilities"
            ]}
            howItWorks="By processing physical evidence through a vision-language model, the system identifies amounts and vendors in physical receipts, automatically flagging ledger entries that lack matching visual proof."
        />

        <div className="grid grid-cols-12 gap-8">
            {/* SEARCH & FILTERS */}
            <div className="col-span-12 flex items-center gap-6">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Interrogate indexed evidence..."
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-[11px] font-bold outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-12 border-white/5 bg-slate-900 text-slate-500 text-[10px] uppercase font-black tracking-widest px-6 rounded-xl">PDFs</Button>
                    <Button variant="outline" className="h-12 border-white/5 bg-slate-900 text-slate-500 text-[10px] uppercase font-black tracking-widest px-6 rounded-xl">Images</Button>
                </div>
            </div>

            {/* EVIDENCE GRID */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {docs.map((doc, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={doc.id}
                        className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all relative overflow-hidden"
                    >
                        <div className="scan-line-overlay" />
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={`p-4 rounded-2xl ${doc.file_type.includes('image') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>
                                <FileText size={24} />
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${doc.risk_status === 'CLEAN' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'}`}>
                                {doc.risk_status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-8 relative z-10">
                            <h3 className="text-sm font-black text-white uppercase truncate tracking-tight">{doc.filename}</h3>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                <Fingerprint size={10} /> {doc.file_hash.slice(0, 16)}...
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {doc.transaction_id ? (
                                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Linked TX</span>
                                    <span className="text-[10px] font-black text-indigo-400 font-mono">{doc.transaction_id}</span>
                                </div>
                            ) : (
                                <Button variant="ghost" className="w-full h-10 border border-dashed border-white/10 rounded-xl text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white hover:bg-white/5 flex items-center gap-2">
                                    <LinkIcon size={12} /> Establish Linkage
                                </Button>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex gap-4 relative z-10">
                            <Button variant="outline" className="flex-1 h-10 rounded-xl border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">
                                <Eye size={12} className="mr-2" /> View
                            </Button>
                            <Button variant="outline" className="h-10 w-10 rounded-xl border-white/5 bg-white/5 p-0 hover:bg-white/10">
                                <Download size={12} />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </ForensicPageLayout>
  );
}
