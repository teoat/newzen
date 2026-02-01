/**
 * Focus Trap Modal Component
 * A modal with built-in focus trap and keyboard navigation
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface FocusTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * FocusTrapModal - Modal with accessible focus management
 * - Traps focus within the modal
 * - Handles Escape key to close
 * - Restores focus on close
 * - Handles click outside to close
 */
export function FocusTrapModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: FocusTrapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = title ? `modal-title-${title.toLowerCase().replace(/\s/g, '-')}` : undefined;

  useFocusTrap(containerRef, {
    active: isOpen,
    onEscape: onClose,
    onClickOutside: onClose,
  });

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative z-50 w-full ${sizeClasses[size]} bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl`}
            tabIndex={-1}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-8 border-b border-white/5">
                <h2 id={titleId} className="text-xl font-bold text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default FocusTrapModal;
