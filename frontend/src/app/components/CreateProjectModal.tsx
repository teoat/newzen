'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Calendar, DollarSign, MapPin, FileText, Globe, ShieldCheck, Loader2, ArrowRight, ChevronLeft, Plus } from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';
import { API_ROUTES } from '../../services/apiRoutes';
import dynamic from 'next/dynamic';
import { useLocationStore, CITIES } from '../../store/useLocationStore';

// Dynamically import Leaflet with no SSR
const LeafletMap = dynamic(() => import('../../components/LeafletMap'), { 
  ssr: false,
  loading: () => <div className="h-[250px] w-full bg-slate-950 animate-pulse rounded-2xl border border-white/5" />
});

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    contractor_name: '',
    contract_value: '',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { currentLocation, setLocation } = useLocationStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      location: currentLocation.name,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng
    }));
  }, [currentLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        contract_value: parseFloat(formData.contract_value.replace(/\./g, '')) || 0,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      const response = await authenticatedFetch(API_ROUTES.PROJECTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to initialize operation');
      }

      onSuccess();
      onClose();
      // Reset
      setStep(1);
      setFormData({
        name: '', contractor_name: '', contract_value: '',
        start_date: '', end_date: '', location: '',
        description: '', latitude: null, longitude: null
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Designation', icon: Briefcase },
    { id: 2, label: 'Deployment', icon: MapPin },
    { id: 3, label: 'Context', icon: FileText },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#020617] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <header className="p-8 pb-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">New <span className="text-indigo-500">Operation</span></h2>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Secure Initialization Protocol</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </header>

            {/* Step Progress */}
            <nav className="px-8 py-6 bg-slate-900/30 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />
                    {steps.map((s) => {
                        const Icon = s.icon;
                        const isCurrent = step === s.id;
                        const isPast = step > s.id;
                        return (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-500 ${
                                    isCurrent ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 
                                    isPast ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-white/5 text-slate-700'
                                }`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : isPast ? 'text-emerald-500' : 'text-slate-700'}`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            <FormField label="Mission Designation" icon={Briefcase} placeholder="e.g. SKYRISE AUDIT 2026" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                            <FormField label="Primary Contractor" icon={ShieldCheck} placeholder="PT KONSTRUKSI JAYA" value={formData.contractor_name} onChange={(v: string) => setFormData({...formData, contractor_name: v})} />
                            <FormField label="Authorized Budget (IDR)" icon={DollarSign} placeholder="50.000.000.000" value={formData.contract_value} isCurrency onChange={(v: string) => setFormData({...formData, contract_value: v})} />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Start Date" type="date" value={formData.start_date} onChange={(v: string) => setFormData({...formData, start_date: v})} />
                                <FormField label="Target End" type="date" value={formData.end_date} onChange={(v: string) => setFormData({...formData, end_date: v})} />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector Coordinates</label>
                                    <button type="button" onClick={() => setShowMap(!showMap)} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                                        {showMap ? '[ Lock Location ]' : '[ Open Intel Map ]'}
                                    </button>
                                </div>
                                {showMap && <div className="rounded-2xl overflow-hidden border border-white/10"><LeafletMap /></div>}
                                <FormField label="Primary Region" icon={MapPin} value={formData.location} onChange={(v: string) => setFormData({...formData, location: v})} />
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Scope</label>
                                <textarea 
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all h-32 resize-none"
                                    placeholder="Describe mission objectives and forensic focus areas..."
                                    value={formData.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                                <Globe className="w-5 h-5 text-indigo-500 shrink-0" />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-wide">
                                    Initializing this operation creates a localized forensic node. All data ingested will be processed through the <span className="text-indigo-400">Sovereign-X</span> dialectic pipeline.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            {/* Footer Actions */}
            <footer className="p-8 pt-0 flex gap-3 shrink-0">
                {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-4 bg-slate-900 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                )}
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Initializing...</> : 
                     step === 3 ? 'Initialize Mission' : <>{step === 1 ? 'Configure Deployment' : 'Review Context'} <ArrowRight className="w-4 h-4" /></>}
                </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FormField({ label, icon: Icon, isCurrency, onChange, ...props }: any) {
    const handleValueChange = (e: any) => {
        let val = e.target.value;
        if (isCurrency) {
            val = val.replace(/[^\d]/g, '');
            val = val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '';
        }
        onChange(val);
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative group">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />}
                <input 
                    {...props}
                    onChange={handleValueChange}
                    className={`w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 text-sm text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all ${Icon ? 'pl-12' : 'px-5'} ${props.type === 'date' ? 'invert-[0.8] brightness-[1.5] contrast-[1.2] grayscale' : ''}`} 
                />
            </div>
        </div>
    );
}
