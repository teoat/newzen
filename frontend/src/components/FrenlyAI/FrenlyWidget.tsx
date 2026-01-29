'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Minimize2, Maximize2, 
  Send, ChevronRight,
  Lightbulb, BrainCircuit, Zap, BarChart3, MessageSquare,
  Image as ImageIcon, Mic, MicOff, Paperclip
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useFrenlyContext, QuickAction } from './context/FrenlyContextEngine';
import { API_URL } from '@/utils/constants';
import { useProject } from '@/store/useProject';

interface Message {
  role: 'user' | 'ai';
  text: string;
  sql?: string;
  data?: Record<string, unknown>[];
  suggestedActions?: {label: string; action?: string; route?: string; format?: string}[];
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  action?: {label: string; route?: string};
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
}

export default function FrenlyWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'actions' | 'alerts'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Zenith AI ready. Ask me anything about your audit data.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const { context } = useFrenlyContext();
  const { activeProjectId } = useProject();

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/ai/alerts?project_id=${activeProjectId}`
      );
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [activeProjectId]);

  // Fetch proactive alerts every 30 seconds
  useEffect(() => {
    // Generate or retrieve session ID
    let sid = localStorage.getItem('frenly_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
        formData.append('file', fileToUpload);
      }

      const response = await fetch(`${API_URL}/api/v1/ai/assist`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('AI request failed');

      const result = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: result.answer,
        sql: result.sql,
        data: result.data,
        suggestedActions: result.suggested_actions
      }]);
    } catch (error) {
      console.error("Frenly Error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Sorry, I encountered an error processing your request. Please try again.' 
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

  const handleActionClick = (action: {label: string; action?: string; route?: string; format?: string}) => {
    if (action.route) {
      router.push(action.route);
      setIsOpen(false);
      return;
    }
    
    // Handle specific AI actions
    switch (action.action) {
      case 'create_case':
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Initiating Case Creation: "${action.label || 'New Investigation'}". Redirecting to Investigation Lab...` 
        }]);
        setTimeout(() => router.push('/investigate'), 1500);
        break;
      case 'export':
      case 'export_report':
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Generating ${action.format || 'PDF'} report. This will be available in your downloads shortly.` 
        }]);
        // Simulate download or call API
        break;
      case 'flag_transaction':
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Transaction flagged for review. Added to high-risk alerts.` 
        }]);
        fetchAlerts(); // Refresh alerts
        break;
      default:
        console.log("Unhandled action type:", action);
        if (action.label) {
          setInput(action.label);
        }
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`
                bg-slate-900 border border-indigo-500/30 shadow-2xl backdrop-blur-xl
                rounded-2xl overflow-hidden flex flex-col
                ${isExpanded ? 'w-[700px] h-[750px]' : 'w-[420px] h-[580px]'}
                transition-all duration-300
              `}
            >
              {/* Header */}
              <div className="h-14 border-b border-white/5 bg-indigo-950/30 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Frenly AI • Zenith Copilot</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-indigo-300 font-mono">GEMINI 2.0 ACTIVE</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={toggleExpand} 
                    title={isExpanded ? "Minimize" : "Maximize"} 
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={toggleOpen} 
                    title="Close" 
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

                  {/* Tabs */}
              <div className="h-12 border-b border-white/5 flex items-center px-2 shrink-0 bg-slate-950/50">
                {[
                  { id: 'chat', label: 'Chat', icon: MessageSquare },
                  { id: 'actions', label: 'Actions', icon: Zap },
                  { id: 'alerts', label: 'Alerts', icon: BarChart3, badge: alerts.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'chat' | 'actions' | 'alerts')}
                    className={`

                      flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative
                      ${activeTab === tab.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
                {activeTab === 'chat' && (
                  <>
                    {/* Context Card */}
                    {context && (
                      <div className="p-3 rounded-xl bg-indigo-900/10 border border-indigo-500/10 mb-4">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-indigo-200 mb-2">
                              {context.greeting}
                            </p>
                            <div className="space-y-1.5">
                              {context.quickActions.slice(0, 3).map((action: QuickAction, idx: number) => (
                                <button 
                                  key={idx}
                                  onClick={() => action.route ? router.push(action.route) : action.action?.()}
                                  className="flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:text-indigo-400 transition-colors bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded-lg w-full text-left"
                                >
                                  <ChevronRight className="w-3 h-3 text-indigo-500" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`
                          max-w-[85%] rounded-2xl p-3 text-sm
                          ${msg.role === 'ai' 
                            ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5' 
                            : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20'}
                        `}>
                          <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                          
                          {/* SQL Display */}
                          {msg.sql && (
                            <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-white/10">
                              <p className="text-[10px] text-slate-400 font-mono mb-1">SQL Generated:</p>
                              <code className="text-[10px] text-emerald-400 font-mono block overflow-x-auto">
                                {msg.sql}
                              </code>
                            </div>
                          )}

                          {/* Data Table */}
                          {msg.data && msg.data.length > 0 && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                              <div className="overflow-x-auto max-h-60 custom-scrollbar bg-slate-950">
                                <table className="w-full text-[10px] text-left">
                                  <thead className="bg-white/5 text-slate-400 sticky top-0">
                                    <tr>
                                      {Object.keys(msg.data[0]).map((k: string) => (
                                        <th key={k} className="p-2 font-black uppercase tracking-widest truncate max-w-[100px]">{k}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {msg.data.slice(0, 10).map((row, i) => (
                                      <tr key={i} className="hover:bg-white/5 transition-colors">
                                    {Object.values(row).map((val: unknown, j) => (
                                      <td key={j} className="p-2 text-slate-300 truncate max-w-[100px]">
                                        {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                      </td>
                                    ))}

                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {msg.data.length > 10 && (
                                <div className="p-2 bg-slate-900 text-center text-[9px] text-slate-500 font-bold uppercase">
                                  ... {msg.data.length - 10} more records in database
                                </div>
                              )}
                            </div>
                          )}

                          {/* Suggested Actions */}
                          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-[10px] text-slate-400 font-bold">Suggested Actions:</p>
                              {msg.suggestedActions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleActionClick(action)}
                                  className="w-full text-left px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-[11px] font-bold text-indigo-200 transition-colors"
                                >
                                  → {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-white/5">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}

                {activeTab === 'actions' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Context-Aware Actions</p>
                    {context?.quickActions.map((action: QuickAction, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => action.route ? router.push(action.route) : action.action?.()}
                        className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white group-hover:text-indigo-300">
                            {action.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">No active alerts</p>
                        <p className="text-xs text-slate-500 mt-1">System is monitoring in the background</p>
                      </div>
                    ) : (
                      alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`
                            p-4 rounded-xl border 
                            ${alert.severity === 'critical' 
                              ? 'bg-rose-500/10 border-rose-500/30' 
                              : alert.severity === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-blue-500/10 border-blue-500/30'}
                          `}
                        >
                          <p className="text-sm font-bold text-white mb-2">{alert.message}</p>
                          {alert.action && (
                            <button
                              onClick={() => alert.action?.route && router.push(alert.action.route)}
                              className="text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors"
                            >
                              {alert.action.label} →
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Input Area (only for chat tab) */}
              {activeTab === 'chat' && (
                <div className="p-4 border-t border-white/5 bg-slate-900">
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] text-indigo-200 font-bold uppercase truncate max-w-[200px]">{selectedFile.name}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)} 
                        title="Remove attachment"
                        aria-label="Remove attached file"
                        className="text-indigo-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask or narrate audit data..."
                      title="AI Command Input"
                      aria-label="Ask the AI agent a question"
                      disabled={isLoading}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-4 pr-32 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach evidence"
                        aria-label="Attach file or image"
                        className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={startListening}
                        className={`p-1.5 transition-colors ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500 hover:text-indigo-400'}`}
                        title="Voice Input"
                      >
                        {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedFile) || isLoading}
                        title="Send message"
                        className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleOpen}
            className="group relative flex items-center gap-3 px-5 py-3 bg-slate-900 hover:bg-indigo-950 border border-indigo-500/30 rounded-full shadow-2xl backdrop-blur-md transition-all"
          >
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-pulse group-hover:bg-indigo-500/20" />
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white tracking-wide">FRENLY AI</span>
            
            {/* Alert Badge */}
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white">
                {alerts.length}
              </span>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}