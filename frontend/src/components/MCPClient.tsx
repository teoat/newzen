'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  Shield,
  FileText,
  Hash
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '@/lib/api';
import { useProject } from '@/store/useProject';

interface MCPContext {
  session_id: string;
  context_type: string;
  project_id?: string;
  hash_signature?: string;
  created_at: string;
  data_summary?: {
    has_project: boolean;
    transaction_count: number;
    entity_count: number;
    document_count: number;
  };
}

interface MCPMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: number;
  sources?: Array<any>;
}

interface MCPClientProps {
  projectId?: string;
}

export default function MCPClient({ projectId }: MCPClientProps) {
  const { activeProjectId } = useProject();
  const [contexts, setContexts] = useState<MCPContext[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedContextType, setSelectedContextType] = useState('investigation');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContexts = async () => {
    try {
      const response = await authenticatedFetch('/api/v3/sessions/active');
      if (response.ok) {
        const data = await response.json();
        setContexts(data.active_sessions || []);
      }
    } catch (error) {
      console.error('Failed to load contexts:', error);
    }
  };

  const createContext = async (contextType: string) => {
    try {
      const response = await authenticatedFetch('/api/v3/context/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context_type: contextType,
          project_id: projectId || activeProjectId
        })
      });

      if (response.ok) {
        const newContext = await response.json();
        setContexts(prev => [...prev, newContext]);
        setActiveSession(newContext.session_id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create context:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeSession) return;

    const userMessage: MCPMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await authenticatedFetch('/api/v3/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          message: inputMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: MCPMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: data.created_at,
          confidence: data.confidence_score,
          sources: data.sources
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
      setInputMessage('');
    }
  };

  const deleteContext = async (sessionId: string) => {
    try {
      const response = await authenticatedFetch(`/api/v3/context/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContexts(prev => prev.filter(ctx => ctx.session_id !== sessionId));
        if (activeSession === sessionId) {
          setActiveSession(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete context:', error);
    }
  };

  const validateContext = async (sessionId: string) => {
    try {
      const response = await authenticatedFetch(`/api/v3/context/${sessionId}/validate`);
      if (response.ok) {
        const validation = await response.json();
        alert(`Context Validation: ${validation.valid ? '✓ Valid' : '✗ Invalid'}\nHash: ${validation.original_hash?.substring(0, 16)}...`);
      }
    } catch (error) {
      console.error('Failed to validate context:', error);
    }
  };

  useEffect(() => {
    loadContexts();
  }, [projectId, activeProjectId]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-slate-400';
    if (confidence > 0.8) return 'text-emerald-400';
    if (confidence > 0.6) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Sidebar - Context Management */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-500" />
              MCP Sessions
            </h2>
            <Button
              size="sm"
              onClick={() => createContext(selectedContextType)}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
          
          <select
            value={selectedContextType}
            onChange={(e) => setSelectedContextType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="investigation">Investigation</option>
            <option value="case">Case Analysis</option>
            <option value="analysis">General Analysis</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {contexts.map((context) => (
              <motion.div
                key={context.session_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeSession === context.session_id
                    ? 'bg-indigo-600/20 border-indigo-500/50'
                    : 'bg-slate-900/50 border-white/5 hover:border-indigo-500/30'
                }`}
                onClick={() => setActiveSession(context.session_id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white capitalize">
                      {context.context_type}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formatTimestamp(context.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        validateContext(context.session_id);
                      }}
                    >
                      <Shield className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContext(context.session_id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {context.data_summary && (
                  <div className="text-xs text-slate-400 space-y-1">
                    {context.data_summary.has_project && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Project context loaded
                      </div>
                    )}
                    {context.data_summary.transaction_count > 0 && (
                      <div>{context.data_summary.transaction_count} transactions</div>
                    )}
                    {context.data_summary.entity_count > 0 && (
                      <div>{context.data_summary.entity_count} entities</div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {contexts.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">No active sessions</p>
              <p className="text-slate-500 text-xs mt-2">Create a session to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white">Active Session</span>
                  <span className="text-xs text-slate-400">{activeSession.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Hash className="w-3 h-3" />
                  {contexts.find(c => c.session_id === activeSession)?.hash_signature?.substring(0, 16)}...
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl max-w-lg ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}>
                      {message.role === 'assistant' && (
                        <Bot className="w-4 h-4 text-indigo-400" />
                      )}
                      {message.role === 'user' && (
                        <User className="w-4 h-4" />
                      )}
                      <div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.confidence && (
                          <div className={`text-xs mt-1 flex items-center gap-1 ${getConfidenceColor(message.confidence)}`}>
                            Confidence: {Math.round(message.confidence * 100)}%
                          </div>
                        )}
                        {message.sources && message.sources.length > 0 && (
                          <div className="text-xs text-slate-400 mt-2">
                            Sources: {message.sources.length}
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="bg-slate-800 text-white px-3 py-2 rounded-2xl flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about financial forensics, transactions, or investigation data..."
                  className="flex-1 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Session</h3>
              <p className="text-slate-400">Choose or create an MCP session to start interacting with the AI</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}