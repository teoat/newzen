'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Database, 
  MessageSquare,
  Maximize2,
  Minimize2,
  Terminal,
  Zap,
  Search
} from 'lucide-react';
import { useProject } from '@/store/useProject';
import { authenticatedFetch } from '@/lib/api';
import { forensicBus } from '@/lib/ForensicEventBus';

interface Message {
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'sql' | 'alert';
}

export function ForensicCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Neural Copilot Active. Ready for dataset interrogation. How can I assist your investigation?' }
  ]);
  const [loading, setLoading] = useState(false);
  const { activeProjectId } = useProject();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const id = forensicBus.subscribe('TOGGLE_AI', handleToggle);
    return () => { forensicBus.off(id, 'TOGGLE_AI'); };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('query', userMsg);
      formData.append('context_json', JSON.stringify({
        project_id: activeProjectId,
        session_id: 'forensic_session_01',
        page: window.location.pathname
      }));

      const res = await authenticatedFetch('/api/v1/ai/assist', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: data.answer,
          type: data.response_type 
        }]);
      } else {
        throw new Error("Neural link unstable");
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "ERROR: Forensic node unreachable. Verify backend synchronization." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-900/40 z-[100] group overflow-hidden border border-indigo-400/30"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-800/50 to-transparent" />
          <Bot className="w-8 h-8 relative z-10 group-hover:animate-pulse" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 w-[400px] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl z-[100] flex flex-col overflow-hidden backdrop-blur-3xl ${isMinimized ? 'h-[72px]' : 'h-[600px]'}`}
          >
            <div className="scan-line-overlay" />
            
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative z-20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Neural Copilot</h3>
                  <p className="text-[8px] text-emerald-500 font-mono font-bold tracking-widest uppercase">Node: Primary_Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-20">
                  {messages.map((m, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i} 
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-indigo-600 text-white font-bold rounded-tr-none shadow-lg' 
                          : 'bg-white/[0.03] border border-white/10 text-slate-300 rounded-tl-none italic'
                      }`}>
                        {m.type === 'sql' && <Terminal className="w-3 h-3 text-indigo-400 mb-2" />}
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl rounded-tl-none">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar relative z-20">
                    <SuggestionBadge icon={Search} label="High risk" onClick={() => setInput("Identify highest risk transactions")} />
                    <SuggestionBadge icon={Zap} label="Circular" onClick={() => setInput("Find circular fund patterns")} />
                    <SuggestionBadge icon={Database} label="Anomalies" onClick={() => setInput("Show entity recidivism")} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-6 pt-2 relative z-20">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask the dataset..."
                      className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-white text-[11px] font-bold focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                    />
                    <button 
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SuggestionBadge({ label, icon: Icon, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            type="button"
            className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all flex items-center gap-2"
        >
            <Icon size={10} />
            {label}
        </button>
    );
}
