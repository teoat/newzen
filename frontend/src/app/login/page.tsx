'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Radio, Zap, TrendingUp, AlertTriangle, Loader2, Quote, Building2, ArrowRight, Mail, Key } from 'lucide-react';
import Link from 'next/link';
import { dark } from '@clerk/themes';
import AuthService from '@/services/AuthService';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState<'clerk' | 'manual'>('clerk');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen depth-layer-0" />;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await AuthService.login({ login: loginId, password, remember_me: rememberMe });
      router.push('/'); // Redirect to root dashboard
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const WorkflowStep = ({ number, title, desc, active = false }: { number: string, title: string, desc: string, active?: boolean }) => (
    <div className="relative pl-10 pb-10 last:pb-0">
        {/* Line */}
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 to-transparent last:hidden" />
        
        {/* Dot */}
        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-black z-10 ${
            active 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                : 'bg-slate-900 border-slate-700 text-slate-500'
        }`}>
            {number}
        </div>

        <div className={`transition-all duration-500 ${active ? 'opacity-100' : 'opacity-60'}`}>
            <h4 className="text-white font-bold text-sm tracking-tight mb-1">{title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">{desc}</p>
        </div>
    </div>
  );

   return (
     <div className="min-h-screen depth-layer-0 flex items-center justify-end p-6 relative overflow-hidden bg-[#020617]">
      {/* Background Workflow Visualization (Watermark Style) */}
      <div className="absolute inset-x-0 inset-y-0 z-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 transform -rotate-12 scale-125">
              <div className="space-y-20">
                  <WorkflowStep number="01" title="INGESTION" desc="OCR/RAG Multimodal Input" active />
                  <WorkflowStep number="02" title="RECONCILIATION" desc="Neural Discrepancy Matching" active />
              </div>
              <div className="space-y-20 mt-40">
                  <WorkflowStep number="03" title="RELATIONSHIP" desc="Sovereign Nexus discovery" active />
                  <WorkflowStep number="04" title="ADJUDICATION" desc="Cryptographic Court Sealing" active />
              </div>
          </div>
      </div>
      
      {/* Ambient Glows - Mirrored & Enhanced */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[120px] rounded-full z-0 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/15 blur-[120px] rounded-full z-0 animate-pulse" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full z-0" />

      {/* Main Login Card with 3D Depth */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ perspective: 1000 }}
        className="w-full max-w-lg z-10 relative"
      >
          {/* 3D Depth Layers */}
          <div className="absolute inset-0 bg-indigo-500/10 rounded-[3rem] translate-y-4 translate-x-2 blur-2xl -z-10" />
          <div className="absolute inset-0 bg-slate-950/50 rounded-[3rem] translate-y-2 translate-x-1 -z-10 border border-white/5" />
          
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_80px_rgba(79,70,229,0.1)] relative overflow-hidden group flex flex-col items-center">
              {/* Inner Gloss */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="text-center mb-10">
                  <motion.div 
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-6 cursor-pointer"
                  >
                      <Radio className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">Zenith Forensic</h1>
                  <p className="text-[11px] text-indigo-400 font-mono uppercase tracking-[0.4em]">Auth Gateway Node // v2.5</p>
                  
                  {/* Mode Toggle */}
                  <div className="flex bg-slate-950/50 p-1 rounded-full mt-8 border border-white/5">
                      <button 
                        onClick={() => setAuthMode('clerk')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${authMode === 'clerk' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Clerk Auth
                      </button>
                      <button 
                        onClick={() => setAuthMode('manual')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${authMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Manual Login
                      </button>
                  </div>
              </div>

              <div className="w-full">
                <AnimatePresence mode="wait">
                  {authMode === 'clerk' ? (
                    <motion.div
                      key="clerk"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <SignIn 
                          routing="hash"
                          appearance={{
                              baseTheme: dark,
                              elements: {
                                  card: "bg-transparent shadow-none w-full",
                                  headerTitle: "hidden",
                                  headerSubtitle: "hidden",
                                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white",
                                  formFieldInput: "bg-slate-950/80 border-white/10 text-white",
                                  footer: "hidden"
                              }
                          }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <form onSubmit={handleManualLogin} className="space-y-4">
                        {error && (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] p-3 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">Agent Identifier</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              type="text" 
                              value={loginId}
                              onChange={(e) => setLoginId(e.target.value)}
                              required
                              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder="Email or Codename"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">Access Key</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              type="password" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="hidden" 
                            />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 group-hover:border-white/20'}`}>
                              {rememberMe && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Persist 24h</span>
                          </label>
                          <Link href="/login/forgot-password" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider">
                            Key Recovery?
                          </Link>
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              INITIATE UPLINK
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                      
                      <div className="text-center pt-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">No credentials? </span>
                        <Link href="/signup" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest">Enrollment</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

          </div>

          <div className="mt-10 text-center">
             <p className="text-[11px] text-slate-600 font-mono uppercase tracking-[0.3em] mb-4">
                 Protocol: OAUTH2.1 // Node: SEA_PRIME
             </p>
             <div className="flex items-center justify-center gap-4">
                 <div className="flex items-center gap-2 text-[8px] text-emerald-500 font-black tracking-widest">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                     SYSTEMS OPERATIONAL
                 </div>
                 <div className="w-px h-3 bg-white/5" />
                 <div className="text-[8px] text-slate-500 font-black tracking-widest uppercase">
                     GPL v3.0 // EXEMPT
                 </div>
             </div>
          </div>
      </motion.div>
    </div>
  );
}
