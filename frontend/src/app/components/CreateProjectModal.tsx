'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Calendar, DollarSign, MapPin, FileText, Globe, Target } from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';
import { API_ROUTES } from '../../services/apiRoutes';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

interface FormErrors {
  name?: string;
  contractor_name?: string;
  expected_completion?: string;
}

interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  threat_type: string;
  description: string;
}

export default function CreateProjectModal({
  isOpen,
 onClose,
  onSuccess,
}: CreateProjectModalProps) {
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
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loadingHotspots, setLoadingHotspots] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (showMap && hotspots.length === 0) {
      setLoadingHotspots(true);
      authenticatedFetch(API_ROUTES.PROJECTS.HOTSPOTS)
        .then(r => {
          if (!r.ok) throw new Error('Failed to fetch hotspots');
          return r.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setHotspots(data);
          } else {
            console.error("Hotspots data is not an array:", data);
          }
          setLoadingHotspots(false);
        })
        .catch(err => {
          console.error("Failed to fetch tactical hotspots", err);
          setLoadingHotspots(false);
          // Fallback to minimal mock if API fails
          setHotspots([
            { 
              id: 'FB-JKT-01', 
              name: 'Jakarta CBD - Ghost Materials', 
              latitude: -6.2, 
              longitude: 106.8, 
              risk_score: 0.5, 
              threat_type: 'Logistics Anomaly', 
              description: 'Manual fallback for central district monitoring.' 
            },
          ]);
        });
    }
  }, [showMap, hotspots.length]);

  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Project name must be at least 3 characters';
    }
    
    if (!formData.contractor_name.trim()) {
      errors.contractor_name = 'Contractor name is required';
    }
    
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        errors.expected_completion = 'End date must be after start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        contract_value: parseFloat(formData.contract_value.replace(/\./g, '')) || 0,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
      };

      const response = await authenticatedFetch(API_ROUTES.PROJECTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create project');
      }

      const project = await response.json();
      onSuccess(project.id);
      onClose();

      // Reset form
      setFormData({
        name: '',
        contractor_name: '',
        contract_value: '',
        start_date: '',
        end_date: '',
        location: '',
        description: '',
        latitude: null,
        longitude: null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      New Audit Operation
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Initialize a new forensic investigation
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  title="Close"
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Project Name */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Project Name *
                  </label>
                  <div className="relative">
                     <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                     <input
                       type="text"
                       required
                       value={formData.name}
                       onChange={(e) => {
                         setFormData({ ...formData, name: e.target.value });
                         setFormErrors(prev => ({ ...prev, name: undefined }));
                       }}
                       placeholder="e.g., Skyrise Tower Construction Audit"
                       className={`w-full bg-slate-800 border rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                         formErrors.name ? 'border-rose-500/50' : 'border-white/10 focus:border-indigo-500/50'
                       }`}
                     />
                     {formErrors.name && (
                       <p className="mt-1 text-xs text-rose-400 font-medium">{formErrors.name}</p>
                     )}
                   </div>
                </div>

                {/* Contractor Name */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Contractor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contractor_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractor_name: e.target.value,
                      })
                    }
                    placeholder="e.g., PT Konstruksi Megah"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none transition-colors"
                  />
                </div>

                {/* Contract Value */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Contract Value (IDR) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={formData.contract_value}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '';
                        setFormData({
                          ...formData,
                          contract_value: formatted,
                        });
                      }}
                      placeholder="e.g., 50.000.000.000"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        title="Start Date"
                        placeholder="YYYY-MM-DD"
                        className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end_date: e.target.value,
                        })
                      }
                      title="End Date"
                      placeholder="YYYY-MM-DD"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Location with Geo-Intelligence Hub */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                      Location
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                        showMap 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-slate-800 text-indigo-400 hover:bg-slate-700'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      {showMap ? 'Hide Map' : 'Geo-Intelligence Hub'}
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
                        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3 flex items-center gap-2">
                            <Target className="w-3 h-3 text-rose-500" /> Active Threat Hotspots
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {loadingHotspots ? (
                              <div className="text-[10px] text-slate-500 font-mono animate-pulse p-4 text-center">
                                Fetching Tactical Intelligence...
                              </div>
                            ) : (
                              hotspots.map((hotspot) => (
                                <button
                                  key={hotspot.name}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ 
                                      ...formData, 
                                      location: hotspot.name,
                                      latitude: hotspot.latitude,
                                      longitude: hotspot.longitude
                                    });
                                    setSelectedHotspot(hotspot.name);
                                  }}
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    formData.location === hotspot.name
                                      ? 'bg-indigo-500/10 border-indigo-500/50'
                                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                                  }`}
                                >
                                  <div className="text-left">
                                    <div className={`text-xs font-bold ${
                                      formData.location === hotspot.name ? 'text-indigo-400' : 'text-slate-200'
                                    }`}>
                                      {hotspot.name}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono italic">
                                      {hotspot.threat_type}
                                    </div>
                                  </div>
                                  <MapPin className={`w-4 h-4 ${
                                    formData.location === hotspot.name ? 'text-indigo-500' : 'text-slate-600'
                                  }`} />
                                </button>
                              ))
                            )}
                          </div>
                          <div className="mt-4 h-32 bg-slate-950 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
                            
                            <svg viewBox="0 0 600 200" className="absolute inset-0 w-full h-full opacity-20">
                              <g fill="currentColor" className="text-indigo-500">
                                <path d="M20,60 L50,30 L80,60 L60,110 Z" /> {/* Sumatra */}
                                <path d="M70,115 L150,115 L150,125 L70,125 Z" /> {/* Java */}
                                <path d="M90,40 L130,40 L130,80 L90,80 Z" /> {/* Kalimantan */}
                                <path d="M140,50 L160,50 L160,65 L175,65 L175,80 L160,80 L160,95 L140,95 Z" /> {/* Sulawesi */}
                                <g> {/* Maluku Group */}
                                  <circle cx="180" cy="70" r="3" />
                                  <circle cx="190" cy="80" r="4" />
                                  <circle cx="185" cy="90" r="2" />
                                </g>
                                <path d="M200,80 L250,80 L250,110 L210,110 L200,95 Z" /> {/* Papua */}
                              </g>
                            </svg>

                            <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] animate-pulse z-10">
                              Archipelago Intelligence Active
                            </div>
                            {/* Visual representation of dots */}
                            <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e] animate-ping" />
                            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b] animate-ping" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="e.g., Jakarta Selatan, Indonesia"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Brief description of the audit scope..."
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-colors"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
