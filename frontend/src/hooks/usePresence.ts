'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketUpdates } from './useWebSocketUpdates';
import { useProject } from '../store/useProject';
import { useUser } from '@clerk/nextjs';

export interface PresenceUser {
    id: string;
    name: string;
    action: string;
    entityId?: string;
    timestamp: number;
}

export function usePresence() {
    const { activeProjectId } = useProject();
    const { user, isSignedIn } = useUser();
    const { socket, connectionStatus } = useWebSocketUpdates(activeProjectId || 'global');
    const [others, setOthers] = useState<Record<string, PresenceUser>>({});

    const emitAction = useCallback((action: string, entityId?: string) => {
        if (socket && socket.readyState === WebSocket.OPEN && isSignedIn && user) {
            socket.send(JSON.stringify({
                type: 'PRESENCE_UPDATE',
                payload: {
                    userId: user.id,
                    name: user.fullName || user.username || 'Anonymous',
                    action,
                    entityId,
                    projectId: activeProjectId
                }
            }));
        }
    }, [socket, user, isSignedIn, activeProjectId]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'PRESENCE_UPDATE' && data.payload.userId !== user?.id) {
                    setOthers(prev => ({
                        ...prev,
                        [data.payload.userId]: {
                            id: data.payload.userId,
                            name: data.payload.name,
                            action: data.payload.action,
                            entityId: data.payload.entityId,
                            timestamp: Date.now()
                        }
                    }));
                }
            } catch (e) {
                // Ignore non-presence messages
            }
        };

        socket.addEventListener('message', handleMessage);
        
        // Cleanup old presence (5 min timeout)
        const interval = setInterval(() => {
            setOthers(prev => {
                const now = Date.now();
                const filtered = { ...prev };
                let changed = false;
                for (const uid in filtered) {
                    if (now - filtered[uid].timestamp > 300000) {
                        delete filtered[uid];
                        changed = true;
                    }
                }
                return changed ? filtered : prev;
            });
        }, 30000);

        return () => {
            socket.removeEventListener('message', handleMessage);
            clearInterval(interval);
        };
    }, [socket, user]);

    return { others, emitAction };
}
