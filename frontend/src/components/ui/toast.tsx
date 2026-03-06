'use client';

/**
 * Toast Component
 * Provides a toast notification system with success, error, info, and warning types
 * 
 * @example
 * ```tsx
 * // In your app root
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * 
 * // In components
 * const { toast } = useToast()
 * toast('Operation successful', 'success')
 * toast('Something went wrong', 'error')
 * ```
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast notification types
 */
type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification interface
 */
interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast context interface
 */
interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, action?: Toast['action']) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider - Wraps the app to provide toast functionality
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', action?: Toast['action']) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message, action }]);
    
    if (!action) {
      setTimeout(() => dismiss(id), 5000);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * ToastContainer - Renders the toast notifications
 */
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 bg-emerald-500/10';
      case 'error': return 'border-rose-500/20 bg-rose-500/10';
      case 'warning': return 'border-amber-500/20 bg-amber-500/10';
      case 'info': return 'border-indigo-500/20 bg-indigo-500/10';
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-[100] p-6 pointer-events-none">
      <div className="space-y-3 min-w-[320px] max-w-[420px]">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={`
                pointer-events-auto
                backdrop-blur-md rounded-2xl border p-4 shadow-2xl
                ${getStyles(toast.type)}
              `}
            >
              <div className="flex items-start gap-3">
                {getIcon(toast.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-relaxed">
                    {toast.message}
                  </p>
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action?.onClick();
                        dismiss(toast.id);
                      }}
                      className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg p-1"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
