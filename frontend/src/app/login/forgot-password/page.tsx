'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import AuthService from '@/services/AuthService';

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen depth-layer-0" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await AuthService.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Recovery request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen depth-layer-0 flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10 relative"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Key Recovery</h1>
            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-[0.2em]">Protocol: ACCESS_RESTORATION</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-slate-400 text-xs text-center leading-relaxed">
                Enter your registered agent email to receive a secure restoration link.
              </p>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">Agent Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
                    placeholder="agent@zenith.node"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SEND RESTORATION LINK"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Transmission Sent</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  If that email exists in our records, a secure restoration link has been dispatched to your terminal.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                  <ArrowLeft className="w-3 h-3" /> RETURN TO UPLINK
                </Link>
              </div>
            </div>
          )}

          {!success && (
            <div className="mt-8 text-center">
              <Link href="/login" className="text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> BACK TO LOGIN
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
