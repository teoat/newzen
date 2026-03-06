"use client";

import React from 'react';
import ForensicLedger from '../../../components/ForensicAnalysis/ForensicLedger';

export default function ForensicLedgerPage() {
    // Hardcoded Project ID for prototype - in real app this comes from params/context
    const PROJECT_ID = "DEMO_PROJECT_V3"; 
    
    return (
        <main className="w-full min-h-screen bg-slate-950 text-slate-50 flex flex-col">
            <ForensicLedger projectId={PROJECT_ID} />
        </main>
    );
}
