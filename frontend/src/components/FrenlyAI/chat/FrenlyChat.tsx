'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  sql?: string;
  data?: Record<string, unknown>[];
}

interface FreniChatProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  isLoading?: boolean;
}

export default function FrenlyChat({ onSendMessage, messages, isLoading = false }: FreniChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');
    await onSendMessage(messageText);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-200 border border-white/5'
                }`}
              >
                {/* Message Header (for assistant) */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span className="text-[9px] font-mono uppercase text-indigo-400">
                      Frenly AI
                    </span>
                    {message.confidence && (
                      <span className="ml-auto text-[8px] text-slate-500">
                        {(message.confidence * 100).toFixed(0)}% confident
                      </span>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* SQL Generated (if available) */}
                {message.sql && (
                  <div className="mt-3 p-3 bg-black/40 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest">Procedural SQL executed</span>
                        <Copy 
                            className="w-3 h-3 text-slate-600 hover:text-indigo-400 cursor-pointer transition-colors" 
                            onClick={() => copyToClipboard(message.sql!)}
                        />
                    </div>
                    <code className="text-[10px] text-slate-400 font-mono break-all line-clamp-2 hover:line-clamp-none transition-all">
                        {message.sql}
                    </code>
                  </div>
                )}

                {/* Data Table (if available) */}
                {message.data && message.data.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-white/5 bg-slate-900/40">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-white/5 text-slate-500 uppercase font-black tracking-widest">
                            <tr>
                                {message.data[0] && Object.keys(message.data[0]).map(key => (
                                    <th key={key} className="px-3 py-2 border-b border-white/5">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            {message.data.slice(0, 3).map((row, i) => (
                                <tr key={i} className="border-b border-white/[0.02] last:border-0">
                                    {Object.values(row).map((val: unknown, j) => {
                                        const value = typeof val === 'number' ? val.toLocaleString() : String(val);
                                        return (
                                            <td key={j} className="px-3 py-2 truncate max-w-[100px]">
                                                {value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {message.data.length > 3 && (
                        <div className="p-2 text-center text-[8px] text-slate-600 font-bold uppercase italic">
                           + {message.data.length - 3} more records found
                        </div>
                    )}
                  </div>
                )}

                {/* Suggestions (for assistant messages) */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Suggested Actions
                    </span>
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left px-3 py-2 rounded-lg bg-slate-900/50 hover:bg-indigo-600/20 text-xs text-indigo-400 transition-colors border border-indigo-500/20 hover:border-indigo-500/40"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Actions (for assistant) */}
                {message.role === 'assistant' && index > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="text-slate-500 hover:text-indigo-400 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      className="text-slate-500 hover:text-green-400 transition-colors"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`mt-2 text-[9px] ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-slate-600'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800 border border-white/5 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-[9px] font-mono uppercase text-indigo-400">
                  Frenly is thinking...
                </span>
                <div className="flex gap-1 ml-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 p-4 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Frenly anything..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/40"
          >
            <Send className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="mt-2 text-[9px] text-slate-600 text-center">
          Frenly AI may make mistakes. Verify critical information.
        </div>
      </div>
    </div>
  );
}
