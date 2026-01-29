'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, Download, RefreshCw
} from 'lucide-react';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { useProject } from '@/store/useProject';
import { API_URL } from '@/utils/constants';
import { ForensicChronology, TimelineEvent } from '@/components/ForensicChronology/ForensicChronology';

export default function ForensicTimelinePage() {
    const { activeProjectId } = useProject();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeline = async () => {
        if (!activeProjectId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Use the new Phase 4 chronology endpoint
            const res = await fetch(`${API_URL}/api/v1/forensic-tools/${activeProjectId}/chronology`);
            if  (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            } else {
                setError('Failed to load chronology data');
            }
        } catch (err) {
            console.error("Chronology fetch failed:", err);
            setError('Network error loading timeline');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    }, [activeProjectId]);

    const handleEventClick = (event: TimelineEvent) => {
        console.log('Event clicked:', event);
        // TODO: Open event details modal or navigate to related entity
    };

    return (
        <ForensicPageLayout
            title="Forensic Chronology"
            subtitle="Interactive Timeline of Evidence & Events"
            icon={Clock}
        >
            <div className="p-10 h-full flex flex-col gap-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                            Phase 4 Enhanced Timeline
                        </h3>
                        {events.length > 0 && (
                            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {events.length} Events
                            </span>
                        )}
                    </div>

                    <button
                        onClick={fetchTimeline}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Timeline Component */}
                <div className="flex-1 relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl z-10">
                            <div className="text-center">
                                <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                    Loading Chronology...
                                </p>
                            </div>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl">
                            <div className="text-center max-w-md">
                                <p className="text-sm font-black text-rose-400 uppercase tracking-widest mb-4">
                                    {error}
                                </p>
                                <button
                                    onClick={fetchTimeline}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <ForensicChronology
                            events={events}
                            onEventClick={handleEventClick}
                            height={700}
                            allowFilter={true}
                            allowExport={true}
                        />
                    )}

                    {!isLoading && !error && events.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm rounded-3xl">
                            <div className="text-center">
                                <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                                    No events in chronology
                                </p>
                                <p className="text-xs text-slate-600 mt-2">
                                    Add transactions or evidence to see timeline
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="tactical-card p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                        <span>🤖 Phase 4 Enhanced • AI-Powered Timeline Visualization</span>
                        <span>⚡ Real-time • Zoom/Filter • Export Enabled</span>
                    </div>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
