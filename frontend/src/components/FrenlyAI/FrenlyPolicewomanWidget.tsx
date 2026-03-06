'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Minimize2, Maximize2, 
  Send, ChevronRight,
  Lightbulb, BrainCircuit, Zap, BarChart3, MessageSquare,
  Image as ImageIcon, Mic, MicOff, Paperclip, Loader2,
  HandMetal, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useFrenlyContext, QuickAction } from './context/FrenlyContextEngine';
import { useProject } from '../../store/useProject';
import { useFileUpload } from '../../hooks/useFileUpload';
import { authenticatedFetch } from '../../lib/api';
import Image from 'next/image';

interface Message {
  role: 'user' | 'ai';
  text: string;
  sql?: string;
  data?: Record<string, unknown>[];
  suggestedActions?: {label: string; action?: string; route?: string; format?: string}[];
  integrity_hash?: string; // Phase 18: Hash-linked narratives
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  action?: {label: string; route?: string};
}

export default function FrenlyPolicewomanWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  type TabType = 'chat' | 'actions' | 'alerts';
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Officer Frenly here. How can I assist with your forensic investigation today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { uploads, isUploading, uploadFile } = useFileUpload();
  
  const router = useRouter();
  const pathname = usePathname();
  const { context } = useFrenlyContext();
  const { activeProjectId } = useProject();

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const fetchAlerts = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const response = await authenticatedFetch(
        `/api/v1/ai/alerts?project_id=${activeProjectId}`
      );
      const data = await response.json();
      setLocalAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [activeProjectId]);

  useEffect(() => {
    setMounted(true);
    let sid = localStorage.getItem('frenly_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('frenly_session_id', sid);
    }
    setSessionId(sid);

    if (isOpen && activeProjectId) {
      void fetchAlerts();
      const interval = setInterval(() => { void fetchAlerts(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeProjectId, fetchAlerts]);

  const handleSend = async () => {
    const queryText = input.trim();
    if (!queryText && !selectedFile) return;
    if (isLoading) return;
    
    const userMessage = queryText || (selectedFile ? `Uploaded ${selectedFile.name}` : '');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('query', queryText || "Analyze this document");
      formData.append('context_json', JSON.stringify({
        page: pathname,
        project_id: activeProjectId,
        session_id: sessionId || 'default'
      }));
      
      if (fileToUpload) {
        const uploadResult = await uploadFile(fileToUpload, '/api/v1/ai/upload');
        if (!uploadResult.success) throw new Error(uploadResult.error || 'Upload failed');
        const fileUrl = (uploadResult.data as Record<string, unknown>)?.file_url;
        if (fileUrl) formData.append('file_url', String(fileUrl));
      }

      const response = await authenticatedFetch('/api/v1/ai/assist', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `AI request failed: ${response.status}`);
      }
      const result = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: result.answer,
        sql: result.sql,
        data: result.data,
        suggestedActions: result.suggested_actions
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `Error encountered. Officer down! System reported: ${error instanceof Error ? error.message : 'Unknown breakdown'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!mounted) return null;

  return (
    <div className="fixed top-20 right-8 z-[100] flex flex-col items-end pointer-events-none">
      {/* Movable Avatar Trigger */}
      <motion.div 
        drag
        dragMomentum={false}
        className="pointer-events-auto cursor-grab active:cursor-grabbing relative group"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div 
          onClick={toggleOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-24 h-24 rounded-full border-4 border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.4)] overflow-hidden bg-slate-900"
          suppressHydrationWarning
        >
          <Image 
            src="/images/frenly-police.png" 
            alt="Frenly AI Officer" 
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 to-transparent pointer-events-none" />
          
          {/* Status Glow */}
          <div className={`absolute bottom-1 right-5 w-3 h-3 rounded-full border border-white/20 shadow-lg ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        </motion.div>

        {/* Floating Label */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-1/2 -left-32 -translate-y-1/2 bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-xl hidden group-hover:block"
            >
              <span className="text-[11px] font-black text-white uppercase tracking-widest">Officer Frenly</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert Badge */}
        {localAlerts.length > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[11px] font-black text-white animate-bounce">
            {localAlerts.length}
          </div>
        )}
      </motion.div>

      {/* Chat Windows (Movable with dragging the avatar, but simplified as fixed relative for UX) */}
      <div className="mt-4 pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(10px)' }}
              className={`
                bg-slate-950/80 border border-indigo-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl
                rounded-[32px] overflow-hidden flex flex-col
                ${isExpanded ? 'w-[600px] h-[700px]' : 'w-[380px] h-[520px]'}
                transition-all duration-500
              `}
            >
              {/* Premium Header */}
              <div className="h-16 border-b border-white/5 bg-indigo-950/20 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Zenith Precinct // AI-01</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-400/50" />
                       <span className="text-[11px] text-indigo-400/80 font-mono tracking-widest uppercase">Forensic Liaison Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleExpand} title={isExpanded ? "Minimize" : "Maximize"} aria-label={isExpanded ? "Minimize chat" : "Maximize chat"} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button onClick={toggleOpen} title="Close" aria-label="Close chat" className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-2 bg-slate-900/30 border-b border-white/5">
                {[
                  { id: 'chat', label: 'Console', icon: MessageSquare },
                  { id: 'actions', label: 'Procedures', icon: Zap },
                  { id: 'alerts', label: 'Dispatch', icon: BarChart3, badge: localAlerts.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all
                      ${activeTab === tab.id 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                    {tab.badge ? <span className="ml-1 text-rose-500">{tab.badge}</span> : null}
                  </button>
                ))}
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {activeTab === 'chat' && (
                  <>
                    {messages.map((msg, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`
                          max-w-[90%] rounded-[24px] p-4 text-xs leading-relaxed relative
                          ${msg.role === 'ai' 
                            ? 'bg-slate-900/50 text-slate-300 border border-white/5 rounded-tl-none' 
                            : 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-900/30 font-medium'}
                        `}>
                          {msg.text}
                          
                          {/* Phase 18: Integrity Hash Badge */}
                          {msg.integrity_hash && (
                              <div className="mt-2 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                  <BadgeCheck size={10} className="text-emerald-400" />
                                  <span className="text-[7px] font-mono text-emerald-500 uppercase tracking-tighter">Chain Sealed: {msg.integrity_hash.slice(0, 12)}...</span>
                              </div>
                          )}
                          
                          {/* Rich Data Components could go here */}
                          {msg.sql && (
                            <div className="mt-4 p-3 bg-black/40 rounded-xl border border-indigo-500/20 font-mono text-[11px] text-indigo-300">
                               <div className="flex items-center gap-2 mb-2 opacity-50">
                                  <Terminal size={10} /> <span>Querying Ledger...</span>
                               </div>
                               {msg.sql}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900/50 rounded-2xl p-4 flex gap-2">
                           <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                           <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Processing Evidence...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
                
                {activeTab === 'actions' && (
                  <div className="grid grid-cols-1 gap-3">
                     {context?.quickActions.map((action, i) => (
                       <button 
                         key={i}
                         onClick={() => action.route ? router.push(action.route) : action.action?.()}
                         className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left"
                       >
                          <div>
                            <div className="text-[11px] font-black text-white uppercase tracking-widest">{action.label}</div>
                            <div className="text-[11px] text-slate-500 mt-1 uppercase">Standard Operating Procedure</div>
                          </div>
                          <ChevronRight size={14} className="text-indigo-500" />
                       </button>
                     ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-slate-900/50 border-t border-white/5">
                 <div className="relative">
                    <input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Report findings or request analysis..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading}
                      title="Send message"
                      aria-label="Send message to Officer Frenly"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Terminal({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>;
}
