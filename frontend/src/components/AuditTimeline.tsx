import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AuditLog {
  id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_reason?: string;
  timestamp: string;
  changed_by_user_id?: string;
}

interface AuditTimelineProps {
  entityId: string;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7900';

export default function AuditTimeline({ entityId, isOpen, onClose }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/reconciliation/audit/${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    if (isOpen && entityId) {
      fetchLogs();
    }
  }, [isOpen, entityId, fetchLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Forensic Audit Trail</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {entityId}</p>
          </div>
          <button onClick={onClose} title="Close Audit Trail" aria-label="Close Audit Trail" className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-slate-600 italic">
            No audit history found for this record.
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Icon Marker */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-auto md:right-1/2 translate-x-0">
                   {log.action === 'FORENSIC_FLAG' ? (
                     <span className="text-red-500 text-lg">⚠️</span>
                   ) : log.action === 'CONFIRM_MATCH' ? (
                     <span className="text-emerald-500 text-lg">✓</span>
                   ) : (
                     <span className="text-blue-500 text-lg">ℹ️</span>
                   )}
                </div>

                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/50 p-4 rounded-xl border border-slate-700 ml-14 md:ml-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.action === 'FORENSIC_FLAG' ? 'bg-red-500/20 text-red-400' :
                      log.action === 'CONFIRM_MATCH' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.action}
                    </span>
                    <time className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</time>
                  </div>
                  
                  <div className="text-slate-300 text-sm mt-2 font-medium">
                    {log.change_reason || 'No reason provided'}
                  </div>
                  
                  {log.field_name && (
                    <div className="mt-2 text-xs bg-slate-900/50 p-2 rounded border border-slate-800/50 font-mono">
                      <div className="text-slate-500 mb-1">Field: {log.field_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 line-through decoration-red-500/50 opacity-70">{log.old_value || 'None'}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-emerald-400">{log.new_value}</span>
                      </div>
                    </div>
                  )}
                  
                  {log.changed_by_user_id && (
                    <div className="mt-2 text-[10px] text-slate-600 text-right">
                      User: {log.changed_by_user_id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
