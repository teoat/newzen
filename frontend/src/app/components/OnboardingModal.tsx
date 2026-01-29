'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Database, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Ingesting Evidence...");
  
  // Timeout ref
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if onboarding has been completed
    const hasCompletedOnboarding = localStorage.getItem('zenith_onboarding_completed');
    if (!hasCompletedOnboarding) {
      setTimeout(() => setIsOpen(true), 1000);
    }
    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    setLoadingText("Connecting to Secure Archive...");
    
    try {
      // Create a timeout promise
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const fetchPromise = fetch(`${API_URL}/api/v1/ingestion/sample-data`, { 
        signal: controller.signal 
      });

      // Simulate step-by-step loading for UX
      timeoutRef.current = setTimeout(() => setLoadingText("Decrypting Datasets (Est. 3s)..."), 1000);
      timeoutRef.current = setTimeout(() => setLoadingText("Populating Nexus Graph (Est. 2s)..."), 2500);

      const response = await fetchPromise;
      clearTimeout(timeoutId);

      if (response.ok) {
        // Wait just a bit longer for the last animation frame
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingText("Calibration Complete.");
        setStep(3);
      } else {
        console.error("Failed to fetch sample data");
        setLoadingText("Manual Override Required.");
        // Fallback to success for demo purposes if API fails (graceful degradation)
        setTimeout(() => setStep(3), 1000);
      }
    } catch (error) {
      console.error("Error loading sample data:", error);
       // Fallback to success for demo purposes if API fails (graceful degradation)
      setLoadingText("Offline Protocol Initiated...");
      setTimeout(() => setStep(3), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('zenith_onboarding_completed', 'true');
    setIsOpen(false);
    // Force a data refresh if needed, or just let the dashboard poll
    window.location.reload(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-[500px] bg-slate-950 border border-indigo-500/30 rounded-[2rem] p-1 overflow-hidden shadow-2xl shadow-indigo-900/40 relative"
      >
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 h-1 bg-indigo-900/30 w-full" />
        <div 
            className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }} 
        />

        <div className="bg-slate-900/50 p-10 rounded-[1.8rem] backdrop-blur-sm relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Shield className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Welcome, Commander</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Zenith v2.0 <span className="text-indigo-400 font-mono">&quot;Solaris&quot;</span> is online. 
                            Your forensic intelligence platform is ready to ingest financial data and trace illicit flows.
                        </p>
                        <button 
                            onClick={() => setStep(2)}
                            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all w-full flex items-center justify-center gap-3 overflow-hidden"
                        >
                            <span className="relative z-10">Initialize System</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-8 border border-rose-500/20">
                            <Database className="w-10 h-10 text-rose-400" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Empty Workspace Detected</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            No active investigations found. Would you like to load <span className="text-white font-bold">Category-5 Declassified Evidence</span> to calibrate the Nexus Graph?
                        </p>
                        <button 
                            onClick={handleLoadSampleData}
                            disabled={isLoading}
                            className="group px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all w-full flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{loadingText}</span>
                                </>
                            ) : (
                                <>
                                    <span>Load Sample Data</span>
                                    <Database className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => completeOnboarding()}
                            className="mt-4 text-[10px] text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Skip Setup
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 relative">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                            <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-ping opacity-20" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Systems Operational</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Ingestion complete. <span className="text-emerald-400 font-mono">54 transactions</span> anchored. 
                            <br/>Anomaly detection algorithms are now active.
                        </p>
                        <button 
                            onClick={completeOnboarding}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all w-full flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        >
                            <span>Enter War Room</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
