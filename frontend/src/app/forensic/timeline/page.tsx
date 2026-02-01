'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Download, RefreshCw, Search, Activity
} from 'lucide-react';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { API_URL } from '../../../lib/constants';
import VirtualizedTimeline from '../../../components/ForensicChronology/VirtualizedTimeline';
import EventDetailModal from '../../../components/ForensicChronology/EventDetailModal';
import { TimelineEvent } from '../../../components/ForensicChronology/ForensicChronology';

export default function ForensicTimelinePage() {
    const { activeProjectId } = useProject();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchTimeline = useCallback(async () => {
        if (!activeProjectId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/v1/forensic-tools/${activeProjectId}/chronology`);
            if (res.ok) {
                const data = await res.json();
                // Convert string timestamps to Date objects for the Chronology component
                const processedEvents = (data.events || []).map((ev: any) => ({
                    ...ev,
                    timestamp: new Date(ev.timestamp),
                    // Map snake_case to camelCase for the component
                    riskLevel: ev.risk_level || ev.riskLevel || 'low'
                }));
                setEvents(processedEvents);
            } else {
                setError('Failed to load chronology data');
            }
        } catch (err) {
            console.error("Chronology fetch failed:", err);
            setError('Network error loading timeline');
        } finally {
            setIsLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        return events.filter((e: TimelineEvent) => {
            const matchesSearch = e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 e.title?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'all' || e.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [events, searchTerm, filterType]);

    const handleEventClick = (event: TimelineEvent) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const isMock = events.length === 0 && !isLoading;

    return (
        <ForensicPageLayout 
            title="Investigation Chronology"
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 italic tracking-tighter">ZENITH_CHRONOLOGY_v3.0</h1>
                        <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em]">High-Fidelity Event Reconstruction & Sequence Verification</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => fetchTimeline()}
                            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/5 transition-all"
                        >
                            <RefreshCw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Sync</span>
                        </button>
                        <button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-4 py-2 flex items-center gap-2 transition-all">
                            <Download className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Export</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH RECONSTRUCTED SEQUENCES..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'transaction', 'evidence', 'milestone', 'risk_flag'].map((type) => (
                            <button 
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`rounded-lg text-[10px] font-bold uppercase tracking-widest py-3 px-4 transition-all border ${
                                    filterType === type 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' 
                                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                                }`}
                            >
                                {type.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timeline Display */}
                <div className="relative rounded-2xl bg-slate-950 border border-white/5 overflow-hidden min-h-[600px] shadow-2xl">
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm"
                            >
                                <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
                                <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Syncing Event Logs...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {events.length > 0 ? (
                        <VirtualizedTimeline 
                            events={filteredEvents} 
                            height={600} 
                            onEventClick={handleEventClick}
                            // itemSize={90} // Adjust based on row height
                        />
                    ) : !isLoading && (
                        <div className="flex flex-col items-center justify-center h-[600px] text-slate-500 font-mono text-xs uppercase tracking-widest">
                            <Clock className="w-12 h-12 mb-4 opacity-20" />
                            <span>No encoded sequences found in this project</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Exploration Modal */}
            {selectedEvent && (
                <EventDetailModal 
                    isOpen={showEventModal}
                    onClose={() => setShowEventModal(false)}
                    event={selectedEvent}
                />
            )}
        </ForensicPageLayout>
    );
}
