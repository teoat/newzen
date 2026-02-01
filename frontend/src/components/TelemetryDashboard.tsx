'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, Zap, Wifi } from 'lucide-react';

interface TelemetryMetrics {
  api: {
    count: number;
    avgLatencyMs: number;
    errorRate: string;
  };
  page: {
    count: number;
    avgFCP: string;
    avgLCP: string;
    avgTTFB: string;
  };
  ws: {
    count: number;
    avgLatencyMs: number;
    totalSizeBytes: number;
  };
}

export function TelemetryDashboard() {
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    api: { count: 0, avgLatencyMs: 0, errorRate: '0%' },
    page: { count: 0, avgFCP: '0ms', avgLCP: '0ms', avgTTFB: '0ms' },
    ws: { count: 0, avgLatencyMs: 0, totalSizeBytes: 0 },
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('telemetry_metrics');
      if (stored) {
        try {
          setMetrics(JSON.parse(stored));
        } catch (e) {
          console.error('[Telemetry] Failed to parse metrics');
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          expanded ? 'bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-500'
        } shadow-lg`}
      >
        <Activity className="w-5 h-5 text-white" />
      </button>

      {expanded && (
        <div className="absolute bottom-16 right-0 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Telemetry
          </h3>

          <div className="space-y-3">
            <MetricCard
              icon={Clock}
              label="API Latency"
              value={`${metrics.api.avgLatencyMs.toFixed(0)}ms`}
              subValue={`${metrics.api.count} calls`}
              color="text-blue-400"
            />

            <MetricCard
              icon={Activity}
              label="Error Rate"
              value={metrics.api.errorRate}
              subValue="API errors"
              color={parseFloat(metrics.api.errorRate) > 5 ? 'text-red-400' : 'text-emerald-400'}
            />

            <MetricCard
              icon={Zap}
              label="Page Load"
              value={metrics.page.avgLCP}
              subValue={`FCP: ${metrics.page.avgFCP}`}
              color="text-amber-400"
            />

            <MetricCard
              icon={Wifi}
              label="WebSocket"
              value={`${metrics.ws.avgLatencyMs.toFixed(0)}ms`}
              subValue={`${formatBytes(metrics.ws.totalSizeBytes)} transferred`}
              color="text-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue: string;
  color: string;
}

function MetricCard({ icon: Icon, label, value, subValue, color }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1">
        <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-bold ${color}`}>{value}</div>
      </div>
      <div className="text-[10px] text-slate-500">{subValue}</div>
    </div>
  );
}
