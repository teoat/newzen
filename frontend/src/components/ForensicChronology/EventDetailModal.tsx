/**
 * Event Detail Modal
 * Shows comprehensive information about a timeline event
 * Includes focus trap and keyboard navigation for accessibility
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, FileText, User, Tag, Link as LinkIcon } from 'lucide-react';
import { TimelineEvent } from './ForensicChronology';

interface EventDetailModalProps {
  event: TimelineEvent | null;
  onClose: () => void;
  isOpen?: boolean;
}

const Activity = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

/**
 * EventDetailModal - Displays detailed information about a timeline event
 * Features:
 * - Focus trap for accessibility
 * - Escape key to close
 * - ARIA attributes for screen readers
 */
const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, isOpen = true }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ESCAPE') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key === 'TAB') {
      const container = modalRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          e.stopPropagation();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          e.stopPropagation();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !event) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, event]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !event) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'risk_flag':
      case 'alert':
        return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case 'evidence':
      case 'document':
        return <FileText className="w-6 h-6 text-blue-400" />;
      case 'user_action':
        return <User className="w-6 h-6 text-purple-400" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;

    const colors = {
      critical: 'bg-red-600 text-white border-red-700',
      high: 'bg-red-500/20 text-red-300 border-red-500/50',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      low: 'bg-green-500/20 text-green-300 border-green-500/50',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm border font-bold uppercase tracking-wider ${colors[riskLevel as keyof typeof colors] || ''}`}>
        {riskLevel}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between p-8 border-b border-white/5">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-white/5 rounded-2xl shadow-inner">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <h2 id="event-modal-title" className="text-3xl font-black text-white italic tracking-tighter mb-2">
                    {event.title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    {getRiskBadge(event.riskLevel)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] custom-scrollbar">
              {event.description && (
                <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Event Narrative</h3>
                  <p className="text-slate-200 text-lg leading-relaxed font-medium">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                {event.entity && (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3 h-3 text-indigo-400" />
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Target Entity</span>
                    </div>
                    <p className="text-white font-bold text-lg">{event.entity}</p>
                  </div>
                )}

                {event.amount !== undefined && (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Financial Impact</span>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {event.currency || 'IDR'} {event.amount.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Sequence Type</span>
                  </div>
                  <p className="text-white font-bold text-lg capitalize">{event.type.replace('_', ' ')}</p>
                </div>

                {event.source && (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Data Source</span>
                    </div>
                    <p className="text-white font-bold text-lg">{event.source}</p>
                  </div>
                )}
              </div>

              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Diagnostic Metadata</h3>
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono text-xs">
                    <pre className="text-indigo-300 whitespace-pre-wrap">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white/5 flex justify-end gap-3 border-t border-white/5">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Close Record
              </button>
              <button
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <LinkIcon className="w-4 h-4" />
                Analyze Trace
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EventDetailModal;
