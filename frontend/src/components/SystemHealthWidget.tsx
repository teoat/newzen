
import React from 'react';
import { useAgentStatus } from '../hooks/useVisibleAutonomy';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Activity, Radio } from 'lucide-react';

export function SystemHealthWidget() {
    const status = useAgentStatus();

    if (!status) return null;

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Autonomous Systems Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Auditor Agent */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className={`h-2.5 w-2.5 rounded-full ${status.auditor.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                             <span className="text-sm font-medium">Auditor Agent</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {status.auditor.type}
                        </span>
                    </div>
                    {status.auditor.stream_metrics && (
                        <div className="pl-5 text-xs text-slate-500">
                             Lag: {status.auditor.stream_metrics.lag || 0} events
                        </div>
                    )}

                    {/* Nurse Agent */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className={`h-2.5 w-2.5 rounded-full ${status.nurse.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                             <span className="text-sm font-medium">Nurse Agent</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Polling ({status.nurse.interval_seconds}s)
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
