'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ShieldCheck, AlertCircle, Maximize2 } from 'lucide-react';
import NeuralCard from './NeuralCard';

interface BridgePart {
  id: string;
  name: string;
  description: string;
  status: 'verified' | 'warning' | 'pending';
  coordinates: { x: number; y: number; w: number; h: number };
  materialComposition: string;
  calcData: { volume: number; ratio: number; result: number };
}

const BRIDGE_PARTS: BridgePart[] = [
  {
    id: 'abutment_a',
    name: 'Abutment A (West)',
    description: 'Foundational support at the western approach. Critical for load distribution.',
    status: 'verified',
    coordinates: { x: 5, y: 15, w: 10, h: 40 },
    materialComposition: 'Foundational Concrete K-250',
    calcData: { volume: 450, ratio: 384, result: 172800 }
  },
  {
    id: 'pier_1',
    name: 'Central Pier',
    description: 'Mid-span structural column. Suspected material substitution area.',
    status: 'warning',
    coordinates: { x: 45, y: 25, w: 10, h: 50 },
    materialComposition: 'Reinforced Concrete K-350',
    calcData: { volume: 120, ratio: 413, result: 49560 }
  },
  {
    id: 'abutment_b',
    name: 'Abutment B (East)',
    description: 'Eastern support structure. Shows significant volume discrepancy in ledger.',
    status: 'warning',
    coordinates: { x: 80, y: 15, w: 10, h: 40 },
    materialComposition: 'Foundational Concrete K-250',
    calcData: { volume: 420, ratio: 384, result: 161280 }
  },
  {
    id: 'deck_slab',
    name: 'Superstructure Deck',
    description: 'Main bridge surface. Cast-in-place prestressed concrete.',
    status: 'pending',
    coordinates: { x: 15, y: 15, w: 65, h: 10 },
    materialComposition: 'Prestressed Concrete K-500',
    calcData: { volume: 800, ratio: 384, result: 307200 }
  }
];

interface Props {
  onSelectPart: (part: BridgePart | null) => void;
}

export default function BridgeStructuralDiagram({ onSelectPart }: Props) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const selectedPart = BRIDGE_PARTS.find(p => p.id === selectedPartId);

  const handleSelect = (part: BridgePart) => {
    setSelectedPartId(part.id);
    onSelectPart(part);
  };

  return (
    <NeuralCard className="relative overflow-hidden min-h-[500px] flex flex-col p-0">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
         <div>
            <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Structural Reconciliation Map</h4>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Girder Bridge: Abutment & Pier Synthesis</p>
         </div>
         <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
               <ShieldCheck className="w-3 h-3" /> Spatial Link Active
            </div>
         </div>
      </div>

      <div className="relative flex-1 bg-slate-950 p-4">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 opacity-40">
            <Image
               src="/api/artifacts/bridge_structural_audit_blueprint_v2"
               alt="Bridge Blueprint"
               fill
               className="object-contain grayscale brightness-75 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
         </div>

        {/* Interactive Layer */}
        <div className="relative z-10 w-full h-full border border-white/5 rounded-2xl overflow-hidden backdrop-blur-[1px]">
           <svg viewBox="0 0 100 100" className="w-full h-full cursor-crosshair">
              {BRIDGE_PARTS.map((part) => (
                <g key={part.id} className="group" onClick={() => handleSelect(part)}>
                  <motion.rect
                     x={part.coordinates.x}
                     y={part.coordinates.y}
                     width={part.coordinates.w}
                     height={part.coordinates.h}
                     className={`
                        fill-transparent stroke-2 transition-all
                        ${part.id === selectedPartId ? 'stroke-indigo-400 fill-indigo-500/20' : 
                          part.status === 'verified' ? 'stroke-emerald-500/40 hover:fill-emerald-500/10' : 
                          part.status === 'warning' ? 'stroke-rose-500/40 hover:fill-rose-500/10' : 
                          'stroke-indigo-500/40 hover:fill-indigo-500/10'}
                     `}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     whileHover={{ scale: 1.02 }}
                  />
                  {/* Glowing Dots at centers */}
                  <circle 
                     cx={part.coordinates.x + part.coordinates.w / 2} 
                     cy={part.coordinates.y + part.coordinates.h / 2} 
                     r="0.5" 
                     className={`${part.status === 'verified' ? 'fill-emerald-500' : part.status === 'warning' ? 'fill-rose-500' : 'fill-indigo-500'} animate-pulse`}
                  />
                </g>
              ))}
           </svg>

           {/* Labels */}
           {BRIDGE_PARTS.map((part) => {
             const labelColor = part.status === 'verified' ? 'text-emerald-500' : 
                               part.status === 'warning' ? 'text-rose-500' : 'text-indigo-500';
             return (
               <div 
                  key={`${part.id}-label`}
                  className={`absolute text-[8px] font-black uppercase tracking-widest pointer-events-none ${labelColor}`}
                  style={{ 
                     left: `${part.coordinates.x}%`, 
                     top: `${part.coordinates.y - 4}%`
                  }}
               >
                  {part.name}
               </div>
             );
           })}
        </div>

        {/* Info Panel Overlay */}
        <AnimatePresence>
          {selectedPart && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="absolute right-8 bottom-8 w-72 z-20"
            >
               <div className="tactical-card p-6 rounded-[2rem] bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                     <h5 className="text-xs font-black text-white uppercase italic">{selectedPart.name}</h5>
                     <button 
                        onClick={() => { setSelectedPartId(null); onSelectPart(null); }} 
                        className="text-slate-500 hover:text-white"
                        aria-label="Close details"
                     >
                        <AlertCircle className="w-4 h-4 rotate-45" />
                     </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-6 leading-relaxed italic">{selectedPart.description}</p>
                  
                  <div className="space-y-4">
                     <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Design Mix</div>
                        <div className="text-[11px] font-bold text-indigo-400 uppercase">{selectedPart.materialComposition}</div>
                     </div>
                     <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <Maximize2 className="w-3 h-3" /> View Specs
                     </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
         <div className="flex gap-4">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[8px] font-black text-slate-500 uppercase">Substructure</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               <span className="text-[8px] font-black text-slate-500 uppercase">Superstructure</span>
            </div>
         </div>
         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white">Toggle Full Blueprint</span>
      </div>
    </NeuralCard>
  );
}
