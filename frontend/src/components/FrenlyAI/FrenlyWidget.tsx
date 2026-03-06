'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Minimize2, Maximize2, 
  BrainCircuit, MessageSquare, Zap, BarChart3
} from 'lucide-react';
import { useFrenlyContext } from './context/FrenlyContextEngine';

export default function FrenlyWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'actions' | 'alerts'>('chat');
  const { context } = useFrenlyContext();
  
  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mb-4 overflow-hidden ${
              isExpanded ? 'w-[600px] h-[500px]' : 'w-[380px] h-[500px]'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Frenly AI</h3>
                  <p className="text-[11px] text-slate-400">Forensic Intelligence Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleExpand} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  {isExpanded ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-white/10">
              {(['chat', 'actions', 'alerts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-medium transition-colors ${
                    activeTab === tab 
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="p-4 h-[calc(100%-120px)] overflow-y-auto">
              {activeTab === 'chat' && (
                <div className="text-center text-slate-400 text-sm">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>Chat with Frenly AI</p>
                  <p className="text-xs mt-2">Ask questions about your forensic data</p>
                </div>
              )}
              {activeTab === 'actions' && (
                <div className="space-y-2">
                  {context?.quickActions?.map((action: { label: string }, idx: number) => (
                    <button
                      key={idx}
                      className="w-full p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-left text-xs font-medium text-slate-300 transition-colors"
                    >
                      <Zap className="w-4 h-4 inline-block mr-2 text-amber-400" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              {activeTab === 'alerts' && (
                <div className="text-center text-slate-400 text-sm">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className="pointer-events-auto w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <BrainCircuit className="w-6 h-6 text-white" />}
      </motion.button>
    </div>
  );
}
