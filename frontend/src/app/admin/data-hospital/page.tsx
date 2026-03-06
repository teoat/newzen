"use client";
export const dynamic = 'force-dynamic';

import { useUser } from "@clerk/nextjs";
import { DataHospitalView } from "../../../components/DataHospitalView";
import ForensicPageLayout from "../../components/ForensicPageLayout";
import { Database, AlertOctagon } from "lucide-react";

export default function DataHospitalPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const userRole = (user?.publicMetadata?.role as string); // Clerk Metadata

    // Simple RBAC check
    if (isLoaded && isSignedIn && userRole !== 'admin') {
        return (
            <div className="flex h-screen items-center justify-center bg-[#020617] text-slate-500">
                <div className="text-center">
                    <AlertOctagon className="w-16 h-16 mx-auto mb-4 text-rose-500 opacity-50" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-rose-500">Access Denied</h2>
                    <p className="text-xs font-bold mt-2">Administrative Clearance Required.</p>
                </div>
            </div>
        );
    }

    return (
        <ForensicPageLayout
            title="Data Hospital"
            subtitle="Global Ingestion Exceptions & Repair Ward"
            icon={Database}
            headerActions={
                <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Nurse Agent Online</span>
                </div>
            }
        >
            <div className="p-10">
                <DataHospitalView />
            </div>
        </ForensicPageLayout>
    );
}
