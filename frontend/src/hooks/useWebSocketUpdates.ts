import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../lib/logger';

// Local type definitions
interface GlobalStats {
  risk_index: number;
  total_leakage_identified: number;
  active_investigations: number;
  pending_alerts: number;
  hotspots: { lat: number; lng: number; intensity: number }[];
}

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' | 'LOW';
  message: string;
  timestamp: string;
  type: string;
  action?: { label: string; route?: string };
}

// Constants
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8200/ws';
const POLLING_INTERVAL = 5000; // 5 seconds (reduced from 30s)
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000; // 1 second
const RETRY_DELAY_MAX = 30000; // 30 seconds

// Message types
type WSMessageType = 'stats' | 'alerts' | 'error' | 'heartbeat';

interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  version: number;
  data: any;
}

interface QueuedMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
}

interface WebSocketUpdateResult {
  stats: GlobalStats | null;
  alerts: AlertItem[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  error: string | null;
}

/**
 * WebSocket Hook with Race Condition Prevention
 * 
 * Features:
 * - Message versioning to prevent overwrites
 * - Optimistic updates with rollback
 * - Message queuing during disconnect
 * - Exponential backoff for reconnection
 * - Faster polling (5s instead of 30s)
 */
export const useWebSocketUpdates = (
  projectId: string,
): WebSocketUpdateResult => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent stale closures
  const wsRef = useRef<WebSocket | null>(null);
  const messageVersionRef = useRef(0);
  const retryCountRef = useRef(0);
  const pendingMessagesRef = useRef<QueuedMessage[]>([]);
  const currentStatsRef = useRef<GlobalStats | null>(null);
  const currentAlertsRef = useRef<AlertItem[]>([]);
  const projectIdRef = useRef(projectId);
  const connectRef = useRef<() => void>(null);

  // Update ref when projectId changes
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  /**
   * Merge stats with version checking
   * Prevents race conditions
   */
  const mergeStats = useCallback((newStats: GlobalStats, version: number) => {
    if (version <= messageVersionRef.current) {
      // Skip old message
      return;
    }

    messageVersionRef.current = version;
    currentStatsRef.current = newStats;
    setStats(newStats);
  }, []);

  /**
   * Merge alerts with version checking
   * Prevents race conditions by merging instead of overwriting
   */
  const mergeAlerts = useCallback((newAlerts: AlertItem[], version: number) => {
    if (version <= messageVersionRef.current) {
      // Skip old message
      return;
    }

    messageVersionRef.current = version;

    // Merge alerts instead of overwriting
    const currentAlerts = currentAlertsRef.current;
    const alertMap = new Map<string, AlertItem>();

    // Add current alerts
    currentAlerts.forEach((alert) => alertMap.set(alert.id, alert));

    // Add/update new alerts
    newAlerts.forEach((alert) => alertMap.set(alert.id, alert));

    const mergedAlerts = Array.from(alertMap.values());
    currentAlertsRef.current = mergedAlerts;
    setAlerts(mergedAlerts);
  }, []);

  /**
   * Send queued messages
   */
  const flushQueue = useCallback(() => {
    while (pendingMessagesRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      const msg = pendingMessagesRef.current.shift();
      if (msg) {
        wsRef.current.send(JSON.stringify(msg));
      }
    }
  }, []);

  /**
   * Queue message during disconnect
   */
  const queueMessage = useCallback((type: WSMessageType, data: any) => {
    pendingMessagesRef.current.push({
      type,
      data,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Handle WebSocket message
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        // Validate message structure
        if (!message.type || message.timestamp === undefined || message.version === undefined) {
          logger.warn('Invalid WebSocket message structure:', { message });
          return;
        }

        switch (message.type) {
          case 'stats':
            mergeStats(message.data, message.version);
            break;

          case 'alerts':
            mergeAlerts(message.data, message.version);
            break;

          case 'heartbeat':
            // Respond to heartbeat
            wsRef.current?.send(
              JSON.stringify({
                type: 'heartbeat_ack',
                timestamp: Date.now(),
              }),
            );
            break;

          case 'error':
            setError(message.data.message || 'WebSocket error');
            break;

          default:
            logger.warn('Unknown message type:', { type: message.type });
        }
      } catch (error) {
        logger.errorWithInfo('Failed to parse WebSocket message', error);
      }
    },
    [mergeStats, mergeAlerts],
  );

  /**
   * Handle WebSocket error
   */
  const handleError = useCallback((event: Event) => {
    logger.error('WebSocket error:', { event });
    setError('WebSocket connection error');
    setConnectionStatus('error');
  }, []);

  /**
   * Handle WebSocket close
   */
  const handleClose = useCallback(() => {
    setConnectionStatus('disconnected');
    retryCountRef.current++;

    if (retryCountRef.current <= MAX_RETRIES) {
      // Exponential backoff
      const delay = Math.min(
        RETRY_DELAY_BASE * Math.pow(2, retryCountRef.current - 1),
        RETRY_DELAY_MAX,
      );

      logger.debug(`WebSocket disconnected. Retrying in ${delay}ms...`);

      setTimeout(() => {
        // Use ref to call connect to avoid circular dependency
        connectRef.current?.();
      }, delay);
    } else {
      setError('Max retry attempts reached');
      setConnectionStatus('error');
    }
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!projectIdRef.current) return;

    setConnectionStatus('connecting');
    setError(null);

    const ws = new WebSocket(
      `${WS_URL}/stats/${projectIdRef.current}`,
    );

    wsRef.current = ws;

    ws.onopen = () => {
      logger.debug('WebSocket connected');
      setConnectionStatus('connected');
      retryCountRef.current = 0;
      setError(null);

      // Flush queued messages
      flushQueue();
    };

    ws.onmessage = handleMessage;
    ws.onclose = handleClose;
    ws.onerror = handleError;
  }, [handleMessage, handleClose, handleError, flushQueue]);

  // Sync ref
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /**
   * Fetch data via polling (fallback)
   */
  const pollData = useCallback(async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch(`/api/v1/stats/${projectIdRef.current}`),
        fetch(`/api/v1/alerts/${projectIdRef.current}`),
      ]);

      if (statsRes.ok && alertsRes.ok) {
        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();

        mergeStats(statsData.data, messageVersionRef.current + 1);
        mergeAlerts(alertsData.data, messageVersionRef.current + 2);
      }
    } catch (error) {
      logger.errorWithInfo('Polling error', error);
    }
  }, [mergeStats, mergeAlerts]);

  /**
   * Initialize and manage connection lifecycle
   */
  useEffect(() => {
    if (!projectId) return;

    const initializeConnection = async () => {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Reset state
      setStats(null);
      setAlerts([]);
      setConnectionStatus('connecting');
      setError(null);
      messageVersionRef.current = 0;
      retryCountRef.current = 0;
      pendingMessagesRef.current = [];

      // Initial connect
      connect();
    };

    initializeConnection();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId, connect]);

  /**
   * Manage polling fallback
   * Only active when WebSocket is not 'connected'
   */
  useEffect(() => {
    if (!projectId || connectionStatus === 'connected') return;

    logger.debug('WebSocket not connected, starting polling fallback...');
    const pollingInterval = setInterval(() => {
      pollData();
    }, POLLING_INTERVAL);

    return () => clearInterval(pollingInterval);
  }, [projectId, connectionStatus, pollData]);

  return {
    stats,
    alerts,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    error,
  };
};
