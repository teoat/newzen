/**
 * Shared Alert Types
 * Centralized type definitions for alerts across the application
 */

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' | 'LOW';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  type: string;
  action?: { label: string; route?: string };
}

export interface GlobalStats {
  risk_index: number;
  total_leakage_identified: number;
  active_investigations: number;
  pending_alerts: number;
  hotspots: Array<{
    lat: number;
    lng: number;
    intensity: number;
  }>;
}
