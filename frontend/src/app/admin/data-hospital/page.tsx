"use client";
export const dynamic = 'force-dynamic';

import { useAuth } from "../../../hooks/useAuth";
import { DataHospitalView } from "../../../components/DataHospitalView";

export default function DataHospitalPage() {
    const { user } = useAuth();
    
    // Simple RBAC check
    if (user && user.role !== 'admin') {
        return <div className="p-8">Access Denied. Admins Only.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Data Hospital 🏥</h1>
                <p className="text-muted-foreground mt-2">
                    Manage failed ingestion data. Review cases the Nurse Agent could not heal.
                </p>
            </div>
            
            <DataHospitalView />
        </div>
    );
}
