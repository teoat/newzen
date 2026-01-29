/**
 * ToolDrawer Component
 * Modal/Drawer system for opening forensic tools without losing investigation context
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ToolDrawer({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'lg' 
}: ToolDrawerProps) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]'
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed right-0 top-0 bottom-0 ${sizeClasses[size]} w-full bg-slate-950 border-l border-white/10 shadow-2xl z-[101] flex flex-col`}
                    >
                        {/* Header */}
                        <div className="h-20 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                    {title}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    Forensic Tool • Investigation Mode
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
                                aria-label="Close drawer"
                            >
                                <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * ToolModal Component
 * Centered modal for quick tools (e.g., sanction screening lookup)
 */

interface ToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function ToolModal({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md' 
}: ToolModalProps) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl'
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${sizeClasses[size]} w-full bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden`}
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
                                    aria-label="Close modal"
                                >
                                    <X className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
