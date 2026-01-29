
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useBatchProcessing } from '@/hooks/useBatchProcessing';
import { BatchJob } from '@/types/batch';

export function BatchProcessingPanel({ projectId }: { projectId: string }) {
    const { 
        submitBatchJob, 
        cancelBatchJob, 
        activeJobs, 
        completedJobs 
    } = useBatchProcessing(projectId);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Batch Operations</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                            {activeJobs.length} Active / {completedJobs.length} Completed
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {activeJobs.map(job => (
                        <BatchJobCard key={job.id} job={job} onCancel={cancelBatchJob} />
                    ))}
                    {activeJobs.length === 0 && (
                        <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl">
                            <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No Active Jobs</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function BatchJobCard({ job, onCancel }: { job: BatchJob, onCancel: (id: string) => void }) {
    const isProcessing = job.status === 'processing';
    const isFailed = job.status === 'failed';
    const isCompleted = job.status === 'completed';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-xl border ${
                isFailed ? 'bg-rose-500/5 border-rose-500/20' : 
                isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' :
                'bg-slate-900/40 border-white/5'
            }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    {isProcessing && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" />}
                    {isFailed && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    
                    <div>
                        <h4 className="text-xs font-bold text-white">{job.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-mono text-slate-500">{job.id.slice(0, 8)}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider ${
                                isFailed ? 'text-rose-400' : isCompleted ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                                {job.status}
                            </span>
                        </div>
                    </div>
                </div>
                
                {isProcessing && (
                    <button 
                        onClick={() => onCancel(job.id)} 
                        className="text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress}%` }}
                    className={`h-full ${
                        isFailed ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                />
            </div>
            
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                <span>{job.progress}% Processed</span>
                {job.eta && <span>ETA: {job.eta}s</span>}
            </div>

            {/* Sub-tasks or Errors */}
            {job.error && (
                <div className="mt-3 p-2 bg-rose-500/10 rounded-lg text-[10px] text-rose-300 font-medium">
                    {job.error}
                </div>
            )}
        </motion.div>
    );
}
