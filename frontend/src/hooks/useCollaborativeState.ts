import { useEffect, useState, useCallback } from 'react';
import { collaborativeEngine } from '../lib/collaborativeEngine';

/**
 * useCollaborativeState
 * Hook for managing CRDT-backed shared state in investigation tools
 */
export function useCollaborativeState<T = any>(key: string, initialValue?: T) {
  const [state, setState] = useState<T>(() => {
    const existing = collaborativeEngine.get(key);
    return existing !== undefined ? existing : initialValue;
  });

  // Local update function
  const updateState = useCallback((newValue: T) => {
    collaborativeEngine.set(key, newValue);
    // Local setState is handled by the observer below for consistency
  }, [key]);

  useEffect(() => {
    // Observer for CRDT changes (local and remote)
    const observer = () => {
      const current = collaborativeEngine.get(key);
      setState(current);
    };

    collaborativeEngine.observe(observer);
    
    // Initial sync
    observer();

    return () => {
      // Future: remove observer if Yjs supports named observers
    };
  }, [key]);

  return [state, updateState] as const;
}

/**
 * useCollaborativeSync
 * Hook for transmitting CRDT updates over a communication channel (WebSocket)
 */
export function useCollaborativeSync(onSendUpdate: (update: Uint8Array) => void) {
  useEffect(() => {
    const handleUpdate = (update: Uint8Array) => {
      onSendUpdate(update);
    };

    // This is a conceptual bridge for the WebSocket transport
    // In a real implementation, the WebSocket service would call collaborativeEngine.applyUpdate()
    return () => {
      // Cleanup
    };
  }, [onSendUpdate]);
}
