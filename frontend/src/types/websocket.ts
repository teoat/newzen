/**
 * Shared WebSocket Types
 * Centralized type definitions for WebSocket communication
 */

export type WSMessageType = 'stats' | 'alerts' | 'error' | 'heartbeat';

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  version: number;
  data: any;
}

export interface QueuedMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketUpdateResult {
  stats: import('./alerts').GlobalStats | null;
  alerts: import('./alerts').AlertItem[];
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  error: string | null;
}
