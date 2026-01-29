'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Calendar, DollarSign, MapPin, FileText } from 'lucide-react';
import { API_URL } from '@/utils/constants';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        contract_value: parseFloat(formData.contract_value),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
      };

      const response = await fetch(`${API_URL}/project/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Skyrise Tower Construction Audit"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none transition-colors"
                    />
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
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.contract_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contract_value: e.target.value,
                        })
                      }
                      placeholder="e.g., 50000000000"
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

                {/* Location */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Location
                  </label>
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
