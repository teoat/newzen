'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Minimize2, Maximize2, 
  Send, ChevronRight,
  Lightbulb, BrainCircuit, Zap, BarChart3, MessageSquare,
  Image as ImageIcon, Mic, MicOff, Paperclip, Loader2
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useFrenlyContext, QuickAction } from './context/FrenlyContextEngine';
import { useProject } from '../../store/useProject';
import { useFileUpload } from '../../hooks/useFileUpload';
import { authenticatedFetch } from '../../lib/api';

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

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
}

export function FrenlyChat({ 
  messages, 
  setMessages, 
  input, 
  setInput,
  isLoading,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  handleSend,
  startListening,
  isListening,
  uploads,
  isUploading
}: {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleSend: () => void;
  startListening: () => void;
  isListening: boolean;
  uploads: Array<{ file: File; status: string; progress: number; error?: string }>;
  isUploading: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { context } = useFrenlyContext();
  const router = useRouter();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleActionClick = (action: {label: string; action?: string; route?: string; format?: string}) => {
    if (action.route) {
      router.push(action.route);
      return;
    }
    
    switch (action.action) {
      case 'create_case':
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Initiating Case Creation: "${action.label || 'New Investigation'}". Redirecting to Investigation Lab...` 
        }]);
        setTimeout(() => router.push('/investigate'), 1500);
        break;
      case 'export':
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Generating ${action.format || 'PDF'} report. This will be available in your downloads shortly.` 
        }]);
        break;
      case 'flag_transaction':
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Transaction flagged for review. Added to high-risk alerts.` 
        }]);
        break;
      default:
        if (action.label) {
          setInput(action.label);
        }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/csv', 'application/vnd.ms-excel'];
      if (!allowedTypes.includes(file.type)) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `File type ${file.type} is not supported. Please upload images (JPEG, PNG, GIF, WebP), PDFs, or CSV files.` 
        }]);
        return;
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 10MB limit. Please upload a smaller file.` 
        }]);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
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

      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
          <div className={`
            max-w-[85%] rounded-2xl p-3 text-sm
            ${msg.role === 'ai' 
              ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5' 
              : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20'}
          `}>
            <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
            
            {msg.sql && (
              <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-white/10">
                <p className="text-[10px] text-slate-400 font-mono mb-1">SQL Generated:</p>
                <code className="text-[10px] text-emerald-400 font-mono block overflow-x-auto">
                  {msg.sql}
                </code>
              </div>
            )}

            {msg.data && msg.data.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                <div className="overflow-x-auto max-h-60 custom-scrollbar bg-slate-950">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-white/5 text-slate-400 sticky top-0">
                      <tr>
                        {(msg.data && msg.data.length > 0) && Object.keys(msg.data[0]).map((k: string) => (
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

      {uploads.map((upload, index) => (
        <div key={index} className="mb-2 p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] text-indigo-200 font-bold uppercase truncate max-w-[200px]">{upload.file.name}</span>
            </div>
            <span className="text-[9px] text-indigo-300">
              {upload.status === 'uploading' ? `${upload.progress}%` : 
               upload.status === 'success' ? '✓' : 
               upload.status === 'error' ? '✗' : '...'}
            </span>
          </div>
          {upload.status === 'uploading' && (
            <div className="w-full bg-indigo-900 rounded-full h-1">
              <div 
                className="bg-indigo-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
          {upload.status === 'error' && (
            <p className="text-[9px] text-rose-400 mt-1">{upload.error}</p>
          )}
        </div>
      ))}
      
      {selectedFile && !isUploading && (
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
            className={`p-1.5 rounded-lg transition-all ${
              isLoading 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
