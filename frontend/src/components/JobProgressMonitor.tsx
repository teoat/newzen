/**
 * Job Progress Monitor Component
 * Displays real-time progress of batch processing jobs
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  TrendingUp,
  AlertTriangle,
  X
} from 'lucide-react';
import { useJobMonitor } from '@/hooks/useJobMonitor';

interface JobProgressMonitorProps {
  jobId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function JobProgressMonitor({ 
  jobId, 
  onComplete, 
  onError,
  onClose
}: JobProgressMonitorProps) {
  const { job, error, isLoading, cancelJob } = useJobMonitor(jobId);

  React.useEffect(() => {
    if (job?.status === 'completed' && onComplete) {
      onComplete();
    }
    if (job?.status === 'failed' && onError) {
      onError(job.error_message || 'Job processing failed');
    }
  }, [job?.status, onComplete, onError, job?.error_message]);

  if (!job && isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-900/40 rounded-2xl border border-white/5">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
        <XCircle className="w-5 h-5 text-rose-500" />
        <span className="text-sm text-rose-400">{error}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-rose-500/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-rose-400" />
          </button>
        )}
      </div>
    );
  }

  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-rose-500" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-slate-500" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'border-emerald-500/20 bg-emerald-500/10';
      case 'failed':
      case 'cancelled':
        return 'border-rose-500/20 bg-rose-500/10';
      case 'processing':
        return 'border-indigo-500/20 bg-indigo-500/10';
      default:
        return 'border-white/5 bg-slate-900/40';
    }
  };

  const handleCancel = async () => {
    const success = await cancelJob();
    if (success) {
      console.log('Job cancelled successfully');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${getStatusColor()} space-y-4 relative`}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Batch Processing
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              Status: {job.status}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {job.progress_percent.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest">
            Complete
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.progress_percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>
            {job.items_processed.toLocaleString()} / {job.total_items.toLocaleString()} items
          </span>
          {job.estimated_completion_time && job.status === 'processing' && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ETA: {new Date(job.estimated_completion_time).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-xs font-bold text-slate-400">Success</div>
            <div className="text-sm font-black text-white">
              {job.success_rate.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-indigo-500" />
          <div>
            <div className="text-xs font-bold text-slate-400">Batches</div>
            <div className="text-sm font-black text-white">
              {job.batches_completed}/{job.total_batches}
            </div>
          </div>
        </div>
        {job.items_failed > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <div>
              <div className="text-xs font-bold text-slate-400">Failed</div>
              <div className="text-sm font-black text-rose-400">
                {job.items_failed.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {job.error_message && (
        <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
          <p className="text-xs text-rose-400">{job.error_message}</p>
        </div>
      )}

      {/* Actions */}
      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            Cancel Job
          </button>
        </div>
      )}
    </motion.div>
  );
}
