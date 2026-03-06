'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  HardHat, 
  Activity, 
  Info, 
  Terminal,
  FileText,
  TrendingDown,
  Layout,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useProject } from '../../../store/useProject';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import MaterialIntegrityCard from '../../../app/components/MaterialIntegrityCard';
import NeuralCard from '../../../app/components/NeuralCard';
import BridgeStructuralDiagram from '../../../app/components/BridgeStructuralDiagram';
import ForensicLogicPath from '../../../components/ForensicAnalysis/ForensicLogicPath';
import BridgeComponentInfographic from '../../../components/ForensicAnalysis/BridgeComponentInfographic';
import { API_URL } from '../../../lib/constants';

export default function MaterialLabPage() {
  const { activeProjectId } = useProject();
  const [data, setData] = useState<any>(null);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'audit' | 'educational'>('audit');
  const [ratios, setRatios] = useState({
    cement_kg_m3: 384,
    steel_kg_m3: 110,
    sand_kg_m3: 692,
    stone_kg_m3: 1039,
  });

  const fetchData = async () => {
    if (!activeProjectId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v2/forensic-v2/rab/variance/${activeProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           BETON: ratios,
           CONCRETE: ratios
        })
      });
      if (!res.ok) throw new Error('Failed to fetch forensic data');
      const json = await res.json();
      setData(json.material_forensics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ForensicPageLayout
      title="Global Material Synthesis Lab"
      subtitle="Financial vs Physical Reconciliation Engine"
      icon={HardHat}
      headerActions={
        <div className="flex bg-slate-900 rounded-2xl p-1 border border-white/5 shadow-xl">
           <button 
              onClick={() => setViewMode('audit')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
           >
              <Terminal className="w-3 h-3" /> Technical Audit
           </button>
           <button 
              onClick={() => setViewMode('educational')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'educational' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
           >
              <HelpCircle className="w-3 h-3" /> Visual Guide
           </button>
        </div>
      }
    >
      <div className="p-12 max-w-7xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-12 items-start justify-between">
           <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4 text-emerald-400">
                 <Activity className="w-5 h-5 animate-pulse" />
                 <span className="text-[11px] font-black uppercase tracking-[0.4em]">Integrated GMF Integrity Mode</span>
              </div>
              <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                 Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-500">Material Fund</span>
              </h2>
              <p className="text-sm font-bold text-slate-400 max-w-2xl leading-relaxed uppercase tracking-widest">
                Zenith v4.0 GMF synthesized total project volume with theoretical material coefficients. 
                We detect discrepancies by comparing required material funds (calculated via CCO formulas) 
                against actual capital outflow categorized in the ledger.
              </p>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 h-32 flex flex-col justify-between min-w-[160px]">
                 <Layout className="w-4 h-4 text-emerald-400" />
                 <div>
                    <div className="text-2xl font-black text-white font-mono uppercase italic">GMF-v4</div>
                    <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Logic standard</div>
                 </div>
              </div>
              <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 h-32 flex flex-col justify-between min-w-[160px]">
                 <Layers className="w-4 h-4 text-indigo-400" />
                 <div>
                    <div className="text-2xl font-black text-white font-mono uppercase italic">Multimodal</div>
                    <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Analysis Engine</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Audit View Mode */}
        {viewMode === 'audit' ? (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                 {loading ? (
                   <div className="h-96 w-full bg-white/5 rounded-[3rem] animate-pulse" />
                 ) : error ? (
                   <div className="p-10 rounded-[3rem] bg-rose-500/10 border border-rose-500/20 text-center">
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest leading-relaxed">
                         Error analyzing material fund: {error}
                      </p>
                   </div>
                 ) : data && data.status !== 'NO_DATA' ? (
                   <MaterialIntegrityCard data={data} />
                 ) : (
                   <div className="p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 text-center">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                         No budget data identified for GMF synthesis in this project cycle.
                      </p>
                   </div>
                 )}
                 
                 <ForensicLogicPath 
                    stages={[
                      {
                        label: "Physical Volume",
                        value: `${selectedPart?.calcData?.volume || 450} m³`,
                        description: "Computed from site survey & NeRF reconstruction.",
                        status: "normal"
                      },
                      {
                        label: "Theoretical Ratio",
                        value: `${selectedPart?.calcData?.ratio || 384} kg/m³`,
                        description: "Standard coefficient for K-350 Concrete.",
                        status: "normal",
                        formula: "Material_REQ = Volume * Coefficient"
                      },
                      {
                        label: "Total Requirement",
                        value: `${((selectedPart?.calcData?.volume || 450) * (selectedPart?.calcData?.ratio || 384) / 1000).toFixed(1)} Tons`,
                        description: "Minimum physical mass required for structural safety.",
                        status: "normal"
                      },
                      {
                        label: "Found Ledger",
                        value: "142.5 Tons",
                        description: "Total material purchases identified in bank records.",
                        status: "anomaly",
                        formula: "Variance = Found - Required"
                      }
                    ]}
                 />
              </div>

              <div className="space-y-12">
                 <BridgeStructuralDiagram onSelectPart={setSelectedPart} />
                 
                 <NeuralCard className="bg-blue-500/5 border-blue-500/10 mb-8">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <Terminal className="w-4 h-4 text-indigo-400" />
                           <span className="text-[11px] font-black text-white uppercase tracking-widest italic">Intensity Calibration</span>
                        </div>
                        <button 
                           onClick={fetchData}
                           className="text-[8px] font-black text-indigo-400 hover:text-white uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded transition-all hover:bg-indigo-500/20"
                        >
                           Recalculate
                        </button>
                     </div>
                     <div className="space-y-4">
                        {Object.entries(ratios).map(([key, val]) => (
                           <div key={key} className="space-y-2">
                              <div className="flex justify-between">
                                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</label>
                                 <span className="text-[8px] font-bold text-white font-mono">{val} KG/M³</span>
                              </div>
                              <input 
                                 type="range" 
                                 min={10} max={2000} 
                                 value={val} 
                                 onChange={(e) => setRatios(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                 className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                           </div>
                        ))}
                     </div>
                  </NeuralCard>

                 <NeuralCard className="bg-rose-500/5 border-rose-500/10">
                    <div className="flex items-center gap-4 mb-6">
                       <ShieldAlert className="w-4 h-4 text-rose-400" />
                       <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest italic">Anomally Triggers</span>
                    </div>
                    <div className="space-y-4">
                       <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                          <p className="text-[11px] font-black text-white uppercase mb-1">Low Steel Output (D25/D32)</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold italic">Often indicates reduced rebar density in abutments.</p>
                       </div>
                       <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                          <p className="text-[11px] font-black text-white uppercase mb-1">Sand/Stone Padding</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold italic">Excess transactions for stone usually mask labor theft.</p>
                       </div>
                    </div>
                 </NeuralCard>
              </div>
           </div>
        ) : (
           /* Educational View Mode */
           <div className="space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <BridgeComponentInfographic 
                    components={[
                      { id: 'abutment_l', name: 'Abutment (Left)', status: 'verified', progress: 100 },
                      { id: 'span_1', name: 'Main Span A', status: 'anomaly', progress: 65 },
                      { id: 'span_2', name: 'Main Span B', status: 'verified', progress: 95 },
                      { id: 'abutment_r', name: 'Abutment (Right)', status: 'verified', progress: 100 }
                    ]}
                 />

                 <div className="flex flex-col justify-center space-y-12">
                    <div className="space-y-6">
                       <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">How we calculate?</h3>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          Think of it like a recipe. If the bridge needs 100 bags of cement, but the bank receipts only show 50 bags were bought, then half the bridge is missing its &quot;glue&quot;.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xl italic">01</div>
                          <div>
                             <h4 className="text-white font-black uppercase text-xs italic tracking-widest">Measure Volume</h4>
                             <p className="text-[11px] text-slate-500 uppercase font-bold mt-1">We count how big the pillars and roads are.</p>
                          </div>
                       </div>
                       <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xl italic">02</div>
                          <div>
                             <h4 className="text-white font-black uppercase text-xs italic tracking-widest">Apply Formula</h4>
                             <p className="text-[11px] text-slate-500 uppercase font-bold mt-1">We calculate how much sand, stone, and steel that size needs.</p>
                          </div>
                       </div>
                       <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xl italic">03</div>
                          <div>
                             <h4 className="text-white font-black uppercase text-xs italic tracking-widest">Match Receipts</h4>
                             <p className="text-[11px] text-slate-500 uppercase font-bold mt-1">We check the actual money spent to see if it matches.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </ForensicPageLayout>
  );
}
