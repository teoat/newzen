'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

export default function TestTransactionPage() {
  const [formData, setFormData] = useState({
    amount: 15000,
    sender: 'Alice Smith',
    receiver: 'Crypto-Global Alpha',
    description: 'Investment payment'
  });
interface TestResult {
  evaluation: {
    status: 'flagged' | 'clear';
    risk_score: number;
    alerts: string[];
  };
  transaction_id: string;
}

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/fraud/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Fraud Simulation Lab</h1>
        <p className="text-slate-500 text-sm">Fire a transaction event to test the real-time engine.</p>
      </header>

      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase">Amount ($)</label>
               <input 
                 type="number" 
                 value={formData.amount}
                 onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                 className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
               />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase">Sender</label>
               <input 
                 type="text" 
                 value={formData.sender}
                 onChange={e => setFormData({...formData, sender: e.target.value})}
                 className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
               />
             </div>
          </div>
          
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase">Receiver</label>
             <input 
               type="text" 
               value={formData.receiver}
               onChange={e => setFormData({...formData, receiver: e.target.value})}
               className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
               placeholder="e.g. Crypto-Vault"
             />
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
             <textarea 
               value={formData.description}
               onChange={e => setFormData({...formData, description: e.target.value})}
               className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24"
             />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : <><Send className="w-4 h-4" /> Fire Event</>}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-3xl border ${result.evaluation.status === 'flagged' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}
          >
            <div className="flex items-center justify-between mb-4">
               <h2 className="font-bold flex items-center gap-2">
                 {result.evaluation.status === 'flagged' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                 Evaluation Result
               </h2>
               <div className="text-2xl font-mono">
                 {(result.evaluation.risk_score * 100).toFixed(0)}% Risk
               </div>
            </div>
            
            <div className="space-y-2">
               {result.evaluation.alerts.map((alert: string, i: number) => (
                 <div key={i} className="text-sm flex items-center gap-2 text-slate-400">
                   <div className="w-1 h-1 bg-red-400 rounded-full" />
                   {alert}
                 </div>
               ))}
               {result.evaluation.alerts.length === 0 && (
                 <p className="text-sm text-slate-400 italic font-mono">No heuristic flags triggered.</p>
               )}
            </div>
            
            <div className="mt-6 p-4 bg-black/20 rounded-xl text-xs font-mono text-slate-500">
               ID: {result.transaction_id}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex justify-center">
        <button 
          onClick={() => window.location.href = '/'}
          className="text-slate-500 hover:text-white text-sm transition-colors"
        >
          Return to Command Center
        </button>
      </div>
    </div>
  );
}
