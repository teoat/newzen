'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gavel, ShieldAlert, FileText, Download, 
  ExternalLink, CheckCircle, Fingerprint, Lock,
  Zap
} from 'lucide-react';
import NeuralCard from './NeuralCard';
import { useInvestigation } from '../../store/useInvestigation';
import { authenticatedFetch } from '../../lib/api';

interface DossierData {
  case_metadata: {
    case_id: string;
    title: string;
    status: string;
  };
  executive_summary: string;
  evidence_inventory: Array<{
    exhibit_id: string;
    type: string;
    label: string;
    hash: string;
  }>;
  chain_of_custody: Array<{
    timestamp: string;
    action: string;
    changed_by: string;
  }>;
  prosecutorial_confidence: number;
  integrity_hash: string;
  registry_id: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: DossierData | null;
  loading: boolean;
}

const HOLOGRAPHIC_DOSSIER: DossierData = {
  case_metadata: {
    case_id: "HOLO-CASE-001",
    title: "SIMULATED_INVESTIGATION_OMEGA",
    status: "in_progress"
  },
  executive_summary: "This is a holographic projection of current forensic telemetry. Live data synthesis is pending. The neural engine predicts high-probability leakage in the material procurement sector involving multiple shell entities.",
  evidence_inventory: [
    { exhibit_id: "EX-001", type: "Ledger", label: "Procurement_Anomalies_v1", hash: "sha256:7f8e...3a1" },
    { exhibit_id: "EX-002", type: "Geospatial", label: "Satellite_Verify_Sector_7", hash: "sha256:4d2b...9c3" }
  ],
  chain_of_custody: [
    { timestamp: new Date().toISOString(), action: "DEMO_INITIALIZED", changed_by: "ZENITH_PRIME" }
  ],
  prosecutorial_confidence: 0.88,
  integrity_hash: "HOLO_HASH_PROJECTION_v3.0",
  registry_id: "REG-HOLO-999"
};


