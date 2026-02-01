import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
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

export function useFrenlyChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Zenith AI ready. Ask me anything about your audit data.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const pathname = usePathname();
  const { activeProjectId } = useProject();
  const { uploads, uploadFile } = useFileUpload();

  useEffect(() => {
    let sid = localStorage.getItem('frenly_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('frenly_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  const handleSend = useCallback(async () => {
    const queryText = input.trim();
    if (!queryText && !selectedFile) return;
    if (isLoading) return;

    const controller = new AbortController();
    
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
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'File upload failed');
        }
        formData.append('file_url', uploadResult.data?.file_url);
      }

      // Start streaming request
      const response = await fetch('/api/v1/ai/chat/stream', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith_token')}` // Conceptually
        },
        body: JSON.stringify({
          message: queryText || "Analyze this document",
          context: {
            page: pathname,
            project_id: activeProjectId,
            session_id: sessionId || 'default'
          }
        }),
      });

      if (!response.ok) throw new Error('AI stream failed');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                assistantText += data.token;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].text = assistantText;
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('AI request failed:', error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, selectedFile, isLoading, pathname, activeProjectId, sessionId, uploadFile]);

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    handleSend,
    uploads,
    isUploading: uploads.some(u => u.status === 'uploading'),
    handleFileSelect
  };
}

// useFrenlyAlerts is available but not currently used - kept for future implementation
interface Alert {
  type: string;
  severity: string;
  message: string;
  action?: {label: string; route?: string};
}

export function useFrenlyAlerts(activeProjectId: string | null) {
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);

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

  // Separate effect for initial fetch to avoid setState-in-effect warning
  useEffect(() => {
    if (activeProjectId) {
      // Use setTimeout to defer the fetch to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        void fetchAlerts();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [activeProjectId, fetchAlerts]);

  // Effect for polling interval
  useEffect(() => {
    if (activeProjectId) {
      const interval = setInterval(() => { void fetchAlerts(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeProjectId, fetchAlerts]);

  return { localAlerts, fetchAlerts };
}
