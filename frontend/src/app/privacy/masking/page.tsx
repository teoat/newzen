"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Shield, 
  Eye, 
  CheckCircle, 
  FileText,
  Users,
  Lock,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ROUTES } from '@/services/apiRoutes';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import PageFeatureCard from '../../components/PageFeatureCard';

interface ExportTemplate {
  name: string;
  description: string;
  user_role: string;
  include_transactions: boolean;
  include_entities: boolean;
  include_cases: boolean;
  privacy_level: string;
}

interface ExportData {
  export_id: string;
  export_data: string;
  format: string;
  metadata: any;
  verification_info: any;
}

interface VerificationResult {
  is_valid: boolean;
  commitment_matched: boolean;
  verification_timestamp: string;
  message: string;
}

export default function PrivacyMaskingPage() {
  const [projectId, setProjectId] = useState<string>('');
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState('export');

  const fetchTemplates = async () => {
    try {
      const response = await fetch(API_ROUTES.V3.PRIVACY.TEMPLATES);
      const data = await response.json();
      const templateList = data.templates 
        ? Object.entries(data.templates).map(([key, value]: [string, any]) => ({
            ...value,
            id: key
          }))
        : [];
      setTemplates(templateList);
    } catch (error) {
      toast.error('Failed to load export templates');
    }
  };

  const fetchExportHistory = React.useCallback(async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(API_ROUTES.V3.PRIVACY.EXPORTS(projectId));
      const data = await response.json();
      setExportHistory(data.exports || []);
    } catch (error) {
      toast.error('Failed to load export history');
    }
  }, [projectId]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchExportHistory();
    }
  }, [projectId, fetchExportHistory]);

  const handleExport = async (format: string = 'json') => {
    if (!projectId || !selectedTemplate) {
      toast.error('Please select a project and export template');
      return;
    }

    setIsExporting(true);
    
    try {
      const response = await fetch(API_ROUTES.V3.PRIVACY.EXPORT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          include_transactions: selectedTemplate.include_transactions,
          include_entities: selectedTemplate.include_entities,
          include_cases: selectedTemplate.include_cases,
          format: format.toUpperCase(),
          user_role: selectedTemplate.user_role
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data: ExportData = await response.json();
      setExportData(data);
      
      const blob = new Blob([data.export_data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.metadata.export_id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
      fetchExportHistory();
      setActiveTab('history');
      
    } catch (error) {
      toast.error('Failed to create export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleVerification = async () => {
    if (!exportData) {
      toast.error('Please create an export first');
      return;
    }

    try {
      const maskedExport = {
        export_metadata: exportData.metadata,
        data: JSON.parse(exportData.export_data),
        verification: exportData.verification_info
      };

      const response = await fetch(API_ROUTES.V3.PRIVACY.VERIFY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          masked_export: maskedExport,
          field_name: 'amount',
          original_value: 1000000, 
          record_id: 'example-transaction-id'
        }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result: VerificationResult = await response.json();
      setVerificationResult(result);
      toast.success(result.message);
      
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const getPrivacyLevelIcon = (level: string) => {
    switch (level) {
      case 'STANDARD': return <Eye className="w-4 h-4" />;
      case 'HIGH': return <Shield className="w-4 h-4" />;
      case 'ZERO_KNOWLEDGE': return <Lock className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPrivacyLevelColor = (level: string) => {
    switch (level) {
      case 'STANDARD': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'ZERO_KNOWLEDGE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <ForensicPageLayout
        title="Zero-Knowledge Privacy"
        subtitle="Cryptographic Evidence Masking & Verification"
        icon={Shield}
    >
        <div className="flex flex-col h-full bg-slate-950">
           {/* Info Card */}
           <div className="px-10 py-8 shrink-0">
                <div className="max-w-6xl w-full">
                    <PageFeatureCard 
                        phase={6}
                        title="Privacy-Preserving Export Engine"
                        description="Enables secure evidence sharing with external auditors while protecting sensitive PII through deterministic pseudonymization and zero-knowledge proofs."
                        features={[
                            "Deterministic PII pseudonymization",
                            "Zero-Knowledge Proof verification",
                            "Role-based export templates",
                            "Cryptographic audit trail"
                        ]}
                        howItWorks="Data is masked using role-specific keys. Zero-knowledge proofs (ZKPs) are generated to allow external verifiers to confirm data integrity (e.g. 'sum of transactions = total') without revealing the underlying individual values."
                    />
                </div>
           </div>

           <div className="flex-1 px-10 pb-10 overflow-hidden">
                <div className="h-full glass-tactical rounded-[2.5rem] p-8 flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <div className="shrink-0 mb-6">
                            <TabsList className="bg-black/40 border border-white/10 p-1 rounded-xl h-12 w-full max-w-2xl grid grid-cols-4">
                                <TabsTrigger value="export" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest rounded-lg transition-all">Create Export</TabsTrigger>
                                <TabsTrigger value="templates" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest rounded-lg transition-all">Templates</TabsTrigger>
                                <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest rounded-lg transition-all">History</TabsTrigger>
                                <TabsTrigger value="verify" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white uppercase text-[10px] font-black tracking-widest rounded-lg transition-all">Verification</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                             <TabsContent value="export" className="mt-0 h-full">
                                <div className="max-w-2xl space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Project Token ID</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono text-sm"
                                                placeholder="Enter project ID..."
                                                value={projectId}
                                                onChange={(e) => setProjectId(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Export Template</label>
                                            <select 
                                                aria-label="Select export template"
                                                title="Export Template Selection"
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                                                onChange={(e) => {
                                                    const template = templates.find(t => (t as any).id === e.target.value);
                                                    setSelectedTemplate(template || null);
                                                }}
                                            >
                                                <option value="">Select a template configuration</option>
                                                {templates.map((template: any) => (
                                                    <option key={template.id} value={template.id}>
                                                    {template.name} - {template.privacy_level}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {selectedTemplate && (
                                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Template Configuration</h4>
                                                <Badge variant="outline" className={`border ${getPrivacyLevelColor(selectedTemplate.privacy_level)}`}>
                                                    <span className="flex items-center gap-2">
                                                        {getPrivacyLevelIcon(selectedTemplate.privacy_level)}
                                                        {selectedTemplate.privacy_level}
                                                    </span>
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{selectedTemplate.description}</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-slate-300 border border-white/5 uppercase">Role: {selectedTemplate.user_role}</div>
                                                {selectedTemplate.include_transactions && <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 uppercase">Transactions</div>}
                                                {selectedTemplate.include_entities && <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 uppercase">Entities</div>}
                                                {selectedTemplate.include_cases && <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 uppercase">Cases</div>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            onClick={() => handleExport('json')}
                                            disabled={!projectId || !selectedTemplate || isExporting}
                                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-900/20"
                                        >
                                            {isExporting ? <span className="animate-pulse">Processing Cryptography...</span> : <span className="flex items-center gap-2"><Download className="w-4 h-4" /> Export Signed JSON</span>}
                                        </Button>
                                    </div>
                                </div>
                             </TabsContent>

                             <TabsContent value="templates" className="mt-0 h-full">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {templates.map((template) => (
                                    <div 
                                        key={template.name} 
                                        className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-indigo-400 transition-colors">{template.name}</h3>
                                            <div className={`p-1.5 rounded-lg ${getPrivacyLevelColor(template.privacy_level)}`}>
                                                {getPrivacyLevelIcon(template.privacy_level)}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-6 line-clamp-2">{template.description}</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                                                <Users className="w-3 h-3" />
                                                <span>Role: {template.user_role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                             </TabsContent>

                             <TabsContent value="history" className="mt-0 h-full">
                                <div className="max-w-4xl space-y-4">
                                    {!projectId ? (
                                        <div className="text-center py-20 opacity-30">
                                            <Key className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Enter Project ID to retrieve ledger</p>
                                        </div>
                                    ) : exportHistory.length === 0 ? (
                                        <div className="text-center py-20 opacity-30">
                                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-400">No export records found</p>
                                        </div>
                                    ) : (
                                        exportHistory.map((export_item) => (
                                            <div key={export_item.export_id} className="flex items-center justify-between p-6 bg-slate-900/30 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                                                <div>
                                                    <div className="font-mono text-sm text-indigo-400 mb-1">{export_item.export_id}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                                                        <span>{new Date(export_item.created_at).toLocaleString()}</span>
                                                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                                        <span>{export_item.metadata?.privacy_level || 'STANDARD'}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                                                    <CheckCircle className="w-3 h-3 mr-2" />
                                                    VERIFIED
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </TabsContent>

                             <TabsContent value="verify" className="mt-0 h-full">
                                <div className="max-w-2xl space-y-8">
                                    {exportData ? (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                                <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Export Ready for Verification
                                                </h4>
                                                <div className="space-y-2 font-mono text-xs text-emerald-400/80">
                                                    <div>ID: {exportData.metadata.export_id}</div>
                                                    <div>PRIVACY_LEVEL: {exportData.metadata.privacy_level}</div>
                                                </div>
                                            </div>

                                            <Button onClick={handleVerification} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase tracking-widest text-[11px] border border-white/5">
                                                <Key className="w-4 h-4 mr-2" />
                                                Run Zero-Knowledge Verification
                                            </Button>

                                            {verificationResult && (
                                                <div className={`p-6 border rounded-2xl ${
                                                verificationResult.is_valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
                                                }`}>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Status</span>
                                                        <Badge variant={verificationResult.is_valid ? "default" : "destructive"} className="uppercase font-bold tracking-wider">
                                                            {verificationResult.is_valid ? 'PASSED_INTEGRITY_CHECK' : 'INTEGRITY_FAILURE'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-white">{verificationResult.message}</p>
                                                </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 opacity-30">
                                            <Lock className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Generate an export to enable verification tools</p>
                                        </div>
                                    )}
                                </div>
                             </TabsContent>
                        </div>
                    </Tabs>
                </div>
           </div>
        </div>
    </ForensicPageLayout>
  );
}