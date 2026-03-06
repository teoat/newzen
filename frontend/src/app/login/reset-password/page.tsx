'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthService from '@/services/AuthService';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-white font-bold">Invalid Reset Link</h2>
        <p className="text-slate-400 text-xs">This link is missing a security token. Please request a new link.</p>
        <Link href="/login/forgot-password" className="text-indigo-400 block pt-4 text-[10px] font-black uppercase">Request New Token</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await AuthService.resetPassword({ token, new_password: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h3 className="text-white font-bold">Access Restored</h3>
        <p className="text-slate-400 text-xs">Your credentials have been updated. Redirecting to uplink...</p>
        <Link href="/login" className="text-indigo-400 font-bold uppercase text-[10px]">Manual Login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">New Access Key</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">Confirm Key</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "UPDATE CREDENTIALS"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <div className="min-h-screen depth-layer-0" />;

  return (
    <div className="min-h-screen depth-layer-0 flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10 relative"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Key Reset</h1>
            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-[0.2em]">Protocol: OVERWRITE_ACCESS</p>
          </div>

          <React.Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
            <ResetPasswordForm />
          </React.Suspense>
        </div>
      </motion.div>
    </div>
  );
}