export default function VerdictModal({ isOpen, onClose, data, loading }: Props) {
  const [downloading, setDownloading] = React.useState(false);
  const [sealing, setSealing] = React.useState(false);
  const sealCase = useInvestigation(state => state.sealCase);

  if (!isOpen) return null;

  const handleSeal = async () => {
    if (!data) return;
    setSealing(true);
    try {
        await sealCase(data.case_metadata.case_id);
        alert("Case Sealed Successfully. Integrity Hash verified.");
        onClose();
    } catch (e) {
        console.error("Seal failed:", e);
        alert("Failed to seal case. Ensure all evidence is admitted.");
    } finally {
        setSealing(false);
    }
  };

  const handleDownload = async () => {
    if (!data) return;
    
    setDownloading(true);
    try {
        const userId = "USER-001"; // In production, get from auth store
        const res = await authenticatedFetch(`/api/v2/forensic-v2/judge/download-dossier?case_id=${data.case_metadata.case_id}&user_id=${userId}`);
        
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Zenith_Court_Dossier_${data.case_metadata.case_id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            console.error("Failed to download PDF");
            alert("Error generating PDF dossier. Please check server logs.");
        }
    } catch (e) {
        console.error("Download error:", e);
    } finally {
        setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        <NeuralCard status="verified" className="w-full h-full flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-white/5 bg-indigo-600/5 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/40">
                   <Gavel className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Verdict Adjudication Bench</h2>
                   <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">AUTONOMOUS_JUDGE_v3.0</span>
                      <span className="text-[11px] font-black text-slate-600">/ LEGAL_DOCK_MODE</span>
                   </div>
                </div>
             </div>
             <button onClick={onClose} title="Close Adjudication Bench" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <Lock className="w-5 h-5 text-slate-500 hover:text-white" />
             </button>
          </div>

          <div className="flex-1 overflow-auto p-12 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-6">
                 <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full" />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-x-0 inset-y-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" 
                    />
                 </div>
                 <div className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] animate-pulse">
                    Neural Data Synthesis In Progress...
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Holographic Mode Indicator */}
                {!data && (
                    <div className="lg:col-span-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-3">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Holographic Demo Projection // No Live Data Seeded</span>
                    </div>
                )}
                {(() => {
                  const activeData = data || HOLOGRAPHIC_DOSSIER;
                  return (
                    <>
                {/* Left Column: Metadata & Confidence */}
                <div className="space-y-8">
                   <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Prosecutorial Confidence</div>
                      <div className="flex items-end gap-3 mb-4">
                         <span className="text-5xl font-black text-white italic tracking-tighter">{(activeData.prosecutorial_confidence * 100).toFixed(0)}%</span>
                         <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic">PROBABLE</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${activeData.prosecutorial_confidence * 100}%` }}
                            className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                         />
                      </div>
                   </div>

                   <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6">
                      <div>
                         <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">Evidence Hash</div>
                         <div className="flex items-center gap-2">
                            <Fingerprint className="w-3 h-3 text-indigo-500" />
                            <span className="text-[11px] font-mono text-slate-400 truncate">{activeData.integrity_hash}</span>
                         </div>
                      </div>
                      <div>
                         <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">Registry ID</div>
                         <div className="text-xs font-black text-white font-mono">{activeData.registry_id}</div>
                      </div>
                   </div>

                   <button 
                    onClick={handleDownload}
                    disabled={downloading || !data}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3"
                   >
                      {downloading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloading ? "Generating Dossier..." : !data ? "Live Data Required for PDF" : "Download Court-Ready PDF"}
                   </button>
                </div>

                {/* Right Column: Narrative & Exhibits */}
                <div className="lg:col-span-2 space-y-12">
                   <section>
                      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                         <FileText className="w-4 h-4 text-indigo-500" /> Executive Summary
                      </h3>
                      <div className="p-8 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 relative">
                         <div className="absolute top-0 right-0 p-6 opacity-10">
                            <ShieldAlert className="w-12 h-12" />
                         </div>
                         <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                            {activeData.executive_summary}
                         </p>
                      </div>
                   </section>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section>
                         <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Secured Exhibits ({activeData.evidence_inventory.length})</h3>
                         <div className="space-y-4">
                            {activeData.evidence_inventory.map((ex, i) => (
                               <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-indigo-400" />
                                     </div>
                                     <div>
                                        <div className="text-[11px] font-black text-white uppercase">{ex.label}</div>
                                        <div className="text-[8px] font-mono text-slate-500">{ex.type}</div>
                                     </div>
                                  </div>
                                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                               </div>
                            ))}
                         </div>
                      </section>

                      <section>
                         <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Chain of Custody Log</h3>
                         <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                            {activeData.chain_of_custody.map((log, i) => (
                               <div key={i} className="relative pl-8">
                                  <div className="absolute left-2 top-2 w-2 h-2 rounded-full bg-indigo-500 border-2 border-slate-900" />
                                  <div className="text-[11px] font-mono text-slate-500 mb-1">{new Date(log.timestamp).toLocaleString()}</div>
                                  <div className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{log.action}</div>
                                  <div className="text-[8px] font-medium text-slate-600 italic">By: {log.changed_by}</div>
                               </div>
                            ))}
                         </div>
                      </section>
                   </div>
                </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="p-8 border-t border-white/5 bg-black/40 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Signed & Sealed by Zenith AI Forensic</span>
             </div>
             <div className="flex gap-4">
                {data?.case_metadata.status !== 'completed' && (
                    <button 
                        onClick={handleSeal}
                        disabled={sealing || loading}
                        className="px-8 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        {sealing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                        {sealing ? "Sealing..." : "Seal Investigation"}
                    </button>
                )}
                <button onClick={onClose} className="px-10 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                    Return to Lab
                </button>
             </div>
          </div>
        </NeuralCard>
      </motion.div>
    </div>
  );
}
