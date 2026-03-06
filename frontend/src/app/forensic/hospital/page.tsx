'use client';

import React, { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle2, XCircle, RefreshCcw, Stethoscope, ChevronRight, AlertTriangle } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import PageFeatureCard from '../../components/PageFeatureCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../../../store/useProject';
import { authFetcher, authenticatedFetch } from '../../../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';


interface QuarantineRow {
    id: string;
    project_id: string;
    error_message: string;
    error_type: string;
    raw_content: string;
    status: string;
    row_index: number;
    created_at: string;
}

export default function IngestionHospitalPage() {
  const { activeProjectId } = useProject();
  const queryClient = useQueryClient();
  const [selectedRepairRow, setSelectedRepairRow] = useState<QuarantineRow | null>(null);
  const [repairData, setRepairData] = useState({
    receiver_name: '',
    amount: '',
    sender: '',
    description: ''
  });

  const { data: rows, isLoading, refetch } = useQuery<QuarantineRow[]>({
    queryKey: ['quarantine', activeProjectId],
    queryFn: () => authFetcher(`/api/v1/ingestion/hospital/${activeProjectId}/quarantine`),
    enabled: !!activeProjectId,
  });

  const repairMutation = useMutation({
    mutationFn: async ({ rowId, data }: { rowId: string, data: any }) => {
      const response = await authenticatedFetch(`/api/v1/ingestion/hospital/${activeProjectId}/repair/${rowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Repair failed");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Surgical Repair Successful", { description: "Entity re-injected into ledger." });
      queryClient.invalidateQueries({ queryKey: ['quarantine', activeProjectId] });
      setSelectedRepairRow(null);
    },
    onError: (err: any) => toast.error("Repair Failed", { description: err.message })
  });

  const mutation = useMutation({
    mutationFn: async ({ rowId, action }: { rowId: string, action: 'ignore' | 'purge' }) => {
      const endpoint = action === 'ignore' ? 'ignore' : 'purge';
      const method = action === 'ignore' ? 'PUT' : 'DELETE';
      
      const response = await authenticatedFetch(`/api/v1/ingestion/hospital/${activeProjectId}/${endpoint}/${rowId}`, {
        method: method,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} row`);
      }
      return { rowId, action };
    },
    onSuccess: (variables) => {
      toast.success(`Row ${variables.action === 'ignore' ? 'Ignored' : 'Purged'}`);
      queryClient.invalidateQueries({ queryKey: ['quarantine', activeProjectId] });
    },
    onError: () => {
      toast.error("Operation failed");
    }
  });

  const handleAction = (rowId: string, action: 'ignore' | 'purge') => {
    mutation.mutate({ rowId, action });
  };

  const openRepairModal = (row: QuarantineRow) => {
    setSelectedRepairRow(row);
    // Attempt to parse some defaults from raw_content if it's JSON
    try {
        const parsed = JSON.parse(row.raw_content);
        setRepairData({
            receiver_name: parsed.receiver_name || parsed.name || '',
            amount: parsed.amount || '',
            sender: parsed.sender || '',
            description: parsed.description || ''
        });
    } catch (e) {
        setRepairData({ receiver_name: '', amount: '', sender: '', description: '' });
    }
  };

  const submitRepair = () => {
    if (!selectedRepairRow) return;
    repairMutation.mutate({ rowId: selectedRepairRow.id, data: repairData });
  };

  return (
    <ForensicPageLayout
      title="Ingestion Hospital"
      subtitle="Data Recovery & Anomaly Resolution Center"
      icon={Stethoscope}
      headerActions={
        <Link href="/">
            <button className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-white/5 rounded-xl flex items-center gap-2 transition-all">
                <ChevronRight className="w-3 h-3 rotate-180" /> Hub
            </button>
        </Link>
      }
    >
      <div className="p-8 space-y-8 overflow-y-auto max-h-full custom-scrollbar">
        <PageFeatureCard 
            phase={12}
            title="Forensic Hospital"
            description="The critical care unit for ingestion failures. Automatically quarantines malformed or unidentifiable transaction data, providing a 'Surgical Repair' interface for data integrity restoration."
            features={[
                "Autonomous 'Error Triaging' classification",
                "Surgical Data Repair & Re-injection protocols",
                "Quarantine Audit logs for chain-of-custody",
                "Bulk Purge logic for poisoned datasets"
            ]}
            howItWorks="When Zenith's ingestion engine encounters unparseable data, it shunts the record into the 'Forensic Hospital'. Investigators can manually resolve missing entities, fix fiscal formatting errors, or purge corrupted entries to ensure the final ledger remains 100% verified."
        />

        <div className="grid grid-cols-1 gap-6">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Patients in Triage</h3>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black">
                        {rows?.length || 0} TOTAL
                    </span>
                </div>
                <Button 
                    variant="outline" size="sm" 
                    onClick={() => void refetch()}
                    className="h-9 border-white/5 bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5"
                >
                    <RefreshCcw className={`w-3 h-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Ward
                </Button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {rows?.map((row) => (
                        <motion.div 
                            key={row.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group relative"
                        >
                            <Card className="p-6 bg-slate-900 border-white/5 rounded-[2rem] hover:border-indigo-500/30 transition-all shadow-xl overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50" />
                                
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-rose-500/10">
                                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                                            </div>
                                             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Case ID: {row.id.substring(0, 8)} {"//"} Row {row.row_index}</span>

                                        </div>
                                        <h4 className="text-sm font-black text-rose-400 uppercase tracking-tight leading-tight">
                                            {row.error_message}
                                        </h4>
                                        <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                            <code className="text-[10px] text-slate-400 break-all font-mono">
                                                {row.raw_content}
                                            </code>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap lg:flex-nowrap gap-3">
                                        <Button 
                                            onClick={() => openRepairModal(row)}
                                            className="px-6 h-12 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-2xl"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Surgical Repair
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            disabled={mutation.isPending && mutation.variables?.rowId === row.id}
                                            onClick={() => handleAction(row.id, 'ignore')}
                                            className="px-6 h-12 border-white/5 bg-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                                        >
                                            {mutation.isPending && mutation.variables?.rowId === row.id && mutation.variables?.action === 'ignore' ? 'Processing...' : 'Ignore'}
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            disabled={mutation.isPending && mutation.variables?.rowId === row.id}
                                            onClick={() => handleAction(row.id, 'purge')}
                                            className="px-6 h-12 border-white/5 bg-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> 
                                            {mutation.isPending && mutation.variables?.rowId === row.id && mutation.variables?.action === 'purge' ? 'Purging...' : 'Purge'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {rows?.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                        <div className="p-10 bg-slate-900 rounded-full mb-6">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-widest">Ward Empty</h4>
                        <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">No data anomalies detected. All project patients have been successfully processed into the ledger.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Surgical Repair Modal */}
        <Dialog open={!!selectedRepairRow} onOpenChange={() => setSelectedRepairRow(null)}>
            <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Surgical Data Repair</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs uppercase tracking-widest font-bold">
                        Correcting Case ID: {selectedRepairRow?.id.substring(0, 12)}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Receiver Entity Name</label>
                        <input 
                            value={repairData.receiver_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepairData({...repairData, receiver_name: e.target.value})}
                            className="bg-slate-900 border border-white/5 rounded-xl h-12 text-sm font-bold uppercase px-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Reconciled Amount (IDR)</label>
                        <input 
                            type="number"
                            value={repairData.amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepairData({...repairData, amount: e.target.value})}
                            className="bg-slate-900 border border-white/5 rounded-xl h-12 text-sm font-bold px-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Originating Sender</label>
                        <input 
                            value={repairData.sender}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepairData({...repairData, sender: e.target.value})}
                            className="bg-slate-900 border border-white/5 rounded-xl h-12 text-sm font-bold uppercase px-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Contextual Description</label>
                        <input 
                            value={repairData.description}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepairData({...repairData, description: e.target.value})}
                            className="bg-slate-900 border border-white/5 rounded-xl h-12 text-sm font-bold uppercase px-4"
                        />
                    </div>
                </div>

                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl mb-6">
                    <p className="text-[10px] text-rose-400 font-bold leading-relaxed">
                        <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" /> 
                        WARNING: Manual re-injection bypasses autonomous validation. This transaction will be marked as &quot;Manually Verified&quot; in the final audit dossier.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedRepairRow(null)} className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border-white/5">Cancel</Button>
                    <Button 
                        disabled={repairMutation.isPending}
                        onClick={submitRepair}
                        className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-indigo-900/20"
                    >
                        {repairMutation.isPending ? 'Injecting...' : 'Complete Surgery'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </ForensicPageLayout>
  );
}
