'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  GitMerge, 
  ArrowRight, 
  Search, 
  CheckCircle,
  AlertOctagon,
  Sparkles,
  Link,
  Ghost
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Bubble {
  id: string;
  type: 'INTERNAL' | 'BANK' | 'GHOST';
  text: string;
  amount: number;
  x: number;
  y: number;
  r: number;
  matchedWith?: string;
  confidence?: number; // 0-1 for match confidence
}

const INITIAL_BUBBLES: Bubble[] = [
  // BANK (Emerald) - Truth Anchors (Right Side)
  { id: 'b1', type: 'BANK', text: 'UBER TECHNOLOGIES', amount: 450000, x: 700, y: 150, r: 40 },
  { id: 'b2', type: 'BANK', text: 'TOKOPEDIA DIGITAL', amount: 1250000, x: 750, y: 300, r: 50 },
  { id: 'b3', type: 'BANK', text: 'TRF TO PT BETON JAYA', amount: 50000000, x: 800, y: 450, r: 70 },
  
  // INTERNAL (Amber) - Floating Claims (Left Side)
  { id: 'i1', type: 'INTERNAL', text: 'Transport - Site Visit', amount: 150000, x: 150, y: 100, r: 35 },
  { id: 'i2', type: 'INTERNAL', text: 'Transport - Client Mtg', amount: 300000, x: 200, y: 180, r: 38 },
  { id: 'i3', type: 'INTERNAL', text: 'Project Server Hosting', amount: 1250000, x: 180, y: 320, r: 50 },
  
  // GHOST (White/Hollow) - Lazarus Prediction
  { id: 'g1', type: 'GHOST', text: 'PREDICTED: Monthly Concrete', amount: 50000000, x: 300, y: 450, r: 65, confidence: 0.95 },
];

import { authenticatedFetch } from '@/lib/api';
import { useProject } from '@/store/useProject';

export function SwarmReconciliation() {
  const { activeProjectId } = useProject();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProjectId) return;
    const fetchSwarm = async () => {
        try {
            const res = await authenticatedFetch(`/api/v1/forensic-tools/${activeProjectId}/swarm`);
            if (res.ok) {
                const data = await res.json();
                if (data.bubbles && data.bubbles.length > 0) {
                    setBubbles(data.bubbles);
                } else {
                    // Fallback to demo if empty
                    setBubbles(INITIAL_BUBBLES);
                }
            }
        } catch (e) {
            console.error("Swarm Fetch Error", e);
            setBubbles(INITIAL_BUBBLES);
        }
    };
    fetchSwarm();
  }, [activeProjectId]);
  
  // Simulation Loop for "Gravity"
  useEffect(() => {
    const interval = setInterval(() => {
        setBubbles(prev => {
            return prev.map(b => {
                let dx = 0;
                let dy = 0;
                
                // 1. Semantic Gravity
                // Uber matched to Transport (i1, i2)
                if (b.id === 'b1') {
                     // Attract i1 and i2
                }
                
                // Manual simple clustering for demo
                if (b.id === 'i1' || b.id === 'i2') {
                    // Move towards 'b1' (Uber)
                    dx += (700 - b.x) * 0.02;
                    dy += (150 - b.y) * 0.02;
                }
                
                if (b.id === 'i3') {
                     // Move towards 'b2' (Tokopedia)
                     dx += (750 - b.x) * 0.03;
                    dy += (300 - b.y) * 0.03;
                }
                
                if (b.id === 'g1') {
                    // Ghost moves to match b3
                     dx += (800 - b.x) * 0.04;
                    dy += (450 - b.y) * 0.04;
                }
                
                // 2. Repulsion (don't overlap too much)
                prev.forEach(other => {
                    if (b.id !== other.id) {
                        const dist = Math.sqrt(Math.pow(b.x - other.x, 2) + Math.pow(b.y - other.y, 2));
                        const minDist = b.r + other.r + 10;
                        if (dist < minDist) {
                            const force = (minDist - dist) * 0.05;
                            const angle = Math.atan2(b.y - other.y, b.x - other.x);
                            dx += Math.cos(angle) * force;
                            dy += Math.sin(angle) * force;
                        }
                    }
                });
                
                return { ...b, x: b.x + dx, y: b.y + dy };
            });
        });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden rounded-[3rem] border border-white/5 shadow-2xl">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle,rgba(99,102,241,0.1)_1px,transparent_1px)] [background-size:30px_30px]"
      />
      
      {/* HUD HEADER */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none z-10">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] pointer-events-auto">Swarm Interface V2</h2>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Autonomous Semantic Clustering</p>
        </div>
        
        <div className="flex gap-4 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur border border-white/10 p-4 rounded-2xl">
                <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Confidence Threshold</div>
                <div className="text-xl font-black text-emerald-400">94.2%</div>
            </div>
        </div>
      </div>

      {/* SWARM CANVAS */}
      <div className="w-full h-full relative">
        {bubbles.map(b => (
            <motion.div
                key={b.id}
                initial={{ scale: 0 }}
                animate={{ 
                    x: b.x, 
                    y: b.y, 
                    scale: 1,
                    boxShadow: b.type === 'GHOST' 
                        ? '0 0 20px rgba(255,255,255,0.1)' 
                        : b.type === 'BANK' 
                        ? '0 0 30px rgba(16,185,129,0.2)' 
                        : '0 0 30px rgba(245,158,11,0.2)'
                }}
                className={`absolute flex flex-col items-center justify-center text-center p-4 rounded-full border-2 cursor-pointer transition-colors backdrop-blur-md
                    ${b.type === 'BANK' 
                        ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-100' 
                        : b.type === 'GHOST'
                        ? 'bg-slate-800/10 border-white/20 text-slate-300 border-dashed'
                        : 'bg-amber-900/40 border-amber-500/50 text-amber-100'
                    }
                `}
                style={{ 
                    width: b.r * 2.5, 
                    height: b.r * 2.5,
                    marginLeft: -b.r * 1.25,
                    marginTop: -b.r * 1.25
                }}
                onClick={() => setSelectedBubble(b.id)}
            >
                {b.type === 'GHOST' && <Ghost size={16} className="mb-1 opacity-50" />}
                <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{b.text}</span>
                <span className="text-[10px] font-mono mt-1 opacity-80">
                    {(b.amount / 1000).toFixed(0)}k
                </span>
                
                {/* CONNECTOR LINES (If matched) */}
                {/* Visualized by proximity in this prototype */}
            </motion.div>
        ))}
        
        {/* CENTER MAGNET */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-full border-l border-dashed border-indigo-500/10" />
      </div>

        {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 p-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full flex gap-4 pointer-events-auto">
            <Button className="rounded-full h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest">
                <GitMerge className="w-4 h-4 mr-2" /> Accept All Matches
            </Button>
            <Button variant="outline" className="rounded-full h-12 px-8 border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest text-slate-400">
                Adjust Gravity
            </Button>
      </div>

    </div>
  );
}
