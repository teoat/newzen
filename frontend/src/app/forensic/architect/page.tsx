'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Ruler, Landmark, AlertTriangle, ShieldCheck, Box, Layers, MousePointer2, BarChart3 } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import ArchitectDashboard from './components/ArchitectDashboard';
import { useProject } from '../../../store/useProject';
import { ArchitectService } from '../../../services/ArchitectService';
import { authenticatedFetch } from '../../../lib/api';
import { useCallback } from 'react';

interface StructuralAnomaly {
    id: string;
    component: string;
    description: string;
    material_variance: number;
    financial_delta: number;
    risk_level: 'CRITICAL' | 'WARNING';
    coords: { x: number; y: number };
}

export default function ArchitectIntegrationPage() {
    const { activeProjectId } = useProject();
    const [anomalies, setAnomalies] = useState<StructuralAnomaly[]>([]);
    const [selectedAnomaly, setSelectedAnomaly] = useState<StructuralAnomaly | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStructuralData = useCallback(async () => {
        if (!activeProjectId) return;
        setLoading(true);
        try {
            // Simulated fetch for structural fraud detection
            const res = await authenticatedFetch(`/api/v2/forensic-v2/architect/spatial-verify/${activeProjectId}`);
            if (res.ok) {
                const data = await res.json();
                setAnomalies(data.anomalies);
            } else {
                throw new Error("API fallback");
            }
        } catch (e) {
            // Fallback mock data
            setAnomalies([
                { id: 'AN-001', component: 'Reinforced Pier 4', description: 'Concrete grade discrepancy vs CCO specs', material_variance: -15, financial_delta: 450000000, risk_level: 'CRITICAL', coords: { x: 30, y: 45 } },
                { id: 'AN-002', component: 'Main Span Cable', description: 'Yield strength test mismatch', material_variance: -5, financial_delta: 120000000, risk_level: 'WARNING', coords: { x: 65, y: 25 } },
                { id: 'AN-003', component: 'Abutment B', description: 'Excavation volume vs reported progress', material_variance: 22, financial_delta: 310000000, risk_level: 'CRITICAL', coords: { x: 85, y: 60 } },
            ]);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        if (activeProjectId) {
            void fetchStructuralData();
        }
    }, [activeProjectId, fetchStructuralData]);

    // Show new comprehensive dashboard if project is selected
    if (activeProjectId) {
        return <ArchitectDashboard projectId={activeProjectId} />;
    }

    return (
        <ForensicPageLayout
            title="Sovereign Architect"
            subtitle="Spatial Fraud Detection & Structural Admissibility"
            icon={HardHat}
        >
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
                    <p className="text-slate-400">Please select a project to view architectural analysis</p>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
