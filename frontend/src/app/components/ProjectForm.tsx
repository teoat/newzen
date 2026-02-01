'use client';

import React from 'react';
import { Briefcase, DollarSign, Calendar, MapPin, FileText } from 'lucide-react';

interface ProjectFormData {
  name: string;
  contractor_name: string;
  contract_value: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

interface ProjectFormProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  formErrors: Record<string, string>;
  showMap: boolean;
  hotspots: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    risk_score: number;
    threat_type: string;
    description: string;
  }>;
  loadingHotspots: boolean;
  selectedHotspot: string | null;
  setSelectedHotspot: (hotspot: string | null) => void;
  isSubmitting: boolean;
}

export function ProjectForm({
  formData,
  setFormData,
  formErrors,
  showMap,
  hotspots,
  loadingHotspots,
  selectedHotspot,
  setSelectedHotspot,
  isSubmitting,
}: ProjectFormProps) {
  return (
    <div className="space-y-6">
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
            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors"
          />
        </div>
      </div>

      {showMap && (
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3">Active Threat Hotspots</p>
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
        </div>
      )}

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
    </div>
  );
}
