'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { SignUp } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Shield, TrendingUp, Mail, Key, User, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { dark } from '@clerk/themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/AuthService';

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState<'clerk' | 'manual'>('clerk');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen depth-layer-0" />;

  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await AuthService.signup({ 
        email, 
        password, 
        full_name: fullName, 
        username: username || undefined 
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen depth-layer-0 flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
      {/* Background Ambience */}
      <div className="absolute inset-x-0 inset-y-0 z-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 transform -rotate-12 scale-125 opacity-10">
               {/* Decorative background elements similar to login */}
               <div className="w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full" />
               <div className="w-96 h-96 bg-rose-500/20 blur-[100px] rounded-full" />
          </div>
      </div>
      
      {/* Main Signup Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ perspective: 1000 }}
        className="w-full max-w-lg z-10 relative"
      >
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_80px_rgba(79,70,229,0.1)] relative overflow-hidden flex flex-col items-center">
              
               <div className="text-center mb-8">
                   <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-4">
                       <Shield className="w-6 h-6 text-white" />
                   </div>
                   <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">New Agent Induction</h1>
                   <p className="text-[11px] text-indigo-400 font-mono uppercase tracking-[0.2em]">Zenith Forensic // Protocol V2.5</p>

                   {/* Mode Toggle */}
                   <div className="flex bg-slate-950/50 p-1 rounded-full mt-6 border border-white/5 w-full">
                      <button 
                        onClick={() => setAuthMode('clerk')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${authMode === 'clerk' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Clerk
                      </button>
                      <button 
                        onClick={() => setAuthMode('manual')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${authMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Manual
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
                      <SignUp 
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
                          signInUrl="/login"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <form onSubmit={handleManualSignup} className="space-y-4">
                        {error && (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] p-3 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold ml-1">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                              <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-white text-xs focus:border-indigo-500/50 outline-none transition-all"
                                placeholder="Agent Name"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold ml-1">Codename</label>
                            <input 
                              type="text" 
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:border-indigo-500/50 outline-none transition-all"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold ml-1">Email Node</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input 
                              type="email" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-white text-xs focus:border-indigo-500/50 outline-none transition-all"
                              placeholder="agent@zenith.node"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold ml-1">Access Key</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input 
                              type="password" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-white text-xs focus:border-indigo-500/50 outline-none transition-all"
                              placeholder="Minimum 8 characters"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group text-xs mt-4"
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              CONFIRM ENROLLMENT
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                      
                      <div className="text-center pt-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Existing Agent? </span>
                        <Link href="/login" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest">Re-Link</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>


          </div>
      </motion.div>
    </div>
  );
}
