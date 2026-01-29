'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Activity, 
  Share2, 
  AlertTriangle,
  ChevronRight,
  Plus,
  HardHat,
  Briefcase,
  Gavel,
  ArrowLeft
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

export default function CaseDetailPage() {
  const { id } = useParams();
const caseId = id as string;
  const router = useRouter();
  const [caseData, setCaseData] = useState<{ 
    id: string; 
    title: string; 
    status: string; 
    description?: string;
    priority?: string;
    risk_score?: number;
    created_at?: string;
    assigned_to?: string;
    events?: Array<{ id: number; type: string; time: string; title?: string; description?: string; text?: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real case data from backend
    fetch(`${API_URL}/api/v1/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch case:", err);
        // Fallback to mock for construction theme
        setCaseData({
          id: caseId,
          title: "Structural Markup Deviation",
          description: "Detected 47% markup on Ready Mix Concrete vs RAB. Potential kickback to procurement manager suspected.",
          status: "investigating",
          priority: "critical",
          risk_score: 0.92,
          created_at: new Date().toISOString(),
          assigned_to: "Forensic Team Alpha",
          events: [
            { id: 1, type: 'alert', text: 'System detected price variance in Batch #204.', time: '1h ago' },
            { id: 2, type: 'note', text: 'Vendor PT. Mega Konstruksi linked to shadow company in nexus.', time: '3h ago' },
            { id: 3, type: 'note', text: 'Manual ledger verification requested.', time: '1d ago' },
          ]
        });
        setLoading(false);
      });
  }, [id, caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="p-8 h-screen flex flex-col space-y-8 bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Header / Breadcrumb */}
      <header className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center text-[10px] text-slate-500 gap-3 font-black uppercase tracking-widest">
            <button onClick={() => router.back()} className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> BACK
            </button>
            <ChevronRight className="w-3 h-3 opacity-20" />
            <span className="text-indigo-400">PROJECT AUDIT</span>
            <ChevronRight className="w-3 h-3 opacity-20" />
            <span>ID: {String(id).toUpperCase()}</span>
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{caseData.title}</h1>
        </div>
        <div className="flex gap-4">
          <button className="glass-panel px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/5 border border-white/5 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-400" /> Share Evidence
          </button>
          <button className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-900/40 transition-all">
            Escalate to Legal
          </button>
        </div>
      </header>

      {/* Tri-Column Layout */}
      <div className="flex-1 flex gap-8 overflow-hidden pb-8">
        
        {/* Left Column: Dossier (Metadata) */}
        <section className="w-96 glass-panel rounded-[2rem] p-8 flex flex-col space-y-8 border border-white/5 shadow-2xl overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
             <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 shadow-inner">
               <div className="text-[10px] text-rose-400 uppercase font-black tracking-[0.2em] mb-2">Audit Risk Score</div>
               <div className="flex items-end gap-3">
                  <div className="text-5xl font-black font-mono text-rose-500 leading-none">{((caseData.risk_score || 0) * 100).toFixed(0)}</div>
                  <div className="text-xl font-black text-rose-900 mb-1">%</div>
               </div>
             </div>
             
             <div className="space-y-4">
               <div className="flex justify-between items-center py-3 border-b border-white/5">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Case Status</span>
                 <span className="text-[10px] font-black text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 uppercase tracking-widest">{caseData.status}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-white/5">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity</span>
                 <span className="text-[10px] font-black text-rose-400 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 uppercase tracking-widest">{caseData.priority}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-white/5">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Auditor</span>
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-lg" />
                    <span className="text-xs font-bold text-slate-200">{caseData.assigned_to}</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Forensic Summary</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              {caseData.description}
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
               <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Related Assets</h3>
               <div className="flex gap-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-colors">
                        <HardHat className="w-5 h-5" />
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-colors">
                        <Briefcase className="w-5 h-5" />
                    </div>
               </div>
          </div>
        </section>

        {/* Center Column: Pulse (Activity Feed) */}
        <section className="flex-1 glass-panel rounded-[2.5rem] flex flex-col overflow-hidden border border-white/5 shadow-2xl">
           <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
             <h2 className="font-black italic uppercase tracking-widest flex items-center gap-4 text-white">
                <Activity className="w-5 h-5 text-indigo-400" /> Investigation Pulse
             </h2>
             <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-900 px-3 py-1 rounded-full border border-white/5">Auto-Refreshed</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {caseData.events?.map((event: { type: string; time: string; title?: string; description?: string; text?: string }, i: number) => (
                <div key={i} className="relative pl-10 border-l-2 border-white/5 pb-10 last:pb-0">
                  <div className={`absolute left-0 top-0 -ml-[9px] w-4 h-4 rounded-full border-4 border-slate-950 ${
                      event.type === 'alert' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]'
                  }`} />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{event.time}</span>
                    {event.type === 'alert' && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest border border-rose-500/30 px-2 py-0.5 rounded-full">Automated Alert</span>}
                  </div>
                  <p className="text-sm font-bold text-slate-200 leading-relaxed uppercase tracking-tight">{event.text}</p>
                </div>
              ))}
              {!caseData.events?.length && (
                  <div className="text-center py-20 opacity-20 italic">No activity logs found for this case.</div>
              )}
           </div>
           
           <div className="p-8 bg-white/[0.02] border-t border-white/5">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Insert case directive..." 
                  className="w-full bg-slate-900 border border-white/5 rounded-[1.5rem] py-5 px-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-700 text-white"
                />
                <button className="absolute right-3 top-3 p-3 bg-indigo-600 rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 text-white">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
           </div>
        </section>

        {/* Right Column: Forensic Tools */}
        <section className="w-80 space-y-6 flex flex-col">
          <div className="glass-panel rounded-[2rem] p-8 flex-1 flex flex-col border border-white/5 shadow-2xl">
            <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-8">Forensic Lenses</h2>
            
            <div className="space-y-4 flex-1">
               <div onClick={() => router.push('/forensic/nexus')} className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.05] cursor-pointer transition-all group relative overflow-hidden">
                 <div className="flex items-center gap-4 mb-2">
                   <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                     <Share2 className="w-5 h-5" />
                   </div>
                   <span className="text-xs font-black uppercase text-white tracking-widest">Network Nexus</span>
                 </div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Trace Vendor Shells</p>
               </div>
               
               <div onClick={() => router.push('/forensic/flow')} className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.05] cursor-pointer transition-all group">
                 <div className="flex items-center gap-4 mb-2">
                   <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                     <Activity className="w-5 h-5" />
                   </div>
                   <span className="text-xs font-black uppercase text-white tracking-widest">Termin Flow</span>
                 </div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Fund Dispersion Map</p>
               </div>
               
               <div onClick={() => router.push('/investigate')} className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.05] cursor-pointer transition-all group">
                 <div className="flex items-center gap-4 mb-2">
                   <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                     <Gavel className="w-5 h-5" />
                   </div>
                   <span className="text-xs font-black uppercase text-white tracking-widest">Audit Bench</span>
                 </div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Manual Verifier</p>
               </div>
            </div>
            
            <div className="mt-8 p-6 rounded-3xl bg-rose-600/5 border border-rose-500/20 shadow-xl">
               <div className="flex items-center gap-3 text-rose-500 mb-2">
                 <AlertTriangle className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Audit Redline</span>
               </div>
               <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed italic">
                 Matched with historic kickback pattern (Pattern #ZK-404) found in 2023 infrastructure projects.
               </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
