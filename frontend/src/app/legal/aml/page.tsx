'use client';

import React, { useState } from 'react';
import { Gavel, Scale, ShieldAlert, BookOpen, ExternalLink, Loader2, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

export default function LegalDossierPage() {
  const { activeProjectId } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200'}/api/v1/ai/narrative/${activeProjectId || 'ZENITH-001'}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setNarrative(data.narrative);
      }
    } catch (e) {
      console.error("Synthesis failed", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200'}/api/v1/forensic/export/pdf`);
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Zenith_Forensic_Dossier_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } catch (e) {
        console.error("Export failed", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const laws = [
    {
      title: 'UU No. 8 Tahun 2010',
      description: 'Primary legislation on Money Laundering (TPPU). Crucial for establishing the "Predicate Crime" and tracing illicit capital transformation.',
      status: 'Statutory Basis'
    },
    {
      title: 'FATF Standards',
      description: 'International standards for identifying "Red Flag" indicators and beneficial ownership concealment patterns.',
      status: 'Forensic Standard'
    },
    {
      title: 'Standard of Proof',
      description: 'The requirement to establish a "Clear Linkage" between the fraudulent project expenditure and the acquired private asset.',
      status: 'Admissibility'
    }
  ];

  return (
    <ForensicPageLayout
        title="Eclipse // Legal Documentation"
        subtitle="Forensic Evidence Synthesis & Statutory Alignment"
        icon={Scale}
        headerActions={
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center gap-4 group border border-indigo-400/20"
            >
              {isGenerating ? (
                <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   EXFILTRATING DOSSIER...
                </>
              ) : (
                <>
                  Export High-Fidelity Dossier
                  <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </>
              )}
            </button>
        }
    >
        <div className="p-8 space-y-8 overflow-y-auto max-h-full custom-scrollbar">


      <section className="glass-panel p-10 rounded-[2.5rem] border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-24 h-24 text-indigo-400" />
        </div>
        <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                    <Activity className="w-5 h-5 text-indigo-500" /> AI Narrative Synthesis
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Generate executive context using Zenith Logic Engine v3</p>
            </div>
            <button 
                onClick={handleSynthesize}
                disabled={isSynthesizing}
                className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-400 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isSynthesizing ? "Synthesizing..." : "Generate Narrative"}
            </button>
        </div>

        {narrative ? (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/5 rounded-3xl p-8 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap relative"
            >
                <div className="absolute top-4 right-6 text-[8px] font-black text-indigo-500/40 uppercase tracking-[0.3em]">Confidential AI Output</div>
                {narrative}
            </motion.div>
        ) : (
            <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">No narrative generated for ZENITH-001. Click generate to begin synthesis.</p>
            </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* FRAUD TRIANGLE ANALYSIS */}
        <div className="xl:col-span-2 glass-panel p-8 rounded-[2.5rem] border border-orange-500/20 bg-orange-500/5 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                       <ShieldAlert className="w-5 h-5 text-orange-500" /> Fraud Triangle Analysis
                   </h2>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Criminological Framework</p>
                </div>
                {/* Mock Save Indicator */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Activity className="w-3 h-3" /> LIVE SAVE
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'pressure', label: '1. PRESSURE', sub: 'Financial/Emotional Motive', placeholder: 'e.g., Gambling debt, Market crash...', icon: Activity, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5' },
                  { id: 'opportunity', label: '2. OPPORTUNITY', sub: 'Control Weakness', placeholder: 'e.g., Shared passwords, No dual-auth...', icon: ExternalLink, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5' },
                  { id: 'rationalization', label: '3. RATIONALIZATION', sub: 'The Justification', placeholder: 'e.g., "I was underpaid", "It\'s just a loan"...', icon: BookOpen, color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5' }
                ].map(item => (
                  <div key={item.id} className={`p-6 rounded-3xl border ${item.border} ${item.bg} relative group hover:bg-opacity-20 transition-all`}>
                      <item.icon className={`w-8 h-8 ${item.color} mb-4 opacity-50`} />
                      <h3 className={`text-sm font-black ${item.color} uppercase tracking-widest mb-1`}>{item.label}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{item.sub}</p>
                      <textarea 
                        aria-label={item.label}
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-colors h-24 resize-none font-mono"
                        placeholder={item.placeholder}
                      />
                  </div>
                ))}
             </div>
        </div>

        {/* MENS REA BUILDER */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-purple-500/20 bg-purple-500/5 relative">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight mb-2">
                <Zap className="w-5 h-5 text-purple-500" /> Mens Rea Matrix
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Establishing Criminal Intent</p>
            
            <div className="space-y-4">
               {['Purpose', 'Knowledge', 'Recklessness', 'Negligence'].map((level, i) => (
                  <div key={level} className="group cursor-pointer">
                      <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-white/5 hover:border-purple-500/50 transition-all">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-purple-400'}`}>
                             {i+1}
                          </div>
                          <div className="flex-1">
                             <div className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{level}</div>
                             <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-purple-500 w-0 group-hover:w-full transition-all duration-700" />
                             </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                                  +
                              </div>
                          </div>
                      </div>
                  </div>
               ))}
               <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-dashed border-slate-700 text-center">
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Drag evidence here to map intent</p>
               </div>
            </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <section className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-rose-400" /> Money Laundering Stages
              </h2>
              <div className="space-y-4">
                 {[
                   { stage: 'Placement', definition: 'Introducing illicit project funds into the formal banking system (BCA/Mandiri accounts).' },
                   { stage: 'Layering', definition: 'Concealing the source by moving funds through family aliases (Faldi, Ema) and using "Tipex" redactions.' },
                   { stage: 'Integration', definition: 'Re-introducing "clean" money via personal luxury purchases or fake loan returns.' },
                 ].map(s => (
                   <div key={s.stage} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="font-bold text-blue-400 text-sm uppercase tracking-widest">{s.stage}</div>
                      <p className="text-sm text-slate-400 mt-1">{s.definition}</p>
                   </div>
                 ))}
              </div>
           </section>

           <div className="p-8 rounded-3xl bg-blue-600/10 border border-blue-500/30 italic text-sm text-blue-100 flex gap-4 pr-12">
              <BookOpen className="w-12 h-12 text-blue-400 shrink-0" />
               &quot;Under Law No. 8 of 2010, the systematic transfer of corporate funds to family members without valid commercial justification constitutes prima facie evidence of Layering.&quot;
           </div>
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" /> Statutes & Regulations
           </h2>
           {laws.map(law => (
             <div key={law.title} className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-white">{law.title}</h3>
                   <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">{law.status}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{law.description}</p>
                <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:underline">
                  Full text archive <ExternalLink className="w-2.5 h-2.5" />
                </button>
             </div>
           ))}

           {/* New Workflow Checklist */}
           <div className="glass-panel p-8 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5">
              <h2 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight mb-6">
                  <ShieldAlert className="w-5 h-5 text-emerald-500" /> Adjudication Workflow
              </h2>
              <div className="space-y-4">
                  {[
                    { id: 'kyc', label: '1. KYC & Identity Verification', desc: 'Confirm person of interest exists in AHU/KPT registry.' },
                    { id: 'ubo', label: '2. UBO Chain Reconstruction', desc: 'Map shell companies back to ultimate individual.' },
                    { id: 'redaction', label: '3. Redaction (Tipex) Analysis', desc: 'Verify voucher integrity for all suspect vouchers.' },
                    { id: 'dossier', label: '4. Case File Compilation', desc: 'Export court-ready dossier for law enforcement submission.' },
                  ].map((item) => {
                    const isCompleted = completedSteps.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleStep(item.id)}
                        className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer border ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : 'bg-black/20 border-white/5 hover:border-emerald-500/40'
                        }`}
                      >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                             isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                          }`}>
                              {isCompleted && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                              <div className={`text-xs font-black uppercase tracking-tight ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 font-bold italic">{item.desc}</div>
                          </div>
                      </div>
                    );
                  })}
              </div>
           </div>
        </div>
      </div>
      
      <div className="flex justify-center py-8">
         <button 
           onClick={() => window.location.href = '/forensic/analytics'}
           className="text-slate-500 hover:text-white text-sm transition-colors font-mono"
         >
           ./back_to_analytics
         </button>
        </div>
      </div>
    </ForensicPageLayout>
  );
}
