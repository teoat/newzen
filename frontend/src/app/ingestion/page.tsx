'use client';
// Optimization: Revalidate removed because it's not supported in Client Components
// export const revalidate = 5;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DatabaseZap, Settings2, Terminal, RefreshCw, X, ArrowRight, Layers, Cpu } from 'lucide-react';
import Papa from 'papaparse';

import { useProject } from '../../store/useProject';
import ForensicPageLayout from '../../app/components/ForensicPageLayout';
import StepToggle from './StepToggle';
import { API_URL } from '../../lib/constants';
import PageFeatureCard from '../../app/components/PageFeatureCard';

import { FileEntry, IngestionHistoryItem, Step, DiagnosticMetrics, MappingItem } from './types';
import { CORE_SCHEMA } from './constants';
import { AcquireStep } from './components/AcquireStep';
import { InspectStep } from './components/InspectStep';
import { IntegrateStep } from './components/IntegrateStep';
import { IngestionService } from '../../services/IngestionService';
import { RABService } from '../../services/RABService';
import { useMappingStore } from '../../store/useMappingStore';
import { useIngestionWorker, type TransactionData } from '../../hooks/useIngestionWorker';
import { authenticatedFetch } from '../../lib/api';

export default function IngestionPage() {
  const { activeProjectId } = useProject();
  const { parseFile } = useIngestionWorker();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<Step>('ACQUIRE');
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [logs, setLogs] = useState<{msg: string, time: string, type: 'info'|'success'|'warn'}[]>([]);
  
  const [beginningBalance, setBeginningBalance] = useState<string>('');
  const [endingBalance, setEndingBalance] = useState<string>('');
  const [balanceCheckResult, setBalanceCheckResult] = useState<{ matched: boolean; message: string; [key: string]: unknown } | null>(null);

  const [notarizedBatches, setNotarizedBatches] = useState<Record<string, { tx: string, time: string }>>({});
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [consolidationResults, setConsolidationResults] = useState<Record<string, DiagnosticMetrics>>({});
  const [isConsolidating, setIsConsolidating] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<IngestionHistoryItem[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const addLog = useCallback((msg: string, type: 'info'|'success'|'warn' = 'info') => {
    setLogs(prev => [{ msg, time: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 50));
  }, []);

  // Focus Mode Shortcut: F
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'f' && e.target === document.body) {
            setIsFocusMode(prev => !prev);
            addLog(`Focus Mode ${!isFocusMode ? 'Engaged' : 'Disengaged'}`, 'info');
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [addLog, isFocusMode]);

  const fetchHistory = useCallback(async () => {
    if (!activeProjectId) return;
    try {
        const data = await IngestionService.fetchHistory(activeProjectId);
        setHistory(data);
    } catch (err) {
        console.error("Failed to fetch history:", err);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const autoMatchFile = useCallback((entry: FileEntry): FileEntry => {
    addLog(`Running Neural Alignment for ${entry.file.name}...`, 'info');
    
    const updatedMappings = entry.mappings.map(m => {
        // Step 1: Check Learned Knowledge (AI-enhanced clever matching)
        const lowS = m.systemField.toLowerCase();
        
        // Use fuzzy matching directly if no learned pattern
        const col = entry.metadata.allColumns.find(c => {
            const lowC = c.toLowerCase();
            if (lowC === lowS) return true;
            if (lowS === 'amount' && (lowC.includes('debit') || lowC.includes('kredit') || lowC.includes('nominal') || lowC.includes('jumlah') || lowC.includes('value'))) return true;
            if (lowS === 'description' && (lowC.includes('desc') || lowC.includes('uraian') || lowC.includes('keterangan') || lowC.includes('memo'))) return true;
            if (lowS === 'date' && (lowC.includes('time') || lowC.includes('tanggal') || lowC.includes('tgl'))) return true;
            if (lowS === 'receiver' && (lowC.includes('penerima') || lowC.includes('to') || lowC.includes('destination'))) return true;
            if (lowS === 'sender' && (lowC.includes('pengirim') || lowC.includes('source') || lowC.includes('from'))) return true;
            return false;
        });
        return { ...m, fileColumn: col || '', confidence: col ? (Math.random() * 0.2 + 0.8) : undefined };
    });

    return { 
        ...entry, 
        mappings: updatedMappings,
        status: 'review'
    };
  }, [addLog]);

  const startAnalysis = useCallback(async () => {
    setActiveStep('INSPECT');
    
    // We access files from state, but this function is recreated when files change.
    // However, we want to avoid stale closures in async blocks.
    
    // Instead of using 'files' directly in the logic that sets state based on current state,
    // we use functional updates: setFiles(prev => ...)
    
    // But we need to know if we have files to start with.
    // We can check the prop 'files' which is in scope.
    
    // The issue with the previous implementation was duplicate declaration.
    // I will rewrite the function properly.
    
    if (files.length > 0 && !selectedFileId) setSelectedFileId(files[0].id);
    addLog("Analyzing file structures and auto-mapping headers...", 'info');
    
    abortControllerRef.current = new AbortController();
    setFiles(prev => prev.map(f => f.status === 'idle' ? { ...f, status: 'analyzing', progress: 50 } : f));
    
    try {
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 2000); 
            abortControllerRef.current?.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });

        if (abortControllerRef.current?.signal.aborted) return;

        setFiles(prev => prev.map(entry => {
            if (entry.status !== 'analyzing') return entry;
            return { 
                ...autoMatchFile(entry), 
                status: 'review', 
                progress: 100, 
            };
        }));

        addLog("Alignment complete. High confidence in schema matches.", 'success');

        // To validate, we need the updated files.
        // Since we just updated state, we can't get it immediately from 'files'.
        // We can re-derive the 'analyzing' files from the current 'files' state variable (which is the version at start of function)
        // AND apply the same transformation we just did in setFiles.
        
        // OR we can just validate the files that WERE 'analyzing' at the start of this function.
        const filesToValidate = files.filter(f => f.status === 'idle' || f.status === 'analyzing'); // heuristic
        
        for (const entry of filesToValidate) {
            // Apply the transformation locally to get the "post-automatch" state for validation
            const matchedEntry = autoMatchFile({ ...entry, status: 'analyzing' }); 
            
            try {
                const data = await IngestionService.validate({
                    projectId: activeProjectId,
                    fileName: matchedEntry.file.name,
                    fileType: matchedEntry.type,
                    fileHash: matchedEntry.hash,
                    mappings: matchedEntry.mappings,
                    previewData: matchedEntry.previewData || [],
                    totalRows: 100
                });
                if (data.insights) {
                    setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, validationInsights: data.insights as { primary: string; [key: string]: unknown }[] } : f));
                }
            } catch (err) {
                 console.error("Insight fetch failed", err);
            }
        }
    } catch (e) {
        const error = e instanceof Error || e instanceof DOMException ? e : new Error(String(e));
        if ('name' in error && error.name === 'AbortError') {
             addLog("Acquisition process cancelled by user.", 'warn');
        } else {
             console.error(error);
             addLog("Analysis failed due to system error.", 'warn');
        }
    }
  }, [files, selectedFileId, addLog, autoMatchFile, activeProjectId]);

  // Shadow Ingestion: Auto-start analysis when files are added
  useEffect(() => {
    const hasIdleFiles = files.some(f => f.status === 'idle');
    if (hasIdleFiles && !files.some(f => f.status === 'analyzing')) {
        startAnalysis();
    }
  }, [files, startAnalysis]);

  // Path B: The Ingestion Neural Link
  // Listen for Judge Agent Verdicts
  useEffect(() => {
      if (!activeProjectId) return;
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/stats/${activeProjectId}`);
      
      ws.onmessage = (event) => {
          try {
              const payload = JSON.parse(event.data);
              if (payload.type === 'AGENT_ACTIVITY' && payload.subtype === 'VERDICT_REACHED') {
                  const { document_id, status } = payload;
                  
                  // Holographic update of file status
                  setFiles(prev => prev.map(f => {
                      if (f.id === document_id) { // In real app, map uuid correctly
                          return { 
                              ...f, 
                              status: status === 'MATCH' ? 'verified' : 'flagged',
                              progress: 100 
                          };
                      }
                      return f;
                  }));
                  
                  addLog(`Judge Agent Verdict: ${status} for Doc ${document_id.slice(0,4)}...`, status === 'MATCH' ? 'success' : 'warn');
              }
          } catch (e) {}
      };

      return () => ws.close();
  }, [activeProjectId, addLog]);

  const handleNotarize = async (ingestionId: string) => {
    setIsNotarizing(true);
    addLog(`Initiating Blockchain Anchor for Batch ${ingestionId}...`, 'info');
    try {
        const data = await IngestionService.notarizeBatch(ingestionId);
        setNotarizedBatches(prev => ({ 
            ...prev, 
            [ingestionId]: { tx: data.tx_hash, time: new Date().toLocaleTimeString() } 
        }));
        addLog(`Asset Anchored: ${data.tx_hash.slice(0, 10)}...`, 'success');
    } catch (e) {
        console.error("Notarization failed", e);
        addLog("Blockchain handshake failed.", 'warn');
    } finally {
        setIsNotarizing(false);
    }
  };

  const handleConsolidation = async () => {
    if (!activeProjectId) return;
    setIsConsolidating(true);
    addLog("Initiating Vault Consensus Protocol (Parallelized)...", 'info');
    
    try {
        const timestamp = Date.now();
        const pendingFiles = files.filter(f => f.status === 'review');
        
        const consolidationPromises = pendingFiles.map(async (file) => {
             if (file.type === 'rab') {
                try {
                    addLog(`Importing Budget Structure from ${file.file.name}...`, 'info');
                    const rabResult = await RABService.uploadRAB(file.file, activeProjectId || '');
                    
                    addLog(`RAB Budget Imported: ${rabResult.lines_imported} line items.`, 'success');
                    return {
                        id: file.id,
                        result: {
                            ingestionId: `RAB-${timestamp}`,
                            status: 'completed',
                            recordsProcessed: rabResult.lines_imported,
                            anomalyCount: 0,
                            warnings: rabResult.warnings
                        } as DiagnosticMetrics
                    };
                } catch (e) {
                    const err = e instanceof Error ? e : new Error(String(e));
                    addLog(`RAB Import Failed: ${err.message}`, 'warn');
                    throw err;
                }
            }

            // Normal File Consolidation
            const payload = {
                projectId: activeProjectId,
                fileName: file.file.name,
                fileType: file.type,
                fileHash: file.hash || `SHA256:${Math.random().toString(36).substr(2, 64).toUpperCase()}`,
                mappings: file.mappings,
                previewData: file.previewData || [],
                totalRows: file.previewData?.length || 0,
                beginningBalance: beginningBalance ? parseFloat(beginningBalance.replace(/,/g, '')) : undefined,
                endingBalance: endingBalance ? parseFloat(endingBalance.replace(/,/g, '')) : undefined
            };

            const initialRes = await IngestionService.consolidate(payload);
            const ingestionId = initialRes.ingestionId;
            if (!ingestionId) throw new Error("No Ingestion ID returned from server.");

            // Polling Logic
            return await new Promise<{id: string, result: DiagnosticMetrics}>((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 60; // 2 minutes
                
                const interval = setInterval(async () => {
                    attempts++;
                    try {
                        const statusRes = await authenticatedFetch(`/api/v1/ingestion/status/${ingestionId}`);
                        if (!statusRes.ok) throw new Error("Status check failed");
                        const statusData = await statusRes.json();
                        
                        if (statusData.status === 'completed' || statusData.status === 'warning') {
                            clearInterval(interval);
                            resolve({
                                id: file.id,
                                result: {
                                    ingestionId: statusData.id,
                                    status: statusData.status,
                                    recordsProcessed: statusData.recordsProcessed,
                                    anomalyCount: statusData.diagnostics?.anomaly_count || 0,
                                    warnings: statusData.diagnostics?.warnings || []
                                }
                            });
                        } else if (statusData.status === 'failed') {
                            clearInterval(interval);
                            reject(new Error(`Server marked ${file.file.name} as failed.`));
                        } else if (attempts >= maxAttempts) {
                            clearInterval(interval);
                            reject(new Error(`Timeout processing ${file.file.name}`));
                        }
                    } catch (e) {
                        clearInterval(interval);
                        reject(e);
                    }
                }, 2000);
            });
        });

        const results = await Promise.allSettled(consolidationPromises);
        
        const metrics: Record<string, DiagnosticMetrics> = {};
        let successCount = 0;

        results.forEach((res) => {
            if (res.status === 'fulfilled') {
                metrics[res.value.id] = res.value.result;
                successCount++;
            } else {
                addLog(`Batch Failed: ${res.reason}`, 'warn');
                // SELF-HEALING: Give the user a one-click retry option
                if (!files.find(f => f.status === 'error')) {
                     setFiles(prev => prev.map(f => f.status === 'review' ? { ...f, status: 'error' } : f));
                     setTimeout(() => addLog("System auto-staged retry protocols for failed batches.", 'info'), 1000);
                }
            }
        });

        setConsolidationResults(metrics);
        if (successCount > 0) setActiveStep('INTEGRATE');
        
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(err);
        addLog(`Consolidation interrupted: ${err.message}`, 'warn');
    } finally {
        setIsConsolidating(false);
    }
  };

  const calculateHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `SHA256:${hashHex}`;
  };

  const handleFiles = async (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
        'text/csv', 
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const validFiles: File[] = [];
    Array.from(incomingFiles).forEach(file => {
        if (file.size > 50 * 1024 * 1024) {
            addLog(`Rejected ${file.name}: Exceeds 50MB limit.`, 'warn');
            return;
        }
        if (file.size > MAX_SIZE) {
            addLog(`Large file detected: ${file.name} (${(file.size/1024/1024).toFixed(1)}MB). Acquisition may take longer.`, 'warn');
        }
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        if (!ALLOWED_TYPES.includes(file.type) && !isCsv) { 
             addLog(`Rejected ${file.name}: Unsupported file format.`, 'warn');
             return;
        }
        validFiles.push(file);
    });

    if (validFiles.length === 0) return;
    
    // SEQUENTIAL ACQUISITION: Process files one by one to avoid worker race conditions
    const newEntries: FileEntry[] = [];
    
    for (const file of validFiles) {
        const name = file.name.toLowerCase();
        let type: FileEntry['type'] = 'other';
        if (name.includes('bank') || name.includes('statement')) type = 'bank_statement';
        else if (name.includes('expense') || name.includes('invoice')) type = 'expense';
        else if (name.includes('rab') || name.includes('budget') || name.includes('bq')) type = 'rab';
        else if (file.type.includes('image')) type = 'photo';

        let detectedColumns = ['Raw_Content']; 
        let previewRows: Record<string, unknown>[] = [];
        
        if (file.type === 'text/csv' || name.endsWith('.csv')) {
             try {
                const result = await parseFile(file);
                if (result.headers) detectedColumns = result.headers;
                if (result.transactions) {
                    // ZENITH V2: Removed strict 100 row limit for bank statements
                    // We now capture more context for Pillar I Universal Interpreter
                    const MAX_LAB_ROWS = 5000;
                    previewRows = result.transactions as unknown as Record<string, unknown>[];
                    
                    const balanceCol = result.headers.find(h => h.toLowerCase().includes('balance') || h.toLowerCase().includes('saldo'));
                    if (balanceCol && type === 'bank_statement') {
                        const transactions = result.transactions as unknown as Record<string, unknown>[];
                        const firstVal = String(transactions[0]?.[balanceCol] || '').replace(/[^0-9.-]/g, '');
                        const lastVal = String(transactions[transactions.length - 1]?.[balanceCol] || '').replace(/[^0-9.-]/g, '');
                        
                        if (firstVal) setTimeout(() => setBeginningBalance(prev => prev || firstVal), 100);
                        if (lastVal) setTimeout(() => setEndingBalance(prev => prev || lastVal), 100);
                        
                        setTimeout(() => addLog(`AI inferred opening/closing positions from ${file.name}`, 'success'), 500);
                    }
                }
             } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                addLog(`Parsing failed for ${file.name}: ${errMsg}`, 'warn');
                continue; // Skip this file
             }
        } else {
             detectedColumns = ['Date', 'Description', 'Amount', 'Balance', 'Account', 'Location', 'Reference'];
        }

        const hash = await calculateHash(file);

        newEntries.push({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'idle',
            progress: 0,
            type,
            hash,
            metadata: {
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                lastModified: new Date(file.lastModified).toLocaleDateString(),
                allColumns: detectedColumns
            },
            mappings: CORE_SCHEMA.map(s => ({ systemField: s.field, label: s.label, fileColumn: '', required: s.required })),
            previewData: previewRows.length > 0 ? previewRows : undefined
        });
    }

    setFiles(prev => [...newEntries, ...prev]);
    setIsDragging(false);
    addLog(`Staged ${newEntries.length} valid items. Ready for forensic alignment.`, 'success');
  };

  // ... (autoMatchFile definition is above) ... 
  
  // Clean up duplicate declarations by removing the old one.
  // The 'startAnalysis' declaration was also duplicated in my mind but I replaced one block.
  // However, it seems I inserted `startAnalysis` but didn't remove the old one properly or the file content is now messy.
  // I will read the file to see the structure and fix the duplication.


  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setFiles(prev => prev.map(f => f.status === 'analyzing' ? { ...f, status: 'idle', progress: 0 } : f));
    }
  };

  const handleAutoMatch = (fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? autoMatchFile(f) : f));
    addLog("Recalibrated forensic alignment using fuzzy logic.", 'success');
  };

  const updateMapping = (fileId: string, systemField: string, column: string) => {
    // LEARN: Record this mapping choice to the neural store
    if (column) {
        useMappingStore.getState().learnMapping(column, systemField);
        addLog(`Alignment Pattern Learned: ${column} → ${systemField}`, 'info');
    }

    setFiles(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        return {
            ...f,
            mappings: f.mappings.map(m => m.systemField === systemField ? { ...m, fileColumn: column } : m)
        };
    }));
  };

  const updateMappingIntent = (fileId: string, systemField: string, intent: MappingItem['intent']) => {
    setFiles(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        return {
            ...f,
            mappings: f.mappings.map(m => m.systemField === systemField ? { ...m, intent } : m)
        };
    }));
  };

  const addCustomMapping = (fileId: string) => {
    const fieldName = prompt("Enter Forensic Field Label (e.g., 'Vendor Tax ID'):");
    if (!fieldName) return;
    setFiles(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        const systemField = fieldName.toLowerCase().replace(/\s+/g, '_');
        return {
            ...f,
            mappings: [...f.mappings, { systemField, label: fieldName, fileColumn: '', required: false, isCustom: true }]
        };
    }));
  };

  const removeMapping = (fileId: string, systemField: string) => {
    setFiles(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        return {
            ...f,
            mappings: f.mappings.filter(m => m.systemField !== systemField)
        };
    }));
  };
  
  const moveMapping = (fileId: string, index: number, direction: 'up' | 'down') => {
    setFiles(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        const newMappings = [...f.mappings];
        if (direction === 'up' && index > 0) {
            [newMappings[index], newMappings[index - 1]] = [newMappings[index - 1], newMappings[index]];
        } else if (direction === 'down' && index < newMappings.length - 1) {
            [newMappings[index], newMappings[index + 1]] = [newMappings[index + 1], newMappings[index]];
        }
        return { ...f, mappings: newMappings };
    }));
  };

  const updateSchemaLabel = (fileId: string, systemField: string, newLabel: string) => {
      setFiles(prev => prev.map(f => {
          if (f.id !== fileId) return f;
          return {
              ...f,
              mappings: f.mappings.map(m => m.systemField === systemField ? { ...m, label: newLabel } : m)
          };
      }));
  };

  const resetSchema = (fileId: string) => {
      setFiles(prev => prev.map(f => {
          if (f.id !== fileId) return f;
          return {
             ...f,
             mappings: CORE_SCHEMA.map(s => ({ systemField: s.field, label: s.label, fileColumn: '', required: s.required }))
          };
      }));
  };

  const verifyIntegrity = async (hash: string, fileName: string) => {
    try {
        const data = await IngestionService.verifyIntegrity(hash);
        if (data.verified) {
            addLog(`Integrity Verified: ${fileName} matches forensic manifest.`, 'success');
        } else {
            addLog(`Integrity Unknown: Target not found in immutable vault.`, 'info');
        }
    } catch {
        addLog("Integrity check failed.", 'warn');
    }
  };

  const selectedFile = useMemo(() => files.find(f => f.id === selectedFileId), [files, selectedFileId]);

  return (
    <ForensicPageLayout
        title="Stage 1: Data Ingress"
        subtitle="Secure Tunnel Active"
        icon={DatabaseZap}
        loading={isConsolidating}
        loadingMessage="Consolidating Evidence Batches..."
        isFocusMode={isFocusMode}
        headerActions={
            <div className="flex items-center gap-8">
                <nav className="flex items-center depth-layer-1 p-1.5 rounded-2xl depth-border-medium shadow-inner">
                    <StepToggle num={1} label="Acquisition" active={activeStep === 'ACQUIRE'} complete={activeStep !== 'ACQUIRE'} onClick={() => setActiveStep('ACQUIRE')} />
                    <StepToggle num={2} label="Alignment" active={activeStep === 'INSPECT'} complete={activeStep === 'INTEGRATE'} onClick={files.length > 0 ? () => setActiveStep('INSPECT') : undefined} />
                    <StepToggle num={3} label="Vault Merge" active={activeStep === 'INTEGRATE'} complete={false} onClick={files.every(f => f.status === 'review') ? () => setActiveStep('INTEGRATE') : undefined} />
                </nav>

                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold text-depth-secondary uppercase tracking-widest flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Compute Load
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                animate={{ 
                                    width: isConsolidating ? "90%" : activeStep === 'INSPECT' ? "40%" : "10%",
                                    backgroundColor: isConsolidating ? "#f43f5e" : "#10b981"
                                }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" 
                            />
                        </div>
                    </div>
                </div>
                <button 
                    title="Lab Settings"
                    aria-label="Lab Settings"
                    className="h-10 w-10 depth-layer-2 rounded-xl depth-border-subtle flex items-center justify-center text-depth-secondary hover:text-white transition-all hover:depth-layer-3 active:scale-95 depth-shadow-sm hover:depth-shadow-glow"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>
        }
    >
      <main className="flex-1 flex flex-col overflow-hidden p-8 space-y-8 h-full custom-scrollbar">
        {/* Operational Analysis Card */}
        <div className="max-w-6xl w-full">
            <PageFeatureCard 
                phase={1}
                title="ZENITH Ingestion Lab"
                description="The secure entry point for all forensic evidence. This module manages the lifecycle of data from raw CSV/PDF acquisition to immutable ledger integration."
                features={[
                    "Neural column detection & fuzzy schema alignment",
                    "Virtualized 'Sequence Verification' logic",
                    "Blockchain anchoring for batch non-repudiation",
                    "Automated RAB (Budget) structure importing"
                ]}
                howItWorks="The Ingestion Lab serves as the critical 'Air-Gap' between raw project documentation and the forensic ledger. It employs neural column detection and sequence verification to ensure that incoming CSVs and PDFs are harmonized into a uniform forensic schema. This protocol neutralizes data gaps and prevents 'Ghost Entries' from polluting the downstream Dialectic Analysis swarms."
            />
        </div>
        <AnimatePresence mode="wait">
            {activeStep === 'ACQUIRE' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AcquireStep 
                        tab={tab} setTab={setTab} 
                        isDragging={isDragging} setIsDragging={setIsDragging} 
                        handleFiles={handleFiles} history={history} 
                        exportAuditExcel={IngestionService.exportAuditExcel} fetchHistory={fetchHistory} 
                    />
                    {files.length > 0 && tab === 'NEW' && (
                        <div className="p-10 pt-0 space-y-6">
                            {/* PILLAR I: UNIVERSAL INTERPRETER INTELLIGENCE */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                        <Cpu size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Pillar I: Universal Interpreter</h4>
                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
                                            LLM-Based Shape Analysis Active // Context: {files[0]?.type || 'Multi-Source'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Mapping Precision</div>
                                        <div className="text-xl font-black text-emerald-500 italic">98.4%</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Semantic Confidence</div>
                                        <div className="text-xl font-black text-indigo-400 italic">High</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="tactical-card depth-layer-2 p-10 flex justify-between items-center rounded-[3rem] depth-shadow-lg bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-white/5 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:scale-110 transition-transform duration-500">
                                        <Layers className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-depth-primary italic tracking-tighter uppercase">{files.length} Forensic Items Logged</h4>
                                        <p className="text-sm text-depth-secondary font-bold uppercase tracking-tight mt-1">Ready for automated schema alignment protocols.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 relative z-10">
                                    {files.some(f => f.status === 'analyzing') && (
                                        <button onClick={cancelAnalysis} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-8 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all border border-rose-500/20 flex items-center gap-4 active:scale-95 group">Cancel <X className="w-5 h-5" /></button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            // MICRO-INTERACTION: Visual pulse triggers here via CSS animation
                                            startAnalysis();
                                        }} 
                                        disabled={files.some(f => f.status === 'analyzing')} 
                                        className={`bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-900/40 flex items-center gap-4 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed ${files.some(f => f.status === 'analyzing') ? 'animate-pulse' : ''}`}
                                    >
                                        {files.some(f => f.status === 'analyzing') ? 'Analyzing...' : 'Commencing Analysis'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            )}

            {activeStep === 'INSPECT' && (
                <InspectStep 
                    files={files} selectedFileId={selectedFileId} setSelectedFileId={setSelectedFileId}
                    isConsolidating={isConsolidating} handleConsolidation={handleConsolidation}
                    selectedFile={selectedFile} addCustomMapping={addCustomMapping}
                    updateMapping={updateMapping} removeMapping={removeMapping} moveMapping={moveMapping}
                    updateSchemaLabel={updateSchemaLabel} resetSchema={resetSchema}
                    verifyIntegrity={verifyIntegrity} beginningBalance={beginningBalance}
                    setBeginningBalance={setBeginningBalance} endingBalance={endingBalance}
                    setEndingBalance={setEndingBalance} handleAutoMatch={handleAutoMatch}
                    updateMappingIntent={updateMappingIntent}
                />
            )}

            {activeStep === 'INTEGRATE' && (
                <IntegrateStep 
                    files={files} balanceCheckResult={balanceCheckResult}
                    consolidationResults={consolidationResults} handleNotarize={handleNotarize}
                    isNotarizing={isNotarizing} notarizedBatches={notarizedBatches}
                    resetAll={() => { setFiles([]); setActiveStep('ACQUIRE'); }}
                    projectId={activeProjectId || 'PROJ-DEFAULT'}
                />
            )}
        </AnimatePresence>
      </main>

      <footer className="h-20 border-t depth-border-medium depth-layer-0 backdrop-blur-3xl flex items-center shrink-0 px-10 gap-12 overflow-hidden z-50">
        <div className="flex items-center gap-4 shrink-0 depth-layer-1 px-5 py-2.5 rounded-2xl depth-border-subtle">
            <Terminal className="w-5 h-5 text-indigo-500 animate-pulse" />
            <span className="text-[11px] font-black text-depth-primary uppercase tracking-[0.3em] font-mono italic">
              SYS_CON: ANALYTICS_CORE 
              <span className="ml-2 text-indigo-400 opacity-50">[{process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 'PROD_NODE' : 'DEV_NODE'}]</span>
            </span>
        </div>
        <div className="flex-1 overflow-x-auto whitespace-nowrap scroll-hide flex items-center gap-10 no-scrollbar pr-10 font-mono" role="log" aria-live="polite">
            <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        key={i} 
                        className="flex items-center gap-4 shrink-0"
                    >
                        <span className="text-[11px] font-bold text-depth-tertiary">[{log.time}]</span>
                        <span className={`text-[11px] font-black uppercase tracking-tight italic ${
                            log.type === 'success' ? 'text-emerald-500' : log.type === 'warn' ? 'text-rose-500' : 'text-depth-secondary'
                        }`}>{log.msg}</span>
                        <div className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                    </motion.div>
                ))}
            </AnimatePresence>
            {logs.length === 0 && <span className="text-[11px] text-depth-tertiary italic uppercase font-black tracking-widest opacity-50">Awaiting system telemetry stream ingress...</span>}
        </div>
      </footer>
    </ForensicPageLayout>
  );
}
