import { useState, useEffect, useMemo } from 'react';
import { 
    Search, CheckCircle, XCircle, 
    Filter, Shield, FileText, Database, Layers, Download, Clock, Fingerprint, AlertTriangle, Lock,
    ShieldCheck, RefreshCw
} from 'lucide-react';
import { API_URL } from '@/utils/constants';
import { useInvestigation } from '@/store/useInvestigation';
import { format } from 'date-fns';

interface Transaction {
  tx: {
    id: number;
    receiver: string;
    description: string;
    category_code: string;
    actual_amount: number;
    verification_status: 'VERIFIED' | 'EXCLUDED' | 'PENDING';
    audit_comment?: string;
  };
  risk: number;
}

interface AdjudicationBenchProps {
    investigationId: string;
}

export default function AdjudicationBench({ investigationId }: AdjudicationBenchProps) {
  const { getInvestigation, addAction, generateNarrative } = useInvestigation();
  const investigation = getInvestigation(investigationId);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'evidence' | 'chronicle' | 'dossier'>('transactions');
  const [narrative, setNarrative] = useState<string>('');
  const [interrogationGuide, setInterrogationGuide] = useState<string | null>(null);
  const [isSealing, setIsSealing] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/forensic/profit-loss`);
        const data = await res.json();
        setTransactions(data?.audit_trail || []);
      } catch (err) {
        console.error('Failed to fetch profit-loss data:', err);
      }
    };
    fetchData();
  }, [investigationId]);

  // Fetch narrative and contradictions when tab changes
  useEffect(() => {
    if (activeTab === 'dossier' && investigation) {
        useInvestigation.getState().generateNarrative(investigation.id).then(setNarrative);
    }
    if (activeTab === 'chronicle' && investigation) {
        useInvestigation.getState().fetchContradictions(investigation.id);
    }
  }, [activeTab, investigation]);

  const handleVerify = async (id: number, status: 'VERIFIED' | 'EXCLUDED' | 'PENDING') => {
    setTransactions(prev => prev.map(item => 
      item.tx.id === id ? { ...item, tx: { ...item.tx, verification_status: status } } : item
    ));
    
    addAction({
        tool: 'AdjudicationBench',
        action: `VERDICT_${status}`,
        result: { evidenceId: id.toString(), context: `Manual audit sign-off for ${id}` }
    });

    try {
        await fetch(`${API_URL}/api/v1/forensic/transaction/${investigation.context.projectId}/${id}?status=${status}`, { method: 'PATCH' });
    } catch (e) {
        console.error(e);
    }
  };

  const handleGenerateInterrogationGuide = async () => {
    setIsGeneratingGuide(true);
    try {
        const res = await fetch(`${API_URL}/api/v1/forensic/interrogation-guide/${investigation.id}`);
        if (res.ok) {
            const data = await res.json();
            setInterrogationGuide(data.guide_content);
            setActiveTab('dossier'); // Switch to dossier view to show guide
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingGuide(false);
    }
  };

  if (!investigation) return (
      <div className="flex-1 flex items-center justify-center text-slate-600 font-black uppercase tracking-widest text-xs animate-pulse">
          Selecting Target Case...
      </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full depth-layer-0 p-8 overflow-y-auto custom-scrollbar">
        {/* Case Header */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-black uppercase tracking-widest">
                        Case File
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">{investigation.id}</span>
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{investigation.title}</h1>
            </div>

            <div className="flex items-center gap-6">
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                        <ShieldCheck className="w-2.5 h-2.5" /> Immutable_Proof_Active
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1.5 h-3 bg-emerald-500/20 rounded-sm border border-emerald-500/40 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                            ))}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">V3_ANCHORED</span>
                    </div>
                 </div>

                 <div className="h-10 w-px bg-white/5" />
                 
                 <div className="text-right">
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Risk Profile</p>
                     <p className={`text-2xl font-black ${investigation.riskScore && investigation.riskScore > 70 ? 'text-rose-500' : 'text-indigo-400'}`}>
                         {investigation.riskScore || 0}%
                     </p>
                 </div>
                 <div className="h-10 w-px bg-white/5" />
                 <div className="text-right">
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                     <p className={`text-sm font-black uppercase tracking-widest ${investigation.status === 'completed' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                        {investigation.status}
                     </p>
                 </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-white/5">
            {[
                { id: 'transactions', label: 'Financial Audit', icon: Database },
                { id: 'evidence', label: 'Evidence Bench', icon: Layers },
                { id: 'chronicle', label: 'The Chronicle', icon: Clock },
                { id: 'dossier', label: 'Report Narrative', icon: FileText }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'transactions' | 'evidence' | 'chronicle' | 'dossier')}
                    className={`
                        px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all
                        ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                    `}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'evidence' && (investigation.context.evidence_items?.length || 0) > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[9px]">
                            {investigation.context.evidence_items?.length}
                        </span>
                    )}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
            
            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && (
                <div className="tactical-frame overflow-hidden rounded-[2rem] depth-border-medium shadow-2xl depth-layer-1">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search transactions..." 
                                className="bg-slate-950/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] w-64 text-white uppercase font-black tracking-widest focus:border-indigo-500 outline-none"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Auto-Verify Routine
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="depth-layer-2 text-[9px] uppercase text-depth-secondary font-black tracking-[0.2em] border-b depth-border-subtle">
                            <tr>
                                <th className="p-6">Subject / Vendor</th>
                                <th className="p-6 text-right">Amount</th>
                                <th className="p-6">Risk</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.filter(t => t.tx.receiver.toLowerCase().includes(filter.toLowerCase())).map(item => (
                                <tr key={item.tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                     <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-200 text-sm">{item.tx.receiver}</p>
                                            <Fingerprint 
                                                className="w-3 h-3 text-indigo-500/40 hover:text-indigo-400 cursor-help" 
                                                aria-label="Hashed Integrity Verified"
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-600 font-mono mt-0.5">{item.tx.description}</p>
                                    </td>
                                    <td className="p-6 text-right font-mono font-black text-white text-xs">
                                        Rp {item.tx.actual_amount?.toLocaleString()}
                                    </td>
                                    <td className="p-6">
                                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden mb-1">
                                            <div className={`h-full ${item.risk > 0.7 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${item.risk * 100}%` }} />
                                        </div>
                                        <span className={`text-[9px] font-bold ${item.risk > 0.7 ? 'text-rose-500' : 'text-slate-500'}`}>
                                            {(item.risk * 100).toFixed(0)}% Risk
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${
                                            item.tx.verification_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            item.tx.verification_status === 'EXCLUDED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                            'bg-slate-800 text-slate-500 border-white/5'
                                        }`}>
                                            {item.tx.verification_status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleVerify(item.tx.id, 'VERIFIED')} 
                                                className="p-2 h-8 w-8 flex items-center justify-center hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all" 
                                                title="Mark as Verified"
                                                aria-label="Verify Transaction"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                    <button 
                                        onClick={() => handleVerify(item.tx.id, 'EXCLUDED')} 
                                        className="p-2 h-8 w-8 flex items-center justify-center hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all" 
                                        title="Mark as Excluded"
                                        aria-label="Exclude Transaction"
                                    >
                                       <XCircle className="w-4 h-4" />
                                    </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* EVIDENCE TAB */}
            {activeTab === 'evidence' && (
                <div className="space-y-4">
                    {!investigation.context.evidence_items?.length && (
                        <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                            <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No injected evidence context</p>
                            <p className="text-slate-600 text-[10px] mt-2">Use the Forensic Hub to inject entities, hotspots, or milestones into this case.</p>
                        </div>
                    )}
                    
                     {investigation.context.evidence_items?.map((item, idx) => (
                        <div key={idx} className={`p-6 border rounded-2xl flex items-start gap-4 transition-all ${
                            item.verdict === 'ADMITTED' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                            item.verdict === 'REJECTED' ? 'bg-rose-500/5 border-rose-500/20' : 
                            'depth-layer-1 depth-border-subtle hover:depth-layer-2'
                        }`}>
                            <div className={`p-3 rounded-xl border ${
                                item.verdict === 'ADMITTED' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                item.verdict === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/20' :
                                'depth-layer-3 depth-border-subtle'
                            }`}>
                                <Layers className={`w-5 h-5 ${
                                    item.verdict === 'ADMITTED' ? 'text-emerald-400' :
                                    item.verdict === 'REJECTED' ? 'text-rose-400' :
                                    'text-indigo-400'
                                }`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</h3>
                                        {item.verdict && (
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                                                item.verdict === 'ADMITTED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                            }`}>
                                                {item.verdict}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-black/20 px-2 py-1 rounded">
                                        {item.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 mb-3">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Source: {item.sourceTool}</p>
                                    <p className="text-[10px] font-mono text-slate-700">{item.id}</p>
                                </div>
                                
                         <div className="flex gap-2">
                            <button 
                                onClick={async () => {
                                    setNarrative('');
                                    const text = await useInvestigation.getState().generateNarrative(investigation.id);
                                    setNarrative(text);
                                }}
                                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                            >
                                <RefreshCw className="w-3 h-3" /> Refresh AI Synthesis
                            </button>
                            <button 

                                        onClick={() => useInvestigation.getState().updateEvidenceStatus(investigation.id, item.id, 'ADMITTED')}
                                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                            item.verdict === 'ADMITTED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-emerald-600/20 hover:text-emerald-400'
                                        }`}
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" /> Adjudicate: Admit
                                    </button>
                                    <button 
                                        onClick={() => useInvestigation.getState().updateEvidenceStatus(investigation.id, item.id, 'REJECTED')}
                                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                            item.verdict === 'REJECTED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-rose-600/20 hover:text-rose-400'
                                        }`}
                                    >
                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CHRONICLE TAB */}
            {activeTab === 'chronicle' && (
                <div className="space-y-6">
                    {/* Contradiction Alerts */}
                    {(investigation.context.contradictions?.length || 0) > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" /> Integrity Alerts ({investigation.context.contradictions?.length})
                            </h4>
                            {investigation.context.contradictions?.map((c, i) => (
                                <div key={i} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-start animate-pulse">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-rose-200">{c.type}</p>
                                        <p className="text-[10px] text-rose-400/80 mt-1">{c.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="tactical-card p-8 rounded-3xl depth-border-subtle depth-layer-2 depth-shadow-md">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Adjudication Chronicle</h2>
                        </div>
                        
                        <div className="relative border-l-2 border-indigo-500/20 ml-4 space-y-12 pb-8">
                            {investigation.timeline.map((event, i) => (
                                <div key={i} className="relative pl-8">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center">
                                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-mono text-slate-500">{format(new Date(event.timestamp), 'HH:mm:ss')}</span>
                                        <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">[{event.tool}] {event.action}</span>
                                        {event.result?.context && (
                                            <p className="text-[10px] text-slate-500 italic mt-1 bg-white/5 p-2 rounded-lg border border-white/5">
                                                {event.result.context}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* DOSSIER TAB */}
            {activeTab === 'dossier' && (
                <div className="flex flex-col h-full bg-white text-slate-900 rounded-t-xl overflow-hidden shadow-2xl relative">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                             <FileText className="w-4 h-4 text-slate-500" />
                             <span className="text-xs font-black uppercase tracking-widest text-slate-600">Generated Narrative</span>
                        </div>
                        <div className="flex gap-2">
                                    <button 
                                        disabled={isGeneratingGuide}
                                        onClick={handleGenerateInterrogationGuide}
                                        className="px-3 py-1.5 bg-rose-600/20 text-rose-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        <Fingerprint className="w-3 h-3" /> {isGeneratingGuide ? 'Extracting Psycology...' : 'Generate Interrogation Guide'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const content = interrogationGuide || narrative;
                                            const blob = new Blob([content], { type: 'text/markdown' });

                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `dossier-${investigation.id}.md`;
                                    a.click();
                                }}
                                className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-900"
                            >
                                <Download className="w-3 h-3" /> Export MD
                            </button>
                            <button 
                                disabled={isSealing || investigation.status === 'completed'}
                                onClick={async () => {
                                    if (!confirm("Are you sure you want to SEAL this case? This will generate the final legal hash and lock the records.")) return;
                                    setIsSealing(true);
                                    try {
                                        const hash = await useInvestigation.getState().sealCase(investigation.id);
                                        alert(`Case Sealed Successfully!\nFinal Forensic Hash: ${hash}`);
                                    } catch (e) {
                                        alert("Sealing failed. Check backend.");
                                    } finally {
                                        setIsSealing(false);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
                                    investigation.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white hover:bg-rose-700'
                                }`}
                            >
                                <Lock className="w-3 h-3" /> {investigation.status === 'completed' ? 'Sealed & Validated' : 'Seal Case File'}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed text-sm max-w-3xl mx-auto w-full">
                        {interrogationGuide ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" /> Active Interrogation Protocol
                                    </p>
                                    <p className="text-xs text-rose-800 italic">This document contains sensitive psychological leverage points based on admitted evidence.</p>
                                </div>
                                <pre className="whitespace-pre-wrap font-sans text-slate-800">{interrogationGuide}</pre>
                                <button 
                                    onClick={() => setInterrogationGuide(null)}
                                    className="mt-8 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-all"
                                >
                                    ← Return to Dossier Narrative
                                </button>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap font-sans text-slate-800">{narrative || 'Orchestrating narrative from admitted exhibits...'}</pre>
                        )}
                    </div>
                    {investigation.context.final_report_hash && (
                        <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
                                <Fingerprint className="w-4 h-4" /> Final Report Hash
                            </div>
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-1 rounded truncate max-w-lg">
                                {investigation.context.final_report_hash}
                            </span>
                        </div>
                    )}
                </div>
            )}

        </div>
    </div>
  );
}
