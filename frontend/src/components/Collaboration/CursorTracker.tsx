'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { logger } from '../../lib/logger';

interface CursorPosition {
  x: number;
  y: number;
}

interface UserCursor {
  id: string;
  name: string;
  color: string;
  position: CursorPosition;
  lastUpdate: number;
}

interface CursorTrackerProps {
  projectId?: string;
  currentUserId?: string;
  userName?: string;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

// Mock other users for demonstration if no WebSocket is connected
const MOCK_USERS = [
  { id: 'user-2', name: 'Analyst Sarah', color: COLORS[1], position: { x: 0.2, y: 0.3 } },
  { id: 'user-3', name: 'Investigator Mike', color: COLORS[4], position: { x: 0.8, y: 0.6 } },
];

export function CursorTracker({ 
  projectId = 'default', 
  currentUserId = 'me', 
  userName = 'You' 
}: CursorTrackerProps) {
  const [cursors, setCursors] = useState<Record<string, UserCursor>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const throttleRef = useRef<number>(0);

  // Connect to WebSocket
  useEffect(() => {
    // Determine WS URL relative to current origin (handling Nginx proxy)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running on port 3000/3200 locally without nginx, point to 8000. 
    // If on port 80 (nginx), point to /api via current host.
    const isLocalDev = window.location.port === '3000' || window.location.port === '3200';
    const wsHost = isLocalDev ? 'localhost:8000' : window.location.host;
    const wsPath = isLocalDev ? '' : '/api'; 
    
    // Construct URL: ws://localhost:8000/ws/collaboration/... OR ws://localhost/api/ws/collaboration/...
    const url = `${protocol}//${wsHost}${wsPath}/ws/collaboration/${projectId}`;
    
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
        logger.info('Connected to collaboration server');
        // Announce presence
        ws.send(JSON.stringify({
            type: 'USER_JOIN',
            user: { id: currentUserId, name: userName, color: COLORS[Math.floor(Math.random() * COLORS.length)] }
        }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'CURSOR_MOVE' && data.user) {
                setCursors(prev => ({
                    ...prev,
                    [data.user.id]: {
                        ...data.user,
                        position: data.payload, // Expecting {x, y}
                        lastUpdate: Date.now()
                    }
                }));
            } else if (data.type === 'USER_JOIN' && data.user) {
                 setCursors(prev => ({
                    ...prev,
                    [data.user.id]: {
                        ...data.user,
                        position: { x: 0.5, y: 0.5 }, // Default start
                        lastUpdate: Date.now()
                    }
                }));
            }
        } catch (e) {
            logger.error('WS parse error', { error: String(e) });
        }
    };

    ws.onclose = () => {
        logger.info('Disconnected from collaboration server');
    };

    return () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    };
  }, [projectId, currentUserId, userName]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - throttleRef.current < 50) return; // Throttle to 20fps
    throttleRef.current = now;

    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    // Send to WS
    if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: 'CURSOR_MOVE',
            user: { id: currentUserId, name: userName, color: COLORS[0] }, // Simplify for now
            payload: { x, y }
        }));
    }
  }, [currentUserId, userName]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Clean up inactive cursors (no update in 1 minute)
  useEffect(() => {
    const cleanup = setInterval(() => {
        const now = Date.now();
        setCursors(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(key => {
                if (now - next[key].lastUpdate > 60000) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, 10000);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" ref={containerRef}>
      <AnimatePresence>
        {Object.values(cursors).map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: cursor.position.x * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: cursor.position.y * (typeof window !== 'undefined' ? window.innerHeight : 1000)
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="absolute top-0 left-0 flex flex-col items-start"
            style={{ color: cursor.color }}
          >
            <MousePointer2 className="w-5 h-5 fill-current transform -rotate-12" />
            <div 
                className="ml-4 -mt-2 px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
