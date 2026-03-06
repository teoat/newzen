'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, ShieldCheck, Save, Briefcase, DollarSign, Calendar, MapPin, FileText, Globe, Loader2, ArrowRight } from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';
import { API_ROUTES } from '../../services/apiRoutes';
import dynamic from 'next/dynamic';
import { useLocationStore, CITIES } from '../../store/useLocationStore';
import { ProjectRegionTag } from '../../components/LocationFeatures';
import { Button } from '@/components/ui/button';

// Dynamically import Leaflet with no SSR
const LeafletMap = dynamic(() => import('../../components/LeafletMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-900 animate-pulse rounded-[2rem]" />
});

interface UpdateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSuccess: () => void;
}

export default function UpdateProjectModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: UpdateProjectModalProps) {
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize form with project data
  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        contractor_name: project.contractor_name || '',
        contract_value: project.contract_value ? new Intl.NumberFormat('id-ID').format(project.contract_value) : '',
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
        location: project.location || '',
        description: project.description || '',
        latitude: project.latitude || null,
        longitude: project.longitude || null,
      });

      if (project.latitude && project.longitude) {
         setLocation({
            name: project.location || 'Selected Location',
            lat: project.latitude,
            lng: project.longitude,
            province: 'Unknown'
         });
      }
      setStep(1);
    }
  }, [project, isOpen, setLocation]);

  // Handle manual location input for reverse sync
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });
    const matchedCity = CITIES.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (matchedCity) {
      setLocation(matchedCity);
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Project name is required';
    if (!formData.contractor_name.trim()) errors.contractor_name = 'Contractor name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) setStep(3);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      nextStep();
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        contract_value: typeof formData.contract_value === 'string' 
            ? parseFloat(formData.contract_value.replace(/\./g, '')) || 0
            : formData.contract_value,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
      };

      const response = await authenticatedFetch(API_ROUTES.PROJECTS.DETAIL(project.id), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update project');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Identity', icon: Briefcase },
    { id: 2, title: 'Logistics', icon: MapPin },
    { id: 3, title: 'Scope', icon: FileText },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <Settings className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Adjust <span className="text-amber-500">Operation</span></h2>
                    <p className="text-[11px] text-slate-500 font-mono uppercase tracking-[0.2em]">Update localized forensic contexts</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-3 hover:bg-white/5 rounded-2xl transition-colors group"
                >
                  <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Step Progress */}
              <div className="px-8 mt-8 mb-4">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0" />
                  {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = step >= s.id;
                    const isCurrent = step === s.id;
                    return (
                      <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                          isCurrent 
                            ? 'bg-amber-600 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110' 
                            : isActive 
                              ? 'bg-slate-800 border-amber-500/50' 
                              : 'bg-slate-900 border-white/5'
                        }`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-400' : 'text-slate-600'}`}>
                          {s.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                <form id="update-project-form" onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      {error}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                              Project Designation
                            </label>
                            <div className="relative group">
                              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                              <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full bg-slate-950/50 border rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none transition-all ${
                                  formErrors.name ? 'border-rose-500/50' : 'border-white/5 focus:border-amber-500/50'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                Contractor Entity
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.contractor_name}
                                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                Asset Value (IDR)
                              </label>
                              <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                  type="text"
                                  required
                                  value={formData.contract_value}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d]/g, '');
                                    const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '';
                                    setFormData({ ...formData, contract_value: formatted });
                                  }}
                                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                              Deployment Start
                            </label>
                            <div className="relative group">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                              <input
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs text-white focus:border-amber-500/50 outline-none transition-all invert-[0.8] brightness-[1.5] contrast-[1.2] grayscale"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                              Deployment End
                            </label>
                            <input
                              type="date"
                              value={formData.end_date}
                              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-white focus:border-amber-500/50 outline-none transition-all invert-[0.8] brightness-[1.5] contrast-[1.2] grayscale"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2 ml-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                              Target Geo-Location
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowMap(!showMap)}
                              className={`flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest transition-all ${
                                showMap 
                                  ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                              }`}
                            >
                              <Globe className="w-3 h-3" />
                              {showMap ? 'Lock Coordinates' : 'Geo-Intel Map'}
                            </button>
                          </div>

                          <AnimatePresence>
                            {showMap && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 overflow-hidden"
                              >
                                 <div className="rounded-2xl border border-white/5 overflow-hidden">
                                   <LeafletMap />
                                 </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                            <input
                              type="text"
                              value={formData.location}
                              onChange={handleLocationInputChange}
                              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                            Operational Scope & Description
                          </label>
                          <div className="relative group">
                            <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={5}
                              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all resize-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                             <ShieldCheck className="w-5 h-5 text-amber-500 mt-0.5" />
                             <div>
                                <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Integrity Protocol Active</p>
                                <p className="text-[10px] text-amber-400/60 mt-1 leading-relaxed">
                                  Updating this operation will re-synchronize forensic compute resources and update the secure ledger metadata.
                                </p>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-950/50 border-t border-white/5 flex gap-4">
                {step > 1 ? (
                  <button
                    onClick={prevStep}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Cancel
                  </button>
                )}
                
                <button
                  form="update-project-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : step === 3 ? (
                    <>
                      <Save className="w-4 h-4" />
                      Seal Changes
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}