import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Box, Maximize, Activity, Box as BoxIcon, Info } from 'lucide-react';
import Bridge3DView from './Bridge3DView';

interface BridgeComponent {
  id: string;
  name: string;
  status: 'pending' | 'verified' | 'anomaly';
  progress: number;
  highlight?: boolean;
}

interface BridgeInfographicProps {
  components: BridgeComponent[];
  title?: string;
}

const BridgeComponentInfographic: React.FC<BridgeInfographicProps> = ({ 
  components,
  title = "Physical Structure Forensic Model"
}) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  return (
    <div className="bg-slate-950 border border-white/5 rounded-[40px] p-10 shadow-2xl overflow-hidden relative group h-full flex flex-col">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
            <p className="text-indigo-400 text-[11px] font-mono tracking-[0.4em] uppercase mt-2">v3.0 Structural Analysis // Material Reality Matching</p>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10">
                <button 
                    onClick={() => setViewMode('2d')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === '2d' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    2D Schematic
                </button>
                <button 
                    onClick={() => setViewMode('3d')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === '3d' ? 'bg-indigo-500 text-white animate-pulse' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    3D Navigable
                </button>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Reality Sync: Active</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[400px] relative">
            <AnimatePresence mode="wait">
                {viewMode === '2d' ? (
                    <motion.div 
                        key="2d"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="h-full flex items-center justify-center"
                    >
                        {/* Abstract Bridge Representation */}
                        <div className="relative w-full max-w-2xl h-64 flex items-end justify-around gap-4 px-12">
                            {/* Bridge Abutment (Left) */}
                            <ComponentNode comp={components.find(c => c.id === 'abutment_l')} />
                            
                            {/* Spans */}
                            <div className="flex-1 flex gap-4 h-full items-end pb-8">
                                {components.filter(c => c.id.startsWith('span')).map(c => (
                                    <ComponentNode key={c.id} comp={c} isSpan />
                                ))}
                            </div>

                            {/* Bridge Abutment (Right) */}
                            <ComponentNode comp={components.find(c => c.id === 'abutment_r')} />

                            {/* The Deck Overlay */}
                            <motion.div 
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                className="absolute top-1/4 left-0 right-0 h-4 bg-slate-900 border-x border-white/10 rounded-full"
                            >
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full"></div>
                                <div className="absolute top-0 left-0 bottom-0 bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="3d"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="h-full"
                    >
                        <Bridge3DView components={components} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-4">
            {components.map(c => (
                <div key={c.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{c.id}</div>
                    <div className="text-xs font-black text-white uppercase truncate">{c.name}</div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${c.status === 'anomaly' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${c.progress}%` }}
                            ></div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{c.progress}%</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const ComponentNode = ({ comp, isSpan = false }: { comp?: BridgeComponent, isSpan?: boolean }) => {
    if (!comp) return null;
    
    return (
        <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`relative flex flex-col items-center group cursor-pointer ${isSpan ? 'flex-1' : 'w-24'}`}
        >
            <div className={`w-full ${isSpan ? 'h-32' : 'h-48'} rounded-2xl border-2 transition-all shadow-2xl relative overflow-hidden ${
                comp.status === 'anomaly' ? 'bg-rose-500/20 border-rose-500 shadow-rose-900/40' :
                comp.status === 'verified' ? 'bg-emerald-500/20 border-emerald-500 shadow-emerald-900/40' :
                'bg-slate-900 border-white/10'
            }`}>
                {/* Visual Internal structure based on progress */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/10 transition-all duration-1000" style={{ height: `${comp.progress}%` }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_1px,transparent_1px)] bg-[size:10px_10px] opacity-20"></div>
                </div>

                {comp.status === 'anomaly' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                         <Activity className="w-8 h-8 text-rose-500 animate-pulse" />
                    </div>
                )}
            </div>
            
            <div className="mt-4 text-center">
                <span className="text-[11px] font-black text-white uppercase tracking-tighter block">{comp.name}</span>
                <span className={`text-[8px] font-mono mt-1 ${
                    comp.status === 'anomaly' ? 'text-rose-500' : 'text-slate-500'
                }`}>{comp.status.toUpperCase()}</span>
            </div>
        </motion.div>
    );
};

export default BridgeComponentInfographic;
